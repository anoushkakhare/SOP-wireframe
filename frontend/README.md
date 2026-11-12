# Demand Planner — Frontend Web Application

A responsive Sales & Operations Planning (S&OP) web application built with React 18, TypeScript, Vite, Tailwind CSS, Recharts, TanStack Query, and Zustand.

## Tech Stack & Highlights

- **React 18 + TypeScript + Vite**: Fast build and HMR.
- **Zustand**: Clean modular state management (`authStore`, `headerStore`, `filterStore`, `scenarioStore`, `tableStore`, `uiStore`).
- **TanStack Query (React Query)**: Declarative server state management, caching, automated invalidations, and optimistic updates.
- **Recharts**: Custom responsive charts with indigo brand palette and WCAG AA contrast:
  - Forecast trend: Line chart with indigo shaded band between Risk and Opportunity.
  - Forecast by brand/product and customer group: Stacked bar chart with interactive circular drill-down (▼) and drill-up (▲) buttons and legend.
  - Forecast bridge: Waterfall with floating delta bars.
  - Product mix: Treemap hierarchy with parent brand groups and product tiles.
- **Tailwind CSS + CSS Variables**: Central theme tokens defined in `src/styles/index.css`.
- **Labels File**: Single source of truth for all copy in `src/constants/labels.ts`.
- **Component Registry**: Role-driven UI rendering driven by backend layout manifests.

## Folder Structure

```
frontend/src/
  components/
    layout/     AppShell, StickyHeader, ScrollRegion, Drawer, Modal, ConfirmDialog, Overlay, ToastContainer
    header/     RoleBadge, LabeledSelect, HeaderIconButton, HeaderActions
    kpi/        KpiCard, KpiCardRow
    charts/     ChartCard, FullscreenChartFrame, ForecastLineChart, StackedBarChart, WaterfallChart, TreemapChart
    filters/    FilterDrawer, TimeRangeSlider, MonthPicker, FilterSelect, FilterActions
    scenarios/  ScenarioSelectorDrawer, ScenarioCard, StatusBadge, SaveScenarioModal, CommitConfirmModal
    table/      BottomDock, PlanningTable, TableFloatingButtons, EditableCell, DeltaCell, ModeHint
  constants/    labels.ts (Single source of truth for all UI text)
  pages/        LoginPage, DemandPlannerPage, DevGalleryPage (/dev), NotFound
  roles/        componentRegistry.ts, RoleGuard.tsx
  services/     apiClient.ts, authService.ts, metaService.ts, kpiService.ts, chartService.ts, scenarioService.ts, tableService.ts
  hooks/        useAuth, useKpis, useChartData, useScenarios, useTableData, useFullscreen
  store/        authStore, headerStore, filterStore, scenarioStore, tableStore, uiStore
  utils/        formatters, signColor, dateRange, relativeTime
  types/        TypeScript interfaces mirrored from backend
  styles/       index.css (Central CSS theme variables and custom scrollbars)
```

## Running the Frontend

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
   Runs at `http://localhost:3000`.
3. Run tests:
   ```bash
   npm test
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## How to Change the Theme

All theme tokens are defined as CSS variables in `src/styles/index.css` and exposed via `tailwind.config.js`:
- Open `src/styles/index.css` and update the desired hex values under `:root` (e.g. `--color-primary-700`, `--color-bg-page`, `--color-positive`, etc.).
- Modifying a token recolours the entire application without needing to edit individual components.

## How to Change UI Labels

All copy is stored in `src/constants/labels.ts`:
- Open `src/constants/labels.ts` and modify any text string or message.
- Components reference `labels.*`, ensuring no text is hard-coded.
