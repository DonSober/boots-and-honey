# Supabase Type Generation (types/database-generated.ts)

This repo uses Supabase typed clients. When you change the database schema (e.g., add accounts/contacts/profiles or new columns on orders), regenerate TypeScript types.

Prerequisites
- Supabase CLI (via npx; no global install required)
- SUPABASE_ACCESS_TOKEN (from https://supabase.com/dashboard/account/tokens)
- SUPABASE_PROJECT_ID (project ref: e.g., abcd1234)

One‑time login
- In your shell, set your access token temporarily for the session:
  export SUPABASE_ACCESS_TOKEN=...    # do not echo this value anywhere

Find your project ref
- npx supabase@latest projects list
- Copy the Ref for your project and export it:
  export SUPABASE_PROJECT_ID=your_project_ref

Generate types (public schema)
- From repo root:
  npm run typegen

Notes
- The script updates types/database-generated.ts in-place.
- Never commit secrets. The script only needs your project ref; the token is taken from env.
- If you get tables missing (e.g., accounts/contacts/profiles), ensure you’ve run the SQL to create them first, then re-run typegen.
- After typegen, remove any temporary "any" casts and rebuild.
