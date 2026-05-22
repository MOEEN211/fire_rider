# Implementation Roadmap

## Milestone 1: Visual Prototype

Goal: Build the Riders Board UI with mock data.

Deliverables:

- React + TypeScript project
- Tailwind configured
- Dashboard background
- Date navigation
- Green A4 board layout
- Four vehicle blocks
- Duties and Notes sections
- Personnel and Standby tables
- Generate Board and Confirm & Print buttons
- Basic A4 print CSS

Recommended order:

1. Create app
2. Add Tailwind
3. Build `DashboardPage`
4. Build `DateNavigator`
5. Build `RidersBoard`
6. Build board subcomponents
7. Add mock data
8. Add print styling

## Milestone 2: Interactive Board

Goal: Make the board editable before confirmation.

Deliverables:

- Draggable personnel names
- Droppable seat rows
- Seat swap behavior
- Manual assignment state
- Read-only mode for confirmed boards

Recommended order:

1. Install `@dnd-kit/core`
2. Wrap board in DnD context
3. Make person rows draggable
4. Make seat rows droppable
5. Implement drop/swap logic
6. Add visual states for empty, assigned, manual, invalid

## Milestone 3: Supabase Database

Goal: Persist boards, people, vehicles, seats, and assignment history.

Deliverables:

- Supabase project
- Database schema
- RLS policies
- Supabase client setup
- CRUD services

Recommended order:

1. Create Supabase project
2. Confirm region/data residency
3. Create tables from schema file
4. Add seed data for station, vehicles, seats, skills, and mock people
5. Configure RLS
6. Create frontend services
7. Replace mock data with Supabase queries

## Milestone 4: Board Generation Logic

Goal: Generate draft seating plans from roster and history.

Deliverables:

- Eligibility filtering
- Seat history lookup
- Longest-time-since-seat algorithm
- Draft board creation
- Confirm board workflow

Recommended order:

1. Implement available crew query
2. Implement seat requirement query
3. Implement confirmed history query
4. Implement assignment scoring
5. Save generated draft
6. Confirm final board
7. Test edge cases

## Milestone 5: Authentication

Goal: Let only approved Microsoft users access the app.

Deliverables:

- Azure AD app registration
- Supabase Auth Azure provider or MSAL setup
- Domain restriction to `@bucksfire.gov.uk`
- Protected dashboard

Recommended order:

1. Confirm auth approach
2. Get Azure app credentials
3. Configure redirects
4. Add login/logout UI
5. Add protected route
6. Add domain validation
7. Sync user profile to `users` table

## Milestone 6: External Integrations

Goal: Pull real roster and calendar data.

Deliverables:

- FireServiceRota sync function
- Microsoft Graph calendar function
- Normalized roster storage
- Calendar notes display

Recommended order:

1. Receive FireServiceRota docs and credentials
2. Create provider interface
3. Build FireServiceRota adapter
4. Store normalized roster data
5. Receive shared Outlook calendar details
6. Build Microsoft Graph function
7. Display events in Notes section

## Milestone 7: Print and Production Readiness

Goal: Make the app reliable for daily use.

Deliverables:

- A4 print-perfect layout
- Black-and-white print mode
- Error handling
- Loading states
- API failure states
- Deployment plan
- Client testing checklist

Recommended order:

1. Tune A4 print CSS
2. Add browser print action
3. Add unavailable/error messages
4. Add final validations
5. Test across Chrome/Edge
6. Deploy frontend
7. Confirm Supabase compliance
8. Run user acceptance testing

## MVP Recommendation

Build the MVP in this order:

1. Static board UI
2. Mock Generate Board
3. Drag-and-drop overrides
4. Supabase persistence
5. Confirm and print
6. Real seating logic
7. Microsoft login
8. Rota and calendar integrations

This reduces risk because the visible workflow is validated before complex integrations are added.
