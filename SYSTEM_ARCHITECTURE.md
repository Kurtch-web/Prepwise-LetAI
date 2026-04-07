# System Architecture & Dataflow Diagram

## 📊 Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  FRONTEND (React + Vite)                 BACKEND (FastAPI)        DATABASE   │
│  ┌──────────────────────────────┐    ┌────────────────────────┐  (PostgreSQL)
│  │                              │    │                        │  ┌─────────┐
│  │  📄 PAGES/VIEWS              │    │  🔌 API ROUTERS        │  │ Tables  │
│  │  ├─ AuthPage                 │    │  ├─ auth.py            │  ├─────────┤
│  │  ├─ LoginPage                │    │  ├─ quizzes.py         │  │ Users   │
│  │  ├─ SignUpPage               │    │  ├─ practice_quizzes.py│  │ Quizzes │
│  │  ├─ UserDashboard            │    │  ├─ assessments.py     │  │ Sessions│
│  │  ├─ AdminPortal              │    │  ├─ flashcards.py      │  │ Answers │
│  │  ├─ QuizPage                 │    │  ├─ videos.py          │  │ Posts   │
│  │  ├─ LearningMaterials        │    │  ├─ questions.py       │  │ ...etc  │
│  │  ├─ ProgressTracker          │    │  ├─ posts.py           │  └─────────┘
│  │  ├─ Flashcards               │    │  ├─ notifications.py    │
│  │  ├─ VideoLessons             │    │  ├─ presence.py        │
│  │  ├─ StudyGuides              │    │  └─ system.py          │
│  │  └─ QuickAssessment          │    │                        │
│  │                              │    │  🛡️ Authentication     │
│  │  🎨 COMPONENTS               │    │  ├─ JWT Token          │
│  │  ├─ PracticeQuizTaker        │    │  ├─ Password Hashing   │
│  │  ├─ PracticeRetakeQuiz       │    │  └─ Permission Checks  │
│  │  ├─ FlashcardView            │    │                        │
│  │  ├─ VideoUploadForm          │    │  📦 Database Models    │
│  │  ├─ AssessmentSurvey         │    │  ├─ UserAccount        │
│  │  └─ LeaderboardModal         │    │  ├─ Quiz/PracticeQuiz  │
│  │                              │    │  ├─ Assessment         │
│  │  📡 SERVICES                 │    │  └─ Video/Flashcard    │
│  │  ├─ quizService              │    │                        │
│  │  ├─ practiceQuizzesService   │    └────────────────────────┘
│  │  ├─ api.ts                   │
│  │  ├─ authService              │
│  │  ├─ progressService          │
│  │  └─ storage.py               │
│  │                              │
│  │  🔐 PROVIDERS                │
│  │  ├─ AuthProvider             │
│  │  └─ ThemeProvider            │
│  └──────────────────────────────┘
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Frontend Architecture

### Pages/Views (User Interfaces)

| Page | Purpose | Components Used | Data Flow |
|------|---------|-----------------|-----------|
| **AuthPage** | User login/signup | Login forms, Auth validation | Sends credentials → authService → Backend /auth endpoints |
| **UserDashboard** | Student home page | Progress cards, Recent quizzes | Fetches user data, quiz sessions, progress stats |
| **AdminPortal** | Admin management panel | User list, Quiz creator, Assessment manager | CRUD operations for quizzes, users, assessments |
| **QuizPage** | Take diagnostic/pre-board tests | Quiz taker, Timer, Leaderboard | Joins quiz by code, submits answers, gets results |
| **LearningMaterials** | Access all learning resources | Practice quizzes, Videos, Flashcards | Lists available resources, launches respective components |
| **ProgressTracker** | View learning analytics | Progress charts, Performance metrics | Aggregates session data, calculates statistics |
| **Flashcards** | Study with flashcards | Flashcard viewer, Quiz mode | Loads flashcard sets, tracks progress |
| **QuickAssessment** | Learning preferences survey | Assessment form | Submits responses, gets recommendations |

### Components (Reusable UI)

| Component | Role | Input | Output |
|-----------|------|-------|--------|
| **PracticeQuizTaker** | Take a new practice quiz | quizId | Session ID → Submit answers → Get results |
| **PracticeRetakeQuiz** | Retake a previous quiz | quizId, originalData | Calculates score locally |
| **FlashcardView** | Study/quiz with flashcards | Flashcard set | Tracks study progress |
| **VideoUploadForm** | Admin upload videos | Video file + metadata | POST to /api/videos |
| **AssessmentSurvey** | Take assessment | Questions | POST to /api/assessments |
| **LeaderboardModal** | View quiz leaderboard | quizId | GET from /api/quizzes/{quizId}/leaderboard |

### Services (Business Logic)

```
Frontend Services
├─ quizService.ts
│  ├─ joinQuizByCode(code, testType)
│  ├─ startSession(quizId)
│  ├─ submitAnswer(sessionId, questionId, answer)
│  ├─ submitQuiz(sessionId)
│  └─ getSessionResults(sessionId)
│
├─ practiceQuizzesService.ts ⭐ (NEW - Fixed)
│  ├─ getPracticeQuiz(quizId)
│  ├─ startSession(quizId)
│  ├─ submitAnswer(sessionId, questionId, answer)
│  ├─ submitQuiz(sessionId)
│  └─ getResults(sessionId)
│
├─ api.ts
│  ├─ fetchUsersWithProfiles()
│  ├─ fetchAssessmentTemplates()
│  ├─ createAssessment(templateId, responses)
│  └─ [20+ other endpoints]
│
├─ authService.ts
│  ├─ login(username, password)
│  ├─ signup(data)
│  ├─ logout()
│  ├─ getToken()
│  └─ isAuthenticated()
│
└─ progressService.ts
   ├─ calculateProgress()
   ├─ fetchPracticeQuizSessions()
   └─ fetchQuizAttempts()
```

---

## 🔌 Backend API Architecture

### API Routers & Endpoints

#### 🔐 **auth.py** - Authentication
```
POST   /auth/login              → Authenticate user, return JWT token
POST   /auth/signup             → Register new account
POST   /auth/logout             → Invalidate session
POST   /auth/refresh-token      → Get new JWT token
POST   /auth/forgot-password    → Send password reset code
POST   /auth/reset-password     → Reset password with code
POST   /auth/verify-code        → Verify email code
```

#### 📝 **quizzes.py** - Formal Quizzes (Diagnostic, Drills, Short, Pre-Board)
```
POST   /api/quizzes/create              → Create new quiz (admin only)
GET    /api/quizzes/list                → List user's created quizzes (admin)
GET    /api/quizzes/list-archived       → List archived quizzes
GET    /api/quizzes/join/{code}         → Join quiz by access code
POST   /api/quizzes/start-session/{id}  → Start quiz session
POST   /api/quizzes/submit-answer       → Submit single answer
POST   /api/quizzes/submit-quiz/{id}    → Complete quiz, calculate score
GET    /api/quizzes/results/{sessionId} → Get quiz results & answers
GET    /api/quizzes/user/sessions       → Get all user's quiz sessions
GET    /api/quizzes/{id}/leaderboard    → Get quiz leaderboard
POST   /api/quizzes/archive/{id}        → Archive quiz
POST   /api/quizzes/restore/{id}        → Restore archived quiz
DELETE /api/quizzes/delete/{id}         → Permanently delete quiz
```

#### 📚 **practice_quizzes.py** - Practice Quizzes (NEW - FIXED ⭐)
```
POST   /api/practice-quizzes                   → Create practice quiz (admin)
GET    /api/practice-quizzes                   → List all practice quizzes
GET    /api/practice-quizzes/{quiz_id}         → Get quiz details with questions
POST   /api/practice-quizzes/{quiz_id}/start-session      → Start session
POST   /api/practice-quizzes/{session_id}/submit-answer   → Submit answer ✓
POST   /api/practice-quizzes/{session_id}/submit          → Complete quiz ✓
GET    /api/practice-quizzes/{session_id}/results         → Get results ✓
GET    /api/practice-quizzes/user/sessions                → User's sessions
GET    /api/practice-quizzes/{quiz_id}/attempts           → User's attempts
```

#### 📊 **assessments.py** - Learning Assessments
```
POST   /api/assessments                    → Create assessment template
GET    /api/assessments                    → List templates
POST   /api/assessments/{template_id}      → Submit assessment response
GET    /api/assessments/{template_id}      → Get template details
GET    /api/assessments/insights/{id}      → Get response insights
GET    /api/assessments/summary             → Get all templates summary
```

#### 🎥 **videos.py** - Video Content
```
POST   /api/videos                      → Upload video (admin)
GET    /api/videos                      → List all videos
GET    /api/videos/{id}                 → Get video details
POST   /api/videos/{id}/watch           → Mark video as watched
GET    /api/videos/user/watch-history   → Get watch history
DELETE /api/videos/{id}                 → Delete video (admin)
```

#### 🎴 **flashcards.py** - Flashcard Sets
```
POST   /api/flashcards/upload            → Upload flashcard file (admin)
GET    /api/flashcards                   → List all flashcard sets
GET    /api/flashcards/{id}/cards        → Get flashcard details
POST   /api/flashcards/{id}/study        → Mark as studied
GET    /api/flashcards/user/sessions     → User's flashcard sessions
```

#### 🔍 **questions.py** - Question Bank
```
POST   /api/questions/upload        → Upload question batch (admin)
GET    /api/questions               → List all questions
GET    /api/questions/by-category   → Filter by category
GET    /api/questions/search        → Search questions
POST   /api/questions/{id}/attempt  → Record question attempt
```

#### 💬 **posts.py** - Community Forum
```
POST   /api/posts                   → Create post
GET    /api/posts                   → List posts (paginated)
GET    /api/posts/{id}              → Get post details
POST   /api/posts/{id}/like         → Like post
POST   /api/posts/{id}/comment      → Add comment
DELETE /api/posts/{id}              → Delete post
```

#### 🔔 **notifications.py** - Notifications
```
GET    /api/notifications               → Get user's notifications
POST   /api/notifications/{id}/read     → Mark as read
DELETE /api/notifications/{id}          → Delete notification
```

#### 👥 **presence.py** - Online Status
```
GET    /api/presence/online-users       → List online users
GET    /api/presence/overview           → Admin overview
POST   /api/presence/heartbeat          → Keep-alive signal
```

#### ⚙️ **system.py** - System
```
GET    /api/system/health               → Health check
GET    /api/system/config               → Get configuration
```

---

## 💾 Database Schema

### Core Tables & Relationships

```
USER_ACCOUNTS (Users)
├─ id (PK)
├─ username (unique)
├─ email (unique)
├─ password_hash
├─ full_name
├─ role (admin | user)
├─ review_type (GenEd, etc)
├─ target_exam_date
├─ instructor_id (FK → user_accounts for sub-relationships)
└─ created_at

QUIZZES (Formal Tests)
├─ id (PK)
├─ creator_id (FK → user_accounts)
├─ title
├─ description
├─ access_code (unique)
├─ test_type (diagnostic-test|drills|short-quiz|preboard)
├─ time_limit_minutes
├─ is_active
├─ is_archived
├─ created_at
└─ 1──N→ QUIZ_QUESTIONS
    └─ 1──N→ QUIZ_ANSWERS

QUIZ_SESSIONS (User Quiz Attempts)
├─ id (PK)
├─ quiz_id (FK → quizzes)
├─ user_id (FK → user_accounts)
├─ started_at
├─ completed_at
├─ score
├─ total_questions
└─ 1──N→ QUIZ_ANSWERS

PRACTICE_QUIZZES (Practice Tests) ⭐
├─ id (PK)
├─ creator_id (FK → user_accounts)
├─ title
├─ category
├─ difficulty
├─ time_limit_minutes
├─ is_active
└─ 1──N→ PRACTICE_QUIZ_QUESTIONS
    └─ 1──N→ PRACTICE_QUIZ_ANSWERS

PRACTICE_QUIZ_SESSIONS ⭐
├─ id (PK)
├─ quiz_id (FK → practice_quizzes)
├─ user_id (FK → user_accounts)
├─ started_at
├─ completed_at
├─ score
└─ 1──N→ PRACTICE_QUIZ_ANSWERS

ASSESSMENT_TEMPLATES (Survey Questions)
├─ id (PK)
├─ creator_id (FK → user_accounts)
├─ name
├─ description
├─ questions (JSON array)
├─ is_active
└─ 1──N→ ASSESSMENTS

ASSESSMENTS (User Assessment Responses)
├─ id (PK)
├─ user_id (FK → user_accounts)
├─ template_id (FK → assessment_templates)
├─ responses (JSON)
├─ learning_preferences (JSON)
└─ recommendations (JSON)

VIDEOS
├─ id (PK)
├─ uploader_id (FK → user_accounts)
├─ title
├─ category
├─ file_url
├─ duration_seconds
└─ 1──N→ VIDEO_WATCHES

VIDEO_WATCHES
├─ id (PK)
├─ user_id (FK → user_accounts)
├─ video_id (FK → videos)
├─ watched_seconds
├─ is_completed
└─ completed_at

FLASHCARDS
├─ id (PK)
├─ uploader_id (FK → user_accounts)
├─ filename
├─ category
├─ storage_path
└─ created_at

POSTS (Forum)
├─ id (PK)
├─ author_id (FK → user_accounts)
├─ content
├─ created_at
├─ 1──N→ POST_ATTACHMENTS
├─ 1──N→ LIKES
└─ 1──N→ COMMENTS

QUESTIONS (Question Bank)
├─ id (PK)
├─ creator_id (FK → user_accounts)
├─ question_text
├─ choices (JSON)
├─ correct_answer
├─ category
├─ batch_name
└─ source
```

---

## 📊 Data Flow Diagrams

### 1️⃣ Quiz Taking Flow (User Journey)

```
User Interface                  Frontend Service                Backend API            Database
┌──────────────────┐          ┌──────────────────┐          ┌─────────────────┐     ┌────────────┐
│                  │          │                  │          │                 │     │            │
│ QuizPage         │          │ quizService      │          │ auth.py         │     │ user_      │
│ 1. Select Type   ├──────────→ joinQuizByCode() ├─────────→ verify token     │     │ accounts   │
│                  │          │                  │          │                 │     │            │
│                  │          │                  │          │ quizzes.py      │     │            │
│ 2. Enter Code    │          │                  │          │ GET /join/{code}├────→ quizzes    │
│                  │          │ startSession()   │          │                 │     │            │
│                  │          │                  ├─────────→ POST /start      ├────→ quiz_      │
│                  │          │                  │          │ Returns:        │     │ sessions   │
│ 3. Take Quiz     │          │                  │          │ session_id      │     │            │
│ - View Q         │          │ submitAnswer()   │          │                 │     │            │
│ - Select Answer  ├──────────→                  ├─────────→ POST /submit-    ├────→ quiz_      │
│ - Next Question  │          │                  │          │ answer          │     │ answers    │
│                  │          │                  │          │ Saves: Q+A pair │     │            │
│ 4. Submit        │          │ submitQuiz()     │          │                 │     │            │
│                  ├──────────→                  ├─────────→ POST /submit-    │     │            │
│                  │          │                  │          │ quiz            │     │            │
│                  │          │ getSessionResults│          │ Calculates score├────→ sessions:  │
│ 5. View Results  │          │                  ├─────────→ GET /results     │     │ score=X   │
│ - Score %        │←─────────┤ Returns: Results │←─────────┤ Returns: Answers│     │ completed │
│ - Answers        │          │                  │          │ + Score        │     │ = now()    │
│                  │          │                  │          │                 │     │            │
└──────────────────┘          └──────────────────┘          └─────────────────┘     └────────────┘
```

### 2️⃣ Practice Quiz Flow (FIXED ⭐)

```
User Interface              Frontend Service            Backend API             Database
┌──────────────────┐     ┌────────────────────┐     ┌──────────────────┐     ┌────────────┐
│                  │     │                    │     │                  │     │            │
│ LearningMaterials│     │ practice          │     │ practice_        │     │ practice_  │
│ Practice Quizzes │     │ QuizzesService    │     │ quizzes.py       │     │ quizzes    │
│                  │     │                    │     │                  │     │            │
│ 1. Select Quiz   ├────→ getPracticeQuiz()  ├────→ GET /api/practice ├────→ Load quiz  │
│                  │     │                    │     │ -quizzes/{id}    │     │ w/ Qs     │
│                  │     │ startSession()     │     │                  │     │            │
│ 2. Start Taking  ├────→                    ├────→ POST /start-      ├────→ Create     │
│                  │     │                    │     │ session          │     │ session   │
│                  │     │                    │     │ Returns:         │     │            │
│                  │     │ submitAnswer()     │     │ session_id       │     │            │
│ 3. Answer Q      ├────→                    ├────→ POST /submit-     ├────→ Save Q+A   │
│    Select: A     │     │                    │     │ answer           │     │ pair      │
│    (Each answer) │     │                    │     │ question_id: Q1  │     │ in DB     │
│                  │     │                    │     │ selected_answer: A
│                  │     │ submitQuiz()       │     │                  │     │            │
│ 4. Submit Quiz   ├────→                    ├────→ POST /submit      ├────→ Calculate  │
│                  │     │                    │     │ Loops through    │     │ score &   │
│                  │     │ getResults()       │     │ all answers      │     │ complete  │
│ 5. View Results  │     │                    │     │ Calculates score │     │ session   │
│ - Score          ├────→                    ├────→ GET /results      ├────→ session:   │
│ - Answers        │←────┤ Returns: Complete │←────┤ Returns:         │     │ score=X   │
│ - Review         │     │ results object    │     │ All questions    │     │ completed │
│                  │     │                    │     │ + user answers   │     │ = now()    │
│                  │     │                    │     │ + is_correct     │     │            │
└──────────────────┘     └────────────────────┘     └──────────────────┘     └────────────┘
                                                        ⭐ NOW WITH AUTH!
```

### 3️⃣ Assessment (Survey) Flow

```
QuickAssessmentPage    AssessmentSurvey Component    api.ts Service      Backend      Database
└─┬──────────────┐     ┌──────────────────────┐     ┌─────────────┐    ┌──────────┐  ┌──────────┐
  │              │     │                      │     │             │    │          │  │          │
  │ 1. Load Q's  ├────→│ Display questions    │     │             │    │ GET /api│ ┌┤Assessment│
  │    (survey)  │     │ with options         │     │             ├───→│ /assessments
  │              │     │                      │     │             │    │ /{id}    │  │ Templates│
  │              │     │ 2. User selects      │     │             │    │          │  │          │
  │ 3. Submit    ├────→│    answers           │     │createAssess │    │          │  │          │
  │    responses │     │                      │     │ment()       │    │ POST /api│ ┌┤Assessment│
  │              │     │ 3. Send to backend   ├────→│             ├───→│ /assessm │ │ (responses
  │              │     │                      │     │             │    │ ents/{id}│  │ + preferen
  │ 4. Get       │←────│ Receive results:     │←────│             │←───│          │  │ ces JSON)
  │    recommen  │     │ - Learning prefs     │     │             │    │ Returns: │  │          │
  │    dations   │     │ - Recommended study  │     │             │    │ - Prefs  │  │          │
  │              │     │   path               │     │             │    │ - Recos  │  └──────────┘
  └──────────────┘     └──────────────────────┘     └─────────────┘    └──────────┘
```

### 4️⃣ Admin Dashboard Flow

```
AdminPortalPage         Components              Services           Backend         Database
└─┬────────────────┐   ┌──────────────────┐   ┌────────────┐    ┌──────────────┐  ┌────────────┐
  │                │   │                  │   │            │    │              │  │            │
  │ Users Tab      ├──→│ Fetch & Display  ├──→│ api.ts     ├───→│ GET /api/    │  │ user_      │
  │ - User list    │   │ user profiles    │   │ fetchUsers │    │ users        │  │ accounts   │
  │ - Profiles     │   │ - Assignments    │   │            │    │              │  │            │
  │                │   │ - Scores         │   │            │    │              │  │            │
  │ Learning Materials Tab                    │            │    │              │  │ quizzes    │
  │ - Diagnostic   ├──→│ Create Quiz Form ├──→│ quizService├───→│ POST /api/   │ ┌┤ questions │
  │ - Drills       │   │ - Title, Q, Choices  │            │    │ quizzes/     │ │            │
  │ - Short Quiz   │   │ - Correct answers    │            │    │ create       │ │ quiz_      │
  │ - Pre-Board    │   │                  │   │            │    │              │  │ sessions   │
  │ - Flashcards   │   │                  │   │            │    │              │  │            │
  │ - Questions    │   │ Delete/Archive/  ├──→│            ├───→│ DELETE,POST  │  │            │
  │ - Practice ✓   │   │ Restore          │   │            │    │ /archive,    │  │ practice_  │
  │ - Archive      │   │                  │   │            │    │ /restore     │  │ quizzes    │
  │                │   │                  │   │            │    │              │  │            │
  │ Assessment Tab │   │ Assessment Form  │   │ api.ts     ├───→│ POST /api/   │  │ assessment │
  │ - Create survey├──→│ - Add questions  ├──→│ createAssess  │ assessments│ │_templates  │
  │ - View insights│   │ - Save template  │   │ ment()     │    │              │  │            │
  │ - List surveys │   │                  │   │            │    │              │  │ assessments│
  │                │   │                  │   │            │    │              │  │            │
  └────────────────┘   └──────────────────┘   └────────────┘    └──────────────┘  └────────────┘
```

---

## 🔐 Authentication & Authorization Flow

```
Step 1: Login
┌──────────────┐                        ┌──────────────┐                    ┌────────────┐
│ LoginPage    │ username + password    │ authService  │ verify hash        │ PostgreSQL │
│              ├──────────────────────→ │              ├───────────────────→ │ user_      │
│              │                        │              │ get password_hash   │ accounts   │
│              │                        │              │                    │            │
└──────────────┘                        └──────────────┘                    └────────────┘
                                               ↓
                                        Compare hashes
                                        Match? Generate JWT
                                               ↓
Step 2: Return Token & Store
┌──────────────┐                        ┌──────────────┐
│ Frontend     │ {token, user_data}     │ authService  │
│ localStorage ←─────────────────────── │              │
│ (Token)      │                        │              │
│              │                        │              │
└──────────────┘                        └──────────────┘

Step 3: Authenticated Requests
┌──────────────┐                        ┌──────────────┐                    ┌────────────┐
│ Any Service  │ GET /api/quizzes       │ quizService  │ Authorization:     │ FastAPI   │
│ Quiz, Practice│ Header: {             │              │ Bearer {JWT}       │ @depends  │
│ Flashcards   │   Authorization:       ├─────────────→│                    │ get_current│
│              │   Bearer {JWT}         │              │ Verify JWT         │_user      │
│              │ }                      │              │                    │           │
└──────────────┘                        └──────────────┘                    └────────────┘
                                               ↓
                                        JWT Valid?
                                        Extract user_id
                                        Proceed with request
                                               ↓
                                        Return filtered data
                                        (user's own data only)
```

---

## 🚀 Key Data Flows Summary

### Quiz Submission Flow (What Was Broken ❌ → What's Fixed ✅)

**BEFORE (Broken):**
```
PracticeQuizTaker Component
  → Raw fetch() call (NO AUTH HEADERS)
  → /api/practice-quizzes/{sessionId}/submit-answer
  → Request failed silently (401 Unauthorized)
  → No data saved to database ❌
```

**AFTER (Fixed):**
```
PracticeQuizTaker Component
  → practiceQuizzesService.submitAnswer()
  → request() function adds:
     ✓ Authorization: Bearer {JWT}
     ✓ Content-Type: application/json
     ✓ API_BASE: http://127.0.0.1:8000
  → POST /api/practice-quizzes/{sessionId}/submit-answer
  → Backend authenticates via JWT
  → Saves answer to practice_quiz_answers table ✅
  → Returns success ✅
```

---

## 📡 API Request/Response Examples

### Example 1: Join & Take a Quiz

**Request 1: Join Quiz**
```http
GET /api/quizzes/join/ABCD1234
Authorization: Bearer {jwt_token}
```

**Response 1:**
```json
{
  "id": "quiz-uuid",
  "title": "Diagnostic Test",
  "description": "...",
  "total_questions": 50,
  "time_limit_minutes": 60,
  "questions": [
    {
      "id": "q1",
      "question_text": "What is 2+2?",
      "choices": ["3", "4", "5", "6"],
      "order": 0
    }
  ]
}
```

**Request 2: Start Session**
```http
POST /api/quizzes/start-session/quiz-uuid
Authorization: Bearer {jwt_token}
```

**Response 2:**
```json
{
  "session_id": "session-uuid",
  "quiz_id": "quiz-uuid",
  "started_at": "2026-03-14T10:30:00",
  "total_questions": 50,
  "time_limit_minutes": 60
}
```

**Request 3: Submit Answer (repeated per question)**
```http
POST /api/quizzes/submit-answer
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "session_id": "session-uuid",
  "question_id": "q1",
  "selected_answer": "B"
}
```

**Request 4: Submit Quiz & Get Results**
```http
POST /api/quizzes/submit-quiz/session-uuid
Authorization: Bearer {jwt_token}
```

**Response 4:**
```json
{
  "session_id": "session-uuid",
  "score": 85,
  "correct": 42,
  "total": 50,
  "completed_at": "2026-03-14T11:45:00"
}
```

**Request 5: Get Detailed Results**
```http
GET /api/quizzes/results/session-uuid
Authorization: Bearer {jwt_token}
```

**Response 5:**
```json
{
  "session_id": "session-uuid",
  "score": 85,
  "correct": 42,
  "total": 50,
  "started_at": "2026-03-14T10:30:00",
  "completed_at": "2026-03-14T11:45:00",
  "answers": [
    {
      "question_id": "q1",
      "question_text": "What is 2+2?",
      "user_answer": "B",
      "correct_answer": "B",
      "is_correct": true
    }
  ]
}
```

---

## 📊 System Statistics & Metrics

```
Components:
├─ Frontend Pages:        18
├─ Frontend Components:   40+
├─ Frontend Services:     7
├─ Providers:             2
├─ Backend Routers:       11
├─ Database Tables:       25+
└─ Database Models:       20+

API Endpoints:           100+
├─ Authentication:        6
├─ Quizzes:             15
├─ Practice Quizzes:     10 ⭐
├─ Assessments:          6
├─ Videos:               6
├─ Flashcards:           6
├─ Questions:            5
├─ Posts/Forum:         10
├─ Notifications:        3
└─ System:               3

Database Relationships:
├─ One-to-Many:         40+
├─ One-to-One:           8
└─ Many-to-Many:         3
```

---

## 🔧 Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Zustand or React Context (state management)

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- PostgreSQL (database)
- JWT for authentication
- AsyncIO (async operations)

**Infrastructure:**
- Backend: http://127.0.0.1:8000
- Frontend: http://localhost:5174
- Database: PostgreSQL (local)
- Environment: VITE_API_BASE configured

---

## ✅ Summary

This document maps out your **complete system architecture** including:
- ✅ All frontend pages and components
- ✅ All backend API routes and endpoints
- ✅ Complete database schema with relationships
- ✅ Authentication & authorization flow
- ✅ Data flow diagrams for major user journeys
- ✅ Request/response examples
- ✅ The **practice quiz fix** with proper auth headers

The key issue that was fixed:
- **Before**: PracticeQuizTaker sent raw fetch() without JWT → requests failed
- **After**: PracticeQuizzesService sends authenticated requests → data saves to DB ✅
