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
          love_meter: number;
          is_archived: boolean;
          difficulty_level: 'easy' | 'medium' | 'hard';
          obstacles: any; // jsonb
          tavus_character_id: string | null;
          tavus_video_url: string | null;
          voice_id: string | null;
          voice_name: string | null;
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
          love_meter?: number;
          is_archived?: boolean;
          difficulty_level?: 'easy' | 'medium' | 'hard';
          obstacles?: any;
          tavus_character_id?: string | null;
          tavus_video_url?: string | null;
          voice_id?: string | null;
          voice_name?: string | null;
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
          love_meter?: number;
          is_archived?: boolean;
          difficulty_level?: 'easy' | 'medium' | 'hard';
          obstacles?: any;
          tavus_character_id?: string | null;
          tavus_video_url?: string | null;
          voice_id?: string | null;
          voice_name?: string | null;
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
          message_type: 'text' | 'audio_log';
          audio_duration: number | null;
          call_session_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          chat_id: string;
          sender: 'user' | 'character';
          content: string;
          message_type?: 'text' | 'audio_log';
          audio_duration?: number | null;
          call_session_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          chat_id?: string;
          sender?: 'user' | 'character';
          content?: string;
          message_type?: 'text' | 'audio_log';
          audio_duration?: number | null;
          call_session_id?: string | null;
        };
      };
      call_sessions: {
        Row: {
          id: string;
          user_id: string;
          character_id: string;
          chat_id: string;
          call_type: 'phone' | 'video';
          status: 'active' | 'ended' | 'failed';
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          tavus_session_id: string | null;
          total_messages: number;
          love_meter_change: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          character_id: string;
          chat_id: string;
          call_type: 'phone' | 'video';
          status?: 'active' | 'ended' | 'failed';
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          tavus_session_id?: string | null;
          total_messages?: number;
          love_meter_change?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          character_id?: string;
          chat_id?: string;
          call_type?: 'phone' | 'video';
          status?: 'active' | 'ended' | 'failed';
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          tavus_session_id?: string | null;
          total_messages?: number;
          love_meter_change?: number;
          created_at?: string;
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
          current_character_limit: number;
          updated_at: string;
          subscription_status: string | null;
          subscription_period_end: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          display_name?: string | null;
          ai_credits_remaining?: number;
          subscription_tier?: 'free' | 'pro' | 'enterprise';
          nsfw_enabled?: boolean;
          current_character_limit?: number;
          updated_at?: string;
          subscription_status?: string | null;
          subscription_period_end?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          display_name?: string | null;
          ai_credits_remaining?: number;
          subscription_tier?: 'free' | 'pro' | 'enterprise';
          nsfw_enabled?: boolean;
          current_character_limit?: number;
          updated_at?: string;
          subscription_status?: string | null;
          subscription_period_end?: string | null;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          comment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          comment_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string | null;
          comment_id?: string | null;
          created_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          email_notifications: boolean;
          push_notifications: boolean;
          theme: string;
          language: string;
          privacy_level: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_notifications?: boolean;
          push_notifications?: boolean;
          theme?: string;
          language?: string;
          privacy_level?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_notifications?: boolean;
          push_notifications?: boolean;
          theme?: string;
          language?: string;
          privacy_level?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          confirmed: boolean;
          created_at: string;
          confirmation_token: string | null;
          unsubscribed_at: string | null;
          source: string; // Added source column
        };
        Insert: {
          id?: string;
          email: string;
          confirmed?: boolean;
          created_at?: string;
          confirmation_token?: string | null;
          unsubscribed_at?: string | null;
          source?: string; // Added source column
        };
        Update: {
          id?: string;
          email?: string;
          confirmed?: boolean;
          created_at?: string;
          confirmation_token?: string | null;
          unsubscribed_at?: string | null;
          source?: string; // Added source column
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
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
}