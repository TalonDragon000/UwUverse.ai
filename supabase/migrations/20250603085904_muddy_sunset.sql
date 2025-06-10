/*
  # Add newsletter and subscription management
  
  1. New Tables
    - newsletter_subscribers
      - id (uuid, primary key)
      - email (text, unique)
      - confirmed (boolean)
      - created_at (timestamp)
      - confirmation_token (text)
      - unsubscribed_at (timestamp)
    
  2. Changes
    - Add subscription management columns to user_profiles
    - Add RLS policies for data access
*/

-- Create user_profiles table first if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    ai_credits_remaining integer DEFAULT 1000,
    subscription_tier text DEFAULT 'free',
    nsfw_enabled boolean DEFAULT false,
    subscription_status text DEFAULT 'free',
    subscription_period_end timestamptz,
    last_login timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    confirmed boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    confirmation_token text,
    unsubscribed_at timestamptz
);

-- Enable RLS on newsletter_subscribers
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Add policy for inserting new subscribers
CREATE POLICY "Anyone can subscribe to newsletter"
    ON newsletter_subscribers
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Add policy for viewing own subscription
CREATE POLICY "Users can view their own subscription"
    ON newsletter_subscribers
    FOR SELECT
    TO authenticated
    USING (email IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
    ));

-- Add policies for user_profiles
CREATE POLICY "Users can read own profile"
    ON user_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());