/*
  # Add Character Archiving and Difficulty System

  1. New Columns
    - `characters` table:
      - `is_archived` (boolean) - tracks if character is archived
      - `difficulty_level` (text) - easy, medium, hard
      - `obstacles` (jsonb) - hidden obstacles for love progression
    - `user_profiles` table:
      - `current_character_limit` (integer) - active character limit

  2. Constraints
    - Add check constraint for difficulty_level values
    - Set appropriate defaults

  3. Indexes
    - Add index for is_archived for better query performance
*/

-- Add new columns to characters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE characters ADD COLUMN is_archived boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'difficulty_level'
  ) THEN
    ALTER TABLE characters ADD COLUMN difficulty_level text DEFAULT 'easy';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'obstacles'
  ) THEN
    ALTER TABLE characters ADD COLUMN obstacles jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add check constraint for difficulty_level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'characters_difficulty_level_check'
  ) THEN
    ALTER TABLE characters ADD CONSTRAINT characters_difficulty_level_check 
    CHECK (difficulty_level IN ('easy', 'medium', 'hard'));
  END IF;
END $$;

-- Add current_character_limit to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'current_character_limit'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN current_character_limit integer DEFAULT 3;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_characters_is_archived ON characters(is_archived);
CREATE INDEX IF NOT EXISTS idx_characters_user_id_archived ON characters(user_id, is_archived);