# SkillForge LMS — Global Project Context for AI Agents

This document is the unified context hub and source of truth for AI agents working in this repository. It defines the system architecture, directory topology, tech stacks, core patterns, auth flows, database models, API routes, and commands across the backend, web frontend, and mobile app.

---

## 1. System Topology & Directory Structure

SkillForge is a full-stack LMS (Learning Management System) with a tiered exam progression engine. The system is organized as a monorepo with three independently deployable layers: a FastAPI Python backend, a React web frontend, and a React Native mobile app.

```
skillforge/                            (Root)
├── backend/                           # FastAPI Python Backend (port 8000)
│   ├── main.py                        # Entry point — app factory, all inline + routed endpoints
│   ├── auth.py                        # JWT creation, role guards (admin/expert/reviewer/sub_admin)
│   ├── database.py                    # SQLAlchemy engine, SessionLocal, Base, fallback to SQLite
│   ├── models/                        # SQLAlchemy ORM models
│   │   ├── __init__.py                # All core models (User, Course, Registration, Exam, etc.)
│   │   ├── certificate.py             # Certificate model
│   │   └── exam.py                    # QuestionBank, Question, ExamConfig, ExamSession, ExamCredential, etc.
│   ├── schemas.py                     # Pydantic request/response schemas
│   ├── routes/                        # Modular FastAPI routers
│   │   ├── exam_banks.py              # Question bank CRUD
│   │   ├── exam_configs.py            # Per-subject exam configuration
│   │   ├── exam_credentials.py        # Slot booking & credential lifecycle
│   │   ├── exam_reminders.py          # Reminder scheduling
│   │   ├── exam_sessions.py           # Proctored exam session management
│   │   ├── admin_analytics.py         # Admin analytics & reporting
│   │   ├── students.py                # Student registration management
│   │   ├── learning.py                # Course progress, learning paths
│   │   ├── payments.py                # Razorpay order creation & verification
│   │   ├── certificates.py            # Certificate issuance & verification
│   │   ├── communications.py          # Announcements, live sessions, notifications
│   │   ├── reports.py                 # Downloadable reports
│   │   ├── subadmins.py               # Sub-admin management
│   │   ├── institutions.py            # Institution CRUD
│   │   ├── analytics.py               # Learner analytics
│   │   ├── admin_analytics.py         # Admin-level aggregated analytics
│   │   └── ...                        # Other route modules
│   ├── services/                      # Business logic service layer
│   │   ├── payment_service.py         # Razorpay order creation, HMAC verification, tier unlock
│   │   ├── certificate_service.py     # Certificate generation, QR codes, badge issuance
│   │   ├── access_rule_engine.py      # Access state machine (active/grace/suspended/locked)
│   │   ├── access_scheduler.py        # Timed access deactivation scheduler
│   │   ├── exam_engine_client.py      # HTTP client for external exam engine microservice
│   │   ├── mailer.py                  # SMTP transactional email sender
│   │   ├── email_templates.py         # All email HTML templates
│   │   └── exam_engine.py             # Exam engine integration helpers
│   ├── utils/                         # Utility helpers (QR code generator, etc.)
│   ├── ai_service.py                  # OpenAI/Groq quiz & assessment generation
│   ├── groq_service.py                # Groq API integration (fast inference)
│   ├── seed.py                        # Database seed script (users, courses, institutions, specs)
│   ├── migrate.py                     # Runtime inline migration runner
│   ├── requirements.txt               # Python dependencies
│   ├── Procfile                       # Render.com start command
│   └── .env                           # Local environment variables (not committed)
│
├── frontend/                          # React Web App (port 3000)
│   ├── src/
│   │   ├── App.js                     # Root component — routing, auth state, page switcher
│   │   ├── index.css                  # Global CSS design tokens and base styles
│   │   ├── Components/
│   │   │   ├── Dashboard/             # All authenticated dashboard views (~64 components)
│   │   │   │   ├── Dashboard.js       # Main dashboard shell (role-based panel switching)
│   │   │   │   ├── Sidebar.js         # Collapsible navigation sidebar (role-aware links)
│   │   │   │   ├── AdminPanel.js      # Admin control panel (users, institutions, cycles)
│   │   │   │   ├── LearnerPerformance.js # Learner exam dashboard & progression view
│   │   │   │   ├── TopicAssessment.js # AI-powered mock assessment engine (largest file)
│   │   │   │   ├── MyLearning.js      # Course progress, quiz, content consumption
│   │   │   │   ├── Certifications.js  # Wallet view for earned certificates
│   │   │   │   ├── ExpertPanel.js     # Expert curriculum manager (course content editor)
│   │   │   │   ├── ReviewCenter.js    # Reviewer: proposal evaluation + certificate issues
│   │   │   │   ├── SubAdminConsole.js # Sub-admin management console (largest component)
│   │   │   │   ├── POCDashboard.js    # POC (Point-of-Contact) result verification panel
│   │   │   │   └── ...                # ~50 more dashboard components
│   │   │   ├── Landing/               # Public landing page sections
│   │   │   ├── Exam/
│   │   │   │   └── ExamPortal.js      # Secure exam-taking UI (proctored)
│   │   │   ├── AuthModal.js           # Login / Register modal
│   │   │   ├── MockAssessment.js      # Public mock assessment route handler
│   │   │   └── ...                    # Other shared components
│   │   ├── config/
│   │   │   └── branding.js            # App branding constants
│   │   └── utils/                     # Frontend utility helpers
│   ├── package.json                   # React 19 dependencies
│   ├── .env                           # REACT_APP_API_URL env variable
│   └── Procfile                       # Render.com static serve command
│
├── mobile/                            # React Native / Expo Mobile App
│   ├── App.js                         # Expo root entry point
│   ├── index.js                       # Expo register root component
│   ├── app.json                       # Expo project config (name, slug, icon, splash)
│   ├── eas.json                       # EAS Build configuration (preview/production profiles)
│   ├── src/
│   │   ├── navigation/                # React Navigation stack/tab/drawer navigators
│   │   │   ├── RootNavigator.js       # Root navigator — auth guard → role navigator
│   │   │   ├── LearnerNavigator.js    # Bottom-tab navigator for learners
│   │   │   ├── AdminNavigator.js      # Drawer navigator for admin
│   │   │   ├── ExpertNavigator.js     # Stack navigator for experts
│   │   │   ├── ReviewerNavigator.js   # Stack navigator for reviewers
│   │   │   └── POCNavigator.js        # Stack navigator for POC users
│   │   ├── screens/
│   │   │   ├── Auth/
│   │   │   │   └── LoginScreen.js     # Login form with Google OAuth support
│   │   │   ├── Dashboard/             # Learner screens
│   │   │   │   ├── DashboardScreen.js       # Main learner dashboard (stats, subjects, progress)
│   │   │   │   ├── SubjectsScreen.js        # Registered subjects & tier progression
│   │   │   │   ├── SlotBookingScreen.js     # Exam slot booking & credential management
│   │   │   │   ├── MockResultsScreen.js     # Mock test history & performance analytics
│   │   │   │   ├── CertificationsScreen.js  # Certificate wallet
│   │   │   │   ├── LiveClassesScreen.js     # Upcoming live session schedule
│   │   │   │   ├── PaymentCheckoutScreen.js # Razorpay tier upgrade payment flow
│   │   │   │   └── SupportScreen.js         # Support ticket management
│   │   │   ├── Admin/                 # Admin screens
│   │   │   │   ├── AdminDashboardScreen.js  # Admin KPI summary
│   │   │   │   ├── StudentsScreen.js        # Student roster management
│   │   │   │   ├── InstitutionsScreen.js    # Institution management
│   │   │   │   ├── OperationsScreen.js      # Full admin ops panel (cycles, payments, etc.)
│   │   │   │   └── SubAdminsScreen.js       # Sub-admin user management
│   │   │   ├── Expert/
│   │   │   │   ├── ExpertDashboardScreen.js # Expert home (pending validations)
│   │   │   │   └── CurriculumManagerScreen.js # Course content editor
│   │   │   ├── Reviewer/
│   │   │   │   ├── ReviewerDashboardScreen.js  # Reviewer proposal queue
│   │   │   │   └── ProposalEvaluationScreen.js # Proposal detail + approve/reject
│   │   │   └── POC/                   # POC result verification screens
│   │   ├── services/
│   │   │   ├── api.js                 # Axios instance with auth interceptor & 401 handler
│   │   │   └── authStorage.js         # expo-secure-store token persistence
│   │   ├── config/
│   │   │   └── env.js                 # API base URL resolver (dev LAN / prod deployed)
│   │   └── context/                   # React context providers (auth, etc.)
│   └── package.json                   # Expo SDK 54 dependencies
│
├── exam_engine_stub/                  # Local Exam Engine Microservice (stub/dev only)
│   ├── server.py                      # FastAPI stub simulating external exam engine webhooks
│   └── trigger_result.py              # Script to manually fire a result webhook payload
│
├── render.yaml                        # Render.com deployment configuration
├── skillforge.db                      # SQLite fallback DB (local dev only, not committed)
└── AGENTS.md                          # THIS FILE
```

---

## 2. Backend Context (backend/) — Port 8000

### 2.1 Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI (latest) |
| Language | Python 3.11+ |
| ORM | SQLAlchemy (sync, `create_engine` + `SessionLocal`) |
| Database | PostgreSQL (production) / SQLite (local fallback) |
| DB Driver | `pg8000` (pure Python, no native libs required) |
| Auth | PyJWT — HS256, 7-day access tokens |
| Password Hashing | SHA-256 via `hashlib` |
| AI | OpenAI API + Groq API (fast inference fallback) |
| Payments | Razorpay (orders, HMAC-SHA256 webhook verification) |
| Certificates | ReportLab + QR Code generation (`qrcode`, `Pillow`) |
| Email | SMTP via `smtplib` (Gmail), HTML templates in `services/email_templates.py` |
| PDF Parsing | `pypdf` + `scrapling` |
| File Uploads | FastAPI `StaticFiles` mounted at `/uploads` |

### 2.2 Authentication & Role System

JWT tokens are issued by `auth.create_access_token()` and contain `{ "sub": "<user_id>", "role": "<role>" }`.

Token lifetime: **7 days** (`ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7`).

**Roles and guards:**

| Role | Guard Dependency | Access Level |
|---|---|---|
| `admin` | `verifyAdminRole` | Full access to all endpoints |
| `sub_admin` | `verifySubAdminOrAdmin` | Scoped by `SubAdminPrivilege` + institution access |
| `expert` | `verifyExpertRole` | Content management, course validation |
| `reviewer` | `verifyReviewerRole` | Proposal review, certificate issues |
| `learner` | `get_current_user` | Own data only |
| `poc` | (via role check in handlers) | POC exam result verification |

Sub-admin fine-grained privilege flags (from `SubAdminPrivilege` model):
`manage_institutions`, `manage_students`, `allocate_specializations`, `view_reports`, `reset_passwords`, `bulk_upload`, `manage_content`, `custom_reports`, `enrollment_reports`, `verify_assessments`

### 2.3 Database Configuration

- Primary DB: `DATABASE_URL` env var (PostgreSQL via `pg8000`)
- Auto-fallback: SQLite at `./skillforge.db` if `DATABASE_URL` is not set or connection fails
- `postgresql://` URLs are auto-rewritten to `postgresql+pg8000://` in `database.py`
- Runtime inline migrations are run on startup via `migrate()` in `main.py`

### 2.4 Core Models

All models are defined in `backend/models/__init__.py` unless noted.

| Model | Table | Key Fields |
|---|---|---|
| `User` | `users` | `id`, `email`, `name`, `hashed_password`, `role`, `streak`, `xp_points`, `must_change_password` |
| `Course` | `courses` | `id`, `title`, `category`, `modules_data` (JSON), `quiz_questions` (JSON) |
| `Expert` | `experts` | `id`, `name`, `role`, `bio`, `courses_validated_count` |
| `Institution` | `institutions` | `id`, `name`, `code`, `contact_email` |
| `Specialization` | `specializations` | `id`, `name`, `code`, `is_active` |
| `Subject` | `subjects` | `id`, `specialization_id`, `name`, `semester_tier` (District/State/National), `daily_mock_attempts_limit` |
| `RegistrationCycle` | `registration_cycles` | `id`, `name`, `is_active`, `start_date` |
| `StudentRegistration` | `student_registrations` | `id`, `user_id`, `institution_id`, `specialization_id`, `current_tier`, `access_status`, `access_state`, `payment_status`, `district_score`, `state_score`, `national_score`, `is_archived` |
| `ExamWindow` | `exam_windows` | `id`, `subject_id`, `level`, `start_date`, `end_date`, `slot_duration_minutes` |
| `ExamSlotBooking` | `exam_slot_bookings` | `id`, `user_id`, `subject_id`, `booking_reference`, `status`, `assessment_link`, `is_link_active` |
| `ExamResult` | `exam_results` | `id`, `booking_ref`, `student_id`, `score`, `pass_fail`, `topic_breakdown` |
| `PaymentRecord` | `payment_records` | `id`, `user_id`, `target_tier`, `total_amount`, `gateway_order_id`, `status` |
| `PaymentConfig` | `payment_configs` | `id`, `tier_name`, `base_amount`, `gst_rate`, `total_amount`, `required_score` |
| `Certificate` | `certificates` | `id`, `user_id`, `course_id`, `certificate_id` (e.g. `SF-AIML-2026-0042`), `certificate_status` |
| `MockTestAttempt` | `mock_test_attempts` | `id`, `user_id`, `topic`, `score`, `attempt_date` |
| `CourseProposal` | `course_proposals` | `id`, `course_name`, `status`, `learner_id`, `upvotes`, `ai_summary`, `risk_level` |
| `Announcement` | `announcements` | `id`, `title`, `target_institution_id`, `target_specialization_id`, `expires_at` |
| `LiveSession` | `live_sessions` | `id`, `title`, `zoom_join_url`, `session_datetime`, `status` |
| `SupportTicket` | `support_tickets` | `id`, `user_id`, `ticket_number`, `status`, `priority` |
| `SubAdminPrivilege` | `subadmin_privileges` | `user_id` + 10 boolean privilege flags |
| `QuestionBank` | `question_banks` (exam.py) | `id`, `subject_id`, `level`, `bank_type` (`mock`/`exam`), `is_active` |
| `ExamSession` | `exam_sessions` (exam.py) | `id`, `booking_ref`, `status`, `proctoring_data` |
| `ExamCredential` | `exam_credentials` (exam.py) | `id`, `booking_ref`, `status`, `link_sent_at` |

### 2.5 API Route Summary

Routers mounted in `main.py`:
- `exam_banks.router` — Question bank CRUD
- `exam_configs.router` — Per-subject exam config
- `exam_credentials.router` — Credential lifecycle (confirm/activate/revoke)
- `exam_reminders.router` — Pre-exam reminder management
- `exam_sessions.router` — Proctored session lifecycle
- `admin_analytics.router` — Admin analytics & leaderboards

Key inline endpoints in `main.py`:

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register or reactivate a learner account |
| `POST` | `/api/auth/login` | None | Password login with rate limiting (5 attempts / 15 min) |
| `POST` | `/api/auth/google` | None | Google OAuth ID token verification & upsert |
| `GET` | `/api/users/me` | Bearer | Current user profile |
| `PUT` | `/api/users/profile` | Bearer | Update profile / password |
| `GET` | `/api/courses` | None | Course list with category & search filters |
| `GET` | `/api/courses/{id}/quiz` | None | Course quiz questions |
| `POST` | `/api/assessment/generate` | Bearer | AI mock test generation (daily limit enforced) |
| `POST` | `/api/proposals/create` | None | Submit course proposal (triggers AI preprocessing) |
| `GET` | `/api/proposals/community` | None | Community proposal board (sorted by upvotes) |
| `POST` | `/api/proposals/{id}/vote` | None | Vote on a proposal |
| `GET` | `/api/reviewer/proposals` | Reviewer | Reviewer queue of proposals |
| `PUT` | `/api/reviewer/proposals/{id}/status` | Reviewer | Approve / reject proposal |
| `POST` | `/api/admin/cycles/start-new` | Admin | Archive current cycle, create new cycle |

Key route file endpoints:

| File | Key Endpoints |
|---|---|
| `routes/payments.py` | `POST /api/payments/create-order`, `POST /api/payments/verify`, `POST /api/payments/webhook` |
| `routes/certificates.py` | `GET /api/certificates`, `POST /api/certificates/generate`, `GET /api/certificates/verify/{id}` |
| `routes/students.py` | `GET /api/students`, `PUT /api/students/{id}/tier`, `POST /api/students/bulk-upload` |
| `routes/learning.py` | `GET /api/learning/subjects`, `POST /api/learning/progress`, `GET /api/learning/bookmarks` |
| `routes/communications.py` | `GET/POST /api/announcements`, `GET/POST /api/live-sessions`, `GET /api/notifications` |
| `routes/reports.py` | `GET /api/reports/enrollment`, `GET /api/reports/performance` |
| `routes/subadmins.py` | `GET/POST /api/subadmins`, `PUT /api/subadmins/{id}/privileges` |
| `routes/admin_analytics.py` | `GET /api/admin/analytics/overview`, `GET /api/admin/analytics/leaderboard` |

### 2.6 Tier Progression & Access State Machine

Students progress through three competitive exam tiers:

```
District → (score ≥ 50%, pay ₹1,770) → State → (score ≥ 60%, pay ₹2,360) → National
```

Access states managed by `services/access_rule_engine.py`:
- `active` — full access, exams allowed
- `grace` — grace period before deactivation (configurable window)
- `suspended` — access blocked, pending payment or admin action
- `locked` — max attempt count reached, requires admin unlock

Payment tiers (from `PaymentConfig` or `services/payment_service.py` defaults):

| Tier | Base Amount | GST (18%) | Total | Required Score |
|---|---|---|---|---|
| State | ₹1,500 | ₹270 | ₹1,770 | District ≥ 50% |
| National | ₹2,000 | ₹360 | ₹2,360 | State ≥ 60% |

### 2.7 Service Modules

| Service | File | Purpose |
|---|---|---|
| AI Quiz/Assessment | `ai_service.py` | OpenAI GPT-4 quiz generation, topic assessment, AI proposal preprocessing |
| Groq Inference | `groq_service.py` | Fast alternative inference for AI features via Groq API |
| Payment | `services/payment_service.py` | Razorpay order creation, HMAC-SHA256 verification, idempotent payment processing |
| Certificate | `services/certificate_service.py` | ID generation (`SF-{PREFIX}-{YEAR}-{NNNN}`), QR code embedding, badge issuance |
| Access Rules | `services/access_rule_engine.py` | State machine transitions, grace period enforcement |
| Access Scheduler | `services/access_scheduler.py` | Time-triggered deactivation background task |
| Exam Engine Client | `services/exam_engine_client.py` | HTTP client to external proctored exam engine |
| Mailer | `services/mailer.py` | SMTP email dispatch via Gmail |
| Email Templates | `services/email_templates.py` | HTML templates for all transactional emails |

### 2.8 Seed Accounts

| Email | Password | Role |
|---|---|---|
| admin@skillforge.com | admin123 | admin |
| reviewer@skillforge.com | reviewer123 | reviewer |
| expert@skillforge.com | expert123 | expert |
| learner@skillforge.com | learner123 | learner |

### 2.9 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | SQLite fallback |
| `JWT_SECRET_KEY` | HS256 signing secret | `super-secret-skillforge-jwt-key-2026` |
| `OPENAI_API_KEY` | OpenAI API key for AI features | — |
| `GROQ_API_KEY` | Groq API key (fast inference) | — |
| `RAZORPAY_KEY_ID` | Razorpay test/live key | `rzp_test_TDQGFCm2xKMtfk` |
| `RAZORPAY_KEY_SECRET` | Razorpay HMAC secret | — |
| `EXAM_ENGINE_WEBHOOK_SECRET` | HMAC secret for exam engine webhooks | — |
| `SMTP_HOST` | Email host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Sender email address | — |
| `SMTP_PASSWORD` | App password for SMTP | — |
| `SMTP_FROM_EMAIL` | From address in emails | — |
| `SKIP_CREDENTIAL_WINDOW_ENFORCEMENT` | Auto-confirm exam credentials instantly | `false` |
| `FRONTEND_URL` | Public frontend URL for QR codes & links | `http://localhost:3000` |
| `BACKEND_URL` | Public backend URL for asset references | `http://localhost:8000` |

---

## 3. Frontend Context (frontend/) — Port 3000

### 3.1 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 (Create React App, `react-scripts 5`) |
| Language | JavaScript (JSX) |
| Styling | Vanilla CSS + custom CSS variables (no Tailwind) |
| Icons | `lucide-react` |
| Charts | `recharts` |
| Auth Storage | `localStorage` (`sf_token`, `sf_user`) |
| API Communication | `fetch` + `process.env.REACT_APP_API_URL` |

### 3.2 Authentication Pattern

- Token stored in `localStorage` as `sf_token`; user object as `sf_user`
- On mount, `App.js` reads from `localStorage` to restore session
- `handleAuthSuccess(token, userData)` sets state + writes to `localStorage`
- `handleLogout()` clears `localStorage` and resets user state
- All API calls include `Authorization: Bearer <token>` header manually

### 3.3 Routing

The app uses `window.location.pathname`-based routing in `App.js` (no React Router):

| Path Pattern | Component | Auth Required |
|---|---|---|
| `/` | Landing page (Hero, Courses, Methodology, Testimonials) | No |
| `/verify/:certId` | `VerifyCertificate` | No |
| `/verify-student/:studentId` | `VerifyStudent` | No |
| `/mock-assessment/:bookingRef` | `MockAssessment` | No |
| `/exam/take/:credentialId` | `ExamPortal` | No (self-contained) |
| (logged in) | `Dashboard` (role-based panel switching) | Yes |

### 3.4 Dashboard Panel Architecture

`Dashboard.js` wraps `Sidebar.js` and switches between role-specific panels based on `activePage` state.

**Learner pages:** DashboardContent, MyLearning, TopicAssessment, Certifications, PaymentHistory, LearnerPerformance, SlotBooking, MockResults, LiveClasses, SupportCenter, Marketplace, Cart, Checkout, Bookmarks, ProposalsVoting, CommunityVoting, RegisteredSubjectsDashboard, AnnouncementBar, AIAssistant

**Admin pages:** AdminPanel, SubAdminConsole, AdminAnalyticsDashboard, ExamConfigPanel, QuestionBankManager, AnnouncementComposer, LiveClassConfig, LiveSessionMonitor, PaymentConfigManager, SystemAnalytics, TicketQueue, SubjectManager

**Reviewer pages:** ReviewCenter

**Expert pages:** ExpertPanel

**POC pages:** POCDashboard

### 3.5 Key Environment Variables

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend API base URL (e.g., `https://skillforge-backend-uy0u.onrender.com`) |

---

## 4. Mobile Context (mobile/) — Expo SDK 54

### 4.1 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Language | JavaScript (JSX) |
| Navigation | React Navigation 7 (Native Stack, Bottom Tabs, Drawer) |
| HTTP Client | Axios with auth interceptor |
| Token Storage | `expo-secure-store` (encrypted, device keychain) |
| Icons | `@expo/vector-icons`, `lucide-react-native` |
| Build | EAS Build (preview + production profiles in `eas.json`) |

### 4.2 Authentication Pattern

- Token stored via `authStorage.js` using `expo-secure-store`
- `api.js` axios interceptor attaches `Authorization: Bearer <token>` to all requests
- On 401 response, `authStorage.clearAll()` is called and `unauthorizedCallback` triggers navigation to `LoginScreen`
- `RootNavigator.js` guards routes based on auth state and user role

### 4.3 Navigation Architecture

```
RootNavigator
├── LoginScreen            (unauthenticated)
└── Role Navigator         (authenticated, selected by user.role)
    ├── LearnerNavigator   (Bottom Tabs: Dashboard, Subjects, MockResults, Certifications, Support)
    ├── AdminNavigator     (Drawer: Dashboard, Students, Institutions, Operations, SubAdmins)
    ├── ExpertNavigator    (Stack: Dashboard, CurriculumManager)
    ├── ReviewerNavigator  (Stack: Dashboard, ProposalEvaluation)
    └── POCNavigator       (Stack: POC result verification)
```

### 4.4 API Base URL Resolution

`src/config/env.js` resolves the API base URL at runtime:
1. If `expoConfig.extra.apiUrl` is set in `app.json`, use it
2. If production build (`!__DEV__`), use `https://skillforge-backend-uy0u.onrender.com`
3. If local dev with Expo Go, derive LAN IP from `expoConfig.hostUri` → `http://<LAN_IP>:8000`
4. Fallback to deployed backend URL

---

## 5. Exam Engine Stub (exam_engine_stub/)

A local FastAPI microservice that simulates the external proctored exam engine during development.

- `server.py` — Responds to slot/session requests and fires result webhooks back to the backend
- `trigger_result.py` — Manually sends a result webhook payload for testing the exam result pipeline
- The backend's `services/exam_engine_client.py` talks to this stub (or the real engine in production) via HTTP

---

## 6. Deployment (Render.com)

Configured via `render.yaml`:

| Service | Type | Root | Start Command |
|---|---|---|---|
| `skillforge-backend` | Web (Python) | `backend/` | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| `skillforge-frontend` | Static Site | `frontend/` | `npm install && npm run build` |
| `skillforge-db` | PostgreSQL | — | Managed by Render |

Environment variables injected by Render:
- `DATABASE_URL` → from `skillforge-db` database service
- `REACT_APP_API_URL` → from `skillforge-backend` service host

Deployed backend URL: `https://skillforge-backend-uy0u.onrender.com`

---

## 7. Development Commands

### Backend

```powershell
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Run locally (SQLite fallback if no DATABASE_URL)
uvicorn main:app --reload --port 8000

# Seed the database
python seed.py

# Run specific migration script
python migrate.py

# Access API docs
# http://localhost:8000/docs
```

### Frontend

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server (port 3000)
npm start

# Build for production
npm run build

# Serve production build locally
npm run start:prod
```

### Mobile

```powershell
# Navigate to mobile
cd mobile

# Install dependencies
npm install

# Start Expo dev server
npm start
# or: npx expo start

# Start on Android
npm run android

# Start on iOS (Mac only)
npm run ios

# Start on web
npm run web

# EAS Build (preview)
eas build --profile preview --platform android
```

### Exam Engine Stub

```powershell
# Run the stub server on its own port
cd exam_engine_stub
uvicorn server:app --reload --port 8005

# Manually trigger a result webhook
python trigger_result.py
```

---

## 8. Critical Patterns & Rules

### JWT Secret Consistency
The `JWT_SECRET_KEY` in `backend/.env` **must** match the value used in Render's environment variables and the `render.yaml` default. All token verification in `auth.py` uses this single shared secret.

### Password Hashing
Passwords are hashed with plain SHA-256 via `hashlib.sha256(password.encode()).hexdigest()`. There is **no bcrypt or salt** — this is intentional for the current implementation. Do not change the hashing method without a full migration.

### Rate Limiting
Login endpoint (`POST /api/auth/login`) uses an in-memory tracker: max 5 failed attempts per IP+email pair within 15 minutes. This resets on successful login. State is lost on server restart.

### File Uploads
All uploaded files (profile images, CSV bulk uploads, QR code images) are served from the `backend/uploads/` directory via FastAPI `StaticFiles` at `/uploads`. In production on Render (ephemeral filesystem), QR codes are regenerated on demand if missing.

### Certificate ID Format
`SF-{COURSE_PREFIX}-{YEAR}-{NNNN}` — e.g., `SF-AIML-2026-0042`. Uniqueness is enforced with a retry loop in `certificate_service.py`.

### Sub-admin Institution Scoping
If a `SubAdminInstitutionAccess` record exists for a sub-admin, they are scoped to only those institutions. If **no** access records exist, the sub-admin has unrestricted institution access (same as admin for institution queries). Use `get_subadmin_allowed_institution_ids()` from `auth.py` for all scoped queries.

### AI Mock Test Daily Limit
Per-subject daily attempt limits are set in `ExamConfig.per_day_ai_limit` or fall back to `Subject.daily_mock_attempts_limit` (default: 3). The check is performed against `MockTestAttempt` records for the current calendar day.

### Database Fallback
If `DATABASE_URL` is missing or PostgreSQL is unreachable, the backend silently falls back to a local SQLite file (`skillforge.db`). This is logged as a warning. Do not rely on SQLite for any multi-process or multi-worker deployment.
