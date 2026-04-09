# Quick Start Guide - Post Moderation & Categories

## ⚡ 5-Minute Setup

### Step 1: Database Migration (2 minutes)

**Go to Supabase SQL Editor:**
1. Open your Supabase project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy this SQL:

```sql
-- Add columns to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS category VARCHAR(32) DEFAULT 'user' NOT NULL,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS has_appeal BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS appeal_text TEXT,
ADD COLUMN IF NOT EXISTS appeal_submitted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS ix_posts_is_flagged ON posts(is_flagged);
CREATE INDEX IF NOT EXISTS ix_posts_has_appeal ON posts(has_appeal);
CREATE INDEX IF NOT EXISTS ix_posts_flagged_at ON posts(flagged_at);
```

5. Click **Run**
6. Wait for success message ✓

### Step 2: Deploy Backend (1 minute)

- Backend code is already updated
- Just deploy to your server
- All endpoints are ready

### Step 3: Deploy Frontend (1 minute)

- Frontend code is already updated
- Just deploy to your hosting
- All features are ready

### Step 4: Test (1 minute)

1. **Create a post as user**: Should show default category
2. **Create a post as admin**: Should show category selector
3. **Filter posts**: Should see category buttons
4. **Flag a post**: Should see moderation dashboard
5. **Submit appeal**: Should work from flagged post

---

## 🎯 Key Features

### For Users
- ✅ Create posts with default 'user' category
- ✅ Filter posts by category (User, Admin, News, Important)
- ✅ Sort posts (New, Old, Most Liked)
- ✅ Submit appeals for flagged posts

### For Admins
- ✅ Create posts with special categories (Admin, News, Important)
- ✅ Flag inappropriate posts with reason
- ✅ View moderation dashboard
- ✅ Review appeals and unflag posts
- ✅ See all posts (including flagged)

---

## 📱 UI Changes

### Create Post Form
```
Before: Just text input
After:  Text input + Category selector (admin only)
```

### Post Feed
```
Before: New | Old | Most Liked
After:  [Category Filters] + [Sort Filters]
        All | User | Admin | News | Important
        New | Old | Most Liked
```

### Admin Dashboard
```
New Tab: 🛡️ Community
Shows:   All posts with moderation controls
         Flag/Unflag buttons
         Appeal management
```

---

## 🔌 API Endpoints

### New Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/posts/{id}/flag` | Admin | Flag a post |
| DELETE | `/posts/{id}/flag` | Admin | Unflag a post |
| POST | `/posts/{id}/appeal` | User | Submit appeal |
| GET | `/posts/admin/moderation` | Admin | Get all posts |

### Updated Endpoints

| Method | Endpoint | Change |
|--------|----------|--------|
| POST | `/posts` | Now accepts `category` parameter |
| GET | `/posts` | Now filters flagged posts |
| GET | `/posts/{id}` | Now returns moderation fields |

---

## 🗂️ File Structure

```
backend/
├── app/
│   ├── models.py          ✅ Updated Post model
│   └── routers/
│       └── posts.py       ✅ Updated endpoints
├── migrations/
│   └── add_post_moderation.sql  ✅ SQL migration
├── add_post_moderation_columns.py  ✅ Python migration
├── MIGRATION_GUIDE.md     ✅ Detailed guide
└── ...

frontend/
├── src/
│   ├── components/
│   │   ├── CreatePostForm.tsx    ✅ Category selector
│   │   ├── PostFeed.tsx          ✅ Category filters
│   │   └── CommunityModeration.tsx  ✅ New dashboard
│   ├── services/
│   │   └── postsService.ts       ✅ Updated methods
│   └── views/
│       └── AdminPortalPage.tsx   ✅ Community tab
└── ...
```

---

## 🚨 Common Issues

### "Column already exists"
- Migration uses `IF NOT EXISTS`
- Safe to run again
- No data loss

### "Permission denied"
- Ensure you're using admin Supabase credentials
- Check database user has ALTER TABLE permission

### Posts not showing category
- Clear browser cache
- Verify frontend deployed
- Check API response in Network tab

### Can't flag posts
- Ensure you're logged in as admin
- Check admin status in user profile
- Verify backend deployed

---

## ✅ Verification

### Database
```sql
-- Check columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'posts' AND column_name LIKE '%flag%';

-- Should return: is_flagged, flag_reason, flagged_at, has_appeal, appeal_text, appeal_submitted_at
```

### Frontend
1. Open browser DevTools
2. Go to Network tab
3. Create a post
4. Check POST /posts request
5. Should include `category` field

### Backend
1. Check server logs
2. Create a post as admin
3. Should see category in response
4. Try to flag a post
5. Should see success message

---

## 📞 Need Help?

1. **Database issues**: See `MIGRATION_GUIDE.md`
2. **API issues**: Check `app/routers/posts.py`
3. **Frontend issues**: Check component files
4. **General questions**: See `IMPLEMENTATION_SUMMARY.md`

---

## 🎉 You're Done!

The system is now ready with:
- ✅ Post categories
- ✅ Post moderation
- ✅ Appeal system
- ✅ Admin dashboard

Enjoy! 🚀
