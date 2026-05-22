# Architecture Plan

## Overview

The app will be a React single-page dashboard backed by Supabase PostgreSQL. Supabase stores normalized station, roster, people, vehicle, seat, board, and assignment data. External API integrations should be handled through server-side functions rather than directly from the browser.

## Recommended Architecture

```text
React Frontend
  |
  | Supabase JS client
  v
Supabase Auth + PostgreSQL + RLS
  |
  | Edge Functions
  v
FireServiceRota API / Microsoft Graph API
```

## Frontend Responsibilities

- Show dashboard page
- Navigate selected date
- Render green Riders Board grid
- Let user generate board
- Let user drag and drop staff between seats
- Let user confirm board
- Trigger print view
- Display Outlook calendar notes
- Enforce read-only UI for confirmed historical boards

## Supabase Responsibilities

- Store application data
- Enforce access rules with Row Level Security
- Store confirmed assignment history
- Store normalized roster records
- Provide queryable data for seating logic
- Run Edge Functions for API integrations

## Edge Function Responsibilities

### FireServiceRota sync

- Store API credentials securely in Supabase secrets
- Fetch roster data by date/station
- Normalize external data
- Upsert people, skills, roster days, and roster assignments

### Microsoft Graph calendar sync

- Store Graph credentials securely
- Fetch events for selected date
- Return or cache events in `calendar_events`

## Data Flow: Generate Board

```text
User clicks Generate Board
  -> Frontend calls generate-board function/API
  -> Load roster_assignments for selected date
  -> Load vehicles and seats
  -> Load confirmed assignment history
  -> Filter eligible crew per seat
  -> Assign longest-waiting eligible person
  -> Save board as Draft
  -> Save draft seat assignments
  -> Return generated board to frontend
```

## Data Flow: Manual Override

```text
User drags person to seat
  -> Frontend updates local draft state
  -> Assignment marked Manual
  -> Optional autosave to Supabase
  -> Confirm later saves final version
```

## Data Flow: Confirm Board

```text
User clicks Confirm & Print
  -> Save final assignments
  -> Set board status to Confirmed
  -> Store confirmed_by and confirmed_at
  -> Confirmed assignments become rotation history
  -> Trigger print
```

## Data Flow: Historical Board

```text
User clicks Back
  -> Load board by date
  -> If Confirmed and date is past, render read-only
  -> Disable drag-and-drop and editing
```

## Core React Components

```text
src/routes/DashboardPage.tsx
src/components/layout/AppShell.tsx
src/components/layout/DateNavigator.tsx
src/components/board/RidersBoard.tsx
src/components/board/VehicleBlock.tsx
src/components/board/SeatRow.tsx
src/components/board/DutiesBlock.tsx
src/components/board/NotesBlock.tsx
src/components/board/PersonnelTable.tsx
src/components/board/StandbyTable.tsx
src/components/board/BoardActions.tsx
src/components/dragdrop/DraggablePerson.tsx
src/components/dragdrop/DroppableSeat.tsx
src/components/auth/ProtectedRoute.tsx
```

## Services

```text
src/services/supabaseClient.ts
src/services/boardService.ts
src/services/rosterService.ts
src/services/calendarService.ts
src/services/authService.ts
src/services/seatAssignmentService.ts
```

## Important Design Decision

Do not tie seating logic directly to FireServiceRota response fields. Always normalize external roster data into internal tables first. This keeps the system ready for GRS, Totalmobile, or CSV imports later.
