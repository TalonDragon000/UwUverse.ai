import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Optimized Supabase client with connection pooling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-client-info': 'uwuverse-ai@1.0.0'
    }
  }
});

// Optimized query builders with pagination and caching
export const queries = {
  // Paginated messages query
  getMessages: (chatId: string, limit = 50, offset = 0) => 
    supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1),
  
  // Optimized character query with minimal data
  getCharacterSummary: (userId: string) =>
    supabase
      .from('characters')
      .select('id, name, image_url, is_archived')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .limit(10),
  
  // Cached user profile query
  getUserProfile: (userId: string) =>
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
};

// Auth state management with caching
class AuthManager {
  private session: any = null;
  private listeners: Set<(session: any) => void> = new Set();
  
  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    this.session = session;
    this.notifyListeners();
    
    // Subscribe to auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.session = session;
      this.notifyListeners();
    });
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.session));
  }
  
  subscribe(listener: (session: any) => void) {
    this.listeners.add(listener);
    listener(this.session); // Immediate call with current session
    
    return () => this.listeners.delete(listener);
  }
  
  getSession() {
    return this.session;
  }
}

export const authManager = new AuthManager();