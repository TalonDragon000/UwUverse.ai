export interface Database {
  public: {
    Tables: {
      characters: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          name: string;
          gender: 'male' | 'female' | 'nonbinary';
          height: string;
          build: string;
          eye_color: string;
          hair_color: string;
          skin_tone: string;
          personality_traits: string[];
          voice_accent: string;
          art_style: 'anime' | 'manhwa' | 'comic' | 'realistic' | 'cartoon';
          backstory: string;
          meet_cute: string;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          name: string;
          gender: 'male' | 'female' | 'nonbinary';
          height: string;
          build: string;
          eye_color: string;
          hair_color: string;
          skin_tone: string;
          personality_traits: string[];
          voice_accent: string;
          art_style: 'anime' | 'manhwa' | 'comic' | 'realistic' | 'cartoon';
          backstory: string;
          meet_cute: string;
          image_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          name?: string;
          gender?: 'male' | 'female' | 'nonbinary';
          height?: string;
          build?: string;
          eye_color?: string;
          hair_color?: string;
          skin_tone?: string;
          personality_traits?: string[];
          voice_accent?: string;
          art_style?: 'anime' | 'manhwa' | 'comic' | 'realistic' | 'cartoon';
          backstory?: string;
          meet_cute?: string;
          image_url?: string | null;
        };
      };
      chats: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          character_id: string;
          love_meter: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          character_id: string;
          love_meter?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          character_id?: string;
          love_meter?: number;
        };
      };
      messages: {
        Row: {
          id: string;
          created_at: string;
          chat_id: string;
          sender: 'user' | 'character';
          content: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          chat_id: string;
          sender: 'user' | 'character';
          content: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          chat_id?: string;
          sender?: 'user' | 'character';
          content?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          display_name: string | null;
          ai_credits_remaining: number;
          subscription_tier: 'free' | 'pro' | 'enterprise';
          nsfw_enabled: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          display_name?: string | null;
          ai_credits_remaining?: number;
          subscription_tier?: 'free' | 'pro' | 'enterprise';
          nsfw_enabled?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          display_name?: string | null;
          ai_credits_remaining?: number;
          subscription_tier?: 'free' | 'pro' | 'enterprise';
          nsfw_enabled?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};