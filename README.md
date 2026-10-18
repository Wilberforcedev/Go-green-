# Grin Mates

Grin Mates helps people discover environmental activities, take part with their community, and track verified participation.

## Impact Hub setup

The Impact Hub requires a Supabase project. It does not use browser storage as a fallback for accounts, sign-ups, attendance or points.

1. Create a Supabase project.
2. Apply `supabase/migrations/202610180001_impact_hub.sql` using the Supabase SQL editor, or link the project with the Supabase CLI and run `supabase db push`.
3. In Supabase Authentication, configure the allowed site URL and redirect URLs for local development and the deployed site. Set the email confirmation policy you want to use.
4. Create `.env.local` in the project root:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   ```

5. Add the same two variables to the Vercel project’s environment settings, then redeploy.
6. Create an account for the site owner. In Supabase SQL editor, promote that account to admin using its Auth user UUID:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = 'AUTH_USER_UUID';
   ```

7. Promote approved organizers from `participant` to `organizer` in `public.profiles`. Public account creation only creates participant accounts; users cannot assign themselves organizer or admin roles.

Never put the Supabase service-role key in a `VITE_` variable or in client-side code. The publishable/anon key is intended for the browser and is constrained by the migration’s row-level security policies.

### Impact Hub behavior

- Participants can register for published future activities through a server-side function that checks capacity and prevents duplicate registrations.
- Only an activity’s organizer or an admin can verify attendance.
- Verification creates one immutable point-ledger entry on the server. Repeating verification does not award points twice.
- Organizers can publish activities with capacity, points, an impact measure and an optional source link.
- Activity and roster changes are recorded in `public.audit_log`; only admins can read audit records.
- Database tests cover organizer publishing, participant sign-up, capacity enforcement, organizer-only attendance verification, and one-time point awards. Run them locally with `supabase start` followed by `npm run test:db`.
- No sample activity or reward is presented as a live offer. Impact figures are organizer-submitted and should be supported by the attached source where applicable.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm ci
npm run dev
```

Without Supabase environment variables, the Impact Hub displays setup guidance and does not store fake participation records.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
supabase start
npm run test:db
```

GitHub Actions runs these checks for pushes and pull requests to `main`.

## Stack

- React 18 and TypeScript
- Vite and React Router
- Tailwind CSS
- Supabase Auth, Postgres and row-level security for the Impact Hub
