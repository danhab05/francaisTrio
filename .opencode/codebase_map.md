# Codebase Map - Trio Nature Sprint

## Overview
Revision tool for the "Nature" theme (French CPGE program), with a step-by-step trio flow and printable export.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **State persistence:** `localStorage` in the browser
- **Styling:** CSS variables + responsive layout + print stylesheet

## Core Files
- `lib/trios-data.js`: source of the 9 trios, arguments, works, and quotes.
- `app/page.js`: main flashcard UI, desktop keyboard shortcuts, local progress state, and PDF export markup.
- `app/globals.css`: app theme, responsive behavior, animations, and A4 print styles for PDF export.
- `vercel.json`: explicit Vercel framework configuration.

## Main Behaviors
- Step flow per trio: theme -> argument -> work 1 -> work 2 -> work 3 -> recap.
- Progress statuses: `new`, `review`, `known`, stored in `localStorage`.
- Desktop keyboard controls: left/right for step navigation, up/down for trio navigation.
- PDF export: a dedicated printable document generated from all trios via browser print.
