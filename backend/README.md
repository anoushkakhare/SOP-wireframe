# Demand Planner — Backend API

Node.js, Express, and TypeScript backend for the Demand Planner Sales & Operations Planning (S&OP) system.

## Architecture

The backend strictly follows a layered enterprise pattern:
```
routes/  ──>  controllers/  ──>  services/  ──>  repositories/  ──>  data/masterData.json
```

- **Routes (`src/routes/`)**: HTTP route declarations and URL bindings.
- **Controllers (`src/controllers/`)**: Request validation, response shaping, HTTP status codes.
- **Services (`src/services/`)**: Business logic (e.g. scenario uniqueness, role manifest mapping, desegregation calculations).
- **Repositories (`src/repositories/`)**: Abstracted data access layer deriving all views from `src/data/masterData.json`.
- **Middleware (`src/middleware/`)**:
  - `auth.ts`: JWT signature verification and role-based access control (`requireRole`).
  - `delay.ts`: 300ms simulated network latency for realistic UX.
- **Types (`src/types/`)**: TypeScript type definitions shared and mirrored with the frontend.

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticates user by role (`demand_planner` or `leadership`), returns JWT and layout manifest |
| `GET` | `/api/layout?role=` | Retrieves role-specific widget and header manifest |
| `GET` | `/api/meta/options` | Retrieves dropdown options for product levels, customer levels, UOM, and filters |
| `GET` | `/api/kpis` | Retrieves 9 S&OP KPI metrics with level/scenario adjustments |
| `GET` | `/api/charts/forecast-line` | Retrieves 12-month forecast time series with risk/opportunity bounds |
| `GET` | `/api/charts/stacked-bar` | Stacked bar chart data by Customer Group (supports brand or product level) |
| `GET` | `/api/charts/waterfall` | Waterfall steps (Baseline, Demand drivers, Manual adjustment, Final forecast) |
| `GET` | `/api/charts/treemap` | Treemap hierarchy data |
| `GET` | `/api/table` | Tabular planning rows (past actuals, future forecast/opp/risk) |
| `POST` | `/api/table/desegregate` | Desegregates brand rows into product-level rows with calculated variances |
| `GET` | `/api/scenarios` | Lists saved and committed scenarios for the authenticated user |
| `POST` | `/api/scenarios` | Creates a new scenario (validates uniqueness per user) |
| `POST` | `/api/scenarios/:id/commit` | Organization-level commit of a scenario |
| `DELETE`| `/api/scenarios/:id` | Deletes a user scenario |

## How to Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server with live reload:
   ```bash
   npm run dev
   ```
   Runs on `http://localhost:5001`.
3. Typecheck and build:
   ```bash
   npm run build
   ```

## How to Replace Master Data

All master data (hierarchy of business units, categories, brands, products, customer groups, customers, 12-month timeline, targets, and seed scenarios) is maintained in `src/data/masterData.json`.

To replace or extend the data:
1. Open `src/data/masterData.json`.
2. Update the `items` array with real brand/product combinations.
3. Update `targets` and `months` if needed.
4. Repositories automatically compute totals, stacked bar groups, treemap hierarchies, table rows, and filter metadata from this single source.
