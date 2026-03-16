# Codebase Map - Trio Nature Sprint

## Overview
Revision tool for the "Nature" theme (French CPGE program).

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** SQLite (better-sqlite3)
- **Styling:** CSS Variables (Dark theme)

## Core Files
- `lib/trios-data.js`: Content source (themes, arguments, quotes).
- `lib/db.js`: SQLite connection and queries.
- `app/page.js`: Main UI and flashcard logic.
- `app/api/statuses/`: Endpoints for progress persistence.

## Data Model
Table `trio_statuses`:
- `trio_id`: Reference to trio ID.
- `status`: 'new' | 'review' | 'known'.
- `updated_at`: Timestamp.
