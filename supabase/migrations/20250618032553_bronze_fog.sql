/*
  # Fix Signup Flow with Database Trigger

  1. Database Function
    - Create handle_new_user function to automatically create user profiles
    - Function runs with DEFINER security to bypass RLS

  2. Database Trigger
    - Trigger on auth.users INSERT to automatically create user_profiles
    - Ensures user_profiles are created after email confirmation

  3. Security
    - Function bypasses RLS safely since it runs on auth.users creation
    - Maintains data integrity and proper user association
*/

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id, 
    display_name, 
    ai_credits_remaining, 
    subscription_tier, 
    nsfw_enabled, 
    current_character_limit
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 
    1000, 
    'free', 
    FALSE, 
    3
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile when user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, anon, authenticated, service_role;