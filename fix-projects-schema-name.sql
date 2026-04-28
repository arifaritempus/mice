
-- Fix Schema Mismatch: Rename 'name' to 'title' in projects table
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'name') THEN
        ALTER TABLE projects RENAME COLUMN name TO title;
    END IF;
END $$;
