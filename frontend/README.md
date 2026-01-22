# ABOGIDA (FIDEL) Frontend

Vite + React + TypeScript app using Supabase for Auth, DB, and Storage.

## Setup
1. Copy `.env.example` to `.env` and fill in values from your Supabase project:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
2. Install deps and run dev server:
```
npm install
npm run dev
```

## Architecture
- `src/lib/supabaseClient.ts`: Supabase SDK client
- `src/pages/`: Feature pages (Login, Dashboard, Attendance MVP)
- `src/App.tsx`: Routing and auth guard

## Notes
- RLS must be applied on the database (see migrations). Client operates under least-privilege constraints.
- Attendance page assumes teacher role for class listing and upserts by composite key.
