-- PostgreSQL Migration for Post Moderation and Categories
-- This migration adds support for post categories and moderation features
-- Run this in Supabase SQL Editor

-- Add new columns to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS category VARCHAR(32) DEFAULT 'user' NOT NULL,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS has_appeal BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS appeal_text TEXT,
ADD COLUMN IF NOT EXISTS appeal_submitted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS ix_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS ix_posts_is_flagged ON posts(is_flagged);
CREATE INDEX IF NOT EXISTS ix_posts_has_appeal ON posts(has_appeal);
CREATE INDEX IF NOT EXISTS ix_posts_flagged_at ON posts(flagged_at);

-- Add comment to document the changes
COMMENT ON COLUMN posts.category IS 'Post category: user, admin, news, or important';
COMMENT ON COLUMN posts.view_count IS 'Number of views for this post';
COMMENT ON COLUMN posts.is_flagged IS 'Whether the post has been flagged by admin';
COMMENT ON COLUMN posts.flag_reason IS 'Reason why the post was flagged';
COMMENT ON COLUMN posts.flagged_at IS 'Timestamp when the post was flagged';
COMMENT ON COLUMN posts.has_appeal IS 'Whether the post author has submitted an appeal';
COMMENT ON COLUMN posts.appeal_text IS 'Appeal text from the post author';
COMMENT ON COLUMN posts.appeal_submitted_at IS 'Timestamp when the appeal was submitted';
