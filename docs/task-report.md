# Riders Board React + Supabase Task Report

## Project Goal

Build a React web app for a UK Fire Station Riders Board that recreates the green physical board, generates daily seating plans, supports drag-and-drop overrides, stores confirmed history, pulls rota/calendar data, and prints to A4.

## Phase 1: Project Setup

### Task 1.1: Create React app

- Priority: High
- Stack: Vite + React + TypeScript
- Deliverable: Local React app running

### Task 1.2: Install dependencies

- Priority: High
- Packages:
  - `@supabase/supabase-js`
  - `@dnd-kit/core`
  - `@dnd-kit/sortable`
  - `@azure/msal-browser`
  - `@azure/msal-react`
  - `axios`
  - `date-fns`
  - `lucide-react`
  - `tailwindcss`
- Deliverable: Frontend dependencies installed

### Task 1.3: Create folder structure

- Priority: High
- Folders:
  - `src/components/board`
  - `src/components/layout`
  - `src/components/auth`
  - `src/components/dragdrop`
  - `src/services`
  - `src/types`
  - `src/utils`
  - `supabase/functions`
- Deliverable: Clean project structure

## Phase 2: Static UI

### Task 2.1: Dashboard shell

- Priority: High
- Build full-screen interface with blurred station background
- Deliverable: `DashboardPage`

### Task 2.2: Date navigator

- Priority: High
- Add Back and Next arrows with current selected date
- Deliverable: `DateNavigator`

### Task 2.3: Riders Board layout

- Priority: High
- Recreate physical green Riders Board grid
- Deliverable: `RidersBoard`

### Task 2.4: Vehicle blocks

- Priority: High
- Include 4 vehicle sections
- Seat rows: OIC, Driver, BA 1, BA 2, ECO where applicable
- Deliverable: `VehicleBlock`

### Task 2.5: Duties and Notes

- Priority: Medium
- Duties rows: Mess, Watchroom, Bollies
- Notes displays Outlook events later
- Deliverable: `DutiesBlock`, `NotesBlock`

### Task 2.6: Personnel and Standby tables

- Priority: High
- Show crew list and standby numbered rows
- Deliverable: `PersonnelTable`, `StandbyTable`

### Task 2.7: Action buttons

- Priority: High
- Buttons: Generate Board, Confirm & Print
- Deliverable: `BoardActions`

## Phase 3: Supabase Setup

### Task 3.1: Create Supabase project

- Priority: High
- Choose region carefully based on client compliance requirement
- Deliverable: Supabase project created

### Task 3.2: Create database tables

- Priority: High
- Use schema in `docs/supabase-schema.md`
- Deliverable: Tables and relationships created

### Task 3.3: Configure Row Level Security

- Priority: High
- Restrict board data to authenticated station users
- Deliverable: RLS policies

### Task 3.4: Create Supabase client

- Priority: High
- Add environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Deliverable: Frontend connected to Supabase

## Phase 4: Mock Data and Frontend Logic

### Task 4.1: Mock vehicles and seats

- Priority: High
- Deliverable: Vehicle config matching screenshots

### Task 4.2: Mock personnel roster

- Priority: High
- Include names, ranks, skills, duty status, staff number
- Deliverable: Test roster data

### Task 4.3: Generate board with mock data

- Priority: High
- Deliverable: Generate Board button fills seats

## Phase 5: Drag-and-Drop

### Task 5.1: Draggable people

- Priority: High
- Use `@dnd-kit/core`
- Deliverable: Crew can be dragged

### Task 5.2: Droppable seats

- Priority: High
- Each seat accepts a person
- Deliverable: Seat drop zones

### Task 5.3: Manual swap logic

- Priority: High
- Empty seat drop, occupied seat swap, assignment marked Manual
- Deliverable: Editable draft board

### Task 5.4: Read-only confirmed history

- Priority: Medium
- Past confirmed boards cannot be edited
- Deliverable: Read-only mode

## Phase 6: Seating Logic

### Task 6.1: Eligibility filter

- Priority: High
- Filter by duty status, rank, skills, availability
- Deliverable: Eligible crew list per seat

### Task 6.2: Seat history lookup

- Priority: High
- Query confirmed `board_seat_assignments`
- Deliverable: Last occupied date per person/seat

### Task 6.3: Auto-assignment service

- Priority: High
- Assign eligible person who has gone longest since sitting in the same seat
- Deliverable: Draft board generation

### Task 6.4: Confirm board

- Priority: High
- Save final assignments and update board status to Confirmed
- Deliverable: History tracking works

## Phase 7: Authentication

### Task 7.1: Decide auth approach

- Priority: High
- Option A: Supabase Auth with Azure provider
- Option B: MSAL login, then sync user to Supabase
- Deliverable: Auth architecture selected

### Task 7.2: Configure Microsoft Azure app

- Priority: High
- Needs client Azure admin
- Deliverable: Azure client credentials and redirect URL

### Task 7.3: Restrict domain

- Priority: High
- Only allow `@bucksfire.gov.uk`
- Deliverable: Domain-protected access

## Phase 8: External Integrations

### Task 8.1: Microsoft Graph calendar Edge Function

- Priority: Medium
- Fetch daily shared calendar events
- Deliverable: Calendar events displayed in Notes

### Task 8.2: FireServiceRota Edge Function

- Priority: High
- Requires API docs and credentials
- Deliverable: Roster sync into normalized tables

### Task 8.3: Rota provider abstraction

- Priority: High
- Support future GRS, Totalmobile, CSV import
- Deliverable: Provider-style integration design

## Phase 9: Print View

### Task 9.1: Print action

- Priority: High
- `Confirm & Print` confirms board then opens browser print
- Deliverable: Print workflow

### Task 9.2: A4 print CSS

- Priority: High
- Hide dashboard chrome, fit board to A4, black-and-white mode
- Deliverable: Clipboard-ready output

## Blockers

- FireServiceRota API docs and credentials
- Azure AD tenant/app registration access
- Shared Outlook calendar details
- Exact seat and duty rotation rules
- Confirmation of Supabase region/data residency suitability
