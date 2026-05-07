# Expense Tracker Project Handoff

## Overview

This is a React + Vite expense tracker app located at:

```powershell
C:\Work\DAY 1 WORKSHOP
```

The app is frontend-only and uses browser `localStorage` for persistence. Expense data is stored per browser/device; there is no backend, authentication, or database yet.

## Current Features

- Add expenses
- Delete expenses
- Edit expenses inline directly on the expense card
- List all expenses
- Show visible total, current/month total, and all-time total
- Category, date, amount, title, and note fields
- Search expenses
- Filter by category
- Filter by month
- Category summary
- CSV export
- IDR currency formatting
- Purple color scheme for the main UI, with rose delete/error states
- Responsive layout for desktop and mobile

## Important Files

- `src/main.jsx`: React state, expense logic, filtering, inline editing, CSV export, and `localStorage` persistence.
- `src/styles.css`: responsive layout, purple color scheme, cards, forms, buttons, and inline edit styling.
- `package.json`: Vite scripts and dependencies.
- `.gitignore`: excludes `node_modules`, `dist`, `.vercel`, env files, and debug logs.

## GitHub

Repository:

```text
https://github.com/livia767/expense-tracker
```

Branch:

```text
main
```

The local `main` branch tracks `origin/main`. The latest local changes include the purple color scheme in `src/styles.css` and this handoff file.

## Vercel

Production app:

```text
https://expense-tracker-flax-seven-61.vercel.app
```

Vercel project:

```text
expense-tracker
```

The Vercel project is connected to the GitHub repository. Vercel CLI confirmed:

```text
livia767/expense-tracker is already connected to your project.
```

Future pushes to GitHub should auto-deploy.

## Useful Commands

```powershell
cd "C:\Work\DAY 1 WORKSHOP"
npm install
npm run dev
npm run build
git status
git push
vercel --prod
```

## Notes For The Next Session

- A normal local `npm run build` once failed because Windows locked `dist/assets`.
- `npm run build -- --emptyOutDir false` passed locally after the purple color scheme update.
- Vercel production build passed normally.
- The app currently has no real multi-user persistence. A future v2 could add Supabase/Firebase/custom backend auth and database storage.
