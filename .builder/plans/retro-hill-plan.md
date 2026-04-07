# Bunny CDN Integration Plan for Video Lessons

## Overview
Currently, videos are uploaded to Cloudflare R2 and served through the backend `/stream` endpoint. The goal is to integrate Bunny CDN to cache videos globally and improve delivery speed for mobile users in Asia & Oceania.

## Current Architecture
- **Storage**: Videos uploaded to Cloudflare R2
- **Delivery**: Videos served via backend proxy endpoint (`/api/videos/{id}/stream`)
- **Database**: Stores R2 public URLs in `file_url` field
- **Support**: Both direct video files and YouTube embeds

## Recommended Approach: Direct Bunny CDN Delivery

### Why This Approach?
1. **Performance**: Direct CDN delivery is faster than backend proxy (no backend latency)
2. **Scalability**: Bunny CDN handles bandwidth, reduces backend load
3. **Cost Effective**: Optimal for Asia region ($0.03/GB vs other regions at $0.06)
4. **Simplicity**: Straightforward implementation with minimal code changes

### How Bunny Pull Zone Works
- Bunny acts as a reverse proxy/cache in front of R2
- When users request a video, Bunny checks its cache
- If not cached, Bunny pulls from R2 origin and caches it
- Future requests are served from Bunny's global edge locations
- For Asia, Bunny will serve from nearest location to users

## Setup Requirements

### What You Need to Provide (Bunny Account Setup)
1. **Create Bunny Account** at bunny.net
2. **Create Pull Zone** with these details:
   - **Pull Zone Name**: Something like `your-project-videos` (letters/numbers only)
   - **Origin Type**: URL
   - **Origin URL**: Your R2 public domain URL (will be provided below)
   - **Host Header**: Leave empty (Bunny will auto-extract)
   - **Tier**: Choose Asia & Oceania region for optimization
   - **Bunny Shield**: Optional but recommended for DDoS protection

### Origin URL Configuration
**Use the value of your `R2_PUBLIC_URL` environment variable** as the Origin URL in Bunny.

Your backend environment variables include:
- **R2_PUBLIC_URL** ← **This is what you need for Bunny**
- R2_BUCKET_NAME (don't use this)
- R2_SECRET_ACCESS_KEY (don't use this)
- R2_ACCESS_KEY_ID (don't use this)
- R2_ACCOUNT_ID (don't use this)

Your `R2_PUBLIC_URL` should look like one of these formats:
- `https://yourbucket.r2.cloudflarestorage.com` (Cloudflare standard domain)
- `https://cdn.yourdomain.com` (if you have a custom domain set up)

**Example for Bunny Setup:**
- **Origin URL field**: Copy your exact `R2_PUBLIC_URL` value
- **Host Header**: Leave empty (Bunny will auto-extract)
- Result: Bunny will be at `https://your-pull-zone-name.b-cdn.net` and pull from your R2_PUBLIC_URL

## Your Bunny CDN Setup (Completed)
✅ Bunny Pull Zone Created
✅ Origin: R2 domain configured
✅ Bunny CDN Domain: `https://letvideoprepwise.b-cdn.net`

This domain is now ready to serve your videos with caching and global distribution.

## Important: Upload Process Does NOT Change ✅
- Videos still upload to R2 (no changes to upload mechanism)
- The upload flow is completely unchanged
- Only the URL that gets saved in the database changes to Bunny CDN domain

## Implementation Steps

### Phase 1: Bunny Account Setup (Completed ✅)
Bunny Pull Zone is already configured with:
- Origin URL: Your R2 domain
- Asia & Oceania region enabled
- Bunny domain ready: `https://letvideoprepwise.b-cdn.net`

### Phase 2: Code Integration (✅ COMPLETED)

#### 2.1 Environment Configuration (⏳ PENDING USER ACTION)
- **Required**: Set environment variable in system: `BUNNY_CDN_URL=https://letvideoprepwise.b-cdn.net`
- This should be added to your deployment system (not in .env file for easier updates)
- See instructions below for how to set this

#### 2.2 Backend Changes (`backend/app/routers/videos.py`) - ✅ COMPLETED
Implemented:
- ✅ Created `_transform_url_to_bunny_cdn()` helper function that transforms R2 URLs to Bunny CDN URLs
- ✅ Updated `get_presigned_upload_url()` to return Bunny CDN URLs instead of R2 URLs
- ✅ Updated `save_video_metadata()` to transform incoming R2 URLs to Bunny CDN URLs
- ✅ Updated `_upload_video_file()` to transform Supabase URLs to Bunny CDN URLs
- ✅ All endpoints now return Bunny CDN URLs to the frontend

What the code does:
- Transforms `file_url` from `https://r2-domain.com/path` to `https://letvideoprepwise.b-cdn.net/path`
- The path structure remains the same, only the domain changes
- Example: `https://example.r2.cloudflarestorage.com/videos/123/2024-01-01/video.mp4` → `https://letvideoprepwise.b-cdn.net/videos/123/2024-01-01/video.mp4`
- Skips transformation for YouTube videos (preserves original behavior)

What didn't change:
- Upload to R2 process (unchanged - videos still upload to R2)
- How files are stored in R2 (unchanged)
- Presigned URLs for uploads (unchanged)

#### 2.3 Frontend Changes
- No changes needed to video player component
- Videos will automatically play from Bunny CDN since only the URL changes
- YouTube embed videos remain unchanged

#### 2.4 Database Considerations
- Existing videos still have R2 URLs in database
- Options for migration:
  1. **Lazy Update**: Update URLs as videos are accessed
  2. **Batch Migration**: Script to update all existing video URLs
  3. **Dual Support**: Code handles both R2 and Bunny URLs transparently

### Phase 3: Testing & Monitoring
1. Test video playback from Bunny CDN
2. Monitor video load times for Asia region
3. Verify download functionality still works
4. Check caching headers and performance metrics

## File Changes Required

### Backend Files to Modify
- `backend/app/routers/videos.py`: Update video URL handling
  - `save_video_metadata()` function
  - `upload_video()` function  
  - `create_video()` function
  - Consider adding helper function to transform R2 URLs to Bunny CDN URLs

### Configuration/Environment to Update
- System environment variable: Set `BUNNY_CDN_URL=https://letvideoprepwise.b-cdn.net`
  - This will be configured directly in your deployment system (not in .env file)
  - Easier to update without code changes
- Backend code will read this variable when running

### Optional Frontend Updates
- Could add visual indicator showing CDN status
- Optional: Track cache hits vs origin requests (via Bunny API)

## Migration Path

### Step 1: Setup Phase (✅ COMPLETED)
- ✅ Created Bunny account and Pull Zone
- ✅ Set up Pull Zone with R2 as origin
- ✅ Got Bunny domain URL: `https://letvideoprepwise.b-cdn.net`

### Step 2: Code Deployment Phase (⏳ IN PROGRESS)
- ✅ Updated code to use Bunny URLs for new uploads
- ⏳ **REQUIRED**: Deploy updated backend code
- ⏳ **REQUIRED**: Set `BUNNY_CDN_URL` environment variable in deployment system
- ⏳ **REQUIRED**: Restart backend after setting environment variable

### Step 3: Database Migration Phase (✅ READY)
- ✅ Created migration script: `backend/migrate_to_bunny_cdn.py`
- ⏳ **OPTIONAL**: Run migration script to update existing video URLs
  - Use: `python migrate_to_bunny_cdn.py`
  - This will batch-update all R2 URLs to Bunny CDN URLs
  - Alternative: Let new videos use Bunny, existing videos stay on R2 until accessed

### Step 4: Monitoring Phase
- Monitor video load times in Bunny dashboard
- Check cache hit ratios
- Verify bandwidth reduction on R2
- Monitor performance metrics for Asia region

## Benefits for Your Use Case

### For Mobile Users in Asia
- **Lower Latency**: Videos served from nearest Bunny edge location
- **Better Buffering**: Cached content means faster starts
- **Bandwidth**: Optimal pricing in Asia ($0.03/GB)

### For Your Infrastructure
- **Reduced R2 Bandwidth**: Bunny caches, fewer origin requests
- **Scalability**: Handle more concurrent users
- **Global Ready**: Can expand to other regions if needed

## Fallback Plan
If Bunny doesn't meet expectations:
- Keep R2 as origin
- Backend streaming endpoint still works as backup
- Can disable Bunny and revert to R2 URLs easily

## Success Metrics
- Video load time for Asia region users
- Cache hit ratio from Bunny dashboard
- Bandwidth reduction on R2
- Mobile user experience improvements
