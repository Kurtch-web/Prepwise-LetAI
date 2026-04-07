# Frontend Video Delivery from Bunny CDN

## Problem Statement
Currently, videos are being served through the backend `/stream` proxy endpoint, which adds latency. The frontend component `VideoPlayerModal.tsx` hardcodes the video source to `${API_BASE}/api/videos/{video_id}/stream` instead of using the Bunny CDN URLs that were prepared in the database.

## Current State
- Backend has been updated to transform R2 URLs to Bunny CDN URLs (✅ done)
- Database stores Bunny CDN URLs in `file_url` field (✅ done)
- Frontend still uses backend `/stream` endpoint (❌ needs fix)

## Issue Identified
In `frontend/src/components/VideoPlayerModal.tsx` (line 97):
```tsx
<source src={`${API_BASE}/api/videos/${video.id}/stream`} type="video/mp4" />
```

Should be changed to use the Bunny CDN URL directly:
```tsx
<source src={video.file_url} type="video/mp4" />
```

## Recommended Approach: Direct Bunny CDN Delivery

### Why This Works
1. **Performance**: Eliminates backend latency (direct to CDN edge location)
2. **Scalability**: Reduces backend load, Bunny handles bandwidth
3. **Bunny CORS**: Bunny CDN should have CORS properly configured for cross-origin requests
4. **Simplicity**: One-line change in the frontend

### Prerequisites
- Bunny CDN must be configured with proper CORS headers
- Bunny should allow requests from your frontend domain(s)
- `video.file_url` should contain valid Bunny CDN URL from database

## Implementation Plan (Ready for Execution)

### Phase 1: Update Frontend Video Player
**File**: `frontend/src/components/VideoPlayerModal.tsx`
**Line**: 97

**Change Required**:
- Replace hardcoded `/stream` endpoint with direct `video.file_url`
- This applies to non-YouTube videos only (YouTube videos use iframe, no change needed)
- One single line change

**Before**:
```tsx
<source src={`${API_BASE}/api/videos/${video.id}/stream`} type="video/mp4" />
```

**After**:
```tsx
<source src={video.file_url} type="video/mp4" />
```

**Rationale**:
- `video.file_url` now contains Bunny CDN URL (set by backend transformation)
- Direct delivery means no backend latency
- Bunny CDN handles CORS automatically for Pull Zones
- Result: Videos stream directly from nearest Bunny edge location

### Phase 2: Verify CORS Configuration
Before deploying, verify that:
- Bunny CDN Pull Zone has CORS enabled
- CORS allows requests from your frontend domain (`prepwise-let-ai.vercel.app`)
- Response includes proper `Access-Control-Allow-Origin` headers

### Phase 3: Test & Monitor
After deployment:
1. Test video playback in the admin dashboard video lessons section
2. Check browser network tab to verify requests go directly to Bunny CDN (`letvideoprepwise.b-cdn.net`)
3. Monitor video load times and performance
4. Verify no CORS errors in browser console

## Files to Modify
- `frontend/src/components/VideoPlayerModal.tsx` - 1 line change

## Fallback Plan
If CORS issues occur with direct Bunny CDN delivery:
- Keep using `/stream` endpoint as proxy
- But the `/stream` endpoint will still benefit from Bunny URLs (origin improves caching)
- Performance improvement will be less optimal, but still better than pure R2

## Expected Outcome
- Videos load directly from Bunny CDN edge locations
- Significantly reduced latency for Asia region users
- Backend `/stream` endpoint still available as fallback
- Users see immediate performance improvement
