/**
 * labels.ts – Single source of truth for all UI text strings.
 *
 * HOW TO CHANGE LABELS
 * ─────────────────────
 * Edit the values in this file. No text string should be hard-coded in
 * any component. Import the `labels` object where needed:
 *
 *   import { labels } from '../../constants/labels';
 *
 * Functions (e.g. `placeholder`, `selectedCount`) accept dynamic params
 * and return a formatted string.
 */

export const labels = {
  // ─── App shell ────────────────────────────────────────────────────────
  app: {
    name: 'S&OP Demand Planner',
    loadingPage: 'Loading…',
  },

  // ─── Header ───────────────────────────────────────────────────────────
  header: {
    defaultUserName: 'Nishtha Agarwal',
    /** Shown below the user's name in the left badge */
    avatarRole: 'Demand Planner',
    mobileMenuToggle: 'Toggle controls menu',

    selects: {
      productView:  'Product view',
      customerView: 'Customer view',
      measure:      'Measure',
      productViewOptions: {
        brand:   'Brand',
        product: 'Product',
      },
      customerViewOptions: {
        customer_group: 'Customer group',
        customer:       'Customer',
      },
      measureOptions: {
        cases: 'Cases',
        units: 'Units',
        value: 'Value',
      },
    },

    /** Icon-button tooltips & aria-labels */
    actions: {
      saveScenario:   'Save scenario',
      commitScenario: 'Commit scenario',
      tableView:      'Table view',
      filters:        'Filters',
      scenarios:      'Scenarios',
    },
  },

  // ─── KPIs ─────────────────────────────────────────────────────────────
  kpi: {
    totalForecast:     'Total forecast',
    risk:              'Risk',
    opportunity:       'Opportunity',
    opportunityRisk:   'Opportunity & Risk',
    fyGrowth:          'FY growth',
    ytdGrowth:         'YTD growth',
    ytgGrowth:         'YTG growth',
    fyGrowthRO:        'FY growth (R&O)',
    ytgGrowthRO:       'YTG growth (R&O)',
    vsLastYear:        'vs last year',

    /** One-line tooltip definitions */
    tooltips: {
      totalForecast:   'Sum of all forecast units for the full fiscal year.',
      risk:            'Downside volume risk relative to the base forecast.',
      opportunity:     'Upside volume opportunity relative to the base forecast.',
      opportunityRisk: 'Upside volume opportunity and downside volume risk relative to the base forecast.',
      fyGrowth:        'Year-on-year growth for the full fiscal year.',
      ytdGrowth:       'Year-on-year growth from Jan to the latest closed month.',
      ytgGrowth:       'Year-on-year growth for the remaining months of the year.',
      fyGrowthRO:      'FY growth including risk and opportunity adjustments.',
      ytgGrowthRO:     'YTG growth including risk and opportunity adjustments.',
    },
  },

  // ─── Charts ───────────────────────────────────────────────────────────
  charts: {
    forecastTrend:        'Forecast trend',
    /** Dynamic: "Forecast by Brand and APG" */
    forecastBy:  (level: string) =>
      `Forecast by ${level} and APG`,
    forecastBridge:       'Forecast bridge',
    productMix:           'Product mix',

    axisForecast:         (measure: string = 'units') => `Forecast (${measure})`,

    fullscreenExpand:     'Expand',
    fullscreenExit:       'Exit fullscreen',
    drillDown:            'Drill down to products',
    drillUp:              'Drill up to brands',

    /** Tooltip labels */
    tooltip: {
      bestCase:   'Best case (opportunity)',
      forecast:   'Forecast',
      worstCase:  'Worst case (risk)',
      total:      'Total',
      value:      'Value',
      brand:      'Brand',
    },

    /** Legend / series names */
    series: {
      band:            'Opportunity / risk band',
      forecastLine:    'Forecast',
    },

    /** Waterfall step labels */
    waterfall: {
      baseline:          'Baseline',
      demandDrivers:     'Demand drivers',
      manualAdjustment:  'Manual adjustment',
      finalForecast:     'Final forecast',
    },

    /** Empty / loading / error states */
    loading:        'Loading…',
    noData:         'No data for the selected filters.',
    error:          'Something went wrong. Try again.',
  },

  // ─── Filter drawer ────────────────────────────────────────────────────
  filterDrawer: {
    title:  'Filters',
    fields: {
      timeRange:     'Time range',
      startMonth:    'Start month',
      endMonth:      'End month',
      category:      'Category',
      brand:         'Brand',
      product:       'Product',
      customerGroup: 'Customer group',
      customer:      'Customer',
      businessUnit:  'Business unit',
    },
    placeholder:   (field: string) => `All ${field}s`,
    selectedCount: (n: number)     => `${n} selected`,
    actions: {
      apply: 'Apply filters',
      reset: 'Reset',
      close: 'Close',
    },
  },

  // ─── Scenario drawer ──────────────────────────────────────────────────
  scenarioDrawer: {
    title:      'Scenarios',
    emptyState: 'No saved scenarios yet.',
    loading:    'Loading scenarios…',
    card: {
      modifiedAgo:  (rel: string) => `Modified ${rel}`,
      lastModified: 'Last modified',
    },
    actions: {
      edit:   'Edit scenario',
      delete: 'Delete scenario',
    },
  },

  // ─── Dialogs / modals ─────────────────────────────────────────────────
  dialogs: {
    save: {
      title:              'Save scenario',
      fieldLabel:         'Scenario name',
      fieldPlaceholder:   'e.g. Festive season upside',
      required:           'Enter a scenario name.',
      duplicate:          'A scenario with this name already exists.',
      saving:             'Saving…',
      submit:             'Save',
      cancel:             'Cancel',
    },
    commit: {
      title:    'Commit scenario?',
      body:     'This will update forecast numbers and visuals for the entire organisation.',
      target:   'Target scenario',
      confirm:  'Commit',
      cancel:   'Cancel',
      loading:  'Committing…',
    },
    delete: {
      title:   'Delete this scenario?',
      body:    (name: string) => `"${name}" will be permanently removed.`,
      confirm: 'Delete',
      cancel:  'Cancel',
    },
    discard: {
      title:   'Discard changes?',
      body:    'Your unsaved edits will be lost.',
      confirm: 'Discard',
      cancel:  'Keep editing',
    },
  },

  // ─── Table ────────────────────────────────────────────────────────────
  table: {
    columns: {
      category:      'Category',
      brand:         'Brand',
      product:       'Product',
      customerGroup: 'Customer group',
      customer:      'Customer',
      measure:       'Measure',
    },
    rows: {
      opportunity:  'Opportunity',
      forecast:     'Forecast',
      actual:       'Actual',
      risk:         'Risk',
    },
    modeChip: {
      view:      'View mode',
      edit:      'Edit mode',
      delta:     'Change log',
    },
    floatingButtons: {
      editForecast:    'Edit forecast',
      switchToView:    'Switch to view',
      showChangeLog:   'Show change log',
      hideChangeLog:   'Hide change log',
      saveChanges:     'Save changes',
      closeTable:      'Close table',
    },
    drillDownBanner:  'Showing disaggregated values at product level.',
    noData:           'No planning records for the current selection.',
    loading:          'Loading table…',
    error:            'Something went wrong. Try again.',
  },

  // ─── Status badges ────────────────────────────────────────────────────
  status: {
    saved:     'Saved',
    committed: 'Committed',
  },

  // ─── Toast notifications ─────────────────────────────────────────────
  toasts: {
    saveSuccess:    'Scenario saved.',
    saveError:      'Could not save scenario. Try again.',
    commitSuccess:  'Scenario committed successfully.',
    commitError:    'Could not commit scenario. Try again.',
    deleteSuccess:  'Scenario deleted.',
    deleteError:    'Could not delete scenario. Try again.',
    editSaved:      'Forecast edits saved.',
  },

  // ─── Auth / login ─────────────────────────────────────────────────────
  auth: {
    loginTitle:  'Sign in',
    emailLabel:  'Email',
    passLabel:   'Password',
    submit:      'Sign in',
    loggingIn:   'Signing in…',
    error:       'Invalid email or password.',
  },

  // ─── Generic empty / error states ────────────────────────────────────
  generic: {
    noData:   'No data for the selected filters.',
    error:    'Something went wrong. Try again.',
    loading:  'Loading…',
  },
} as const;
