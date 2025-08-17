import { getDatabase, initializeDatabase } from './databaseV2.js';
import analysisService from './analysisService.js';
import enhancementService from './enhancementService.js';
import privacyService from './privacyService.js';
import * as FileSystem from 'expo-file-system';

/**
 * Unified Dream Database Service
 * High-level service that orchestrates all database operations for dream management
 */
class DreamDatabaseService {
  
  // Initialize the complete database system
  async initialize() {
    return await initializeDatabase();
  }
  
  // Create a complete dream entry with all associated data
  async createCompleteDreamEntry(dreamData) {
    const db = getDatabase();
    
    try {
      // Start transaction
      await db.execAsync('BEGIN TRANSACTION');
      
      const {
        // Basic dream information
        userId = 'default_user',
        entryDate = new Date().toISOString().split('T')[0],
        dreamTitle = '',
        originalTranscription = '',
        enhancedDescription = '',
        
        // Assessment
        lucidityLevel = 0,
        vividnessLevel = 0,
        emotionalIntensity = 0,
        
        // Audio data
        audioFiles = [], // Array of { filePath, audioType, duration, etc. }
        
        // Analysis data
        analysisData = null, // { emotions, themes, symbols, etc. }
        
        // Enhancement data
        enhancementData = null, // { originalPrompt, enhancedPrompt, etc. }
        
        // Approval data
        approvalData = null, // { approvalStatus, userModifications, etc. }
        
        // Additional data
        artStyle = 'ethereal',
        processingLocation = 'on_device'
      } = dreamData;
      
      // 1. Create main dream entry
      const dreamResult = await db.runAsync(`
        INSERT INTO dream_entries (
          user_id, entry_date, dream_title, original_transcription,
          enhanced_description, lucidity_level, vividness_level,
          emotional_intensity, processing_location, entry_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, entryDate, dreamTitle, originalTranscription,
        enhancedDescription, lucidityLevel, vividnessLevel,
        emotionalIntensity, processingLocation, 'draft'
      ]);
      
      const dreamEntryId = dreamResult.lastInsertRowId;
      
      // 2. Save audio files
      for (const audioFile of audioFiles) {
        await this.saveAudioFile(dreamEntryId, audioFile);
      }
      
      // 3. Save psychological analysis if provided
      let analysisId = null;
      if (analysisData) {
        analysisId = await analysisService.saveAnalysis(dreamEntryId, analysisData);
      }
      
      // 4. Save enhancement if provided
      let enhancementId = null;
      if (enhancementData) {
        enhancementId = await enhancementService.saveEnhancement(dreamEntryId, enhancementData);
        
        // 5. Save approval if provided
        if (approvalData && enhancementId) {
          await enhancementService.saveApproval(enhancementId, approvalData);
        }
      }
      
      // 6. Update dream entry status
      await db.runAsync(
        'UPDATE dream_entries SET entry_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['complete', dreamEntryId]
      );
      
      // Commit transaction
      await db.execAsync('COMMIT');
      
      // Return the complete dream entry
      return await this.getDreamEntry(dreamEntryId);
      
    } catch (error) {
      // Rollback on error
      await db.execAsync('ROLLBACK');
      console.error('Failed to create complete dream entry:', error);
      throw error;
    }
  }
  
  // Save audio file with metadata
  async saveAudioFile(dreamEntryId, audioFileData) {
    const db = getDatabase();
    
    const {
      filePath,
      fileName = null,
      duration = 0,
      audioType = 'original_dream',
      audioFormat = 'm4a',
      transcriptionMethod = 'on_device',
      transcriptionConfidence = 0.0,
      promptId = null
    } = audioFileData;
    
    // Get file size
    let fileSize = 0;
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      fileSize = fileInfo.size || 0;
    } catch (error) {
      console.warn('Could not get file size:', error);
    }
    
    // Set auto-delete date based on privacy settings
    const privacySettings = await privacyService.getPrivacySettings('default_user');
    const autoDeleteDate = new Date();
    autoDeleteDate.setDate(autoDeleteDate.getDate() + privacySettings.data_retention_days);
    
    const result = await db.runAsync(`
      INSERT INTO audio_files (
        dream_entry_id, file_path, file_name, file_size, duration_seconds,
        audio_format, audio_type, prompt_id, transcription_method,
        transcription_confidence, auto_delete_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dreamEntryId, filePath, fileName, fileSize, duration,
      audioFormat, audioType, promptId, transcriptionMethod,
      transcriptionConfidence, autoDeleteDate.toISOString()
    ]);
    
    return result.lastInsertRowId;
  }
  
  // Get complete dream entry with all associated data
  async getDreamEntry(dreamEntryId) {
    const db = getDatabase();
    
    // Get main entry
    const entry = await db.getFirstAsync(
      'SELECT * FROM dream_entries WHERE id = ?',
      [dreamEntryId]
    );
    
    if (!entry) return null;
    
    // Get audio files
    const audioFiles = await db.getAllAsync(
      'SELECT * FROM audio_files WHERE dream_entry_id = ? ORDER BY created_at',
      [dreamEntryId]
    );
    
    // Get psychological analysis
    const analysis = await analysisService.getAnalysis(dreamEntryId);
    
    // Get enhancement history
    const enhancements = await enhancementService.getEnhancementHistory(dreamEntryId);
    
    // Get journal prompts
    const prompts = await db.getAllAsync(
      'SELECT * FROM journal_prompts WHERE dream_entry_id = ? ORDER BY prompt_order',
      [dreamEntryId]
    );
    
    // Get image generations
    const images = await db.getAllAsync(
      'SELECT * FROM image_generations WHERE dream_entry_id = ? ORDER BY created_at DESC',
      [dreamEntryId]
    );
    
    return {
      ...entry,
      audio_files: audioFiles,
      psychological_analysis: analysis,
      enhancements: enhancements,
      journal_prompts: prompts,
      image_generations: images,
      
      // Computed fields
      has_audio: audioFiles.length > 0,
      has_analysis: !!analysis,
      has_enhancements: enhancements.length > 0,
      has_images: images.length > 0,
      completion_status: this.calculateCompletionStatus(entry, audioFiles, analysis, enhancements, images)
    };
  }
  
  // Get dream entries with pagination and filtering
  async getDreamEntries(options = {}) {
    const db = getDatabase();
    
    const {
      userId = 'default_user',
      limit = 20,
      offset = 0,
      dateFrom = null,
      dateTo = null,
      status = null,
      hasAnalysis = null,
      hasImages = null,
      searchTerm = null,
      sortBy = 'entry_date',
      sortOrder = 'DESC'
    } = options;
    
    let query = `
      SELECT 
        de.*,
        COUNT(af.id) as audio_count,
        COUNT(DISTINCT pa.id) as analysis_count,
        COUNT(DISTINCT pe.id) as enhancement_count,
        COUNT(DISTINCT ig.id) as image_count
      FROM dream_entries de
      LEFT JOIN audio_files af ON de.id = af.dream_entry_id
      LEFT JOIN psychological_analysis pa ON de.id = pa.dream_entry_id
      LEFT JOIN prompt_enhancements pe ON de.id = pe.dream_entry_id
      LEFT JOIN image_generations ig ON de.id = ig.dream_entry_id
      WHERE de.user_id = ?
    `;
    
    const params = [userId];
    
    // Add filters
    if (dateFrom) {
      query += ' AND de.entry_date >= ?';
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ' AND de.entry_date <= ?';
      params.push(dateTo);
    }
    
    if (status) {
      query += ' AND de.entry_status = ?';
      params.push(status);
    }
    
    if (searchTerm) {
      query += ' AND (de.dream_title LIKE ? OR de.original_transcription LIKE ? OR de.enhanced_description LIKE ?)';
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    query += ' GROUP BY de.id';
    
    // Add having clauses for analysis/image filters
    if (hasAnalysis !== null) {
      query += hasAnalysis ? ' HAVING analysis_count > 0' : ' HAVING analysis_count = 0';
    }
    
    if (hasImages !== null) {
      query += hasImages ? ' HAVING image_count > 0' : ' HAVING image_count = 0';
    }
    
    // Add sorting
    const validSortColumns = ['entry_date', 'created_at', 'updated_at', 'dream_title', 'lucidity_level', 'vividness_level'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortColumns.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      query += ` ORDER BY de.${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      query += ' ORDER BY de.entry_date DESC';
    }
    
    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const entries = await db.getAllAsync(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM dream_entries WHERE user_id = ?';
    const countParams = [userId];
    
    if (dateFrom) {
      countQuery += ' AND entry_date >= ?';
      countParams.push(dateFrom);
    }
    
    if (dateTo) {
      countQuery += ' AND entry_date <= ?';
      countParams.push(dateTo);
    }
    
    if (status) {
      countQuery += ' AND entry_status = ?';
      countParams.push(status);
    }
    
    const countResult = await db.getFirstAsync(countQuery, countParams);
    
    return {
      entries: entries,
      total: countResult.total,
      limit: limit,
      offset: offset,
      has_more: (offset + limit) < countResult.total
    };
  }
  
  // Update dream entry
  async updateDreamEntry(dreamEntryId, updateData) {
    const db = getDatabase();
    
    const {
      dreamTitle,
      enhancedDescription,
      lucidityLevel,
      vividnessLevel,
      emotionalIntensity,
      entryStatus
    } = updateData;
    
    const fields = [];
    const values = [];
    
    if (dreamTitle !== undefined) {
      fields.push('dream_title = ?');
      values.push(dreamTitle);
    }
    
    if (enhancedDescription !== undefined) {
      fields.push('enhanced_description = ?');
      values.push(enhancedDescription);
    }
    
    if (lucidityLevel !== undefined) {
      fields.push('lucidity_level = ?');
      values.push(lucidityLevel);
    }
    
    if (vividnessLevel !== undefined) {
      fields.push('vividness_level = ?');
      values.push(vividnessLevel);
    }
    
    if (emotionalIntensity !== undefined) {
      fields.push('emotional_intensity = ?');
      values.push(emotionalIntensity);
    }
    
    if (entryStatus !== undefined) {
      fields.push('entry_status = ?');
      values.push(entryStatus);
    }
    
    if (fields.length === 0) return false;
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(dreamEntryId);
    
    await db.runAsync(
      `UPDATE dream_entries SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return true;
  }
  
  // Delete dream entry and all associated data
  async deleteDreamEntry(dreamEntryId) {
    const db = getDatabase();
    
    try {
      await db.execAsync('BEGIN TRANSACTION');
      
      // Get audio files to delete from filesystem
      const audioFiles = await db.getAllAsync(
        'SELECT file_path FROM audio_files WHERE dream_entry_id = ?',
        [dreamEntryId]
      );
      
      // Delete audio files from filesystem
      for (const audio of audioFiles) {
        try {
          await FileSystem.deleteAsync(audio.file_path);
        } catch (error) {
          console.warn(`Failed to delete audio file ${audio.file_path}:`, error);
        }
      }
      
      // Delete the dream entry (cascades to all related tables)
      await db.runAsync('DELETE FROM dream_entries WHERE id = ?', [dreamEntryId]);
      
      await db.execAsync('COMMIT');
      return true;
      
    } catch (error) {
      await db.execAsync('ROLLBACK');
      console.error('Failed to delete dream entry:', error);
      throw error;
    }
  }
  
  // Get comprehensive dashboard statistics
  async getDashboardStats(userId = 'default_user', timeframe = '30_days') {
    const db = getDatabase();
    
    const timeCondition = this.getTimeCondition(timeframe);
    
    // Basic statistics
    const basicStats = await db.getFirstAsync(`
      SELECT 
        COUNT(*) as total_dreams,
        AVG(lucidity_level) as avg_lucidity,
        AVG(vividness_level) as avg_vividness,
        AVG(emotional_intensity) as avg_emotional_intensity,
        COUNT(CASE WHEN entry_status = 'complete' THEN 1 END) as completed_dreams
      FROM dream_entries 
      WHERE user_id = ? ${timeCondition}
    `, [userId]);
    
    // Get analysis statistics
    const analysisStats = await analysisService.getAnalysisStats(userId, timeframe);
    
    // Get enhancement statistics
    const enhancementStats = await enhancementService.getEnhancementStats(userId, timeframe);
    
    // Privacy compliance status
    const privacySettings = await privacyService.getPrivacySettings(userId);
    
    // Recent activity
    const recentDreams = await db.getAllAsync(`
      SELECT id, dream_title, entry_date, entry_status
      FROM dream_entries 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [userId]);
    
    return {
      timeframe,
      basic_stats: basicStats,
      analysis_stats: analysisStats,
      enhancement_stats: enhancementStats,
      privacy_settings: privacySettings,
      recent_dreams: recentDreams,
      generated_at: new Date().toISOString()
    };
  }
  
  // Calculate completion status for a dream entry
  calculateCompletionStatus(entry, audioFiles, analysis, enhancements, images) {
    const checks = {
      has_title: !!entry.dream_title,
      has_transcription: !!entry.original_transcription,
      has_audio: audioFiles.length > 0,
      has_analysis: !!analysis,
      has_enhancement: enhancements.length > 0,
      has_image: images.length > 0
    };
    
    const completedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    const completionPercentage = Math.round((completedChecks / totalChecks) * 100);
    
    let status = 'incomplete';
    if (completionPercentage >= 100) status = 'complete';
    else if (completionPercentage >= 75) status = 'mostly_complete';
    else if (completionPercentage >= 50) status = 'partially_complete';
    
    return {
      status,
      percentage: completionPercentage,
      checks,
      completed_checks: completedChecks,
      total_checks: totalChecks
    };
  }
  
  // Helper: Generate time condition for SQL queries
  getTimeCondition(timeframe) {
    const conditions = {
      '7_days': "AND created_at >= datetime('now', '-7 days')",
      '30_days': "AND created_at >= datetime('now', '-30 days')",
      '90_days': "AND created_at >= datetime('now', '-90 days')",
      '1_year': "AND created_at >= datetime('now', '-1 year')",
      'all_time': ''
    };
    
    return conditions[timeframe] || conditions['30_days'];
  }
  
  // Maintenance operations
  async runMaintenance(userId = 'default_user') {
    console.log('Running database maintenance...');
    
    const results = {
      privacy_cleanup: await privacyService.enforceDataRetention(userId),
      database_vacuum: await this.vacuumDatabase(),
      integrity_check: await this.checkDatabaseIntegrity()
    };
    
    console.log('Database maintenance completed:', results);
    return results;
  }
  
  // Vacuum database for performance
  async vacuumDatabase() {
    const db = getDatabase();
    await db.execAsync('VACUUM');
    return { status: 'completed' };
  }
  
  // Check database integrity
  async checkDatabaseIntegrity() {
    const db = getDatabase();
    const result = await db.getFirstAsync('PRAGMA integrity_check');
    return { status: result.integrity_check === 'ok' ? 'passed' : 'failed', result };
  }
}

export default new DreamDatabaseService();