import { getDatabase } from './databaseV2.js';

/**
 * Enhancement Service
 * Handles prompt enhancement, user approval, and enhancement tracking
 */
class EnhancementService {
  
  // Save prompt enhancement
  async saveEnhancement(dreamEntryId, enhancementData) {
    const db = getDatabase();
    
    const {
      originalPrompt,
      enhancedPrompt,
      artStyle = 'ethereal',
      styleIntensity = 1.0,
      emotionsUsed = [],
      themesUsed = [],
      symbolsUsed = [],
      enhancementMethod = 'psychological_analysis',
      enhancementDuration = 0,
      tokensEstimated = 0
    } = enhancementData;
    
    // Calculate metrics
    const promptLength = enhancedPrompt.length;
    const complexityScore = this.calculateComplexityScore(enhancedPrompt);
    const readabilityScore = this.calculateReadabilityScore(enhancedPrompt);
    
    const result = await db.runAsync(`
      INSERT INTO prompt_enhancements (
        dream_entry_id, original_prompt, enhanced_prompt,
        enhancement_method, art_style, style_intensity,
        emotions_used, themes_used, symbols_used,
        enhancement_data, prompt_length, complexity_score,
        readability_score, enhancement_duration_ms, tokens_estimated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dreamEntryId, originalPrompt, enhancedPrompt,
      enhancementMethod, artStyle, styleIntensity,
      JSON.stringify(emotionsUsed), JSON.stringify(themesUsed), JSON.stringify(symbolsUsed),
      JSON.stringify(enhancementData), promptLength, complexityScore,
      readabilityScore, enhancementDuration, tokensEstimated
    ]);
    
    return result.lastInsertRowId;
  }
  
  // Save user approval decision
  async saveApproval(enhancementId, approvalData) {
    const db = getDatabase();
    
    const {
      approvalStatus = 'approved',
      userModifications = null,
      approvalReason = '',
      dataSharingConsent = false,
      analyticsConsent = false,
      improvementConsent = false,
      timeToApprove = 0,
      approvalMethod = 'manual',
      satisfactionRating = null,
      userFeedback = ''
    } = approvalData;
    
    const result = await db.runAsync(`
      INSERT INTO prompt_approvals (
        enhancement_id, approval_status, user_modifications, approval_reason,
        data_sharing_consent, analytics_consent, improvement_consent,
        time_to_approve_seconds, approval_method, satisfaction_rating,
        user_feedback, approved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      enhancementId, approvalStatus, userModifications, approvalReason,
      dataSharingConsent ? 1 : 0, analyticsConsent ? 1 : 0, improvementConsent ? 1 : 0,
      timeToApprove, approvalMethod, satisfactionRating, userFeedback
    ]);
    
    // Update the enhancement with final approved prompt
    const finalPrompt = userModifications || 
      (await this.getEnhancement(enhancementId)).enhanced_prompt;
    
    await db.runAsync(
      'UPDATE prompt_enhancements SET final_approved_prompt = ? WHERE id = ?',
      [finalPrompt, enhancementId]
    );
    
    return result.lastInsertRowId;
  }
  
  // Get enhancement with approval status
  async getEnhancement(enhancementId) {
    const db = getDatabase();
    
    const enhancement = await db.getFirstAsync(`
      SELECT 
        pe.*,
        pa.approval_status,
        pa.user_modifications,
        pa.satisfaction_rating,
        pa.approved_at
      FROM prompt_enhancements pe
      LEFT JOIN prompt_approvals pa ON pe.id = pa.enhancement_id
      WHERE pe.id = ?
    `, [enhancementId]);
    
    if (!enhancement) return null;
    
    return {
      ...enhancement,
      emotions_used: JSON.parse(enhancement.emotions_used || '[]'),
      themes_used: JSON.parse(enhancement.themes_used || '[]'),
      symbols_used: JSON.parse(enhancement.symbols_used || '[]'),
      enhancement_data: JSON.parse(enhancement.enhancement_data || '{}')
    };
  }
  
  // Get enhancement history for a dream
  async getEnhancementHistory(dreamEntryId) {
    const db = getDatabase();
    
    const history = await db.getAllAsync(`
      SELECT 
        pe.*,
        pa.approval_status,
        pa.approved_at,
        pa.satisfaction_rating
      FROM prompt_enhancements pe
      LEFT JOIN prompt_approvals pa ON pe.id = pa.enhancement_id
      WHERE pe.dream_entry_id = ?
      ORDER BY pe.created_at DESC
    `, [dreamEntryId]);
    
    return history.map(row => ({
      ...row,
      emotions_used: JSON.parse(row.emotions_used || '[]'),
      themes_used: JSON.parse(row.themes_used || '[]'),
      symbols_used: JSON.parse(row.symbols_used || '[]')
    }));
  }
  
  // Track enhancement performance metrics
  async getEnhancementStats(userId = 'default_user', timeframe = '30_days') {
    const db = getDatabase();
    
    const timeCondition = this.getTimeCondition(timeframe);
    
    // Overall enhancement statistics
    const stats = await db.getFirstAsync(`
      SELECT 
        COUNT(*) as total_enhancements,
        AVG(pe.complexity_score) as avg_complexity,
        AVG(pe.readability_score) as avg_readability,
        AVG(pe.enhancement_duration_ms) as avg_duration_ms,
        AVG(pa.time_to_approve_seconds) as avg_approval_time,
        AVG(pa.satisfaction_rating) as avg_satisfaction
      FROM prompt_enhancements pe
      JOIN dream_entries de ON pe.dream_entry_id = de.id
      LEFT JOIN prompt_approvals pa ON pe.id = pa.enhancement_id
      WHERE de.user_id = ? ${timeCondition}
    `, [userId]);
    
    // Approval rate by status
    const approvalStats = await db.getAllAsync(`
      SELECT 
        pa.approval_status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM prompt_enhancements pe
      JOIN dream_entries de ON pe.dream_entry_id = de.id
      LEFT JOIN prompt_approvals pa ON pe.id = pa.enhancement_id
      WHERE de.user_id = ? ${timeCondition}
      GROUP BY pa.approval_status
    `, [userId]);
    
    // Most effective art styles
    const styleStats = await db.getAllAsync(`
      SELECT 
        pe.art_style,
        COUNT(*) as usage_count,
        AVG(pa.satisfaction_rating) as avg_rating
      FROM prompt_enhancements pe
      JOIN dream_entries de ON pe.dream_entry_id = de.id
      LEFT JOIN prompt_approvals pa ON pe.id = pa.enhancement_id
      WHERE de.user_id = ? AND pa.satisfaction_rating IS NOT NULL ${timeCondition}
      GROUP BY pe.art_style
      ORDER BY avg_rating DESC, usage_count DESC
    `, [userId]);
    
    return {
      ...stats,
      approval_breakdown: approvalStats,
      style_effectiveness: styleStats
    };
  }
  
  // Find optimization opportunities
  async getOptimizationSuggestions(userId = 'default_user') {
    const db = getDatabase();
    
    const suggestions = [];
    
    // Check for frequently rejected enhancements
    const rejectedPatterns = await db.getAllAsync(`
      SELECT 
        pe.art_style,
        COUNT(*) as rejection_count
      FROM prompt_enhancements pe
      JOIN dream_entries de ON pe.dream_entry_id = de.id
      JOIN prompt_approvals pa ON pe.id = pa.enhancement_id
      WHERE de.user_id = ? AND pa.approval_status = 'rejected'
      GROUP BY pe.art_style
      HAVING rejection_count > 2
      ORDER BY rejection_count DESC
    `, [userId]);
    
    rejectedPatterns.forEach(pattern => {
      suggestions.push({
        type: 'style_optimization',
        priority: 'medium',
        message: `Consider adjusting ${pattern.art_style} style - frequently rejected (${pattern.rejection_count} times)`,
        action: 'review_style_preferences'
      });
    });
    
    // Check for slow approval times
    const slowApprovals = await db.getFirstAsync(`
      SELECT AVG(time_to_approve_seconds) as avg_time
      FROM prompt_approvals pa
      JOIN prompt_enhancements pe ON pa.enhancement_id = pe.id
      JOIN dream_entries de ON pe.dream_entry_id = de.id
      WHERE de.user_id = ? AND pa.time_to_approve_seconds > 60
    `, [userId]);
    
    if (slowApprovals.avg_time > 120) {
      suggestions.push({
        type: 'ui_optimization',
        priority: 'low',
        message: 'Approval process taking longer than average - consider simplifying prompts',
        action: 'simplify_prompts'
      });
    }
    
    // Check for low satisfaction ratings
    const lowSatisfaction = await db.getFirstAsync(`
      SELECT AVG(satisfaction_rating) as avg_rating
      FROM prompt_approvals pa
      JOIN prompt_enhancements pe ON pa.enhancement_id = pe.id
      JOIN dream_entries de ON pe.dream_entry_id = de.id
      WHERE de.user_id = ? AND pa.satisfaction_rating IS NOT NULL
    `, [userId]);
    
    if (lowSatisfaction.avg_rating < 3.5) {
      suggestions.push({
        type: 'enhancement_quality',
        priority: 'high',
        message: 'Enhancement quality below optimal - review analysis accuracy',
        action: 'improve_analysis'
      });
    }
    
    return suggestions;
  }
  
  // Calculate complexity score for prompts
  calculateComplexityScore(prompt) {
    const words = prompt.split(/\\s+/).length;
    const sentences = prompt.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    const longWords = prompt.split(/\\s+/).filter(word => word.length > 6).length;
    
    // Simple complexity formula (0-1 scale)
    return Math.min(1.0, (avgWordsPerSentence / 20) + (longWords / words));
  }
  
  // Calculate readability score for prompts
  calculateReadabilityScore(prompt) {
    const words = prompt.split(/\\s+/).length;
    const sentences = prompt.split(/[.!?]+/).length;
    const syllables = this.countSyllables(prompt);
    
    // Simplified Flesch Reading Ease (normalized to 0-1)
    const flesch = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(1, flesch / 100));
  }
  
  // Count syllables in text (approximation)
  countSyllables(text) {
    const words = text.toLowerCase().split(/\\s+/);
    let syllableCount = 0;
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (cleanWord.length > 0) {
        const vowelMatches = cleanWord.match(/[aeiouy]+/g);
        syllableCount += vowelMatches ? vowelMatches.length : 1;
      }
    });
    
    return syllableCount;
  }
  
  // Helper: Generate time condition for SQL queries
  getTimeCondition(timeframe) {
    const conditions = {
      '7_days': "AND pe.created_at >= datetime('now', '-7 days')",
      '30_days': "AND pe.created_at >= datetime('now', '-30 days')",
      '90_days': "AND pe.created_at >= datetime('now', '-90 days')",
      '1_year': "AND pe.created_at >= datetime('now', '-1 year')",
      'all_time': ''
    };
    
    return conditions[timeframe] || conditions['30_days'];
  }
}

export default new EnhancementService();