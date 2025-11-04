# 🎯 LET AI Control Hub

A comprehensive workspace management platform with real-time presence tracking, admin command center, community engagement, and verified member management.

![Tech Stack](https://img.shields.io/badge/Tech-FastAPI%20%7C%20React%20%7C%20TypeScript%20%7C%20PostgreSQL-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)
![Deployed](https://img.shields.io/badge/Deployed%20On-Vercel%20%2B%20Render-000000?style=for-the-badge)

---

## 📸 Demo

**Frontend**: https://prepwise-letai.vercel.app  
**Backend API**: https://backend-thesis-1.onrender.com

---

## ✨ Features

### 🔐 **Authentication & Security**
- User signup and member login
- Admin authentication with role-based access
- Email verification with OTP codes
- Password reset with email confirmation
- Session management with configurable TTL
- Secure cookie-based authentication

### 📊 **Admin Command Center**
- Real-time presence tracking (online/offline status)
- Live member and admin roster
- Verified/unverified member status
- Presence event history (login, logout, signup)
- Advanced search and filtering
- Member modal with verification filters
- Statistics dashboard

### 👥 **Member Management**
- User profile with email and phone verification
- Verification status tracking across the platform
- User profile visibility in community
- Activity history
- Profile customization (name, bio, avatar)

### 💬 **Community Features**
- Create and share community posts
- Post attachments (images, files)
- Comment on posts
- Like/unlike posts
- Post tagging system
- Search and filter posts
- Archive posts
- Report inappropriate content

### 🔔 **Real-time Chat**
- One-on-one messaging
- User presence indicators
- Message read status
- Chat history
- User search and discovery

### 📱 **Notifications**
- In-app notification system
- Event-based notifications
- Read/unread status
- Activity notifications

### 📚 **Flashcards**
- Upload PDF flashcard sets
- Parse and organize flashcards by category
- View questions and answers
- Categorized learning materials

### 🎨 **UI/UX**
- Light and dark mode support
- Responsive design (mobile, tablet, desktop)
- Real-time updates
- Smooth transitions and animations
- Accessible components (WCAG compliant)
- Professional styling with Tailwind CSS

---

## 🚀 Quick Start

### Prerequisites
- **Python** 3.10+
- **Node.js** 18+
- **PostgreSQL** or **SQLite** (for development)
- **pnpm** (recommended) or npm

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env  # Configure your database and email settings

# Run migrations (if using SQLAlchemy)
python main.py

# Start the server
python main.py
# Server runs on http://localhost:8000
```

**Environment Variables (Backend)**:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost/presence_hub
FRONTEND_ORIGIN=http://localhost:5174
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
SESSION_TTL_MINUTES=60
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm run dev
# App runs on http://localhost:5174
```

---

## 📁 Project Structure

```
.
├── backend/                    # FastAPI backend service
│   ├── app/
│   │   ├── routers/           # API endpoints
│   │   │   ├── auth.py        # Authentication & password reset
│   │   │   ├── presence.py    # Real-time presence tracking
│   │   │   ├── chat.py        # Messaging
│   │   │   ├── community.py   # Posts, comments, likes
│   │   │   ├── user.py        # Profile management
│   │   │   ├── notifications.py # Notifications
│   │   │   └── flashcards.py  # PDF flashcards
│   │   ├── services/          # Business logic
│   │   │   ├── profiles.py    # User profiles & verification
│   │   │   ├── sessions.py    # Session management
│   │   │   ├── users.py       # User operations
│   │   │   ├── events.py      # Event tracking
│   │   │   └── storage.py     # File storage
│   │   ├── models.py          # SQLAlchemy ORM models
│   │   ├── schemas.py         # Pydantic schemas
│   │   └── security.py        # Password hashing & auth
│   ├── main.py                # FastAPI app entry point
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── PresenceRoster.tsx
│   │   │   ├── MembersModal.tsx
│   │   │   ├── ForgotPasswordModal.tsx
│   │   │   └── ...
│   │   ├── views/             # Page components
│   │   │   ├── AdminPortalPage.tsx
│   │   │   ├── UserDashboardPage.tsx
│   │   │   ├── CommunityPage.tsx
│   │   │   └── ...
│   │   ├── providers/         # Context providers
│   │   │   ├─��� AuthProvider.tsx
│   │   │   └── ThemeProvider.tsx
│   │   ├── services/          # API client
│   │   │   ├── api.ts
│   │   │   └── chatApi.ts
│   │   └── styles/            # Global styles
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.ts     # Tailwind CSS config
│   ├── vercel.json            # Vercel deployment config
│   └── package.json
│
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout
- `POST /auth/request-password-reset` - Request password reset
- `POST /auth/verify-password-reset` - Verify reset code
- `POST /auth/reset-password` - Complete password reset

### User Profile
- `GET /user/profile` - Get current user profile
- `PUT /user/profile` - Update profile
- `POST /user/request-email-code` - Request email verification
- `POST /user/verify-email` - Verify email
- `POST /user/request-sms-code` - Request SMS verification
- `POST /user/verify-phone` - Verify phone

### Presence
- `GET /presence/overview` - Get presence overview
- `GET /admin/online-users` - Get online users
- `GET /admin/presence-events` - Get presence events
- `GET /admin/users` - List all users
- `GET /admin/stats` - Get admin statistics

### Community
- `GET /community/posts` - Get posts feed
- `POST /community/posts` - Create post
- `PUT /community/posts/{id}` - Update post
- `DELETE /community/posts/{id}` - Delete post
- `POST /community/posts/{id}/like` - Like post
- `POST /community/posts/{id}/comments` - Add comment
- `GET /community/users/{username}` - Get user profile

### Chat
- `GET /chat/conversations` - Get conversations
- `POST /chat/messages` - Send message
- `GET /chat/messages/{id}` - Get conversation messages

### Notifications
- `GET /notifications` - Get notifications
- `POST /notifications/{id}/read` - Mark as read

### Flashcards
- `POST /flashcards/upload` - Upload flashcard PDF
- `GET /flashcards` - List flashcards
- `GET /flashcards/{id}` - Get flashcard details
- `DELETE /flashcards/{id}` - Delete flashcard

---

## 🔐 Key Features Deep Dive

### Real-time Presence Tracking
The system tracks user presence in real-time with automatic session management:
- Users appear as "online" while actively using the workspace
- Automatic logout after configurable TTL (default 60 minutes)
- Last seen timestamp for offline users
- Presence events logged for audit trail

### Member Verification System
- Email verification with 6-digit OTP codes
- Phone number verification support
- Verification status visible to admins
- Members modal with filtering by verification status
- Settings page for users to manage their verification

### Password Reset Flow
- User requests password reset via email
- Receives 6-digit code via email (secure HTML template)
- Enters code to verify identity
- Creates new password
- Automatic session invalidation after reset

### Community & Engagement
- Rich post creation with attachments
- Comment threads on posts
- Like/unlike functionality
- Post tagging system
- Content reporting for moderation
- Post archiving without deletion

---

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern async Python web framework
- **SQLAlchemy 2.0** - ORM for database operations
- **asyncpg** - Async PostgreSQL driver
- **Pydantic** - Data validation
- **Python-multipart** - File upload support
- **PDFPlumber** - PDF parsing for flashcards
- **SMTP** - Email sending (Gmail)

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **AutoPrefixer** - CSS compatibility

### Database
- **PostgreSQL** (production)
- **SQLite** (development)

### Infrastructure
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **Docker** - Backend containerization
- **GitHub Actions** - CI/CD pipeline
- **Git** - Version control

---

## 🚢 Deployment Guide

### 📱 Frontend Deployment (Vercel + GitHub)

#### Step 1: Connect GitHub Repository

```bash
# Add your GitHub repository as origin
git remote add origin https://github.com/Kurtch-web/Prepwise-LetAI.git

# Push code to GitHub
git add .
git commit -m "Initial commit: LET AI Control Hub"
git branch -M main
git push -u origin main
```

#### Step 2: Configure Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Select **`frontend`** as the root directory
5. Add environment variables:
   - `VITE_API_BASE`: `https://backend-thesis-1.onrender.com`
6. Click **"Deploy"**

Your frontend will automatically deploy on every push to `main`!

#### Step 3: Custom Domain (Optional)

In Vercel project settings:
1. Go to **Domains**
2. Add your custom domain
3. Update DNS records as shown in Vercel

### 🔧 Backend Deployment (Render)

1. Go to [render.com](https://render.com)
2. Create **New** → **Web Service**
3. Connect your GitHub repository
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `python main.py`
6. Add environment variables:
   - `DATABASE_URL`
   - `EMAIL_FROM`
   - `EMAIL_PASSWORD`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
7. Deploy!

### Automatic Deployments

Both Vercel and Render watch your GitHub repository and automatically redeploy when you push updates.

---

## 🔄 GitHub Actions CI/CD

The repository includes GitHub Actions workflows for:
- ✅ **Linting** - ESLint on frontend code
- ✅ **TypeScript** - Type checking
- ✅ **Builds** - Verify production builds work
- ✅ **Automated on Push** - Runs on every pull request

Workflows run on every push to ensure code quality before merging to main.

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ HTTP-only secure cookies
- ✅ CORS configuration
- ✅ Role-based access control (RBAC)
- ✅ Email verification for accounts
- ✅ Secure password reset flow
- ✅ Session management with TTL
- ✅ SSL/TLS certificate validation
- ✅ Environment variable protection
- ✅ CSRF protection

---

## 📊 Current Status

- ✅ Core authentication system
- ✅ Real-time presence tracking
- ✅ Admin dashboard
- ✅ Community features
- ✅ Email verification
- ✅ Password reset
- ✅ User profiles
- ✅ Chat system
- ✅ Light/Dark theme
- ✅ Vercel + Render deployment
- ✅ GitHub Actions CI/CD
- 🔄 WebSocket real-time updates (in progress)
- 🔄 Advanced analytics (planned)

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 Contact & Support

For questions or support, please open an issue on GitHub or reach out to the development team.

---

## 🎓 Learning Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Render Deployment Guide](https://render.com/docs)

---

**Made with ❤️ using FastAPI + React + TypeScript**
