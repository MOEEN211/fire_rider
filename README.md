# UK Fire Station Riders Board

React + Supabase project plan for building a digital fire station Riders Board.

## Goal

Build a single-page React dashboard that recreates the provided physical Green Watch Riders board and supports:

- Microsoft Azure AD login
- FireServiceRota roster sync
- Outlook calendar notes via Microsoft Graph
- Automatic seat assignment based on rank, skills, availability, and rotation history
- Drag-and-drop manual overrides
- Confirmed board history
- A4 print layout
- UK-focused hosting/data compliance planning

## Recommended Stack

- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- Drag and drop: `@dnd-kit/core`
- Backend/database: Supabase PostgreSQL
- Auth option: Supabase Auth with Azure AD provider, or MSAL + Supabase user sync
- External APIs: Supabase Edge Functions for FireServiceRota and Microsoft Graph integrations
- Hosting: Vercel/Netlify frontend plus Supabase project region selected for compliance, or AWS London for stricter requirements

## Important Compliance Note

The client requested UK-based server cluster/AWS London region. Supabase region availability must be confirmed before production. If Supabase cannot guarantee the required UK-only data residency, use AWS London PostgreSQL/Supabase self-hosting or another UK-region database provider.

## Documentation Files

- `docs/task-report.md` — full task breakdown
- `docs/architecture-plan.md` — app architecture and data flow
- `docs/supabase-schema.md` — proposed database schema
- `docs/implementation-roadmap.md` — build phases and order
- `docs/client-questions.md` — questions to ask before final quote/build
