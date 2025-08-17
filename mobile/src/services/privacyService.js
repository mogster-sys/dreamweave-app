import { getDatabase } from './databaseV2.js';
import * as FileSystem from 'expo-file-system';

/**
 * Privacy Service
 * Handles privacy-focused operations, data retention, and user consent management
 */
class PrivacyService {
  
  // Privacy settings and consent management
  async setPrivacySettings(userId, settings) {
    const db = getDatabase();
    
    const privacySettings = {
      data_retention_days: settings.dataRetentionDays || 365,
      audio_auto_delete: settings.audioAutoDelete || true,
      analytics_consent: settings.analyticsConsent || false,
      improvement_consent: settings.improvementConsent || false,
      cloud_sync_consent: settings.cloudSyncConsent || false,
      data_export_format: settings.dataExportFormat || 'json',
      local_processing_only: settings.localProcessingOnly || true,
      ...settings
    };
    
    // Save each setting
    for (const [key, value] of Object.entries(privacySettings)) {
      await db.runAsync(`
        INSERT OR REPLACE INTO core_settings (setting_key, setting_value, setting_type)
        VALUES (?, ?, ?)
      `, [`privacy_${key}_${userId}`, JSON.stringify(value), typeof value]);
    }
    
    // Log consent changes
    await this.logConsentChange(userId, privacySettings);
    
    return privacySettings;
  }
  
  // Get current privacy settings
  async getPrivacySettings(userId) {
    const db = getDatabase();
    
    const settings = await db.getAllAsync(
      "SELECT setting_key, setting_value, setting_type FROM core_settings WHERE setting_key LIKE ?",
      [`privacy_%_${userId}`]
    );
    
    const privacySettings = {};
    settings.forEach(setting => {
      const key = setting.setting_key.replace(`privacy_`, '').replace(`_${userId}`, '');
      privacySettings[key] = JSON.parse(setting.setting_value);
    });
    
    // Apply defaults for missing settings
    return {
      data_retention_days: 365,
      audio_auto_delete: true,
      analytics_consent: false,
      improvement_consent: false,
      cloud_sync_consent: false,
      local_processing_only: true,
      ...privacySettings
    };
  }
  
  // Log consent changes for compliance
  async logConsentChange(userId, newSettings) {
    const db = getDatabase();
    
    await db.runAsync(`
      INSERT INTO analytics_events (
        event_type, event_name, event_category, user_id,
        event_properties, is_anonymous
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'privacy_event',
      'consent_updated',
      'privacy',
      userId,
      JSON.stringify({
        settings_changed: Object.keys(newSettings),
        timestamp: new Date().toISOString()
      }),
      0 // Not anonymous for compliance tracking
    ]);
  }
  
  // Clean up old data based on retention policies
  async enforceDataRetention(userId) {
    const db = getDatabase();
    const settings = await this.getPrivacySettings(userId);
    const retentionDays = settings.data_retention_days;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffISO = cutoffDate.toISOString();
    
    console.log(`Enforcing data retention: deleting data older than ${retentionDays} days`);
    
    // Get entries to be deleted (for audio cleanup)
    const oldEntries = await db.getAllAsync(
      'SELECT id FROM dream_entries WHERE user_id = ? AND created_at < ?',
      [userId, cutoffISO]
    );
    
    // Clean up audio files first
    for (const entry of oldEntries) {
      await this.cleanupAudioFiles(entry.id);
    }
    
    // Delete old dream entries (cascades to related tables)
    const deletedEntries = await db.runAsync(
      'DELETE FROM dream_entries WHERE user_id = ? AND created_at < ?',
      [userId, cutoffISO]
    );
    
    // Clean up orphaned analytics events
    const deletedAnalytics = await db.runAsync(
      'DELETE FROM analytics_events WHERE user_id = ? AND created_at < ?',
      [userId, cutoffISO]
    );
    
    // Clean up old cost tracking
    const deletedCosts = await db.runAsync(
      'DELETE FROM cost_tracking WHERE user_id = ? AND created_at < ?',
      [userId, cutoffISO]
    );
    
    const cleanupResult = {
      entries_deleted: deletedEntries.changes,
      analytics_events_deleted: deletedAnalytics.changes,
      cost_records_deleted: deletedCosts.changes,
      retention_days: retentionDays,
      cutoff_date: cutoffISO
    };
    
    // Log the cleanup operation
    await this.logDataCleanup(userId, cleanupResult);
    
    return cleanupResult;
  }
  
  // Clean up audio files for a specific dream entry
  async cleanupAudioFiles(dreamEntryId) {
    const db = getDatabase();
    
    const audioFiles = await db.getAllAsync(
      'SELECT file_path FROM audio_files WHERE dream_entry_id = ?',
      [dreamEntryId]
    );
    
    for (const audio of audioFiles) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(audio.file_path);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(audio.file_path);
          console.log(`Deleted audio file: ${audio.file_path}`);
        }
      } catch (error) {
        console.warn(`Failed to delete audio file ${audio.file_path}:`, error);
      }
    }
    
    // Remove audio file records
    await db.runAsync(
      'DELETE FROM audio_files WHERE dream_entry_id = ?',
      [dreamEntryId]
    );
  }
  
  // Export user data for GDPR compliance
  async exportUserData(userId, format = 'json') {
    const db = getDatabase();
    
    console.log(`Exporting user data for ${userId} in ${format} format`);
    
    // Collect all user data
    const userData = {
      user_id: userId,
      export_date: new Date().toISOString(),
      privacy_settings: await this.getPrivacySettings(userId),
      
      // Core dream data
      dream_entries: await db.getAllAsync(
        'SELECT * FROM dream_entries WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      ),
      
      // Analysis data
      psychological_analysis: await db.getAllAsync(`
        SELECT pa.* FROM psychological_analysis pa
        JOIN dream_entries de ON pa.dream_entry_id = de.id
        WHERE de.user_id = ?
      `, [userId]),
      
      // Enhancement data
      prompt_enhancements: await db.getAllAsync(`
        SELECT pe.* FROM prompt_enhancements pe
        JOIN dream_entries de ON pe.dream_entry_id = de.id
        WHERE de.user_id = ?
      `, [userId]),
      
      // Approval history
      prompt_approvals: await db.getAllAsync(`
        SELECT pa.* FROM prompt_approvals pa
        JOIN prompt_enhancements pe ON pa.enhancement_id = pe.id
        JOIN dream_entries de ON pe.dream_entry_id = de.id
        WHERE de.user_id = ?
      `, [userId]),
      
      // Characters and preferences
      user_characters: await db.getAllAsync(
        'SELECT * FROM user_characters WHERE user_id = ?',
        [userId]
      ),
      
      art_style_preferences: await db.getAllAsync(
        'SELECT * FROM art_style_preferences WHERE user_id = ?',
        [userId]
      ),
      
      // Usage analytics (if consented)
      analytics_events: await this.getAnalyticsData(userId),
      
      // Cost data
      cost_tracking: await db.getAllAsync(
        'SELECT * FROM cost_tracking WHERE user_id = ?',
        [userId]
      )
    };
    
    // Remove audio file paths from export (privacy)
    userData.dream_entries = userData.dream_entries.map(entry => ({
      ...entry,
      audio_file_path: '[REDACTED - PRIVATE LOCAL FILE]'
    }));
    
    // Log the export
    await this.logDataExport(userId, format);
    
    if (format === 'csv') {
      return this.convertToCSV(userData);
    }
    
    return userData;
  }
  
  // Get analytics data (only if user consented)
  async getAnalyticsData(userId) {
    const settings = await this.getPrivacySettings(userId);
    
    if (!settings.analytics_consent) {
      return { message: 'Analytics data not available - user has not consented to analytics tracking' };
    }
    
    const db = getDatabase();
    return await db.getAllAsync(
      'SELECT * FROM analytics_events WHERE user_id = ? AND is_anonymous = 0',
      [userId]
    );
  }
  
  // Delete all user data (GDPR right to erasure)
  async deleteAllUserData(userId, confirmationCode) {
    // Security check - require confirmation
    const expectedCode = `DELETE_${userId}_${new Date().getDate()}`;
    if (confirmationCode !== expectedCode) {
      throw new Error('Invalid confirmation code for data deletion');
    }
    
    const db = getDatabase();
    
    console.log(`GDPR deletion initiated for user ${userId}`);
    
    // Get all audio files before deletion
    const audioFiles = await db.getAllAsync(`
      SELECT af.file_path FROM audio_files af
      JOIN dream_entries de ON af.dream_entry_id = de.id
      WHERE de.user_id = ?
    `, [userId]);
    
    // Delete audio files from filesystem
    for (const audio of audioFiles) {
      try {
        await FileSystem.deleteAsync(audio.file_path);
      } catch (error) {
        console.warn(`Failed to delete audio file:`, error);
      }
    }
    
    // Delete all user data (cascading deletes handle related tables)
    const deletionResult = {
      dream_entries: await db.runAsync('DELETE FROM dream_entries WHERE user_id = ?', [userId]),
      user_characters: await db.runAsync('DELETE FROM user_characters WHERE user_id = ?', [userId]),
      art_preferences: await db.runAsync('DELETE FROM art_style_preferences WHERE user_id = ?', [userId]),
      analytics: await db.runAsync('DELETE FROM analytics_events WHERE user_id = ?', [userId]),
      cost_tracking: await db.runAsync('DELETE FROM cost_tracking WHERE user_id = ?', [userId]),
      settings: await db.runAsync("DELETE FROM core_settings WHERE setting_key LIKE ?", [`%_${userId}`])
    };
    
    // Log the deletion (anonymized)
    await db.runAsync(`
      INSERT INTO analytics_events (
        event_type, event_name, event_category, user_id,
        event_properties, is_anonymous
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'privacy_event',
      'user_data_deleted',
      'privacy',
      'anonymous',
      JSON.stringify({
        deletion_date: new Date().toISOString(),
        records_deleted: Object.values(deletionResult).reduce((sum, result) => sum + result.changes, 0)
      }),
      1
    ]);
    
    return {
      message: 'All user data has been permanently deleted',
      deletion_result: deletionResult,
      audio_files_deleted: audioFiles.length
    };
  }
  
  // Generate GDPR compliance report
  async generateComplianceReport(userId) {
    const db = getDatabase();
    const settings = await this.getPrivacySettings(userId);
    
    // Data inventory
    const dataInventory = {
      dream_entries: await db.getFirstAsync(
        'SELECT COUNT(*) as count, MIN(created_at) as oldest, MAX(created_at) as newest FROM dream_entries WHERE user_id = ?',
        [userId]
      ),
      audio_files: await db.getFirstAsync(`
        SELECT COUNT(*) as count, SUM(file_size) as total_size FROM audio_files af
        JOIN dream_entries de ON af.dream_entry_id = de.id
        WHERE de.user_id = ?
      `, [userId]),
      analysis_records: await db.getFirstAsync(`
        SELECT COUNT(*) as count FROM psychological_analysis pa
        JOIN dream_entries de ON pa.dream_entry_id = de.id
        WHERE de.user_id = ?
      `, [userId])
    };
    
    // Consent status
    const consentStatus = {
      analytics_consent: settings.analytics_consent,
      improvement_consent: settings.improvement_consent,
      cloud_sync_consent: settings.cloud_sync_consent,
      data_retention_days: settings.data_retention_days,
      local_processing_only: settings.local_processing_only
    };
    
    // Data processing activities
    const processingActivities = [
      {
        purpose: 'Dream content storage and analysis',
        legal_basis: 'User consent',
        data_types: ['Audio recordings', 'Text transcriptions', 'Psychological analysis'],
        retention_period: `${settings.data_retention_days} days`,
        processing_location: settings.local_processing_only ? 'On-device only' : 'Mixed'
      },
      {
        purpose: 'AI image generation',
        legal_basis: 'User consent',
        data_types: ['Enhanced text prompts only'],
        retention_period: 'Not stored - API call only',
        processing_location: 'External API (OpenAI)'
      }
    ];
    
    return {
      user_id: userId,
      report_date: new Date().toISOString(),
      compliance_status: 'COMPLIANT',
      data_inventory: dataInventory,
      consent_status: consentStatus,
      processing_activities: processingActivities,
      rights_available: [
        'Right to access (data export)',
        'Right to rectification (edit/delete entries)',
        'Right to erasure (full account deletion)',
        'Right to data portability (export formats)',
        'Right to object (opt-out of analytics)'
      ]
    };
  }
  
  // Log data export for compliance
  async logDataExport(userId, format) {
    const db = getDatabase();
    
    await db.runAsync(`
      INSERT INTO analytics_events (
        event_type, event_name, event_category, user_id,
        event_properties, is_anonymous
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'privacy_event',
      'data_exported',
      'privacy',
      userId,
      JSON.stringify({
        export_format: format,
        export_date: new Date().toISOString()
      }),
      0
    ]);
  }
  
  // Log data cleanup for compliance
  async logDataCleanup(userId, cleanupResult) {
    const db = getDatabase();
    
    await db.runAsync(`
      INSERT INTO analytics_events (
        event_type, event_name, event_category, user_id,
        event_properties, is_anonymous
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'privacy_event',
      'data_retention_enforced',
      'privacy',
      userId,
      JSON.stringify(cleanupResult),
      1 // Anonymous for privacy
    ]);
  }
  
  // Convert data to CSV format
  convertToCSV(userData) {
    // This is a simplified CSV export - in production you'd want separate CSV files
    const entries = userData.dream_entries || [];
    
    const headers = [
      'entry_date',
      'dream_title',
      'lucidity_level',
      'vividness_level',
      'emotional_intensity',
      'created_at'
    ];
    
    const rows = entries.map(entry => [
      entry.entry_date,
      entry.dream_title || '',
      entry.lucidity_level,
      entry.vividness_level,
      entry.emotional_intensity,
      entry.created_at
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\\n');
  }
}

export default new PrivacyService();