# InterviewFlow — Recovery Audit (2026-05-23)

## 1. Executive Summary
The build is **healthy** (0 TS errors, `npm run build` succeeds). All **14 routes** render, all **services** have mock+supabase branches, all **6 AI functions** exist (+ agent), the **RLS schema** is in place, **i18n EN/HE** is wired, and **file upload** is implemented. However, three Phase 11 deliverables are missing or regressed: (1) **profile editing is hard-disabled** in [SettingsPage.tsx:40-41](../src/pages/SettingsPage.tsx#L40-L41) and [:383-384](../src/pages/SettingsPage.tsx#L383-L384), so a real signed-in user cannot ever set their name, (2) **every consumer falls back to `mockUser` ("Demo User"/"Demo")** so a new user sees *"Good morning, Demo."* and *"Demo User"* across Dashboard/Settings/PrepPack until profile is editable, and (3) the **migration tree is now two-headed**: legacy `0001..0007` (RLS-correct, multi-file) and a parallel `20260521_initial_schema*.sql` rebuild — risk of drift. The reported "sign-in is broken" symptom most likely comes from **Supabase dashboard URL config**, not from the client code, which looks correct.

## 2. Git State
- Current branch: `recovery-multiuser-rebuild`; same SHA `ea12277` as `main`, **0 ahead / 0 behind** `origin/main`.
- Uncommitted changes:
  - modified: `.claude/settings.local.json`, `.gitignore`, `dist/index.html`, `package-lock.json`, `package.json`
  - **untracked: `recovery-codes.txt`** — present in repo root; flag below.
- Last commits (14 total):
  ```
  ea12277 fix: redirect to / after successful login + idempotent migration
  b3792d1 feat: multi-user auth — email+password login, per-user data isolation, Supabase schema
  efbc2aa feat: data safety - export/import backup, hardened demo/real separation, generic demo user
  89572da restore: real application data — Amazon, Salesforce, MyHeritage, Upwind
  4806b27 fix: only clear demo cache on seed version change, never real data
  675ab76 fix: clear both real+demo localStorage on seed version change
  8ea5519 fix: clear stale demo localStorage when seed version changes
  5b0d9a7 Replace demo data — Nvidia, Google, Microsoft, Wix, Dell, Mobileye
  1302b07 chore: trigger Vercel rebuild
  aa30fbb fix: remove deprecated nodejs runtime field from vercel.json
  d8f6e7e InterviewFlow — BYOK, demo mode, and data-mode toggle
  481de02 InterviewFlow — full Phase 1 through polish pass
  3d13c7e add gitignore and stop tracking node_modules
  3e3fa3c initial safe state
  ```
- Suspicious commits:
  - `b3792d1` "multi-user auth" added the **second migration file pair** (`20260521_initial_schema.sql` + `_idempotent.sql`) alongside the existing `0001..0007` set — large overlap, no commit body explains coexistence.
  - `efbc2aa` "generic demo user" replaced what looks like real persona data in `src/data/mock-user.ts` with `Demo User` (now [mock-user.ts:7-9](../src/data/mock-user.ts#L7-L9)). This is the source of the "Demo User" greeting.
  - 3 sequential `fix:` commits (`8ea5519`, `675ab76`, `4806b27`) on demo cache invalidation suggest churn / unstable demo seeding.
  - `dist/index.html` is **modified but tracked** — `dist/` should be gitignored; it is in `.gitignore:2` but already tracked.

## 3. Build Health
- `npx tsc --noEmit` → **0 errors**.
- `npm run build` → **succeeds** in 7.97 s.
- Bundle: main `index-Z8Cqm9oI.js` **614 kB** / 163 kB gzipped — large enough to flag for code-split review later, not a defect today. Vendor chunks split correctly (`vendor-react` 165 kB, `vendor-ui` 125 kB, `vendor-forms` 96 kB, `vendor-query` 42 kB).
- CalendarPage (13.7 kB) and AIPage (33.2 kB) are correctly lazy-loaded ([App.tsx:29-30](../src/App.tsx#L29-L30)).

## 4. Route Inventory

| # | Route | File | Lines | Last mod | Renders |
|---|---|---|---|---|---|
| 1 | `/` | [DashboardPage.tsx](../src/pages/DashboardPage.tsx) | 192 | 2026-05-10 | Greeting + KPIs + recents |
| 2 | `/applications` | [ApplicationsPage.tsx](../src/pages/ApplicationsPage.tsx) | 335 | 2026-05-10 | Filterable applications list |
| 3 | `/applications/board` | [ApplicationBoardPage.tsx](../src/pages/ApplicationBoardPage.tsx) | 260 | 2026-05-10 | Kanban board |
| 4 | `/applications/new` | [NewApplicationPage.tsx](../src/pages/NewApplicationPage.tsx) | 66 | 2026-05-06 | Wraps ApplicationForm — small but real, not a stub |
| 5 | `/applications/:id` | [ApplicationDetailPage.tsx](../src/pages/ApplicationDetailPage.tsx) | 1231 | 2026-05-10 | Full detail w/ stages/tasks/notes |
| 6 | `/companies` | [CompaniesPage.tsx](../src/pages/CompaniesPage.tsx) | 121 | 2026-05-10 | Companies grid |
| 7 | `/companies/:id` | [CompanyDetailPage.tsx](../src/pages/CompanyDetailPage.tsx) | 239 | 2026-05-10 | Company detail w/ apps |
| 7b | `/companies/new` | [NewCompanyPage.tsx](../src/pages/NewCompanyPage.tsx) | 59 | 2026-05-10 | Real wrapper |
| 8 | `/tasks` | [TasksPage.tsx](../src/pages/TasksPage.tsx) | 400 | 2026-05-10 | Tasks list w/ filters |
| 9 | `/calendar` | [CalendarPage.tsx](../src/pages/CalendarPage.tsx) | 402 | 2026-05-10 | Calendar (lazy) |
| 10 | `/contacts` | [ContactsPage.tsx](../src/pages/ContactsPage.tsx) | 357 | 2026-05-10 | Contacts CRUD |
| 11 | `/documents` | [DocumentsPage.tsx](../src/pages/DocumentsPage.tsx) | 365 | 2026-05-10 | Docs + CV |
| 12 | `/prep` | [PrepPage.tsx](../src/pages/PrepPage.tsx) | 314 | 2026-05-09 | Prep library |
| 13 | `/ai` | [AIPage.tsx](../src/pages/AIPage.tsx) | 303 | 2026-05-10 | AI tools (lazy) |
| 14 | `/settings` | [SettingsPage.tsx](../src/pages/SettingsPage.tsx) | 537 | 2026-05-21 | Profile (read-only) + BYOK + backup |
| 15 | `/login` | [LoginPage.tsx](../src/pages/LoginPage.tsx) | 199 | 2026-05-21 | Email+password sign-in/sign-up |
| 15b | `/themes-preview` | [ThemesPreviewPage.tsx](../src/pages/ThemesPreviewPage.tsx) | 312 | 2026-05-10 | Dev preview |

**All 13 expected routes exist and are non-trivial.** Bonus `/themes-preview` is wired in [App.tsx:139](../src/App.tsx#L139).

## 5. Supabase Status

### Migrations (9 files)
| File | Purpose |
|---|---|
| `0001_init.sql` | Extensions, enums (`application_stage`, `priority_level`, `task_status`, `task_category`, `work_model`), all tables, indexes |
| `0002_rls.sql` | RLS enable + 4 policies per table — all use `auth.uid() = user_id` (profiles uses `auth.uid() = id`) |
| `0003_storage.sql` | Buckets `cv-files` (private, 5 MB, PDF), `documents` (private, 10 MB, PDF/DOC/PNG/JPG) + path-prefix RLS |
| `0004_add_storage_path.sql` | Adds `storage_path` columns |
| `0005_add_ai_role_summary.sql` | Adds `ai_role_summary` column to job_applications |
| `0006_activity_triggers.sql` | AFTER triggers that populate `recent_activity` — SECURITY INVOKER, not DEFINER ([0006:6-10](../supabase/migrations/0006_activity_triggers.sql#L6-L10)) |
| `0007_company_logo_url.sql` | Adds `logo_url` column to companies |
| `20260521_initial_schema.sql` | **Parallel rebuild** of full schema + RLS (single-file) |
| `20260521_initial_schema_idempotent.sql` | Drop-and-recreate-policies idempotent variant of above |

**RLS posture:** Verified policies in `0002_rls.sql` for every table use `auth.uid() = user_id` (profiles uses `auth.uid() = id`). No service-role escape hatches found. ✅

**`grep -rn "ANTHROPIC_API_KEY" src` shows zero hits** — the key is server-only ([api/ai/_lib/claude.ts:18](../api/ai/_lib/claude.ts#L18)).

### D2 — Auth Flow Diagnostic
**Auth flow status: PARTIAL (client code OK; almost certainly a dashboard-config or email-confirmation issue).**

- **D2.1 Client config** — [src/lib/supabase.ts:29-34](../src/lib/supabase.ts#L29-L34):
  ```ts
  _client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  ```
  `detectSessionInUrl` is **not explicitly set**. The supabase-js v2 default is `true`, so URL hash detection still works — *but* if a future signup-with-email-confirm flow is used, the explicit value would make this unambiguous. Not currently broken; flag as low-risk.
- **D2.2 Env vars** — `.env.local` present:
  - `VITE_SUPABASE_URL=https://rongqrwahaubbvhajvda.supabase.co` ✓ (valid Supabase URL shape)
  - `VITE_SUPABASE_ANON_KEY=sb_publishable_42yp02VqMd2g0fTKYVeBzA_N3KUIru2` — this is the **new "publishable key" format**, not a JWT. Supabase JS `^2.105.3` supports it. ✓
  - `SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...` — **server-only by name** (no `VITE_` prefix). Vite will NOT bundle it. ✓ But its presence in a file alongside the publishable key warrants ongoing care.
- **D2.3 Sign-in component** — [LoginPage.tsx](../src/pages/LoginPage.tsx) uses **email+password** (`signInWithPassword`), not magic link. Errors are surfaced ([:71-72](../src/pages/LoginPage.tsx#L71-L72)), loading state is shown ([:161](../src/pages/LoginPage.tsx#L161)). ✅ Component is correct.
- **D2.4 Callback** — Not needed for password flow. For the **signup** path, [useUser.ts:64-65](../src/hooks/useUser.ts#L64-L65) returns `needsConfirmation` when Supabase requires email confirmation; LoginPage tells the user to check email ([LoginPage.tsx:64](../src/pages/LoginPage.tsx#L64)) but does **not** pass `options.emailRedirectTo` to `signUp` ([useUser.ts:61](../src/hooks/useUser.ts#L61)) — the confirmation email will redirect to the project's **Supabase Site URL**, which may not be `http://localhost:5173`.

- **D2.5 Dashboard checklist** (user must do manually):
  ```
  [ ] Supabase → Authentication → URL Configuration → Site URL contains
      http://localhost:5173  AND  https://interview-crm.vercel.app
  [ ] Supabase → Authentication → URL Configuration → Redirect URLs include
      http://localhost:5173/**  AND  https://interview-crm.vercel.app/**
  [ ] Supabase → Authentication → Providers → Email provider is ENABLED
  [ ] Supabase → Authentication → Providers → Email → "Confirm email" setting:
      if ON, no immediate session; if OFF, signIn works right after signUp
  [ ] Supabase → Authentication → Email Templates → Confirm signup template enabled
  [ ] Supabase → Project Settings → API → URL matches VITE_SUPABASE_URL
  [ ] Supabase → Project Settings → API → "publishable" key matches VITE_SUPABASE_ANON_KEY
  [ ] Vercel → Settings → Environment Variables → VITE_SUPABASE_URL and
      VITE_SUPABASE_ANON_KEY set for Production AND Preview AND Development
  ```

- **D2.6 Reproduce-and-capture in the browser:**
  1. DevTools → Network → click Sign in.
  2. Look for `POST https://rongqrwahaubbvhajvda.supabase.co/auth/v1/token?grant_type=password`. Capture status code + response body.
  3. If `400 Email logins are disabled` → enable Email provider in dashboard.
  4. If `400 Invalid login credentials` → account doesn't exist; try Sign up tab.
  5. If `400 Email not confirmed` → confirmation email is gated; either confirm via email link or turn "Confirm email" OFF in the dashboard.
  6. If sign-up returns `200` but no session → "Confirm email" is ON. Look in inbox/spam for confirmation link; click it; if it lands on production Vercel URL instead of localhost, fix Site URL.

- **D2.7 Most likely root causes (ranked):**
  1. **"Confirm email" is enabled on the Supabase project** → signup succeeds but user must click an email; the link redirects to Site URL which may be set to the Vercel deploy, leaving the local dev session unauthenticated. Fix: in Supabase dashboard, either disable "Confirm email" or add `http://localhost:5173` to Site URL / Redirect URLs.
  2. **Email provider disabled** → `POST /auth/v1/token` returns 400. Fix: enable Email in Auth → Providers.
  3. **Local `.env.local` not loaded by the running dev server** (Vite cached env from before file existed) → `isSupabaseMode()` returns `false`, AuthGuard short-circuits ([AuthGuard.tsx:14](../src/components/layout/AuthGuard.tsx#L14)) and the user lands on the app in mock mode, never seeing a real login attempt. Fix: stop and restart `npm run dev`.

## 6. Services Layer Integrity
All 12 services have both mock+supabase branches (services list: `agentService, aiClientService, aiService, applicationsService, calendarService, companiesService, contactsService, dashboardService, documentsService, interviewStageService, prepService, profilesService, tasksService`). No "Not implemented" stubs (`grep "Not implemented" src/services` → 0 hits).

**Services-layer violations (pages/components importing `@/data/*`):**
| File | Line | Import |
|---|---|---|
| [DashboardPage.tsx:25](../src/pages/DashboardPage.tsx#L25) | 25 | `mockUser` — used as greeting fallback |
| [SettingsPage.tsx:5-6,17-18](../src/pages/SettingsPage.tsx#L5-L18) | 5-18 | `mock-store` + `mockUser` for backup/import + fallback fields |
| [PrepPackPanel.tsx:20](../src/components/ai/PrepPackPanel.tsx#L20) | 20 | `mockUser` — `defaultPitch` fallback |
| [Topbar.tsx:8](../src/components/layout/Topbar.tsx#L8) | 8 | `getDataMode`/`setDataMode` for demo toggle |

These imports are **intentional fallbacks**, not stale violations — but they are why a real signed-in user sees demo persona content.

Service files also import from `src/data/*` (`mockStore`, `mockUser`, `mockAISummaries`), which is correct (services are the boundary).

## 7. AI Integration Status
Functions present in `api/ai/`:
- `jd-parser.ts`, `prep-pack.ts`, `follow-up.ts` (the three spec'd tools) ✅
- Bonus: `company-fill.ts`, `cv-parse.ts`, `jd-summarize.ts`, `agent.ts`
- Shared `_lib/`: `claude.ts`, `schemas.ts`, `agent-schemas.ts`, `rate-limit.ts`

Each function (verified `jd-parser.ts:1-40`, `prep-pack.ts:1-40`, `follow-up.ts:1-40`):
- ✅ Imports `callClaude` + `getUserApiKey` (BYOK)
- ✅ Imports `checkRateLimit` + `getIP`
- ✅ Imports zod schemas (`*RequestSchema`, `*ResponseSchema`) — request validated, response validated and parsed
- ✅ No `console.log` of keys (`grep -rn "console.log" api` → 0 hits)
- ✅ `ANTHROPIC_API_KEY` referenced only in [api/ai/_lib/claude.ts:18-19](../api/ai/_lib/claude.ts#L18-L19), never in `src/`

[aiService.ts:35](../src/services/aiService.ts#L35) wraps live calls with mock fallback (`AIGeneratorResult<T> { fromFallback: boolean }`). [aiClientService.ts:226-231](../src/services/aiClientService.ts#L226-L231) routes through demo responses when no API key is stored AND not in DEV.

**Live AI is currently OFF** locally: `.env.local` has `VITE_AI_ENABLED=false`.

## 8. File Upload Status
- [FileDropzone.tsx](../src/components/ui/FileDropzone.tsx) component exists ✅
- [storage.ts:37-51](../src/lib/storage.ts#L37-L51) helpers `uploadToBucket`, `createSignedUrl`, `deleteFromBucket` exist
- [CVUploadDialog.tsx:47](../src/components/documents/CVUploadDialog.tsx#L47) uploads to `cv-files`
- [DocumentUploadDialog.tsx](../src/components/documents/DocumentUploadDialog.tsx) uses the same pattern
- [CVViewerButton.tsx:31](../src/components/documents/CVViewerButton.tsx#L31) uses signed URLs (5 min TTL) ✅
- Storage RLS in `0003_storage.sql` uses `bucket_id = 'cv-files'` + path-prefix matching ([0003:48-52](../supabase/migrations/0003_storage.sql#L48-L52)) ✅

## 9. Profile / Identity Status

**`mockUser` usage matrix (3 fallback, 1 demo-toggle, 1 type-import):**
| File:Line | Usage | Type |
|---|---|---|
| [DashboardPage.tsx:43](../src/pages/DashboardPage.tsx#L43) | `profile?.preferredName ?? mockUser.preferredName ?? 'there'` | fallback |
| [PrepPackPanel.tsx:96](../src/components/ai/PrepPackPanel.tsx#L96) | `profile?.defaultPitch ?? mockUser.defaultPitch` | fallback |
| [SettingsPage.tsx:356-364, 400, 405-406](../src/pages/SettingsPage.tsx#L356-L406) | `isDemo ? mockUser.x : (profile?.x ?? mockUser.x)` | demo-or-fallback (11 fields) |
| [profilesService.ts:19, 25](../src/services/profilesService.ts#L19) | `return mockUser` from mock impl | direct (mock mode only) |

**Real persona check** — [src/data/mock-user.ts:7-9](../src/data/mock-user.ts#L7-L9):
```ts
name: 'Demo User',
preferredName: 'Demo',
email: 'demo@example.com',
```
✅ No "Amir Haddad" or "Shay Silversmith" in `mock-user.ts`. But **persona leftovers elsewhere**:
- [ai-demo-responses.ts:129, 131, 158](../src/data/ai-demo-responses.ts#L129) — `"Best,\nAmir"` in two follow-up samples and `'Amir — Demo CV'` in suggested name.
- [ThemesPreviewPage.tsx:117, 160, 207, 271](../src/pages/ThemesPreviewPage.tsx#L117) — 4× `"Good morning, Amir"` in theme preview cards.

**`useProfile()` hook** — present ([useProfile.ts:25](../src/hooks/useProfile.ts#L25)) ✅. Wraps `profilesService.getProfile()` via `useMockStore`.

**`profilesService`** — full CRUD: `getProfile`, `ensureProfile`, `updateProfile` ([profilesService.ts:29-92](../src/services/profilesService.ts#L29-L92)) ✅. `ensureProfile` is called from `useUser.ts:43` on `SIGNED_IN`.

**SettingsPage profile editing** — **DISABLED**:
- [SettingsPage.tsx:40-41](../src/pages/SettingsPage.tsx#L40-L41): `<Button variant="outline" size="sm" disabled>` (top-of-page header)
- [SettingsPage.tsx:383-384](../src/pages/SettingsPage.tsx#L383-L384): `<Button variant="outline" size="sm" disabled> ... {t('pages.settings.editProfile')}` (profile card)
- No `EditProfileDrawer` / `ProfileForm` component found anywhere; `updateProfile` in `profilesService` is implemented but **has no UI**.
- Consequence: real users see fields read-only forever, falling back to `mockUser` ("Tel Aviv University", "Demo User", etc.) per [SettingsPage.tsx:356-364](../src/pages/SettingsPage.tsx#L356-L364).

**Dashboard greeting** — [DashboardPage.tsx:43, 55](../src/pages/DashboardPage.tsx#L43): displays `profile?.preferredName ?? mockUser.preferredName ?? 'there'` → renders **"Good morning, Demo."** for a real signed-in user until they have a `preferredName` in `profiles`.

**Sidebar bottom user info** — Sidebar.tsx has only a `{/* Bottom: Settings + user chip */}` placeholder at [Sidebar.tsx:124](../src/components/layout/Sidebar.tsx#L124) but no `user.email`/`profile.name` reference found in the file. The "user chip" appears to be unrendered or static.

## 10. Demo Mode Status
- Toggle key: `interviewflow.dataMode` ([mock-store.ts:53](../src/data/mock-store.ts#L53)).
- `getDataMode()`/`setDataMode()` in [mock-store.ts:65-79](../src/data/mock-store.ts#L65-L79); `setDataMode` triggers `window.location.reload()`.
- Banner: [DemoModeBanner.tsx](../src/components/layout/DemoModeBanner.tsx), mounted in [AppShell.tsx:46](../src/components/layout/AppShell.tsx#L46); only shows when `isDemoMode()` returns true (i.e. no stored API key, not DEV — see [aiClientService.ts:226-231](../src/services/aiClientService.ts#L226-L231)).
- Topbar pill to exit demo: [Topbar.tsx:63-72](../src/components/layout/Topbar.tsx#L63-L72) — only renders when `getDataMode() === 'demo'`.
- Reset-to-demo button: [SettingsPage.tsx:345](../src/pages/SettingsPage.tsx#L345) `toast.info('Reset to demo data')`.
- **No admin-only gate** — anyone visiting `/settings` can toggle demo mode. There is no comparison of `user.email` to a hardcoded admin email. This is a deliberate "personal CRM, single user" design today; flag for review if multi-user.
- Separation: real and demo localStorage live under distinct prefixes (`interviewflow_mock_v1_` vs `interviewflow_demo_v1_`, [mock-store.ts:51-52](../src/data/mock-store.ts#L51-L52)); demo cache is invalidated on `SEED_VERSION` bump without touching real data ([mock-store.ts:90-100](../src/data/mock-store.ts#L90-L100)). ✅

## 11. Bilingual / i18n Status
| Item | Status | Evidence |
|---|---|---|
| `src/i18n/I18nProvider.tsx` | ✅ | exists, 40+ lines with `<html dir>` sync |
| `src/i18n/translations/en.ts` | ✅ | present |
| `src/i18n/translations/he.ts` | ✅ | present |
| `useI18n` hook | ✅ | [src/hooks/useI18n.ts](../src/hooks/useI18n.ts) |
| `LanguageToggle` in Topbar | ✅ | imported & rendered at [Topbar.tsx:5, 100](../src/components/layout/Topbar.tsx#L100) |
| `<html dir>` logic | ✅ | I18nProvider uses `useLayoutEffect` to sync direction |
| Wrapping in App | ✅ | [App.tsx:9, 60](../src/App.tsx#L60) |

## 12. Half-Done Work Detected
- **No Gemini/Google-generative migration attempts** — `grep "gemini|GEMINI|google.*generative|@google/generative-ai"` returned 0 files. ✅
- **Persona leftovers**: see §9 — "Amir" still in [ai-demo-responses.ts:129,131,158](../src/data/ai-demo-responses.ts#L129) and [ThemesPreviewPage.tsx:117,160,207,271](../src/pages/ThemesPreviewPage.tsx#L117).
- **Half-built profile editor**: `profilesService.updateProfile` is fully wired (lines 78-92) but there is **no form/drawer component** that calls it. The Edit buttons are disabled stubs.
- **Two migration trees**: legacy `0001..0007` (multi-file) and new `20260521_initial_schema*.sql` (single-file rebuild). Either consolidate or document which is authoritative. The idempotent version drops & recreates policies — applying both could create duplicate-policy errors.
- **`recovery-codes.txt` untracked in repo root** — 107 bytes; recovery codes for some service (MFA?). Move to a password manager and delete from working tree; not in `.gitignore`, so a stray `git add .` would commit it.
- **`dist/index.html` is tracked AND modified** — `.gitignore:2` lists `dist/` but it's still tracked. Either `git rm -r --cached dist/` and commit, or accept that builds are part of the repo.

## 13. Vercel Deploy Status
- [vercel.json](../vercel.json) intact: `framework: "vite"`, `outputDirectory: "dist"`, function maxDuration 30 s, SPA rewrite to `/index.html` with `/api/(.*)` passthrough. Security headers (`X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin`) ✅.
- [.env.example](../.env.example) documents `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_AI_ENABLED`, `ANTHROPIC_API_KEY` (server-only).
- `.env.local` correctly gitignored (`.gitignore:6` `.env.local`).

## 14. ✅ Working as expected
- TypeScript: 0 errors.
- Build: succeeds, lazy chunks split.
- All 13 spec'd routes render and are non-trivial.
- RLS posture: every table has `auth.uid() = user_id`, no service-role escape hatches.
- AI: 3 spec'd tools + 4 bonus functions, zod validation, BYOK pattern, rate-limited, key server-only.
- File upload: buckets, helpers, dialogs, signed URLs, RLS by path prefix.
- i18n: EN + HE dictionaries, LanguageToggle, `<html dir>` sync.
- Demo/real separation: distinct localStorage prefixes, version-gated demo invalidation.
- Sign-in code path (email+password): correct usage of `signInWithPassword`, errors surfaced, redirect after success.

## 15. 🟡 Partially working / inconsistent
- **Profile editing**: backend (`updateProfile`) ready; UI buttons are `disabled`. Real users cannot change their name → permanently see "Demo".
- **`detectSessionInUrl`**: not explicit in [supabase.ts:31-32](../src/lib/supabase.ts#L31-L32). Default is `true` so works today, but signup-confirm flow relies on it — make it explicit.
- **Two-headed migration tree**: legacy `0001..0007` *and* `20260521_initial_schema*.sql`. Risk if both ever applied to the same database.
- **`signUp` lacks `emailRedirectTo`** ([useUser.ts:61](../src/hooks/useUser.ts#L61)) — confirmation email will redirect to whatever Site URL is in the Supabase dashboard, not to localhost during local dev.
- **Topbar has no user chip / sign-out button visible in current Sidebar/Topbar reading** — Sidebar bottom is a placeholder comment with no rendered user info.

## 16. ❌ Missing or regressed
- **No ProfileForm / EditProfileDrawer** — `disabled` buttons at [SettingsPage.tsx:40-41](../src/pages/SettingsPage.tsx#L40-L41) and [:383-384](../src/pages/SettingsPage.tsx#L383-L384).
- **Dashboard greeting + 11 Settings fields fall back to `mockUser`** for real users (see §9 table).
- **Persona leftovers** in [ai-demo-responses.ts:129,131,158](../src/data/ai-demo-responses.ts#L129) and [ThemesPreviewPage.tsx](../src/pages/ThemesPreviewPage.tsx#L117).
- **No admin gate** on demo-mode toggle / reset-to-demo (intentional today, regression risk if multi-user).
- **No sign-out button** detected in Sidebar/Topbar audit (`signOut` exists in `useUser` but no caller in the layout components reviewed).

## 17. ⚠️ Risks

| Sev | Risk | Evidence |
|---|---|---|
| **High** | Two parallel migration files (`0001..0007` vs `20260521_initial_schema*.sql`) — applying both will duplicate tables/policies or error. | [supabase/migrations/](../supabase/migrations/) — 9 files, two distinct generations |
| **High** | `recovery-codes.txt` untracked in repo root; a `git add .` will commit it. | `git status` output |
| **Medium** | `signUp()` doesn't pass `emailRedirectTo` → email confirmation links go to dashboard's Site URL, not localhost during dev. | [useUser.ts:61](../src/hooks/useUser.ts#L61) |
| **Medium** | `dist/index.html` is tracked despite `.gitignore` — divergence between source build and committed artifact. | git status |
| **Medium** | No "edit profile" UI → real user identity is permanently "Demo". | [SettingsPage.tsx:40-41, 383-384](../src/pages/SettingsPage.tsx#L40-L41) |
| **Low** | `detectSessionInUrl` not explicit on Supabase client. | [supabase.ts:31-32](../src/lib/supabase.ts#L31-L32) |
| **Low** | "Amir" persona references in demo-only responses and ThemesPreviewPage. | [ai-demo-responses.ts:129,131,158](../src/data/ai-demo-responses.ts#L129), [ThemesPreviewPage.tsx:117](../src/pages/ThemesPreviewPage.tsx#L117) |
| **Low** | Demo-mode toggle is ungated (any signed-in user can flip to demo or reset to demo). | [SettingsPage.tsx:345](../src/pages/SettingsPage.tsx#L345), [Topbar.tsx:63-72](../src/components/layout/Topbar.tsx#L63-L72) |
| **Low** | `SUPABASE_SERVICE_ROLE_KEY` lives in same `.env.local` file as the publishable key. Not exposed (no `VITE_` prefix) but increases blast radius if file is mishandled. | `.env.local:11` |
| **Low** | Main bundle 614 kB / 163 kB gzipped — large for initial paint. | build output |

## 18. 🔧 Recommended Fix Order
1. **Triage the sign-in issue with the Supabase dashboard checklist (§D2.5)** before changing any code; the client code is correct.
2. **Consolidate the migration tree**: decide whether `0001..0007` or `20260521_initial_schema_idempotent.sql` is canonical; archive the other; document this in `supabase/README.md`.
3. **Build the ProfileForm / EditProfileDrawer** and wire the two disabled Edit buttons in `SettingsPage.tsx` to it; remove `mockUser` fallbacks in `SettingsPage.tsx` and `DashboardPage.tsx` once profile is editable.
4. **Add `emailRedirectTo: window.location.origin + '/'` to `signUp` in `useUser.ts:61`** and make `detectSessionInUrl: true` explicit in `supabase.ts:31`.
5. **Remove persona leftovers**: replace "Amir" in `ai-demo-responses.ts` and `ThemesPreviewPage.tsx` with generic strings (or `mockUser.preferredName`).
6. **Repo hygiene**: delete or move `recovery-codes.txt`; `git rm -r --cached dist/`.
7. **Sign-out + user chip in Sidebar/Topbar** (calls existing `useUser().signOut`).
8. **(Optional) Bundle split**: move heavy AI panels behind further `lazy()` boundaries; aim to drop main chunk under 400 kB.
9. **(Optional)** Admin gate on demo-mode toggle (compare `user.email` to an env-configured admin list).
