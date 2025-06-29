/*
  # Add source column to newsletter_subscribers for waitlist tracking

  1. Changes
    - Add `source` column to track subscription origin
    - Set default value for existing records
    - Enable tracking of waitlist vs general newsletter signups

  2. Security
    - No RLS changes needed - existing policies cover new column
*/

-- Add source column to newsletter_subscribers table
ALTER TABLE public.newsletter_subscribers 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'newsletter';

-- Update existing records to have 'newsletter' as source
UPDATE public.newsletter_subscribers 
SET source = 'newsletter' 
WHERE source IS NULL;