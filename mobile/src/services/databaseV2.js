import * as SQLite from 'expo-sqlite';

let db = null;

// Database schema version for future migrations
const CURRENT_SCHEMA_VERSION = 2;

export async function initializeDatabase() {
  try {
    db = await SQLite.openDatabaseAsync('dreamweave.db');
    
    // Check and handle schema migrations
    await handleSchemaMigrations();
    
    // Core Tables
    await createCoreTable();
    await createDreamEntriesTable();
    await createAudioFilesTable();
    
    // Analysis Tables (Modular)
    await createPsychologicalAnalysisTable();
    await createPromptEnhancementTable();
    await createPromptApprovalTable();
    
    // Enhancement Tables (Modular)
    await createJournalPromptsTable();
    await createUserCharactersTable();
    await createArtStylePreferencesTable();
    
    // Generation Tables (Modular)
    await createImageGenerationsTable();
    await createCostTrackingTable();
    
    // Future-Ready Tables (Modular)
    await createAnalyticsTable();
    await createSyncTable();
    
    // Create indexes for performance
    await createIndexes();
    
    console.log('Enhanced database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Schema Migration Handler
async function handleSchemaMigrations() {
  // Get current version
  const result = await db.getFirstAsync(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_info'"
  );
  
  if (!result) {
    // First time setup
    await db.execAsync(`
      CREATE TABLE schema_info (
        version INTEGER PRIMARY KEY,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.runAsync('INSERT INTO schema_info (version) VALUES (?)', [CURRENT_SCHEMA_VERSION]);
  } else {
    // Check if migration needed
    const versionInfo = await db.getFirstAsync('SELECT version FROM schema_info LIMIT 1');
    if (versionInfo.version < CURRENT_SCHEMA_VERSION) {
      await migrateSchema(versionInfo.version, CURRENT_SCHEMA_VERSION);
    }
  }
}

async function migrateSchema(fromVersion, toVersion) {
  console.log(`Migrating database from version ${fromVersion} to ${toVersion}`);
  
  // Add migration logic here for future versions
  if (fromVersion < 2) {
    // Migration from v1 to v2 - add new modular tables
    console.log('Migrating to modular schema v2...');
  }
  
  // Update version
  await db.runAsync('UPDATE schema_info SET version = ?, updated_at = CURRENT_TIMESTAMP', [toVersion]);
}

// Core System Table
async function createCoreTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS core_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT,
      setting_type TEXT DEFAULT 'string',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Enhanced Dream Entries (Core)
async function createDreamEntriesTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS dream_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      
      -- Basic Information
      entry_date TEXT NOT NULL,
      dream_title TEXT,
      entry_status TEXT DEFAULT 'draft', -- draft, processing, complete, archived
      
      -- Content
      original_transcription TEXT,
      enhanced_description TEXT,
      final_dream_text TEXT, -- After all enhancements
      
      -- Assessment
      lucidity_level INTEGER DEFAULT 0 CHECK (lucidity_level >= 0 AND lucidity_level <= 5),
      vividness_level INTEGER DEFAULT 0 CHECK (vividness_level >= 0 AND vividness_level <= 5),
      emotional_intensity INTEGER DEFAULT 0 CHECK (emotional_intensity >= 0 AND emotional_intensity <= 5),
      
      -- Privacy & Processing
      processing_location TEXT DEFAULT 'on_device', -- on_device, cloud, hybrid
      data_retention_days INTEGER DEFAULT 365,
      
      -- Timestamps
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_accessed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Audio Files (Privacy-Focused)
async function createAudioFilesTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS audio_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dream_entry_id INTEGER NOT NULL,
      
      -- File Information
      file_path TEXT NOT NULL, -- Local path only
      file_name TEXT,
      file_size INTEGER,
      duration_seconds REAL,
      audio_format TEXT DEFAULT 'm4a',
      
      -- Purpose
      audio_type TEXT NOT NULL, -- 'original_dream', 'enhancement_response', 'note'
      prompt_id INTEGER, -- Links to journal_prompts if it's a response
      
      -- Processing
      transcription_method TEXT DEFAULT 'on_device', -- on_device, manual
      transcription_confidence REAL,
      
      -- Privacy
      is_backed_up INTEGER DEFAULT 0,
      auto_delete_date TEXT, -- For privacy compliance
      
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dream_entry_id) REFERENCES dream_entries (id) ON DELETE CASCADE
    );
  `);
}

// Psychological Analysis (Modular)
async function createPsychologicalAnalysisTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS psychological_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dream_entry_id INTEGER NOT NULL,
      
      -- Analysis Metadata
      analysis_version TEXT DEFAULT 'v1.0',
      analysis_method TEXT DEFAULT 'keyword_matching',
      confidence_score REAL DEFAULT 0.0,
      
      -- Emotional Analysis
      emotions_detected TEXT, -- JSON array
      dominant_emotion TEXT,
      emotional_complexity INTEGER DEFAULT 1,
      
      -- Thematic Analysis  
      themes_detected TEXT, -- JSON array
      dominant_theme TEXT,
      theme_confidence REAL DEFAULT 0.0,
      
      -- Symbolic Analysis
      symbols_detected TEXT, -- JSON array
      archetypal_symbols TEXT, -- JSON array
      symbolic_density REAL DEFAULT 0.0,
      
      -- Advanced Analysis (Future)
      narrative_structure TEXT, -- JSON object
      metaphor_analysis TEXT, -- JSON object
      cultural_symbols TEXT, -- JSON array
      
      -- Processing Info
      analysis_duration_ms INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (dream_entry_id) REFERENCES dream_entries (id) ON DELETE CASCADE
    );
  `);
}

// Prompt Enhancement (Modular)
async function createPromptEnhancementTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS prompt_enhancements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dream_entry_id INTEGER NOT NULL,
      
      -- Prompt Versions
      original_prompt TEXT NOT NULL,
      enhanced_prompt TEXT NOT NULL,
      final_approved_prompt TEXT, -- What was actually sent
      
      -- Enhancement Details
      enhancement_method TEXT DEFAULT 'psychological_analysis',
      art_style TEXT DEFAULT 'ethereal',
      style_intensity REAL DEFAULT 1.0,
      
      -- Analysis Integration
      emotions_used TEXT, -- JSON array of emotions included
      themes_used TEXT, -- JSON array of themes included  
      symbols_used TEXT, -- JSON array of symbols included
      enhancement_data TEXT, -- JSON object with full enhancement details
      
      -- Prompt Engineering
      prompt_length INTEGER,
      complexity_score REAL DEFAULT 0.0,
      readability_score REAL DEFAULT 0.0,
      
      -- Performance Tracking
      enhancement_duration_ms INTEGER,
      tokens_estimated INTEGER,
      
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dream_entry_id) REFERENCES dream_entries (id) ON DELETE CASCADE
    );
  `);
}

// User Prompt Approval (Privacy & Control)
async function createPromptApprovalTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS prompt_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enhancement_id INTEGER NOT NULL,
      
      -- Approval Details
      approval_status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, modified
      user_modifications TEXT, -- User edits to the prompt
      approval_reason TEXT,
      
      -- Privacy Consent
      data_sharing_consent INTEGER DEFAULT 0,
      analytics_consent INTEGER DEFAULT 0,
      improvement_consent INTEGER DEFAULT 0,
      
      -- Interaction
      time_to_approve_seconds INTEGER,
      approval_method TEXT DEFAULT 'manual', -- manual, auto, quick_approve
      
      -- Feedback
      satisfaction_rating INTEGER, -- 1-5 stars
      user_feedback TEXT,
      
      approved_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (enhancement_id) REFERENCES prompt_enhancements (id) ON DELETE CASCADE
    );
  `);
}

// Enhanced Journal Prompts (Modular)
async function createJournalPromptsTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS journal_prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dream_entry_id INTEGER NOT NULL,
      
      -- Prompt Information
      prompt_text TEXT NOT NULL,
      prompt_category TEXT, -- emotion, detail, interpretation, lucidity
      prompt_type TEXT DEFAULT 'enhancement', -- enhancement, analysis, therapeutic
      prompt_source TEXT DEFAULT 'system', -- system, user, therapist, ai
      
      -- Response Information
      response_audio_path TEXT,
      response_transcription TEXT,
      response_quality_score REAL,
      
      -- Ordering & Flow
      prompt_order INTEGER DEFAULT 0,
      is_mandatory INTEGER DEFAULT 0,
      is_adaptive INTEGER DEFAULT 1, -- Adapts based on previous answers
      
      -- Effectiveness Tracking
      completion_rate REAL DEFAULT 0.0,
      user_rating INTEGER, -- How helpful was this prompt
      response_length_chars INTEGER,
      
      -- Conditional Logic (Future)
      trigger_conditions TEXT, -- JSON conditions for when to show
      skip_conditions TEXT, -- JSON conditions for when to skip
      
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      
      FOREIGN KEY (dream_entry_id) REFERENCES dream_entries (id) ON DELETE CASCADE
    );
  `);
}

// Enhanced User Characters (Modular)
async function createUserCharactersTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      
      -- Character Information
      character_name TEXT NOT NULL,
      character_description TEXT,
      character_type TEXT DEFAULT 'dream_figure', -- dream_figure, real_person, symbolic
      
      -- Visual Information
      character_image_url TEXT,
      visual_description TEXT,
      appearance_tags TEXT, -- JSON array
      
      -- Relationship & Context
      relationship_to_user TEXT, -- family, friend, stranger, symbolic, etc.
      emotional_significance INTEGER DEFAULT 1, -- 1-5 scale
      frequency_in_dreams INTEGER DEFAULT 0,
      
      -- Dream Context
      typical_dream_role TEXT, -- protagonist, guide, antagonist, observer
      symbolic_meaning TEXT,
      associated_emotions TEXT, -- JSON array
      
      -- Character Evolution
      first_appearance_date TEXT,
      last_appearance_date TEXT,
      character_evolution_notes TEXT,
      
      -- Usage & Management
      is_active INTEGER DEFAULT 1,
      usage_count INTEGER DEFAULT 0,
      prompt_influence_weight REAL DEFAULT 1.0, -- How much this character influences prompts
      
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Art Style Preferences (Modular)
async function createArtStylePreferencesTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS art_style_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      
      -- Style Information
      style_name TEXT NOT NULL, -- ethereal, surreal, etc.
      custom_style_description TEXT,
      
      -- Usage Statistics
      usage_count INTEGER DEFAULT 0,
      success_rate REAL DEFAULT 0.0, -- % of images user rated positively
      average_user_rating REAL DEFAULT 0.0,
      
      -- Personalization
      personal_modifications TEXT, -- JSON object with user customizations
      color_preferences TEXT, -- JSON array
      mood_associations TEXT, -- JSON array
      
      -- Effectiveness
      emotional_match_score REAL DEFAULT 0.0, -- How well style matches dream emotions
      theme_compatibility TEXT, -- JSON object
      
      -- Management
      is_favorite INTEGER DEFAULT 0,
      is_custom INTEGER DEFAULT 0,
      last_used_date TEXT,
      
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Image Generations (Modular)
async function createImageGenerationsTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS image_generations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dream_entry_id INTEGER NOT NULL,
      enhancement_id INTEGER,
      
      -- Generation Request
      generation_provider TEXT DEFAULT 'openai', -- openai, midjourney, stable_diffusion
      model_used TEXT DEFAULT 'dall-e-3',
      quality_setting TEXT DEFAULT 'standard',
      size_setting TEXT DEFAULT '1024x1024',
      
      -- Prompts
      submitted_prompt TEXT NOT NULL,
      revised_prompt TEXT, -- AI-revised version
      negative_prompt TEXT, -- For future models that support it
      
      -- Results
      image_url TEXT,
      local_image_path TEXT, -- If downloaded locally
      generation_status TEXT DEFAULT 'pending', -- pending, success, failed, expired
      
      -- Performance Metrics
      generation_time_seconds REAL,
      queue_time_seconds REAL,
      total_time_seconds REAL,
      
      -- Quality Assessment
      technical_quality_score REAL, -- Automated assessment
      user_satisfaction_rating INTEGER, -- 1-5 stars
      dream_accuracy_rating INTEGER, -- 1-5 stars
      artistic_quality_rating INTEGER, -- 1-5 stars
      
      -- Metadata
      generation_seed INTEGER, -- For reproducibility where supported
      safety_filtered INTEGER DEFAULT 0,
      content_warning_flags TEXT, -- JSON array
      
      -- Error Handling
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      failure_reason TEXT,
      
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      
      FOREIGN KEY (dream_entry_id) REFERENCES dream_entries (id) ON DELETE CASCADE,
      FOREIGN KEY (enhancement_id) REFERENCES prompt_enhancements (id)
    );
  `);
}

// Cost Tracking (Modular)
async function createCostTrackingTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cost_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Operation Information
      operation_type TEXT NOT NULL, -- image_generation, transcription, analysis
      operation_id INTEGER, -- Links to specific operation
      provider TEXT, -- openai, google, etc.
      
      -- Cost Details
      cost_amount REAL NOT NULL,
      cost_currency TEXT DEFAULT 'USD',
      billing_unit TEXT, -- token, image, minute, etc.
      units_used INTEGER,
      
      -- Context
      user_id TEXT NOT NULL DEFAULT 'default_user',
      dream_entry_id INTEGER,
      
      -- Billing Period
      billing_date TEXT NOT NULL,
      billing_period TEXT, -- daily, monthly, etc.
      
      -- Budget Tracking
      monthly_total REAL DEFAULT 0.0,
      user_budget_limit REAL,
      budget_warning_sent INTEGER DEFAULT 0,
      
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Analytics (Future-Ready)
async function createAnalyticsTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Event Information
      event_type TEXT NOT NULL, -- user_action, system_event, performance_metric
      event_name TEXT NOT NULL, -- prompt_approved, image_generated, etc.
      event_category TEXT, -- ui_interaction, generation, analysis
      
      -- Context
      user_id TEXT NOT NULL DEFAULT 'default_user',
      dream_entry_id INTEGER,
      session_id TEXT,
      
      -- Event Data
      event_properties TEXT, -- JSON object with event-specific data
      event_value REAL, -- Numeric value if applicable
      
      -- Performance
      duration_ms INTEGER,
      memory_usage_mb REAL,
      battery_level INTEGER,
      
      -- Device Context
      app_version TEXT,
      platform TEXT, -- ios, android, web
      device_info TEXT, -- JSON object
      
      -- Privacy
      is_anonymous INTEGER DEFAULT 1,
      consent_level TEXT DEFAULT 'minimal', -- minimal, basic, full
      
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Sync Management (Future Cloud Sync)
async function createSyncTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Sync Information
      table_name TEXT NOT NULL,
      record_id INTEGER NOT NULL,
      operation_type TEXT NOT NULL, -- create, update, delete
      
      -- Status
      sync_status TEXT DEFAULT 'pending', -- pending, synced, failed, conflict
      sync_direction TEXT, -- up, down, bidirectional
      
      -- Conflict Resolution
      local_data TEXT, -- JSON snapshot
      remote_data TEXT, -- JSON snapshot
      resolved_data TEXT, -- JSON final resolution
      conflict_resolution_method TEXT, -- manual, auto_local, auto_remote, merge
      
      -- Timestamps
      local_timestamp TEXT NOT NULL,
      remote_timestamp TEXT,
      sync_timestamp TEXT,
      
      -- Error Handling
      error_count INTEGER DEFAULT 0,
      last_error TEXT,
      retry_after TEXT,
      
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Performance Indexes
async function createIndexes() {
  const indexes = [
    // Core performance indexes
    'CREATE INDEX IF NOT EXISTS idx_dream_entries_user_date ON dream_entries(user_id, entry_date DESC)',
    'CREATE INDEX IF NOT EXISTS idx_dream_entries_status ON dream_entries(entry_status)',
    'CREATE INDEX IF NOT EXISTS idx_dream_entries_updated ON dream_entries(updated_at DESC)',
    
    // Audio files
    'CREATE INDEX IF NOT EXISTS idx_audio_files_dream_id ON audio_files(dream_entry_id)',
    'CREATE INDEX IF NOT EXISTS idx_audio_files_type ON audio_files(audio_type)',
    
    // Analysis
    'CREATE INDEX IF NOT EXISTS idx_psychological_analysis_dream_id ON psychological_analysis(dream_entry_id)',
    'CREATE INDEX IF NOT EXISTS idx_psychological_analysis_emotion ON psychological_analysis(dominant_emotion)',
    
    // Enhancements
    'CREATE INDEX IF NOT EXISTS idx_prompt_enhancements_dream_id ON prompt_enhancements(dream_entry_id)',
    'CREATE INDEX IF NOT EXISTS idx_prompt_approvals_status ON prompt_approvals(approval_status)',
    
    // Generations
    'CREATE INDEX IF NOT EXISTS idx_image_generations_dream_id ON image_generations(dream_entry_id)',
    'CREATE INDEX IF NOT EXISTS idx_image_generations_status ON image_generations(generation_status)',
    
    // Analytics
    'CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type, created_at)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id, created_at)',
    
    // Cost tracking
    'CREATE INDEX IF NOT EXISTS idx_cost_tracking_user_date ON cost_tracking(user_id, billing_date)',
    'CREATE INDEX IF NOT EXISTS idx_cost_tracking_operation ON cost_tracking(operation_type, created_at)',
    
    // Sync
    'CREATE INDEX IF NOT EXISTS idx_sync_operations_status ON sync_operations(sync_status)',
    'CREATE INDEX IF NOT EXISTS idx_sync_operations_table_record ON sync_operations(table_name, record_id)'
  ];

  for (const indexSql of indexes) {
    await db.execAsync(indexSql);
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Export the old database functions for backward compatibility
export * from './database.js';