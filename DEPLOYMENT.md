Vercel deployment notes

1. Build

- Vercel will run `npm run vercel-build` which executes `next build` (we added this script to support standard Node builds).

2. Environment variables (set these in Vercel Dashboard -> Project -> Settings -> Environment Variables):

- `SUPABASE_URL` - your Supabase project URL (optional if using local SQLite fallback)
- `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` - your Supabase keys

3. Database

- The app falls back to SQLite (`db/schema.sqlite3`) when Supabase is not configured. Vercel serverless functions do not provide persistent writable storage; therefore for production you must use Supabase (or another hosted DB).

4. Static assets

- Ensure `public/audio` is present in the repository (the `scripts/sync-assets-to-public.js` produces it). Vercel will serve `public/` automatically.

5. Node version

- Vercel will use the Node version defined in your project or default. If you need a specific Node version, add an `engines.node` entry to `package.json`.

6. After deploy

- Open Project -> Settings -> Environment Variables and add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or service role key for server operations).
- Re-deploy.

Optional: If you want us to add a production-only check that forces Supabase usage and errors early when missing, tell me and I'll add it.
