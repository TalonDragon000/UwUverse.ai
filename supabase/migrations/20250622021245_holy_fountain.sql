/*
  # Fix Newsletter Subscribers RLS Policies

  1. Security Changes
    - Remove problematic SELECT policy that accesses auth.users
    - Add proper policies for newsletter subscription functionality
    - Ensure public can subscribe and authenticated users can view their subscription

  2. Changes
    - Drop existing problematic SELECT policy
    - Add new SELECT policy that doesn't access auth.users directly
    - Ensure INSERT policy works for anonymous users
*/

-- Drop the problematic SELECT policy that tries to access auth.users
DROP POLICY IF EXISTS "Users can view their own subscription" ON newsletter_subscribers;

-- Add a new SELECT policy that allows authenticated users to see their own subscription
-- by comparing email with their auth email directly
CREATE POLICY "Users can view their own subscription" 
  ON newsletter_subscribers 
  FOR SELECT 
  TO authenticated 
  USING (email = auth.email());

-- Ensure the INSERT policy allows anonymous users to subscribe
-- (this should already exist but let's make sure it's correct)
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;

CREATE POLICY "Anyone can subscribe to newsletter" 
  ON newsletter_subscribers 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Add UPDATE policy for unsubscribing
CREATE POLICY "Anyone can update their subscription" 
  ON newsletter_subscribers 
  FOR UPDATE 
  TO public 
  USING (true) 
  WITH CHECK (true);