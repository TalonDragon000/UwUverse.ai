/*
  # Add INSERT policy for user_profiles table

  1. Security
    - Add policy for authenticated users to insert their own profile data
    - Ensures users can only create profiles for themselves using auth.uid()

  This migration adds the missing INSERT policy that was causing the RLS violation
  when users tried to create their profile after signup.
*/

-- Add INSERT policy for user_profiles table
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);