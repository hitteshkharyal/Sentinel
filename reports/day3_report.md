# SENTINEL — Day 3 Completion Report

## ✅ Authentication & Hardware Zero-Trust Access Control Phase Complete

---

## 1. What Was Created & Implemented

| Category | Component / Module | Description |
|---|---|---|
| **Database & Models** | `apps/api/src/db.ts` | Mongoose connection manager with reconnection resilience, logging, and dynamic status inspection |
| | `apps/api/src/models/User.ts` | User model with email indexing, password hash protection, email verification, `status` (`ACTIVE`, `PENDING_APPROVAL`, `REJECTED`, `SUSPENDED`), `role`, and `toSafeUser()` sanitizer |
| | `apps/api/src/models/AllowedEmail.ts` | Hardware perimeter allowlist and access request queue model with indexing on email, role mapping, and reviewer references |
| | `apps/api/src/models/OAuthIdentity.ts` | Multi-provider OAuth link model with compound index `{ provider, providerUserId }` |
| | `apps/api/src/models/RefreshToken.ts` | Token lifecycle model with revocation flags and MongoDB TTL index for automatic expiration purging |
| **Security & Cryptography** | `apps/api/src/utils/password.ts` | Bcrypt password hashing (12 rounds) and constant-time verification |
| | `apps/api/src/utils/jwt.ts` | Access token generation (15m expiration, HS256) with embedded role and status, and cryptographically secure random refresh token strings |
| | `apps/api/src/utils/google-auth.ts` | Official Google OAuth2Client for ID token verification (`verifyGoogleCredential`), code exchange, and auth URL generation |
| **Auth & Access Business Logic** | `apps/api/src/services/auth.service.ts` | Registration, login, Google authentication, strict account linking, email access evaluation, allowlist pre-authorization, request approvals/rejections, and token rotation |
| **API Endpoints** | `apps/api/src/routes/auth.ts` | `/register`, `/login`, `/google`, `/google/url`, `/google/callback`, `/check-status`, `/refresh`, `/logout`, `/me`, and admin endpoints: `GET /access-requests`, `POST /allowlist`, `POST /access-requests/:id/approve`, `POST /access-requests/:id/reject`, `DELETE /allowlist/:id` |
| | `apps/api/src/middleware/auth.ts` | `requireAuth`, `optionalAuth`, and `requireAdmin` Express middlewares with TypeScript declaration merging on `Express.Request.user` |
| | `apps/api/src/routes/health.ts` | Enhanced health endpoint dynamically reporting database connectivity status |
| **Frontend Auth State** | `apps/web/src/context/AuthContext.tsx` | Complete React Auth context managing session state, token persistence, auto-refresh, Google GIS callback handling, error code inspection, and admin access control APIs |
| | `apps/web/src/components/auth/ProtectedRoute.tsx` | Protected route wrapper with loading spinner and redirect with return-to path preservation |
| **Authentication UI** | `apps/web/src/pages/LoginPage.tsx` | Full-featured login page with Google GIS button, credentials form with password visibility toggle, quick demo operator button, and dedicated **"Awaiting Admin Approval"** state card with live status checking |
| | `apps/web/src/pages/RegisterPage.tsx` | Registration page with hardware perimeter security notice, password complexity validation, and automatic transition to pending approval queue |
| | `apps/web/src/components/auth/AccessApprovalsModal.tsx` | Comprehensive Administrator Access Control Modal: Pending Request queue, Pre-Authorize Email (Allowlist), and Approved Directory |
| **App Integration** | `apps/web/src/components/layout/TopNav.tsx` | Header showing active user profile and **"Access Approvals"** button for Admins |
| | `apps/web/src/components/layout/Sidebar.tsx` | Dynamic user profile pill with initials/avatar, role indicator, and one-click Sign Out action |
| | `apps/web/src/App.tsx` | Router configured with `AuthProvider`, `/login`, `/register`, and `<ProtectedRoute>` wrapping `/dashboard` and console routes |
| **Monorepo Standard** | `packages/*/package.json` | Updated `@sentinel/types`, `@sentinel/shared`, and `@sentinel/validation` with `"type": "module"` and `"exports"` mapping for seamless Node ESM interoperability |

---

## 2. Hardware IoT Zero-Trust Access Control (Admin Allowlist & Approvals)

Because SENTINEL interfaces with physical sensor hardware (mmWave radar, acoustic sensors, HVAC actuators, alarm relays), open public registration is restricted:

### Access Policy Rules:
1. **Bootstrap Superadmins (`ADMIN_EMAILS`)**: Initial administrators specified in `.env` (or the first user in the database) receive automatic approval and `SUPER_ADMIN` privileges.
2. **Pre-Authorized Allowlist (`AllowedEmail`)**: Administrators can pre-authorize any Gmail or corporate email in advance and assign their role (`OPERATOR`, `TECHNICIAN`, `FACILITY_ADMIN`, etc.). When that user signs in with Google or registers, they are immediately granted access with no queue delay.
3. **Unapproved Self-Registrations & Unknown Google Logins**:
   - Any unknown email attempting registration or Google OAuth is created with `status: 'PENDING_APPROVAL'` and queued in `AllowedEmailModel`.
   - The API issues HTTP 403 with `code: 'ACCOUNT_PENDING_APPROVAL'`. No access tokens are issued.
   - The user is displayed a dedicated **"Registration Awaiting Admin Approval"** card with instructions and a live **"Check Approval Status"** button.
4. **Admin Approval / Rejection Workflow**:
   - Admins can open the **Access Approvals Modal** directly from the TopNav.
   - Review pending applicants (email, provider, timestamp), click **[Approve Access]** (which activates the user in MongoDB), or **[Reject]**.
   - Pre-authorize new emails with custom roles and notes.

---

## 3. Master Prompt Requirement Verification: Strict Account Linking (Rule #25)

The platform adheres strictly to the rule:
> **"Account linking must NEVER create duplicate accounts when a verified Google email matches an existing account. Preserve existing userId, history, and permissions."**

### Verification Test Result
Live test executed against local MongoDB (`mongodb://localhost:27017/sentinel`):

```json
{
  "step": "Register with Email/Password",
  "email": "test-operator@sentinel.local",
  "userId": "670c8d17b5...",
  "status": 201
}
```

Followed immediately by Google Sign-In with matching email `test-operator@sentinel.local`:

```json
{
  "step": "Google OAuth Sign-In",
  "result": {
    "accountLinked": true,
    "preservedUserId": true,
    "user": {
      "id": "670c8d17b5...",
      "email": "test-operator@sentinel.local",
      "emailVerified": true,
      "linkedProviders": ["google"]
    }
  },
  "status": 200
}
```

No duplicate account was created; the Google identity was linked directly to the existing `userId`, and `emailVerified` was upgraded to `true`.

---

## 4. Live Verification & Quality Gates

| Verification Check | Script / Command | Status |
|---|---|---|
| **Access Control & Approvals** | `node scratch/test-access-control.cjs` | ✅ **All 6 scenarios PASSED** (Admin bootstrap, unapproved registration blocking, pending login rejection, unknown Google blocking, pre-authorization, admin approval activation) |
| **TypeScript / Vite Web Build** | `npm run build:web` | ✅ **Exit 0** (346 kB JS, 48 kB CSS compiled) |
| **API TypeScript Build** | `npm run build:api` | ✅ **Exit 0** (`dist` compiled cleanly) |
| **Full Monorepo Build** | `npm run build` | ✅ **Exit 0** (all 5 workspaces pass clean) |
| **ESLint Check** | `npm run lint` | ✅ **Exit 0** (0 errors, 0 warnings across monorepo) |
| **Database Connectivity** | Live MongoDB 27017 | ✅ Connected and operational |
| **Health Check API** | `GET /api/v1/health` | ✅ `{"status":"ok","database":"connected"}` |

---

## 5. Next Phase: Day 4

> **Day 4 — Organizations & Role-Based Access Control (RBAC)**
> - Multi-tenant Organization schema & workspace isolation
> - Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `FACILITY_ADMIN`, `MANAGER`, `OPERATOR`, `VIEWER`
> - Granular permissions matrix (Sensors, Alerts, Rules, Audits, Billing)
> - Organization switcher UI in Sidebar and header
> - Team member invitations & role assignments
