-- ORIA MVP - Play Tracking Schema
-- Run this in Supabase SQL Editor to add play tracking support

-- Add play_count column to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0;

-- Create asset_plays table for detailed tracking
CREATE TABLE IF NOT EXISTS asset_plays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID,  -- Optional: logged-in user
    play_identifier VARCHAR(255) NOT NULL,  -- For session-based deduplication
    completed BOOLEAN DEFAULT FALSE,  -- Did they finish the track?
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_plays_asset_id ON asset_plays(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_plays_identifier ON asset_plays(play_identifier);
CREATE INDEX IF NOT EXISTS idx_asset_plays_created_at ON asset_plays(created_at);

-- Function to increment play count atomically
CREATE OR REPLACE FUNCTION increment_play_count(asset_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE assets
    SET play_count = COALESCE(play_count, 0) + 1
    WHERE id = asset_uuid;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for asset_plays (if RLS is enabled)
-- ALTER TABLE asset_plays ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert plays (for anonymous users)
-- CREATE POLICY "Anyone can record plays" ON asset_plays
--     FOR INSERT WITH CHECK (true);

-- Only allow reading own plays or if admin
-- CREATE POLICY "Users can read own plays" ON asset_plays
--     FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
