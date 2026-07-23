# SkillForge LMS — AI Agent Prompt Library

This file contains ready-to-use prompts for AI agents working on the SkillForge codebase. Each prompt is self-contained and references the correct file paths, patterns, and conventions documented in `AGENTS.md`.

---

## Table of Contents

1. [Backend — Models & Database](#1-backend--models--database)
2. [Backend — Routes & Endpoints](#2-backend--routes--endpoints)
3. [Backend — Services & Business Logic](#3-backend--services--business-logic)
4. [Backend — Auth & Guards](#4-backend--auth--guards)
5. [Frontend — Dashboard Components](#5-frontend--dashboard-components)
6. [Frontend — Routing & Auth](#6-frontend--routing--auth)
7. [Mobile — Screens & Navigation](#7-mobile--screens--navigation)
8. [Migrations & Schema Changes](#8-migrations--schema-changes)
9. [Testing & Debugging](#9-testing--debugging)
10. [Full Feature Prompts](#10-full-feature-prompts)

---

## 1. Backend — Models & Database

### Add a new column to an existing model

```
Add a new column `<column_name>` of type `<type>` to the `<ModelName>` model in `backend/models/__init__.py`.
- Follow the existing SQLAlchemy column pattern in that file.
- Make the column nullable unless there is a clear default.
- Add a corresponding inline migration in `backend/migrate.py` using an `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statement (PostgreSQL-safe).
- Do NOT use Alembic — all migrations in this project are inline SQL in migrate.py.
```

### Add a new SQLAlchemy model

```
Create a new SQLAlchemy ORM model called `<ModelName>` in `backend/models/__init__.py`.
- Follow the pattern of existing models in that file: inherit from `Base`, define `__tablename__`, use `Column(Integer, primary_key=True, index=True)` for the PK.
- Add `created_at = Column(DateTime(timezone=True), server_default=func.now())` unless the model is a join table.
- Add the corresponding Pydantic schema(s) in `backend/schemas.py` (request + response shapes).
- Register the table in `main.py`'s `Base.metadata.create_all(bind=engine)` call — it is already called on import, so just defining the model is enough.
- Add an inline migration check in `backend/migrate.py` if the table might already exist in production with an older schema.
```

### Seed new data

```
Add seed data for `<entity>` to `backend/seed.py` inside the `seed_db()` function.
- Follow the import style at the top of the file (import the model from `models`).
- Add a `.delete()` cleanup call at the top of seed_db so re-runs are idempotent.
- Commit only after all related entities are added in the correct FK order.
- Do NOT change the existing user seed accounts (admin, reviewer, expert, learner) or their passwords.
```

---

## 2. Backend — Routes & Endpoints

### Add a new endpoint to an existing router

```
Add a new `<METHOD>` endpoint at `<path>` to `backend/routes/<router_file>.py`.
- Import and use the `get_db` dependency from `database.py` for the DB session.
- Apply the correct auth guard:
  - Admin-only: `current_user: models.User = Depends(verifyAdminRole)`
  - Learner or any authenticated user: `current_user: models.User = Depends(get_current_user)`
  - Reviewer: `current_user: models.User = Depends(verifyReviewerRole)`
  - Sub-admin or admin: `current_user: models.User = Depends(verifySubAdminOrAdmin)`
- Use Pydantic schemas from `backend/schemas.py` for request/response typing.
- Return a dict or Pydantic model — do NOT return raw SQLAlchemy objects without a `response_model`.
```

### Add a new inline endpoint to main.py

```
Add a new inline `<METHOD>` endpoint at `<path>` directly in `backend/main.py`.
- Place it in the appropriate section of the file (auth, courses, admin, etc.).
- Follow the existing comment-block structure (e.g., `# Course Proposal Create`).
- Use `Depends(get_db)` for DB session and `Depends(verifyAdminRole)` / `Depends(get_current_user)` for auth.
- If the endpoint needs a request body, define a Pydantic class either in `schemas.py` or inline as a nested class inheriting from `schemas.BaseModel`.
```

### Add a new modular router

```
Create a new FastAPI router module at `backend/routes/<name>.py`.
- Use `APIRouter(prefix="/api/<name>", tags=["<Name>"])` at the top.
- Import `get_db` from `database`, `models`, `schemas`, and auth guards from `auth`.
- At the bottom of `backend/main.py`, add:
  from routes import <name>
  app.include_router(<name>.router)
- Document all endpoints with a brief docstring.
```

---

## 3. Backend — Services & Business Logic

### Add a method to the payment service

```
Add a new function to `backend/services/payment_service.py`.
- Keep all Razorpay credentials sourced from `os.getenv("RAZORPAY_KEY_ID")` and `os.getenv("RAZORPAY_KEY_SECRET")`.
- Use the existing `get_tier_pricing(db)` function for pricing — do NOT hardcode amounts.
- Log important events using the `logger = logging.getLogger("payment_service")` at the top of the file.
- Return a dict result (not a model) so callers can serialize freely.
- For any tier unlock, call `process_successful_payment()` to ensure consistent access state transitions and audit logging.
```

### Add a new email template

```
Add a new HTML email template function to `backend/services/email_templates.py`.
- Follow the existing function signature pattern: `def get_<name>_email(recipient_name: str, ...) -> str`.
- Return a complete HTML string with inline styles (no external CSS).
- Use the SkillForge brand color `#667eea` (purple gradient) as the primary color.
- Add a corresponding send function in `backend/services/mailer.py` that calls `send_email(to, subject, html)`.
```

### Add a certificate badge tier

```
Modify `backend/services/certificate_service.py` to support a new badge tier `<TierName>`.
- Add the new branch in `issue_level_certificate_and_badge()` under the `if is_qualifying:` block.
- Assign an appropriate `cert_title` and `badge_tier` string for the new level.
- The `synthetic_course_id` pattern is `tier_{tier_normalized.lower()}_{'pass' if is_qualifying else 'part'}` — follow this exactly.
- Ensure no duplicate certificates are issued (the existing `db.query` check handles this).
```

---

## 4. Backend — Auth & Guards

### Add a new role guard

```
Add a new role guard function to `backend/auth.py` following the pattern of `verifyAdminRole` or `verifyExpertRole`.
- Name it `verify<RoleName>Role`.
- Decode the JWT, fetch the user from DB, and check `user.role in [<allowed_roles>]`.
- Raise `HTTP 401` for invalid/missing tokens and `HTTP 403` for wrong roles.
- Import and use the new guard in any route file that needs it.
```

### Add a sub-admin privilege check

```
Add a privilege-gated endpoint using `require_privilege("<privilege_key>")` from `backend/auth.py`.
- The privilege key must be one of the 10 boolean fields on `SubAdminPrivilege`:
  manage_institutions, manage_students, allocate_specializations, view_reports,
  reset_passwords, bulk_upload, manage_content, custom_reports, enrollment_reports, verify_assessments
- Usage: `current_user: models.User = Depends(require_privilege("manage_students"))`
- Admin users always bypass privilege checks (unrestricted access).
```

---

## 5. Frontend — Dashboard Components

### Create a new dashboard panel component

```
Create a new React dashboard panel component at `frontend/src/Components/Dashboard/<ComponentName>.js`.
- Use functional React with hooks (useState, useEffect).
- Fetch data from the backend using:
  const token = localStorage.getItem('sf_token');
  const res = await fetch(`${process.env.REACT_APP_API_URL}/api/<path>`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
- Style with a companion `<ComponentName>.css` file or inline with existing CSS variables from `index.css`.
- Do NOT use Tailwind or any CSS framework — vanilla CSS only.
- Export the component as default and import it into `Dashboard.js`.
- Register it in the `activePage` switch/render logic inside `Dashboard.js`.
- Add the corresponding link in `Sidebar.js` for the appropriate role(s).
```

### Add a new sidebar link

```
Add a new navigation link to `frontend/src/Components/Dashboard/Sidebar.js`.
- Find the role section (learner, admin, reviewer, expert, poc) and add a new link object or JSX item.
- Follow the existing icon + label pattern using `lucide-react` icons.
- The `onClick` should call `setActivePage('<pageName>')` to switch panels.
- If the link is role-restricted, wrap it inside the appropriate role conditional already in the file.
```

### Add a recharts chart to a dashboard component

```
Add a recharts chart to `<ComponentName>.js` in `frontend/src/Components/Dashboard/`.
- Import from `recharts`: `import { <ChartType>, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';`
- Wrap the chart in `<ResponsiveContainer width="100%" height={300}>` for responsive sizing.
- Use the SkillForge brand color `#667eea` or `#764ba2` for primary data series.
- Format data as an array of objects: `[{ name: 'Label', value: 123 }, ...]`.
```

---

## 6. Frontend — Routing & Auth

### Add a new public route

```
Add a new public (unauthenticated) route to `frontend/src/App.js`.
- The routing pattern uses `window.location.pathname` — no React Router is used.
- Add a new `if (pathname.startsWith('/<route>'))` block before the main `return` statement.
- Extract any URL parameters from the pathname string (e.g., `pathname.split('/<route>/')[1]`).
- Import and render the target component directly.
- This route will be accessible to both authenticated and unauthenticated users.
```

### Add Google OAuth support for a new flow

```
Modify the Google OAuth flow in `backend/main.py` at `POST /api/auth/google`.
- The endpoint verifies the Google ID token via `https://oauth2.googleapis.com/tokeninfo?id_token=<token>`.
- After verification, it upserts the user (create if not exist) and returns a JWT.
- Any new fields to populate on Google-created users should be added to the `User(...)` constructor block inside the `if not db_user:` branch.
- The frontend sends `{ id_token: googleIdToken }` in the request body.
```

---

## 7. Mobile — Screens & Navigation

### Create a new learner screen

```
Create a new React Native screen at `mobile/src/screens/Dashboard/<ScreenName>.js`.
- Use `StyleSheet.create({})` for all styles — no inline style objects except for dynamic values.
- Fetch data using the `api` instance from `mobile/src/services/api.js` (axios with auth interceptor).
- Handle loading state with a `<ActivityIndicator />` and error state with a visible message.
- Export the component as default.
- Register it in `mobile/src/navigation/LearnerNavigator.js` as a new stack screen or tab.
```

### Add a screen to the Admin navigator

```
Create a new admin screen at `mobile/src/screens/Admin/<ScreenName>.js` and register it.
- Import and add it to `mobile/src/navigation/AdminNavigator.js` as a new drawer or stack screen.
- Admin screens typically show a full data list with a header, search bar, and action buttons.
- Use the admin color palette: deep purple/indigo primary with white card surfaces.
- Data fetching: `api.get('/api/<endpoint>')` using the auth interceptor from `services/api.js`.
```

### Add a tab to the LearnerNavigator bottom bar

```
Add a new tab to `mobile/src/navigation/LearnerNavigator.js`.
- Import the screen component.
- Add a `<Tab.Screen name="<Name>" component={<ScreenName>} />` entry inside the `Tab.Navigator`.
- Set the `tabBarIcon` prop using `@expo/vector-icons` (Ionicons or Feather icon set).
- Keep tab count to 5 or fewer to avoid crowding the bottom bar on small screens.
```

---

## 8. Migrations & Schema Changes

### Add an inline migration for a new column

```
Add a migration for a new column `<column_name>` on table `<table_name>` to `backend/migrate.py`.
- Follow the existing pattern: wrap in a try/except, use `text(...)` from sqlalchemy.
- Use `ADD COLUMN IF NOT EXISTS` for PostgreSQL to make it idempotent.
- For SQLite, use a try/except around `ALTER TABLE ... ADD COLUMN` (SQLite does not support IF NOT EXISTS).
- Test the migration runs cleanly on a fresh SQLite DB by running `python migrate.py`.
```

### Add a new table via inline migration

```
Add a migration to create a new table `<table_name>` in `backend/migrate.py`.
- Use `CREATE TABLE IF NOT EXISTS <table_name> (...)` so it is idempotent.
- Match the column types to what SQLAlchemy will generate (INTEGER, TEXT, BOOLEAN, FLOAT, TIMESTAMP WITH TIME ZONE).
- Also ensure the SQLAlchemy model in `models/__init__.py` is defined first so `Base.metadata.create_all()` can handle it on fresh installs.
- The migrate() function in `migrate.py` is called on every server startup.
```

---

## 9. Testing & Debugging

### Write a backend integration test

```
Create a test script at `backend/test_<feature>.py` that hits the live local API.
- Use `import requests` and target `http://localhost:8000`.
- Log in first using `POST /api/auth/login` with `{"email": "admin@skillforge.com", "password": "admin123"}` to get a token.
- Use `headers = {"Authorization": f"Bearer {token}"}` for protected endpoints.
- Print each response status and JSON for manual inspection.
- Do NOT use pytest fixtures — these are standalone scripts, not pytest test cases.
```

### Debug a 500 error on a backend endpoint

```
Debug the 500 error on `<METHOD> /api/<path>`.
- First check `backend/main.py` and the relevant route file (`backend/routes/<router>.py`) for the handler.
- Add a try/except around the DB operations and print the full exception traceback.
- Check if the error is a missing column (use `backend/migrate.py` to add it).
- Check if a related model's nullable constraint is being violated.
- Verify the request schema matches the Pydantic model in `backend/schemas.py`.
- Run `python backend/debug_500.py` if it exists, or create a minimal reproduction script.
```

### Check API readiness for mobile

```
Run `python backend/check_mobile_api_readiness.py` to verify all mobile-required endpoints are accessible.
- If missing endpoints are reported, implement them following the route patterns in `backend/routes/`.
- Cross-reference with `backend/openapi.json` for the full OpenAPI spec.
```

---

## 10. Full Feature Prompts

### Add a new exam tier (e.g., "Regional")

```
Add a new exam tier called "Regional" between District and State in the SkillForge tier progression.

Backend changes:
1. Add "Regional" as a valid `semester_tier` in `Subject` and `current_tier` in `StudentRegistration` in `backend/models/__init__.py`.
2. Add a new `PaymentConfig` seed entry for "Regional" in `backend/seed.py`.
3. Update `backend/services/payment_service.py` TIER_PRICING dict and `process_successful_payment()` to handle "Regional".
4. Update `backend/services/access_rule_engine.py` to include "Regional" in tier transition logic.
5. Update `backend/services/certificate_service.py` `issue_level_certificate_and_badge()` to issue a correct cert title and badge for "Regional".
6. Add an inline migration in `backend/migrate.py` if needed.

Frontend changes:
7. Update `frontend/src/Components/Dashboard/LearnerPerformance.js` to display the new Regional tier step in the progression UI.
8. Update any payment flow components that show tier names.

Mobile changes:
9. Update `mobile/src/screens/Dashboard/SubjectsScreen.js` tier display logic.
10. Update `mobile/src/screens/Dashboard/PaymentCheckoutScreen.js` to include the new tier option.
```

### Add a new sub-admin privilege

```
Add a new sub-admin privilege called "<privilege_name>" to the SkillForge RBAC system.

1. Add the boolean column `<privilege_name> = Column(Boolean, default=False)` to the `SubAdminPrivilege` model in `backend/models/__init__.py`.
2. Add a corresponding inline migration in `backend/migrate.py`:
   ALTER TABLE subadmin_privileges ADD COLUMN IF NOT EXISTS <privilege_name> BOOLEAN DEFAULT FALSE
3. Add the field to the relevant Pydantic schemas in `backend/schemas.py` (SubAdminPrivilegeCreate / SubAdminPrivilegeUpdate).
4. Gate the relevant endpoint(s) with `Depends(require_privilege("<privilege_name>"))` in the route file.
5. Expose the toggle in `frontend/src/Components/Dashboard/SubAdminConsole.js` privilege management UI.
6. Update `mobile/src/screens/Admin/SubAdminsScreen.js` if sub-admin management is shown there.
```

### Add a bulk notification system

```
Build a bulk notification feature so admins can push a notification to all learners of a given specialization.

Backend:
1. Add a `POST /api/admin/notifications/bulk` endpoint in `backend/main.py` or a new `routes/notifications.py`.
   - Request body: `{ "specialization_id": int, "title": str, "message": str }`.
   - Guard with `Depends(verifyAdminRole)`.
   - Query all active `StudentRegistration` records filtered by `specialization_id`, then bulk-insert `Notification` rows.
2. Optionally trigger emails via `services/mailer.py` as a background task using FastAPI's `BackgroundTasks`.

Frontend:
3. Add a "Bulk Notify" button in `frontend/src/Components/Dashboard/AnnouncementComposer.js` or `AdminPanel.js`.
4. Add a form with specialization selector and message textarea.
5. Show a success toast on completion.

Mobile:
6. Learners already see notifications via `GET /api/notifications` — no mobile change needed unless a push notification provider is added.
```

### Add a learner leaderboard page

```
Build a learner-facing leaderboard page showing top students by XP points and exam scores.

Backend:
1. Add `GET /api/leaderboard` in `backend/main.py` or `backend/routes/analytics.py`.
   - Query top N `StudentRegistration` records joined with `User`, ordered by district/state/national score.
   - Accept a `tier` query param (District/State/National) to filter.
   - No auth required (public leaderboard) or use `Depends(get_current_user)` if private.

Frontend:
2. Create `frontend/src/Components/Dashboard/LeaderboardView.js` (a file already exists as a stub — fill it in).
3. Display a ranked table with rank badge, student name, institution, specialization, and score.
4. Add a link in `Sidebar.js` under the learner section.

Mobile:
5. Create `mobile/src/screens/Dashboard/LeaderboardScreen.js`.
6. Add it as a tab in `mobile/src/navigation/LearnerNavigator.js`.
```

### Implement password reset via email OTP

```
Implement a "Forgot Password" flow with email OTP verification.

Backend:
1. Add a `PasswordResetToken` model in `backend/models/__init__.py`:
   - Fields: id, user_id, token (hashed), expires_at, is_used.
2. Add inline migration in `backend/migrate.py`.
3. Add `POST /api/auth/forgot-password`:
   - Accept { email } body, generate a 6-digit OTP, hash it and store as PasswordResetToken.
   - Send the OTP via `services/mailer.py` using a new template in `services/email_templates.py`.
4. Add `POST /api/auth/reset-password`:
   - Accept { email, otp, new_password }.
   - Verify OTP against stored hash, check expiry, mark token as used.
   - Update user's `hashed_password` using `hashlib.sha256(new_password.encode()).hexdigest()`.

Frontend:
5. Add a "Forgot Password?" link in `frontend/src/Components/AuthModal.js`.
6. Show an OTP input step after the email is submitted.
7. On success, switch back to the login view.

Mobile:
8. Add the same flow in `mobile/src/screens/Auth/LoginScreen.js` with a "Forgot Password" modal.
```

### Add course progress persistence

```
Implement course module completion tracking per user using the `UserCourseProgress` model.

Backend:
1. The model already exists in `backend/models/__init__.py` with `completed_items` (JSON array) and `quiz_answers` (JSON dict).
2. Add `POST /api/learning/progress` in `backend/routes/learning.py` (or verify it exists):
   - Body: { course_id, completed_item_key }.
   - Upsert a `UserCourseProgress` row for the user+course, append the key to `completed_items`.
3. Add `GET /api/learning/progress/{course_id}` to return the user's progress percentage and completed items.

Frontend:
4. In `frontend/src/Components/Dashboard/MyLearning.js`, call the progress endpoint on each module/lesson completion.
5. Show a progress bar per course using the percentage returned.
6. Auto-unlock certificate generation button when progress hits 100% and quiz is passed.

Mobile:
7. Reflect course progress in `mobile/src/screens/Dashboard/DashboardScreen.js` subject progress bars.
```

---

## Quick Reference

### API base URL pattern (Frontend)
```js
const API = process.env.REACT_APP_API_URL;
const token = localStorage.getItem('sf_token');
const res = await fetch(`${API}/api/<path>`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

### API base URL pattern (Mobile)
```js
import api from '../services/api'; // axios instance with auth interceptor
const response = await api.get('/api/<path>');
const response = await api.post('/api/<path>', payload);
```

### FastAPI endpoint template
```python
@router.get("/api/<path>", response_model=schemas.<ResponseSchema>)
def endpoint_name(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = db.query(models.<Model>).filter(
        models.<Model>.user_id == current_user.id
    ).all()
    return result
```

### Inline migration template
```python
def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE <table> ADD COLUMN IF NOT EXISTS <col> <TYPE> DEFAULT <val>"))
            conn.commit()
        except Exception as e:
            print(f"Migration skipped: {e}")
```
