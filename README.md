# AttendanceGuard – Your Attendance. Your Squad. Your Semester.

An AI-powered, gamified predictive attendance management & semester survival platform built with **React, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Web Audio API, Browser Speech Synthesis, and Supabase PostgreSQL + Row Level Security**.

> **Important Distinction:** When Supabase credentials are not configured, AttendanceGuard runs in **Simulated Local Demo Mode** (`localStorage`). Real institutional ERP updates require authorized college integration and Supabase configuration.

---

## Core Modules

1. **Exact Integer Attendance Engine (`src/utils/attendanceMath.ts`)**
   - Eligibility check: `100 × A ≥ p × T` (never uses rounded percentages)
   - Maximum safe consecutive absences: `floor((100 × A - p × T) / p)`
   - Required consecutive recovery classes: `ceil((p × T - 100 × A) / (100 - p))`
   - Supports subject-specific minimum percentages and `Avengers Shield` (100%) detection.
2. **AI Hall Ticket Survival Predictor (`/predictor`)**
   - Predicts `GREEN`, `YELLOW`, or `RED` examination readiness based on remaining timetable classes, working days, holidays, exam date, and approved OD credits.
   - Displays a visual Survival Radar and transparent 0–100 Survival Score (explicitly labeled as an internal planning indicator, not an official college hall-ticket guarantee).
3. **Smart Recovery Planner (`/recovery`)**
   - Automatically maps required recovery streaks onto actual upcoming working days and timetable slots, or alerts students to contact faculty/administration if mathematically impossible.
4. **Non-Destructive What-If Bunk Simulator (`/simulator`)**
   - Simulate attending or missing classes with sliders and instant hero & Thanos reactions without ever modifying real records.
5. **Emotional Cartoon Hero Companions (`/heroes`) & Thanos Emergency Alert**
   - Four original animated SVG companions: **Captain Campus**, **Iron Scholar**, **Doctor Deadline**, and **Spider-Coder**.
   - **Thanos – College Administration** triggers on risk transitions with synthesized Web Audio warning chords and optional speech synthesis narration.
6. **Smart OD Reconciliation (`/od`)**
   - Submit Hackathon, CoE workshop, symposium, or sports OD claims, preview attendance impact before approval, and prevent duplicate OD credits.
7. **Gamification & Anti-Fake Reward Vault (`/armory`)**
   - Verified attendance & task rewards, 7 progression levels (`Freshman Sidekick` → `Campus Mythic`), 100% Avengers Shield bonus, unlockable Hero Auras, and duplicate-claim prevention via unique `eventKey`.
8. **Privacy-Masked Squad Connect (`/squad`) & Shared Tasks (`/tasks`)**
   - Join squads with codes (e.g., `COE-75GUARD`), send attendance nudges, and collaborate on assignments without exposing exact percentages by default.
9. **Faculty & College Admin Portals (`/faculty`, `/admin`)**
   - Role-protected verification workflows, OD approvals, risk alerts, institutional rule config, CSV exports, and immutable audit logs.

---

## Local Setup & Commands

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests (exact math, simulation isolation, deduplication, privacy)
npm test

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
```

---

## Demo Accounts (Local Demo Mode)

On `/login` (or from the landing page), click any of the clearly labeled **Simulated Demo Account** buttons:
- **Demo Student**: Arjun Karthik (`CyberShield-07`) — full student dashboard, simulator, squad, OD, armory
- **Demo Faculty**: Dr. Kavya Ramanathan — assigned to `MA501`, `CS502`, `AI504` with OD verification & risk reports
- **Demo Admin**: Prof. Vikramaditya Rao — institutional rules, eligibility reports, audit logs

Or register a brand-new student account at `/register`.

---

## Supabase Configuration & Database Migration

1. Create a Supabase project.
2. Open the Supabase **SQL Editor** and run the full schema in [`database/schema.sql`](database/schema.sql). This creates all **18 tables**, foreign keys, unique constraints (preventing duplicate OD credits and duplicate rewards), **Row Level Security (RLS)** policies, and the `approve_od_request` atomic RPC function.
3. Copy `.env.example` to `.env` and fill in your public keys:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> Never place `service_role` keys or administrator secrets in frontend environment variables or source code.

---

## Deployment

Build the static bundle with `npm run build` and deploy `dist/` to Vercel, Netlify, or Cloudflare Pages with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured in your hosting environment. Ensure SPA fallback rewrites (`/* -> /index.html`) are enabled for React Router routes.
