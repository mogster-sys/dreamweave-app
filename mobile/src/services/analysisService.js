import { getDatabase } from './databaseV2.js';

/**
 * Psychological Analysis Service
 * Handles storing and retrieving on-device dream analysis
 */
class AnalysisService {
  
  // Save psychological analysis results
  async saveAnalysis(dreamEntryId, analysisData) {
    const db = getDatabase();
    
    const {
      emotions = [],
      themes = [],
      symbols = [],
      analysisMethod = 'keyword_matching',
      analysisVersion = 'v1.0',
      confidenceScore = 0.0,
      analysisDuration = 0
    } = analysisData;
    
    // Calculate derived metrics
    const dominantEmotion = emotions.length > 0 ? emotions[0] : null;
    const dominantTheme = themes.length > 0 ? themes[0] : null;
    const emotionalComplexity = emotions.length;
    const symbolicDensity = symbols.length / 10.0; // Normalize to 0-1 scale
    
    const result = await db.runAsync(`
      INSERT INTO psychological_analysis (
        dream_entry_id, analysis_version, analysis_method, confidence_score,
        emotions_detected, dominant_emotion, emotional_complexity,
        themes_detected, dominant_theme, theme_confidence,
        symbols_detected, symbolic_density, analysis_duration_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dreamEntryId, analysisVersion, analysisMethod, confidenceScore,
      JSON.stringify(emotions), dominantEmotion, emotionalComplexity,
      JSON.stringify(themes), dominantTheme, confidenceScore,
      JSON.stringify(symbols), symbolicDensity, analysisDuration
    ]);
    
    return result.lastInsertRowId;
  }
  
  // Get analysis for a dream entry
  async getAnalysis(dreamEntryId) {
    const db = getDatabase();
    
    const analysis = await db.getFirstAsync(
      'SELECT * FROM psychological_analysis WHERE dream_entry_id = ? ORDER BY created_at DESC LIMIT 1',
      [dreamEntryId]
    );
    
    if (!analysis) return null;
    
    return {
      ...analysis,
      emotions_detected: JSON.parse(analysis.emotions_detected || '[]'),
      themes_detected: JSON.parse(analysis.themes_detected || '[]'),
      symbols_detected: JSON.parse(analysis.symbols_detected || '[]')
    };
  }
  
  // Get analysis statistics for a user
  async getAnalysisStats(userId = 'default_user', timeframe = '30_days') {
    const db = getDatabase();
    
    const timeCondition = this.getTimeCondition(timeframe);
    
    const stats = await db.getFirstAsync(`
      SELECT 
        COUNT(*) as total_analyses,
        AVG(confidence_score) as avg_confidence,
        AVG(emotional_complexity) as avg_emotional_complexity,
        AVG(symbolic_density) as avg_symbolic_density
      FROM psychological_analysis pa
      JOIN dream_entries de ON pa.dream_entry_id = de.id
      WHERE de.user_id = ? ${timeCondition}
    `, [userId]);
    
    // Get most common emotions
    const emotions = await db.getAllAsync(`
      SELECT dominant_emotion, COUNT(*) as frequency
      FROM psychological_analysis pa
      JOIN dream_entries de ON pa.dream_entry_id = de.id
      WHERE de.user_id = ? AND dominant_emotion IS NOT NULL ${timeCondition}
      GROUP BY dominant_emotion
      ORDER BY frequency DESC
      LIMIT 5
    `, [userId]);
    
    // Get most common themes
    const themes = await db.getAllAsync(`
      SELECT dominant_theme, COUNT(*) as frequency
      FROM psychological_analysis pa
      JOIN dream_entries de ON pa.dream_entry_id = de.id
      WHERE de.user_id = ? AND dominant_theme IS NOT NULL ${timeCondition}
      GROUP BY dominant_theme
      ORDER BY frequency DESC
      LIMIT 5
    `, [userId]);
    
    return {
      ...stats,
      top_emotions: emotions,
      top_themes: themes
    };
  }
  
  // Track analysis performance
  async recordAnalysisPerformance(dreamEntryId, performanceData) {
    const db = getDatabase();
    
    await db.runAsync(`
      INSERT INTO analytics_events (
        event_type, event_name, event_category, dream_entry_id,
        event_properties, duration_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      'performance_metric',
      'psychological_analysis_completed', 
      'analysis',
      dreamEntryId,
      JSON.stringify(performanceData),
      performanceData.duration_ms
    ]);
  }
  
  // Helper: Generate time condition for SQL queries
  getTimeCondition(timeframe) {
    const conditions = {
      '7_days': "AND de.created_at >= datetime('now', '-7 days')",
      '30_days': "AND de.created_at >= datetime('now', '-30 days')",
      '90_days': "AND de.created_at >= datetime('now', '-90 days')",
      '1_year': "AND de.created_at >= datetime('now', '-1 year')",
      'all_time': ''
    };
    
    return conditions[timeframe] || conditions['30_days'];
  }
  
  // Find similar dreams based on analysis
  async findSimilarDreams(dreamEntryId, limit = 5) {
    const db = getDatabase();
    
    // Get analysis for the target dream
    const targetAnalysis = await this.getAnalysis(dreamEntryId);
    if (!targetAnalysis) return [];
    
    // Find dreams with similar dominant emotions or themes
    const similarDreams = await db.getAllAsync(`
      SELECT 
        de.id,
        de.dream_title,
        de.entry_date,
        pa.dominant_emotion,
        pa.dominant_theme,
        pa.confidence_score
      FROM psychological_analysis pa
      JOIN dream_entries de ON pa.dream_entry_id = de.id
      WHERE de.id != ? 
        AND (
          pa.dominant_emotion = ? 
          OR pa.dominant_theme = ?
        )
      ORDER BY pa.confidence_score DESC
      LIMIT ?
    `, [
      dreamEntryId, 
      targetAnalysis.dominant_emotion, 
      targetAnalysis.dominant_theme,
      limit
    ]);
    
    return similarDreams;
  }
  
  // Export analysis data for insights
  async exportAnalysisData(userId = 'default_user', format = 'json') {
    const db = getDatabase();
    
    const analysisData = await db.getAllAsync(`
      SELECT 
        de.entry_date,
        de.dream_title,
        pa.emotions_detected,
        pa.themes_detected,
        pa.symbols_detected,
        pa.dominant_emotion,
        pa.dominant_theme,
        pa.confidence_score
      FROM psychological_analysis pa
      JOIN dream_entries de ON pa.dream_entry_id = de.id
      WHERE de.user_id = ?
      ORDER BY de.entry_date DESC
    `, [userId]);
    
    // Parse JSON fields
    const parsedData = analysisData.map(row => ({
      ...row,
      emotions_detected: JSON.parse(row.emotions_detected || '[]'),
      themes_detected: JSON.parse(row.themes_detected || '[]'),
      symbols_detected: JSON.parse(row.symbols_detected || '[]')
    }));
    
    if (format === 'csv') {
      return this.convertToCSV(parsedData);
    }
    
    return parsedData;
  }
  
  // Convert data to CSV format
  convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = [
      'entry_date',
      'dream_title', 
      'dominant_emotion',
      'dominant_theme',
      'emotions_count',
      'themes_count',
      'symbols_count',
      'confidence_score'
    ];
    
    const rows = data.map(row => [
      row.entry_date,
      row.dream_title || '',
      row.dominant_emotion || '',
      row.dominant_theme || '',
      row.emotions_detected.length,
      row.themes_detected.length,
      row.symbols_detected.length,
      row.confidence_score
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\\n');
  }
}

export default new AnalysisService();