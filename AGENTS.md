<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

The Blue Book is a single Next.js 16 (Turbopack, React 19) app — a structured screenwriting editor. There is one service; standard commands live in `package.json` (`dev`, `build`, `start`, `lint`).

- Runs fully offline by default. Storage backend defaults to `local` (browser `localStorage`), so `npm run dev` needs no secrets and no running database — the app auto-seeds a default project/document and requires no login. Do not treat missing Supabase/OpenAI config as a blocker.
- Optional integrations, only if a feature under test needs them: Supabase cloud sync + auth is enabled by setting `NEXT_PUBLIC_STORAGE_BACKEND=supabase` plus `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (schema in `supabase/migrations/`). The "Jon" companion chat (`app/api/companion/chat`) needs `OPENAI_API_KEY`; without it, chat returns an error but the rest of the app works.
- `npm run lint` currently reports pre-existing errors/warnings (e.g. `react-hooks/set-state-in-effect` in `lib/theme/ThemeProvider.tsx`). These are not environment problems. `next build` does NOT fail on these lint errors and completes successfully.
