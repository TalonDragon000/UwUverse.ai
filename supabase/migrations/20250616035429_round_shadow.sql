/*
  # Add Tavus AI Integration and Enhanced Message Types

  1. New Columns for Characters Table
    - `tavus_character_id` (text) - Tavus AI character identifier
    - `tavus_video_url` (text) - Static video URL for character display
    - `voice_id` (text) - ElevenLabs voice identifier
    - `voice_name` (text) - Human-readable voice name

  2. New Columns for Messages Table
    - `message_type` (text) - Differentiates between 'text' and 'audio_log'
    - `audio_duration` (numeric) - Duration of audio messages in seconds
    - `call_session_id` (uuid) - Groups messages from the same call session

  3. New Table: Call Sessions
    - Tracks phone and video call sessions
    - Links to characters and stores call metadata

  4. Constraints and Indexes
    - Add check constraints for message_type values
    - Add indexes for better query performance
*/

-- Add new columns to characters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'tavus_character_id'
  ) THEN
    ALTER TABLE characters ADD COLUMN tavus_character_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'tavus_video_url'
  ) THEN
    ALTER TABLE characters ADD COLUMN tavus_video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'voice_id'
  ) THEN
    ALTER TABLE characters ADD COLUMN voice_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'voice_name'
  ) THEN
    ALTER TABLE characters ADD COLUMN voice_name text;
  END IF;
END $$;

-- Add new columns to messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_type text DEFAULT 'text';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'audio_duration'
  ) THEN
    ALTER TABLE messages ADD COLUMN audio_duration numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'call_session_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN call_session_id uuid;
  END IF;
END $$;

-- Add check constraint for message_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'messages_message_type_check'
  ) THEN
    ALTER TABLE messages ADD CONSTRAINT messages_message_type_check 
    CHECK (message_type IN ('text', 'audio_log'));
  END IF;
END $$;

-- Create call_sessions table
CREATE TABLE IF NOT EXISTS call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  call_type text NOT NULL CHECK (call_type IN ('phone', 'video')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'ended', 'failed')),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  tavus_session_id text,
  total_messages integer DEFAULT 0,
  love_meter_change numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on call_sessions
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

-- Add policies for call_sessions
CREATE POLICY "Users can create their own call sessions"
  ON call_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own call sessions"
  ON call_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own call sessions"
  ON call_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_tavus_character_id ON characters(tavus_character_id);
CREATE INDEX IF NOT EXISTS idx_characters_voice_id ON characters(voice_id);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_call_session_id ON messages(call_session_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_user_id ON call_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_character_id ON call_sessions(character_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_chat_id ON call_sessions(chat_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_started_at ON call_sessions(started_at DESC);

-- Add foreign key constraint for call_session_id in messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'messages_call_session_id_fkey'
  ) THEN
    ALTER TABLE messages ADD CONSTRAINT messages_call_session_id_fkey
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update messages policies to handle audio logs
DROP POLICY IF EXISTS "Users can create messages in their chats" ON messages;
CREATE POLICY "Users can create messages in their chats"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    chat_id IN (
      SELECT id FROM chats WHERE user_id = auth.uid()
    )
  );

-- Add trigger to update call session stats when messages are added
CREATE OR REPLACE FUNCTION update_call_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update for audio_log messages
  IF NEW.message_type = 'audio_log' AND NEW.call_session_id IS NOT NULL THEN
    UPDATE call_sessions 
    SET total_messages = total_messages + 1
    WHERE id = NEW.call_session_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_call_session_stats_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_call_session_stats();