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
- `app/layout.js`: root layout with PWA metadata (apple-mobile-web-app, manifest, icons, viewport-fit=cover).
- `app/globals.css`: app theme, responsive behavior (incl. iPad landscape 3-column recap), safe-area insets, animations, and A4 print styles for PDF export.
- `public/manifest.webmanifest`: PWA manifest (standalone display, icons, theme).
- `public/icon.svg`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/favicon-*.png`: home-screen icons.
- `vercel.json`: explicit Vercel framework configuration.

## Main Behaviors
- Step flow per trio: theme -> argument -> work 1 -> work 2 -> work 3 -> recap.
- Progress statuses: `new`, `review`, `known`, stored in `localStorage`.
- Desktop keyboard controls: left/right for step navigation, up/down for trio navigation.
- PDF export: a dedicated printable document generated from all trios via browser print.
- PWA: installable to the iOS/iPadOS home screen as a standalone app (no Safari chrome), with safe-area insets honored.
- iPad landscape: the recap step lays out the 3 works in a single row with auto-revealed quotes, so everything fits on screen without scrolling.
