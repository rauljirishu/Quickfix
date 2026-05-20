# Supabase setup for QuickFix

Place your keys as follows:

- Client (browser-safe anon key): copy values into `.env.local` (do NOT commit).
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

- Server (service role key - KEEP SECRET): set in your deployment provider's secret store as `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` or locally in `.env.server` (do NOT commit).

Examples are provided in `.env.local.example` and `.env.server.example`.

Frontend usage (Vite + React): see `src/lib/supabaseClient.ts`.
Server usage (Node/API): see `src/server/supabaseAdmin.ts`.
