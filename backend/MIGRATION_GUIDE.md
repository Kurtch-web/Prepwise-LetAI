# Post Moderation & Categories Migration Guide

This guide explains how to apply the database migration for post moderation and category features to your Supabase PostgreSQL database.

## Overview

The migration adds the following features to the `posts` table:

### New Columns:
1. **category** - Post category (user, admin, news, important)
2. **view_count** - Number of views for the post
3. **is_flagged** - Whether the post has been flagged by admin
4. **flag_reason** - Reason why the post was flagged
5. **flagged_at** - Timestamp when the post was flagged
6. **has_appeal** - Whether the post author submitted an appeal
7. **appeal_text** - Appeal text from the post author
8. **appeal_submitted_at** - Timestamp when the appeal was submitted

### New Indexes:
- `ix_posts_category` - For filtering by category
- `ix_posts_is_flagged` - For finding flagged posts
- `ix_posts_has_appeal` - For finding posts with appeals
- `ix_posts_flagged_at` - For sorting by flag timestamp

## Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `migrations/add_post_moderation.sql`
5. Paste it into the SQL editor
6. Click **Run** button
7. Wait for the migration to complete

The SQL editor will show:
- ✓ Queries executed successfully
- Any warnings or notes about existing columns

## Option 2: Using Python Migration Script

If you prefer to run the migration programmatically:

```bash
# From the backend directory
python add_post_moderation_columns.py
```

This script will:
- Connect to your Supabase PostgreSQL database
- Add all new columns with proper defaults
- Create all necessary indexes
- Handle cases where columns already exist

## Option 3: Manual SQL Execution

If you want to run individual SQL statements:

```sql
-- Add columns one at a time
ALTER TABLE posts ADD COLUMN IF NOT EXISTS category VARCHAR(32) DEFAULT 'user' NOT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS has_appeal BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS appeal_text TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS appeal_submitted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS ix_posts_is_flagged ON posts(is_flagged);
CREATE INDEX IF NOT EXISTS ix_posts_has_appeal ON posts(has_appeal);
CREATE INDEX IF NOT EXISTS ix_posts_flagged_at ON posts(flagged_at);
```

## Verification

After running the migration, verify it was successful:

```sql
-- Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- Check if indexes were created
SELECT indexname
FROM pg_indexes
WHERE tablename = 'posts'
ORDER BY indexname;
```

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Drop columns (careful: this will delete data)
ALTER TABLE posts DROP COLUMN IF EXISTS category;
ALTER TABLE posts DROP COLUMN IF EXISTS view_count;
ALTER TABLE posts DROP COLUMN IF EXISTS is_flagged;
ALTER TABLE posts DROP COLUMN IF EXISTS flag_reason;
ALTER TABLE posts DROP COLUMN IF EXISTS flagged_at;
ALTER TABLE posts DROP COLUMN IF EXISTS has_appeal;
ALTER TABLE posts DROP COLUMN IF EXISTS appeal_text;
ALTER TABLE posts DROP COLUMN IF EXISTS appeal_submitted_at;

-- Indexes will be automatically dropped with columns
```

## Database Schema After Migration

```
posts table:
├── id (UUID, PK)
├── author_id (INTEGER, FK)
├── content (TEXT)
├── category (VARCHAR(32)) ← NEW
├── view_count (INTEGER) ← NEW
├── is_flagged (BOOLEAN) ← NEW
├── flag_reason (TEXT) ← NEW
├── flagged_at (TIMESTAMP) ← NEW
├── has_appeal (BOOLEAN) ← NEW
├── appeal_text (TEXT) ← NEW
├── appeal_submitted_at (TIMESTAMP) ← NEW
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── relationships...
```

## API Endpoints Using These Columns

After migration, these new endpoints will be available:

- `POST /posts/{post_id}/flag` - Flag a post (admin only)
- `DELETE /posts/{post_id}/flag` - Unflag a post (admin only)
- `POST /posts/{post_id}/appeal` - Submit appeal for flagged post
- `GET /posts/admin/moderation` - Get all posts for moderation

## Frontend Features

The frontend will support:

- **Post Categories**: Users can filter posts by category (User, Admin, News, Important)
- **Admin Controls**: Admins can flag posts with a reason
- **User Appeals**: Users can submit appeals for flagged posts
- **Moderation Dashboard**: Admins can view all posts and manage flags/appeals

## Support

If you encounter any issues:

1. Check that your Supabase database is PostgreSQL (not SQLite)
2. Ensure you have admin access to the database
3. Verify the `posts` table exists before running migration
4. Check Supabase logs for any error messages
5. Try running the migration again - it uses `IF NOT EXISTS` so it's safe to re-run

## Notes

- All new columns have default values, so existing posts won't be affected
- The migration is idempotent (safe to run multiple times)
- Indexes improve query performance for filtering and sorting
- No data loss occurs during this migration
