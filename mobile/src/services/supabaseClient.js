import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// Validate credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null

// Supabase service functions for DreamWeave
export class SupabaseService {
  
  // Check if Supabase is properly configured
  isConfigured() {
    return supabase !== null;
  }
  
  // Validate before any operation
  validateSupabase() {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured. Please set environment variables.');
    }
  }
  
  // Dream Entry operations
  async createDreamEntry(entryData) {
    try {
      this.validateSupabase();
      const { data, error } = await supabase
        .from('dream_entries')
        .insert([entryData])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating dream entry:', error)
      throw error
    }
  }

  async getDreamEntries(userId = 'default_user', limit = 50) {
    try {
      this.validateSupabase();
      const { data, error } = await supabase
        .from('dream_entries')
        .select(`
          *,
          prompts:journal_prompts(*)
        `)
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching dream entries:', error)
      throw error
    }
  }

  async getDreamEntry(entryId) {
    try {
      this.validateSupabase();
      const { data, error } = await supabase
        .from('dream_entries')
        .select(`
          *,
          prompts:journal_prompts(*)
        `)
        .eq('id', entryId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching dream entry:', error)
      throw error
    }
  }

  async updateDreamEntry(entryId, updateData) {
    try {
      this.validateSupabase();
      const { data, error } = await supabase
        .from('dream_entries')
        .update(updateData)
        .eq('id', entryId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating dream entry:', error)
      throw error
    }
  }

  async deleteDreamEntry(entryId) {
    try {
      this.validateSupabase();
      const { error } = await supabase
        .from('dream_entries')
        .delete()
        .eq('id', entryId)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting dream entry:', error)
      throw error
    }
  }

  // Journal Prompt operations
  async createJournalPrompt(promptData) {
    try {
      this.validateSupabase();
      const { data, error } = await supabase
        .from('journal_prompts')
        .insert([promptData])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating journal prompt:', error)
      throw error
    }
  }

  async getJournalPrompts(dreamEntryId) {
    try {
      this.validateSupabase();
      const { data, error } = await supabase
        .from('journal_prompts')
        .select('*')
        .eq('dream_entry_id', dreamEntryId)
        .order('prompt_order', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching journal prompts:', error)
      throw error
    }
  }

  // User Character operations
  async createUserCharacter(characterData) {
    try {
      this.validateSupabase();
      const { data, error } = await supabase
        .from('user_characters')
        .insert([characterData])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating user character:', error)
      throw error
    }
  }

  async getUserCharacters(userId = 'default_user') {
    try {
      this.validateSupabase();
      const { data, error } = await supabase
        .from('user_characters')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user characters:', error)
      throw error
    }
  }

  // Dream Statistics
  async getDreamStatistics(userId = 'default_user', startDate = null, endDate = null) {
    try {
      this.validateSupabase();
      let query = supabase
        .from('dream_entries')
        .select('*')
        .eq('user_id', userId)
      
      if (startDate) {
        query = query.gte('entry_date', startDate)
      }
      
      if (endDate) {
        query = query.lte('entry_date', endDate)
      }

      const { data, error } = await query
      
      if (error) throw error
      
      const entries = data || []
      const totalDreams = entries.length
      
      if (totalDreams === 0) {
        return {
          total_dreams: 0,
          average_lucidity: 0,
          average_vividness: 0,
          most_common_themes: [],
          most_common_emotions: [],
          most_common_symbols: [],
          dreams_with_images: 0
        }
      }

      // Calculate averages
      const avgLucidity = entries.reduce((sum, e) => sum + (e.lucidity_level || 0), 0) / totalDreams
      const avgVividness = entries.reduce((sum, e) => sum + (e.vividness_level || 0), 0) / totalDreams
      
      // Count themes, emotions, symbols
      const allThemes = []
      const allEmotions = []
      const allSymbols = []
      
      entries.forEach(entry => {
        if (entry.themes) allThemes.push(...entry.themes)
        if (entry.emotions) allEmotions.push(...entry.emotions)
        if (entry.symbols) allSymbols.push(...entry.symbols)
      })
      
      // Count occurrences
      const countOccurrences = (arr) => {
        const counts = {}
        arr.forEach(item => counts[item] = (counts[item] || 0) + 1)
        return Object.entries(counts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => [name, count])
      }
      
      return {
        total_dreams: totalDreams,
        average_lucidity: Math.round(avgLucidity * 100) / 100,
        average_vividness: Math.round(avgVividness * 100) / 100,
        most_common_themes: countOccurrences(allThemes),
        most_common_emotions: countOccurrences(allEmotions),
        most_common_symbols: countOccurrences(allSymbols),
        dreams_with_images: entries.filter(e => e.image_url).length
      }
      
    } catch (error) {
      console.error('Error fetching dream statistics:', error)
      throw error
    }
  }

  // File Upload operations (for audio files and images)
  async uploadFile(userId, fileName, fileData, bucket = 'dreamweave-files') {
    try {
      this.validateSupabase();
      const filePath = `${userId}/${Date.now()}_${fileName}`
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileData)
      
      if (error) throw error
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
      
      return {
        path: filePath,
        url: urlData.publicUrl
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  async deleteFile(filePath, bucket = 'dreamweave-files') {
    try {
      this.validateSupabase();
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath])
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }

  // Authentication helpers
  async getCurrentUser() {
    try {
      this.validateSupabase();
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  async signOut() {
    try {
      this.validateSupabase();
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return true
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Real-time subscriptions
  subscribeToDreamEntries(userId, callback) {
    if (!this.isConfigured()) return null;
    return supabase
      .channel('dream_entries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dream_entries',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }

  unsubscribe(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }

  // Dream Archive operations
  async createDreamArchive(archiveData) {
    try {
      this.validateSupabase();
      const { data, error } = await supabase
        .from('dream_archives')
        .insert([archiveData])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating dream archive:', error)
      throw error
    }
  }

  async getDreamArchives(userId = 'default_user') {
    try {
      this.validateSupabase();
      const { data, error } = await supabase
        .from('dream_archives')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching dream archives:', error)
      throw error
    }
  }

  async deleteDreamArchive(archiveId) {
    try {
      this.validateSupabase();
      const { error } = await supabase
        .from('dream_archives')
        .delete()
        .eq('id', archiveId)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting dream archive:', error)
      throw error
    }
  }
}

export const supabaseService = new SupabaseService()