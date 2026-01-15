# Deployment Guide: Vercel Backend + Vercel Frontend

This guide explains how to deploy both the FastAPI backend and React frontend to Vercel.

## Architecture

```
Frontend (Vercel)
    ↓
Backend (Vercel)
    ↓
Database (Neon/Supabase)
```

## Deployment Steps

### Step 1: Deploy Backend to Vercel

1. Push your code to GitHub (both `frontend/` and `backend/` directories)
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **"Add New..."** → **"Project"**
4. Select your repository
5. Configure project settings:
   - **Framework Preset**: `Other`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Output Directory**: (leave empty)
   - **Install Command**: (leave empty - Vercel handles this)
6. Click **"Deploy"**

### Step 2: Set Environment Variables for Backend

After deployment, configure environment variables:

1. Go to your backend project settings
2. Click **Settings** → **Environment Variables**
3. Add the following variables:

```
DATABASE_URL=<your-postgres-connection-string>
SUPABASE_URL=<your-supabase-url>
SUPABASE_BUCKET2=<your-bucket-name>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
FRONTEND_ORIGIN=https://your-frontend.vercel.app,http://localhost:5173
```

4. Click **"Save"** and redeploy

### Step 3: Deploy Frontend to Vercel

1. Click **"Add New..."** → **"Project"** again
2. Select your repository
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   ```
   VITE_API_BASE=https://your-backend.vercel.app
   ```
5. Click **"Deploy"**

### Step 4: Update Backend FRONTEND_ORIGIN

After frontend deployment, update the backend's `FRONTEND_ORIGIN`:

1. Go back to backend project settings
2. Update the `FRONTEND_ORIGIN` variable to include your frontend URL:
   ```
   FRONTEND_ORIGIN=https://your-frontend.vercel.app,http://localhost:5173
   ```
3. Click redeploy or wait for automatic redeployment

## Environment Variables Reference

### Backend (`backend/vercel.json`)

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_BUCKET2` | Storage bucket name for flashcards | `flashcards` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `(long key)` |
| `FRONTEND_ORIGIN` | Allowed frontend origins | `https://your-frontend.vercel.app` |
| `FRONTEND_ORIGIN_DEV` | For development (optional) | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_BASE` | Backend API base URL | `https://your-backend.vercel.app` |

## Local Development

### Terminal 1: Run Backend Locally
```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend runs at: `http://127.0.0.1:8000`

### Terminal 2: Run Frontend Locally
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

The frontend automatically connects to `http://127.0.0.1:8000` for local development.

## Troubleshooting

### CORS Error: "Access to XMLHttpRequest blocked"
- **Cause**: `FRONTEND_ORIGIN` not set or incorrect on backend
- **Fix**: Go to backend environment variables and update `FRONTEND_ORIGIN` to match your frontend URL
- **Verify**: Redeploy backend after changing env vars

### Flashcard Upload Fails
- **Check**: `SUPABASE_URL`, `SUPABASE_BUCKET2`, `SUPABASE_SERVICE_ROLE_KEY` are correctly set
- **Test**: Use [Supabase Dashboard](https://supabase.com/dashboard) to verify bucket exists

### Database Connection Error
- **Check**: `DATABASE_URL` is correct and accessible from Vercel
- **Test**: Connect locally first to verify connection string works
- **Note**: Ensure database allows connections from Vercel's IP ranges

### Frontend Shows "Backend Unavailable"
- **Check**: `VITE_API_BASE` environment variable is set correctly
- **Fix**: Redeploy frontend after setting the environment variable
- **Verify**: Check network tab in browser DevTools to see API requests

## Useful Commands

```bash
# Test backend locally
curl http://127.0.0.1:8000/system/health

# View backend logs on Vercel
# Go to backend project → Deployments → select deployment → Logs

# Hard refresh frontend (clear cache)
# Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

## Additional Resources

- [Vercel Python Runtime](https://vercel.com/docs/functions/runtimes/python)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/concepts/)
