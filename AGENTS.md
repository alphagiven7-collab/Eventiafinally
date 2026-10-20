<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- Dependencies install with `npm ci` (lockfile: `package-lock.json`). Node.js 22 is already on the default image. `npm run build` typechecks and produces the production build. `npm run lint` currently exits non-zero because of existing ESLint issues in the app; that does not block the dev server or the production build.
- The dev server is `npm run dev`. It listens on `0.0.0.0:3000`. Open the UI at `http://localhost:3000`. Next.js 16 blocks dev assets when the page is opened as `http://127.0.0.1:3000`, so hydration, clicks, and form state do not run on that host. `curl` to either host still returns 200.
- Supabase is not configured here. There is no Docker daemon, and `supabase/migrations` are SQL editor scripts rather than an ordered CLI migration chain, so do not start a local Supabase stack. Without `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`, `/e/yanick-keren` loads from `src/data/events.ts`, and `/create` saves an unsigned local draft. Sign-in, publish, dashboard, and admin need those variables (see `.env.example`).
- On the create form, the optional time must be a value `Date` can parse, such as `18:00`. The placeholder `16h00` throws `Invalid time value`.
