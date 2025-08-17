import * as SQLite from 'expo-sqlite';

let db = null;

export async function initializeDatabase() {
  try {
    db = await SQLite.openDatabaseAsync('dreamweave.db');
    
    // Create tables
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS dream_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT 'default_user',
        entry_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        audio_file_path TEXT,
        original_transcription TEXT,
        enhanced_description TEXT,
        dream_title TEXT,
        emotions TEXT,
        themes TEXT,
        symbols TEXT,
        analysis_emotions TEXT, -- On-device detected emotions JSON
        analysis_themes TEXT,   -- On-device detected themes JSON  
        analysis_symbols TEXT,  -- On-device detected symbols JSON
        enhanced_prompt TEXT,   -- Final enhanced prompt sent to AI
        original_prompt TEXT,   -- Original dream text before enhancement
        prompt_approved INTEGER DEFAULT 0, -- User approved the prompt
        lucidity_level INTEGER DEFAULT 0,
        vividness_level INTEGER DEFAULT 0,
        ai_prompt TEXT,
        art_style TEXT DEFAULT 'ethereal',
        image_url TEXT,
        card_design TEXT
      );
    `);
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS journal_prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dream_entry_id INTEGER NOT NULL,
        prompt_text TEXT NOT NULL,
        response_audio_path TEXT,
        response_transcription TEXT,
        prompt_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dream_entry_id) REFERENCES dream_entries (id)
      );
    `);
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT 'default_user',
        character_name TEXT NOT NULL,
        character_description TEXT,
        character_image_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Dream entry operations
export async function createDreamEntry(entryData) {
  const database = getDatabase();
  
  const {
    user_id = 'default_user',
    entry_date,
    original_transcription = '',
    enhanced_description = '',
    dream_title = '',
    emotions = '[]',
    themes = '[]',
    symbols = '[]',
    lucidity_level = 0,
    vividness_level = 0,
    ai_prompt = '',
    art_style = 'ethereal',
    image_url = '',
    card_design = '{}'
  } = entryData;
  
  const result = await database.runAsync(
    `INSERT INTO dream_entries (
      user_id, entry_date, original_transcription, enhanced_description, 
      dream_title, emotions, themes, symbols, lucidity_level, vividness_level,
      ai_prompt, art_style, image_url, card_design
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, entry_date, original_transcription, enhanced_description,
     dream_title, emotions, themes, symbols, lucidity_level, vividness_level,
     ai_prompt, art_style, image_url, card_design]
  );
  
  return result.lastInsertRowId;
}

export async function getDreamEntries(userId = 'default_user', limit = 50) {
  const database = getDatabase();
  
  const entries = await database.getAllAsync(
    'SELECT * FROM dream_entries WHERE user_id = ? ORDER BY entry_date DESC, created_at DESC LIMIT ?',
    [userId, limit]
  );
  
  return entries.map(entry => ({
    ...entry,
    emotions: JSON.parse(entry.emotions || '[]'),
    themes: JSON.parse(entry.themes || '[]'),
    symbols: JSON.parse(entry.symbols || '[]'),
    card_design: JSON.parse(entry.card_design || '{}')
  }));
}

export async function getDreamEntry(entryId) {
  const database = getDatabase();
  
  const entry = await database.getFirstAsync(
    'SELECT * FROM dream_entries WHERE id = ?',
    [entryId]
  );
  
  if (!entry) return null;
  
  const prompts = await database.getAllAsync(
    'SELECT * FROM journal_prompts WHERE dream_entry_id = ? ORDER BY prompt_order ASC',
    [entryId]
  );
  
  return {
    ...entry,
    emotions: JSON.parse(entry.emotions || '[]'),
    themes: JSON.parse(entry.themes || '[]'),
    symbols: JSON.parse(entry.symbols || '[]'),
    card_design: JSON.parse(entry.card_design || '{}'),
    prompts: prompts
  };
}

export async function updateDreamEntry(entryId, updateData) {
  const database = getDatabase();
  
  const fields = [];
  const values = [];
  
  Object.entries(updateData).forEach(([key, value]) => {
    if (key !== 'id') {
      fields.push(`${key} = ?`);
      if (typeof value === 'object') {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
    }
  });
  
  if (fields.length === 0) return;
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(entryId);
  
  await database.runAsync(
    `UPDATE dream_entries SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

// Journal prompt operations
export async function createJournalPrompt(promptData) {
  const database = getDatabase();
  
  const {
    dream_entry_id,
    prompt_text,
    response_audio_path = '',
    response_transcription = '',
    prompt_order = 0
  } = promptData;
  
  const result = await database.runAsync(
    `INSERT INTO journal_prompts (
      dream_entry_id, prompt_text, response_audio_path, 
      response_transcription, prompt_order
    ) VALUES (?, ?, ?, ?, ?)`,
    [dream_entry_id, prompt_text, response_audio_path, response_transcription, prompt_order]
  );
  
  return result.lastInsertRowId;
}

// Character operations  
export async function createUserCharacter(characterData) {
  const database = getDatabase();
  
  const {
    user_id = 'default_user',
    character_name,
    character_description = '',
    character_image_url = '',
    is_active = 1
  } = characterData;
  
  const result = await database.runAsync(
    `INSERT INTO user_characters (
      user_id, character_name, character_description, 
      character_image_url, is_active
    ) VALUES (?, ?, ?, ?, ?)`,
    [user_id, character_name, character_description, character_image_url, is_active]
  );
  
  return result.lastInsertRowId;
}

export async function getUserCharacters(userId = 'default_user') {
  const database = getDatabase();
  
  return await database.getAllAsync(
    'SELECT * FROM user_characters WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC',
    [userId]
  );
}