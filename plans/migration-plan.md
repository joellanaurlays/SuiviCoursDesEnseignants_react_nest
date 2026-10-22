# Migration Plan: Next.js to React + Vite

## 1. Current State of the Frontend
- **Framework:** The frontend is currently built with Next.js (App Router).
- **Pages:**
  - `src/app/enseignant/enseignements/page.tsx` (Enseignant View)
  - `src/app/scolarite/suivi-enseignements/page.tsx` (Scolarité View)
- **Components:**
  - `src/components/enseignements/EnseignementList.tsx`
  - `src/components/enseignements/EtatBadge.tsx`
- **Backend API Routes (Next.js):**
  - Various routes under `src/app/api/` (e.g., `/api/suivi/enseignements`) that currently interact with Prisma directly.

## 2. Dependencies on Next.js
The project currently relies on several Next.js-specific features:
- **File-based Routing:** The `src/app/` folder dictates routing.
- **Next.js Components:** The `next/link` component is used for navigation.
- **Directives:** `"use client"` is used extensively.
- **API Routes:** The backend logic is partially embedded in Next.js API routes (`src/app/api/...`) instead of communicating with the standalone NestJS backend.

## 3. Pages and Components Realized
- **Enseignant Dashboard:** Lists teachings, progression, state, and allows viewing/declaring sessions.
- **Scolarité Dashboard:** Provides a global view with KPIs (total teachings, states, total hours), filtering options, and detailed teachings list.
- **Components:** `EnseignementList` and `EtatBadge` are implemented.

## 4. What Can Be Reused Directly in React
- The core JSX/TSX layout, tailwind classes, and UI structures.
- State management (`useState`, `useEffect`).
- Utility components like `EtatBadge.tsx` (once Next.js specific imports are removed if any).
- The general structure of the pages (these will become standard React components).

## 5. What Must Be Adapted for Vite
- **Routing:** Replace Next.js file-based routing (`src/app/`) with `react-router-dom`. Define routes in a standard `App.tsx` or `router.tsx` file.
- **Links:** Replace `next/link` with `react-router-dom`'s `<Link>` component.
- **Directives:** Remove `"use client"` directives as they are not needed in standard Vite React applications.
- **API Calls:** 
  - Update `fetch` calls in components to point to the NestJS backend (e.g., `http://localhost:3000/suivi/enseignements`) instead of the relative Next.js API routes (`/api/...`).
  - Introduce an Axios instance or configured fetch wrapper for API base URL and headers.
- **Project Structure:** Move source files into standard Vite structure (`src/pages/`, `src/components/`, `src/routes/`).

## 6. Current State of the NestJS Backend
- **Location:** `backend/src/enseignements/`
- **Architecture:** Aligns very well with Clean Architecture principles:
  - **Controllers:** Handles HTTP routing (`enseignements.controller.ts`).
  - **Services:** Coordinates use cases (`enseignements.service.ts`).
  - **Use Cases:** Contains business logic (`create-seance.use-case.ts`, `get-suivi.use-case.ts`).
  - **Repositories:** Uses `PrismaService` which acts as the data access layer.
- **Status:** The backend covers the necessary logic for CRUD operations and calculation of tracking metrics ("suivi"). It is fully capable of replacing the Next.js API routes.

## 7. Estimate of Necessary Modifications and Risks
- **Modifications:** Low to Medium effort. The UI components are simple and straightforward. Wiring up React Router and redirecting API requests are standard tasks.
- **Risks:** 
  - **CORS Issues:** The Vite frontend will run on a different port (e.g., 5173) than the NestJS backend (e.g., 3000). NestJS must be configured to allow CORS.
  - **Environment Variables:** Must migrate `.env` usage to Vite's `VITE_` prefix where required by the frontend.
  - **State Loss / API mismatch:** The response format of NestJS must match what the frontend components expect (or components need slight adjustments). Next.js API returns specific structures mapped manually; we must ensure NestJS endpoints return the same shape.

## 8. Step-by-Step Migration Plan (Agile & Progressive)
1. **Initialize Vite Project:** Set up a new React + Vite project (or replace the existing frontend structure in-place).
2. **Setup Routing & Layout:** Install `react-router-dom`. Create the routing configuration mirroring the current Next.js structure (e.g., `/enseignant/enseignements` and `/scolarite/suivi-enseignements`).
3. **Migrate Components:** Copy the UI components (`EnseignementList`, `EtatBadge`) and adapt imports.
4. **Migrate Pages:** Copy the page logic from `src/app/` to `src/pages/`. Replace `<Link from="next/link">` with `<Link from="react-router-dom">` and remove `"use client"`.
5. **Connect to NestJS Backend:** Update API calls in the pages/components to target the NestJS application. Validate CORS configuration in NestJS.
6. **Testing and Verification:** Run the Vite dev server and NestJS server concurrently. Verify both dashboards (Enseignant and Scolarité) work, filters function correctly, and data is correctly displayed.
7. **Cleanup:** Remove Next.js specific files, the `src/app/api/` directory, and Next.js dependencies from `package.json`.
