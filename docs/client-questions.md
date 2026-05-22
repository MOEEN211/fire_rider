# Client Questions

## Compliance and Hosting

1. Do you require true UK-only hosting for the frontend, backend, and database?
2. Is Supabase acceptable if its selected region meets your compliance needs?
3. If Supabase cannot guarantee AWS London/UK-only residency, are you open to AWS London PostgreSQL or self-hosted Supabase?
4. Is any special data protection assessment required by the fire service?

## FireServiceRota API

1. Can you provide API documentation?
2. Can you provide test credentials or sandbox access?
3. What authentication method does the API use?
4. Which endpoint returns daily staffing?
5. Which endpoint returns ranks and skills?
6. Which endpoint returns duty status?
7. Are vehicle allocations included in the API or only personnel rosters?
8. Are there rate limits?

## Microsoft Azure AD Login

1. Who will create the Azure App Registration?
2. Can the Azure admin provide client ID, tenant ID, and redirect URL setup?
3. Should access be limited only to `@bucksfire.gov.uk`?
4. Are there different roles, such as admin, officer, and viewer?

## Microsoft Graph Calendar

1. Is the calendar a shared mailbox calendar, Microsoft 365 group calendar, or user calendar?
2. Which account owns the shared calendar?
3. Should events be displayed only as text notes?
4. Should private calendar events be hidden?
5. Should calendar events be cached in the database?

## Riders Board Layout

1. Are the four vehicles fixed every day?
2. Do vehicle names or registrations change?
3. Should an admin be able to edit vehicles and seats?
4. Are OIC, Driver, BA 1, BA 2, and ECO always the same seat labels?
5. Do seat requirements vary by vehicle?
6. Should the print view match the physical board exactly?

## Seating Logic

1. Should only confirmed boards count toward rotation history?
2. Should manual overrides count the same as automatic assignments?
3. What should happen if no eligible person is available for a seat?
4. Can one person occupy more than one position?
5. Should manual overrides be allowed even if the person lacks required rank or skill?
6. Should the app show warnings for invalid manual placements?
7. Are duties like Mess, Watchroom, and Bollies also rotated automatically?
8. What does the Standby section represent?

## Personnel Table

1. What do the abbreviations in the left column mean?
2. Should all on-duty staff appear in Personnel, even if assigned to seats?
3. Should unavailable staff appear anywhere?
4. Should staff numbers always be shown?

## Print Requirements

1. Should print be black-and-white only?
2. Should there also be a green print option matching the physical board?
3. Must the board fit on a single A4 page?
4. Should Outlook notes appear in the printed version?
5. Should the printed version include confirmation timestamp or confirmer name?
