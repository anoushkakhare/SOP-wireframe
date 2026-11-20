https://docs.google.com/document/d/1nnz5t6rjFOQU25jdIsz1Y9rcSv20ppuaHEBnIZNZ7NQ/edit?usp=sharing

# Demand Planner — Sales & Operations Planning (S&OP) Web Application

A responsive full-stack Sales & Operations Planning (S&OP) web application built to enterprise standards, featuring primary brand indigo theming, role-driven layout manifests, analytics charts, drill-down desegregation, scenario planning, and an interactive bottom tabular dock with live cell editing and change logs.

---

## 🌟 Key Features

1. **Role-Driven UI**:
   - Backend provides a JSON layout manifest upon login (`demand_planner`, `leadership`).
   - Frontend resolves widgets dynamically via a component registry. Adding a new role requires zero frontend code modifications.
2. **Sticky Header**:
   - Solid primary indigo (`#0F0E9A`) header (56–64px height) with white text and icons.
   - Left: User avatar + role title ("Demand Planner").
   - Middle: Three floating selects inside translucent white pills ("Product view", "Customer view", "Measure").
   - Right: Action icon buttons with tooltips:
     - 💾 **Save scenario** (`SaveScenarioModal`)
     - ☁️ **Commit scenario** (`CommitConfirmModal`)
     - 📊 **Table view** (`BottomDock`)
     - 🌪️ **Filters** (`FilterDrawer`)
     - ☰ **Scenarios** (`ScenarioSelectorDrawer`)
   - Mobile: Responsive menu collapsing dropdowns and actions.
3. **9 KPI Cards Row**:
   - Total forecast (`1.82M`, neutral, no sign) | Forecast adjustment (`+42K`) | Risk (`-96K`) | Opportunity (`+128K`) | FY growth (`+2.8%`) | YTD growth (`+5.8%`) | YTG growth (`-1.9%`) | FY growth (R&O) (`+2.8%`) | YTG growth (R&O) (`-1.9%`).
   - Positive numbers are positive green with `+` and up triangle icon, negative are negative red with `-` and down triangle icon, neutral are dark.
   - Info tooltip on each card with a one-line definition and "vs last year" caption where data exists.
   - Horizontally scrollable on small screens.
4. **2×2 Interactive Charts**:
   - **Forecast trend**: Monotone indigo line chart with light indigo shaded band between Risk and Opportunity.
   - **Forecast by brand/product and customer group**: Stacked bar chart by Customer Group with circular drill-down (▼) and drill-up (▲) buttons. Legend included; details in hover tooltip.
   - **Forecast bridge**: Waterfall chart (Baseline indigo, Demand drivers positive green, Manual adjustment positive green, Final forecast brand indigo) with floating delta bars.
   - **Product mix**: Treemap hierarchy grouping by parent brand with product tiles; indigo tints with WCAG AA compliant text.
   - **Fullscreen Chart Mode**: Click expand on any chart card to enlarge it within the page while keeping the sticky header and KPI row visible. Press Esc or click ✕ to close.
5. **Right Filter Drawer**:
   - Dimmed backdrop overlay (`rgba(26,28,46,.45)`).
   - Dual-handle time range slider synced with Start/End month pickers.
   - Multi-select dropdowns with closed summary text (Category, Brand, Product, Customer group, Customer, Business unit).
   - Bottom action buttons: Apply filters (solid primary), Reset (secondary white with primary border), Close (neutral ghost).
6. **Scenario Planning**:
   - Drawer with bordered scenario cards, status badges (Saved = warning amber pill, Committed = positive green pill), and relative time ("2 min ago", "Yesterday", "15 Jul").
   - Edit, delete with confirmation modal, unique name validation, and organization-wide Commit modal.
7. **Bottom Tabular View Dock**:
   - Fixed bottom dock with vertical scrollable charts area above it.
   - Primary indigo header row with white text, sticky leading dimension columns.
   - 3 sub-rows per entity: Opportunity (positive green italic), Forecast / Actual (bold), Risk (negative red italic).
   - Merged actuals cell with light grey background (`#F1F2F7`) spanning past months; individual editable cells for future months.
   - Mode chip next to buttons ("View mode", "Edit mode", "Change log").
   - Three floating action buttons:
     - ✏️ **Edit forecast** / 👁️ **Switch to view**: forecast cells become editable in-place with primary-300 border.
     - **± Show change log**: displays delta differences against baseline with soft positive/negative highlights.
     - **✕ Close table** / **✓ Save changes**: commits local edits and shows a toast notification.
   - **Desegregation**: Clicking ▼ drill-down on a brand executes desegregation logic, showing the dismissible info banner "Showing disaggregated values at product level".
8. **Toast Notifications & Empty States**:
   - Toast alerts for save/commit/delete success and errors.
   - Consistent empty, loading, and error states.

---

## 🚀 Quick Start

### 1. Backend Server
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:5001`.

### 2. Frontend Web App
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`.

### 3. Run Unit Tests
```bash
cd frontend
npm test
```

---

## 🎨 How to Change the Theme

The application theme is centralized via CSS custom properties in `frontend/src/styles/index.css` and mapped to Tailwind in `frontend/src/tailwind.config.js`:

1. Open `frontend/src/styles/index.css`.
2. Modify any token in `:root`:
   - `--color-primary-700`: Main brand color (default `#0F0E9A`)
   - `--color-primary-900` ... `--color-primary-50`: Indigo color ramp
   - `--color-bg-page`: Page canvas background (`#F6F7FB`)
   - `--color-surface`: Card / surface background (`#FFFFFF`)
   - `--color-border`: Default border (`#E0E3EC`)
   - `--color-text-primary`, `--color-text-secondary`: Typography colors
   - `--color-positive`, `--color-negative`, `--color-warning`: Semantic indicators
3. Changing a single token recolours the entire application across headers, buttons, cards, tables, charts, and drawers.

---

## 📝 How to Change Labels and UI Copy

All UI text is centralized in a single file: `frontend/src/constants/labels.ts`.
No text strings are hard-coded inside components.

1. Open `frontend/src/constants/labels.ts`.
2. Update the corresponding string or generator function:
   - Header labels & tooltips (`labels.header.*`)
   - KPI titles & tooltips (`labels.kpi.*`)
   - Chart titles, axis labels & waterfall steps (`labels.charts.*`)
   - Filter drawer field names and actions (`labels.filterDrawer.*`)
   - Scenario drawer & modal dialogs (`labels.scenarioDrawer.*`, `labels.dialogs.*`)
   - Table headers, rows & buttons (`labels.table.*`)
   - Toast notifications & error messages (`labels.toasts.*`, `labels.generic.*`)

---

## 📊 How to Replace Master Data

All hierarchical planning entities, months, targets, and seed scenarios reside in a single file: `backend/src/data/masterData.json`.

1. Open `backend/src/data/masterData.json`.
2. Update or replace:
   - `months`: Array of 12 month strings (e.g. `["Jan 2026", ..., "Dec 2026"]`)
   - `currentMonthIndex`: Index dividing past actuals from future forecast (e.g. `5` for Jun)
   - `targets`: Top-level baseline, forecast adjustments, growth targets, and totals
   - `items`: Hierarchical products with `businessUnit`, `category`, `brand`, `product`, `customerGroup`, `customer`, `pastActuals`, and `definitions` (`actualFcst`, `opportunity`, `risk`)
   - `scenarios`: Seed scenarios with initial status and timestamps
3. All KPIs, chart time series, stacked bars, waterfall steps, treemap hierarchy, table rows, and filter options are derived directly from `masterData.json`, ensuring consistent totals across every view.

---

## 🛠 Troubleshooting

### Empty screen / no data checklist

| # | Check | Fix |
|---|-------|-----|
| 1 | **Back-end health** | `curl http://localhost:5001/api/health` → should return `{"status":"ok"}`. If it fails, start the back-end: `cd backend && npm run dev`. |
| 2 | **API URL env var** | The front-end reads `VITE_API_URL` (defaults to `http://localhost:5001/api`). If the back-end runs on a different port, create `frontend/.env.local` with `VITE_API_URL=http://localhost:<port>/api`. |
| 3 | **Ports in use** | If port 5001 or 3000 is taken, change them in `backend/src/index.ts` and `frontend/vite.config.ts`, then update `VITE_API_URL`. |
| 4 | **Stale browser state / logged-out session** | Open DevTools → Application → Local Storage → clear all keys for `localhost:3000`, then hard-refresh (`Ctrl+Shift+R`). Alternatively click **Log out** in the app header and log back in (`amy.chen` / `password123`). |
| 5 | **CORS error in console** | Ensure `VITE_API_URL` does not have a trailing slash, and the back-end `cors` config in `backend/src/index.ts` lists `http://localhost:3000`. |
| 6 | **Charts show "Something went wrong"** | Click the **Retry** button on each chart card. If errors persist, check the browser Network tab for 4xx/5xx responses and restart the back-end. |

### Quick start (both servers at once)

```bash
# From the repo root:
npm install          # installs concurrently
npm run dev          # starts backend (port 5001) + frontend (port 3000) together
```
