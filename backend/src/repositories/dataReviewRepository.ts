import dataReviewRaw from '../data/dataReview.json';
import masterDataRaw from '../data/masterData.json';
import {
  ComboPack,
  ComboPackComponent,
  DataReviewFeed,
  DataReviewHistoryItem,
  DataReviewReadinessResponse,
  DataValidationData,
  InnovationProduct,
  MappingGapRow,
  MissingItemRow,
  NullValueRow,
  ReadinessCheckItem,
  SignoffRequest,
  TransactionReviewItem,
  TransactionReviewQueryParams,
  TransactionReviewResponse,
} from '../types';

interface RawFeedTemplate {
  id: string;
  name: string;
  type: 'master' | 'transactional';
  day: number;
  hour: number;
  minute: number;
  status: 'loaded' | 'delayed' | 'pending' | 'failed';
  delayHours?: number;
  loadedDelayMinutes?: number | null;
  rowCount: number | null;
  source: string;
}

interface RawHistoryTemplate {
  feedId: string;
  feedName: string;
  type: 'master' | 'transactional';
  monthOffset: number;
  day: number;
  hour: number;
  status: 'loaded' | 'delayed' | 'pending' | 'failed';
  delayHours: number;
  rowCount: number | null;
  source: string;
}

export class DataReviewRepository {
  private feeds: DataReviewFeed[] = [];
  private history: DataReviewHistoryItem[] = [];
  private additionalCalendarFeeds: Array<{
    id: string;
    name: string;
    type: 'master' | 'transactional';
    date: string;
    status: 'loaded' | 'delayed' | 'pending' | 'failed';
    delayHours: number;
    source: string;
  }> = [];

  private manualChecks = {
    innovationReviewed: false,
    comboPacksReviewed: false,
  };

  private signoffState: {
    signedOff: boolean;
    signedBy: string | null;
    signedAt: string | null;
    cycle: string;
  };

  private validationData: DataValidationData = {
    mappingGaps: {
      count: 25,
      rows: [
        {
          id: 'mg-1',
          transactionCode: 'TX-SKU-99210',
          description: 'Dove Deep Moisture Body Wash 250ml Promo',
          period: '2026-10',
          value: 182500,
          suggestedMaster: 'SKU-DOVE-001 (Dove Deep Moisture 250ml)',
          fixed: false,
        },
        {
          id: 'mg-2',
          transactionCode: 'TX-SKU-99412',
          description: 'Sunsilk Black Shine Shampoo 350ml Bundle',
          period: '2026-10',
          value: 94200,
          suggestedMaster: 'SKU-SUN-004 (Sunsilk Black Shine 350ml)',
          fixed: false,
        },
        {
          id: 'mg-3',
          transactionCode: 'TX-SKU-99508',
          description: 'Lifebuoy Total 100g 3-Pack Multibuy',
          period: '2026-09',
          value: 145000,
          suggestedMaster: 'SKU-LIFE-002 (Lifebuoy Total 100g)',
          fixed: false,
        },
        {
          id: 'mg-4',
          transactionCode: 'TX-SKU-99631',
          description: 'Comfort Fabric Softener Morning Fresh 1L',
          period: '2026-10',
          value: 215800,
          suggestedMaster: 'SKU-COMF-003 (Comfort Morning Fresh 1L)',
          fixed: false,
        },
        {
          id: 'mg-5',
          transactionCode: 'TX-SKU-99784',
          description: 'Surf Excel Matic Top Load 2kg Twin Pack',
          period: '2026-09',
          value: 310400,
          suggestedMaster: 'SKU-SURF-001 (Surf Excel Matic Top Load 2kg)',
          fixed: false,
        },
      ],
    },
    nullValues: {
      count: 5,
      rows: [
        {
          id: 'nv-1',
          column: 'Base Unit Price',
          row: 'Row #1,042 (SAP/BW Actuals)',
          expected: 'Numeric currency > 0',
          fixed: false,
        },
        {
          id: 'nv-2',
          column: 'Customer Region',
          row: 'Row #2,180 (Price Master)',
          expected: 'Valid ISO Region Code',
          fixed: false,
        },
        {
          id: 'nv-3',
          column: 'Units Per Case',
          row: 'Row #3,491 (Product Master)',
          expected: 'Integer > 0',
          fixed: false,
        },
        {
          id: 'nv-4',
          column: 'Historical Volume',
          row: 'Row #4,819 (SAP/BW Actuals)',
          expected: 'Non-negative number',
          fixed: false,
        },
        {
          id: 'nv-5',
          column: 'Currency Code',
          row: 'Row #5,920 (Price Master)',
          expected: 'ISO-4217 3-letter code',
          fixed: false,
        },
      ],
    },
    missingItems: {
      count: 2,
      rows: [
        {
          id: 'mi-1',
          feedId: '4',
          feedName: 'Actuals (SAP/BW)',
          description: 'Missing column: channel_discount_pct in October ingestion feed',
        },
        {
          id: 'mi-2',
          feedId: '5',
          feedName: 'Statistical forecast',
          description: "Missing rows: 4,200 forecast units for APG 'Quick Commerce'",
        },
      ],
    },
  };

  private innovations: InnovationProduct[] = [
    {
      id: 'inn-1',
      code: 'NPD-2026-001',
      name: 'Dove Men+Care Fresh Radiance',
      category: 'Personal Care',
      sopGroup: 'Skin Cleansing',
      brand: 'Dove',
      sourceForecastUnits: ['Dove Deep Moisture 250ml', 'Dove Nourishing Silk 250ml'],
      launchMonth: '2027-01',
      upliftPct: 15.0,
    },
    {
      id: 'inn-2',
      code: 'NPD-2026-002',
      name: 'Lux Botanical Bloom 400ml',
      category: 'Personal Care',
      sopGroup: 'Skin Cleansing',
      brand: 'Lux',
      sourceForecastUnits: ['Lux Velvet Touch 250ml'],
      launchMonth: '2027-02',
      upliftPct: 12.5,
    },
  ];

  private combos: ComboPack[] = [
    {
      id: 'combo-1',
      name: 'Dove Shampoo + Conditioner Duo',
      code: 'COMBO-DOVE-01',
      components: [
        { id: 'comp-1', name: 'Dove Daily Moisture Shampoo 250ml', code: 'SKU-DOVE-SH-250', quantity: 1 },
        { id: 'comp-2', name: 'Dove Daily Moisture Conditioner 250ml', code: 'SKU-DOVE-CD-250', quantity: 1 },
      ],
    },
    {
      id: 'combo-2',
      name: 'Surf Excel + Comfort Combo',
      code: 'COMBO-SURF-02',
      components: [
        { id: 'comp-3', name: 'Surf Excel Easy Wash 1kg', code: 'SKU-SURF-EW-1KG', quantity: 1 },
        { id: 'comp-4', name: 'Comfort Fabric Conditioner 860ml', code: 'SKU-COMF-FC-860', quantity: 1 },
      ],
    },
  ];

  constructor() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    this.signoffState = {
      signedOff: false,
      signedBy: null,
      signedAt: null,
      cycle: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
    };

    this.initializeFeeds(currentYear, currentMonth);
    this.initializeHistory(currentYear, currentMonth);
    this.initializeAdditionalCalendarFeeds(currentYear, currentMonth);
  }

  private formatDateISO(year: number, month: number, day: number, hour: number, minute: number): string {
    const d = new Date(Date.UTC(year, month, day, hour, minute, 0));
    return d.toISOString();
  }

  private initializeFeeds(year: number, month: number) {
    const rawFeeds = (dataReviewRaw as any).feeds as RawFeedTemplate[];
    this.feeds = rawFeeds.map(rf => {
      const expectedDate = this.formatDateISO(year, month, rf.day, rf.hour, rf.minute);
      let loadedAt: string | null = null;
      if (rf.status === 'loaded') {
        const loadedMin = rf.minute + (rf.loadedDelayMinutes || 0);
        loadedAt = this.formatDateISO(year, month, rf.day, rf.hour, loadedMin);
      }

      return {
        id: rf.id,
        name: rf.name,
        type: rf.type,
        expectedDate,
        status: rf.status,
        loadedAt,
        rowCount: rf.rowCount,
        source: rf.source,
        delayHours: rf.delayHours || 0,
      };
    });
  }

  private initializeHistory(year: number, month: number) {
    const rawTemplates = (dataReviewRaw as any).historyTemplates as RawHistoryTemplate[];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    this.history = rawTemplates.map((item, index) => {
      const targetDate = new Date(year, month + item.monthOffset, 1);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      const cycleName = `${monthNames[targetMonth]} ${targetYear}`;

      const expectedDate = this.formatDateISO(targetYear, targetMonth, item.day, item.hour, 0);
      let loadedAt: string | null = null;
      if (item.status === 'loaded') {
        const loadedHour = item.hour + Math.floor(item.delayHours);
        const loadedMinute = Math.round((item.delayHours % 1) * 60);
        loadedAt = this.formatDateISO(targetYear, targetMonth, item.day, loadedHour, loadedMinute);
      }

      return {
        id: `hist-${index + 1}`,
        feedId: item.feedId,
        feedName: item.feedName,
        type: item.type,
        cycle: cycleName,
        expectedDate,
        loadedAt,
        status: item.status,
        delayHours: item.delayHours,
        rowCount: item.rowCount,
        source: item.source,
      };
    });
  }

  private initializeAdditionalCalendarFeeds(year: number, month: number) {
    const addRaw = ((dataReviewRaw as any).scheduledAdditionalFeeds || []) as any[];
    this.additionalCalendarFeeds = addRaw.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      date: this.formatDateISO(year, month, item.day, item.hour, item.minute),
      status: item.status,
      delayHours: item.delayHours || 0,
      source: item.source,
    }));
  }

  getPipeline(): DataReviewFeed[] {
    return [...this.feeds];
  }

  getHistory(): DataReviewHistoryItem[] {
    return [...this.history];
  }

  getCalendarFeeds(): Array<{
    id: string;
    name: string;
    type: 'master' | 'transactional';
    date: string;
    status: 'loaded' | 'delayed' | 'pending' | 'failed';
    loadedAt: string | null;
    delayHours: number;
    rowCount: number | null;
    source: string;
  }> {
    const pipelineItems = this.feeds.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      date: f.expectedDate,
      status: f.status,
      loadedAt: f.loadedAt,
      delayHours: f.delayHours || 0,
      rowCount: f.rowCount,
      source: f.source,
    }));

    const additional = this.additionalCalendarFeeds.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      date: f.date,
      status: f.status,
      loadedAt: null,
      delayHours: f.delayHours,
      rowCount: null,
      source: f.source,
    }));

    return [...pipelineItems, ...additional];
  }

  loadFeed(feedId: string): DataReviewFeed | null {
    const feed = this.feeds.find(f => f.id === feedId);
    if (!feed) return null;

    feed.status = 'loaded';
    feed.loadedAt = new Date().toISOString();
    feed.delayHours = 0;
    if (!feed.rowCount) {
      feed.rowCount = feed.type === 'master' ? 15400 : 485000;
    }

    // Also update in history if present
    const hist = this.history.find(h => h.feedId === feedId && h.cycle.includes(new Date().getFullYear().toString()));
    if (hist) {
      hist.status = 'loaded';
      hist.loadedAt = feed.loadedAt;
      hist.delayHours = 0;
      hist.rowCount = feed.rowCount;
    }

    return { ...feed };
  }

  updateReadiness(patch: { innovationReviewed?: boolean; comboPacksReviewed?: boolean }) {
    if (typeof patch.innovationReviewed === 'boolean') {
      this.manualChecks.innovationReviewed = patch.innovationReviewed;
    }
    if (typeof patch.comboPacksReviewed === 'boolean') {
      this.manualChecks.comboPacksReviewed = patch.comboPacksReviewed;
    }
  }

  getReadiness(): DataReviewReadinessResponse {
    const loadedFeedsCount = this.feeds.filter(f => f.status === 'loaded').length;
    const allFeedsLoaded = loadedFeedsCount === this.feeds.length;
    const missingFeeds = this.feeds.filter(f => f.status !== 'loaded');

    const mappingGapsCount = this.validationData.mappingGaps.count;
    const nullValuesCount = this.validationData.nullValues.count;

    // 7 steps: 5 feeds + 2 manual reviews
    const manualDoneCount =
      (this.manualChecks.innovationReviewed ? 1 : 0) +
      (this.manualChecks.comboPacksReviewed ? 1 : 0);
    const completedSteps = loadedFeedsCount + manualDoneCount;
    const totalSteps = 7;

    const blockingItems: string[] = [];
    if (!allFeedsLoaded) {
      missingFeeds.forEach(mf => {
        blockingItems.push(`${mf.name} feed not loaded (${mf.status})`);
      });
    }
    if (mappingGapsCount > 0) {
      blockingItems.push(`${mappingGapsCount} missing product mappings pending resolution`);
    }
    if (nullValuesCount > 0) {
      blockingItems.push(`${nullValuesCount} null values pending replacement`);
    }
    if (!this.manualChecks.innovationReviewed) {
      blockingItems.push('Innovation review pending');
    }
    if (!this.manualChecks.comboPacksReviewed) {
      blockingItems.push('Combo packs review pending');
    }

    const checklist: ReadinessCheckItem[] = [
      {
        id: 'feeds_loaded',
        label: '5 feeds loaded',
        status: allFeedsLoaded ? 'passed' : 'failed',
        checked: allFeedsLoaded,
        isManual: false,
        details: allFeedsLoaded
          ? 'All 5 feeds successfully ingested'
          : `${loadedFeedsCount}/5 feeds loaded (${missingFeeds.map(f => f.name).join(', ')})`,
      },
      {
        id: 'mapping_gaps',
        label: mappingGapsCount === 0 ? '0 mapping gaps' : `${mappingGapsCount} mapping gaps`,
        status: mappingGapsCount === 0 ? 'passed' : 'failed',
        checked: mappingGapsCount === 0,
        isManual: false,
        details: mappingGapsCount === 0
          ? '0 mapping gaps detected across master hierarchies'
          : `${mappingGapsCount} missing product mappings detected`,
      },
      {
        id: 'null_values',
        label: nullValuesCount === 0 ? '0 null values' : `${nullValuesCount} null values`,
        status: nullValuesCount === 0 ? 'passed' : 'failed',
        checked: nullValuesCount === 0,
        isManual: false,
        details: nullValuesCount === 0
          ? '0 null values in critical attributes'
          : `${nullValuesCount} null critical values require replacement`,
      },
      {
        id: 'innovation_reviewed',
        label: 'Innovation reviewed',
        status: this.manualChecks.innovationReviewed ? 'passed' : 'pending',
        checked: this.manualChecks.innovationReviewed,
        isManual: true,
        details: 'NPD launches, cannibalisation & phase-ins verified',
      },
      {
        id: 'combo_packs_reviewed',
        label: 'Combo packs reviewed',
        status: this.manualChecks.comboPacksReviewed ? 'passed' : 'pending',
        checked: this.manualChecks.comboPacksReviewed,
        isManual: true,
        details: 'Promotional bundles & special pack BOMs verified',
      },
    ];

    return {
      totalSteps,
      completedSteps,
      signedOff: this.signoffState.signedOff,
      signoff: this.signoffState.signedOff
        ? {
            signedBy: this.signoffState.signedBy || 'Demand Planner',
            signedAt: this.signoffState.signedAt || new Date().toISOString(),
            cycle: this.signoffState.cycle,
          }
        : null,
      checklist,
      blockingItems,
    };
  }

  getValidationData(): DataValidationData {
    return JSON.parse(JSON.stringify(this.validationData));
  }

  fixMappingGap(id: string, fixType: 'master' | 'transaction' = 'master'): DataValidationData {
    const row = this.validationData.mappingGaps.rows.find(r => r.id === id);
    if (row && !row.fixed) {
      row.fixed = true;
      row.fixedType = fixType;
      this.validationData.mappingGaps.count = Math.max(0, this.validationData.mappingGaps.count - 5);
    }
    return this.getValidationData();
  }

  fixAllMappingGaps(): DataValidationData {
    this.validationData.mappingGaps.rows.forEach(r => {
      r.fixed = true;
      r.fixedType = 'master';
    });
    this.validationData.mappingGaps.count = 0;
    return this.getValidationData();
  }

  replaceNullValue(id: string, method: 'zero' | 'mean' | 'mode'): DataValidationData {
    const row = this.validationData.nullValues.rows.find(r => r.id === id);
    if (row && !row.fixed) {
      row.fixed = true;
      row.replacedWith = method;
      this.validationData.nullValues.count = Math.max(0, this.validationData.nullValues.count - 1);
    }
    return this.getValidationData();
  }

  fixAllNullValues(method: 'zero' | 'mean' | 'mode' = 'mean'): DataValidationData {
    this.validationData.nullValues.rows.forEach(r => {
      r.fixed = true;
      r.replacedWith = method;
    });
    this.validationData.nullValues.count = 0;
    return this.getValidationData();
  }

  rerunMissingIntegration(): { success: boolean; pendingFeeds: string[] } {
    const targetFeedIds = ['4', '5'];
    targetFeedIds.forEach(id => {
      const feed = this.feeds.find(f => f.id === id);
      if (feed) {
        feed.status = 'pending';
        feed.loadedAt = null;
        feed.delayHours = 0;
      }
      const hist = this.history.find(h => h.feedId === id && h.cycle.includes(new Date().getFullYear().toString()));
      if (hist) {
        hist.status = 'pending';
        hist.loadedAt = null;
      }
    });
    this.validationData.missingItems.count = 0;
    return { success: true, pendingFeeds: targetFeedIds };
  }

  getInnovations(): InnovationProduct[] {
    return JSON.parse(JSON.stringify(this.innovations));
  }

  addInnovation(product: Omit<InnovationProduct, 'id'>): InnovationProduct {
    const trimmedCode = (product.code || '').trim();
    if (!trimmedCode) {
      const err: any = new Error('Product code is required');
      err.statusCode = 400;
      throw err;
    }
    const exists = this.innovations.some(p => p.code.toLowerCase() === trimmedCode.toLowerCase());
    if (exists) {
      const err: any = new Error(`Innovation product code '${trimmedCode}' must be unique`);
      err.statusCode = 400;
      throw err;
    }
    if (!product.sourceForecastUnits || product.sourceForecastUnits.length === 0) {
      const err: any = new Error('At least one source forecast unit must be selected');
      err.statusCode = 400;
      throw err;
    }

    const newProd: InnovationProduct = {
      id: `inn-${Date.now()}`,
      code: trimmedCode,
      name: product.name.trim(),
      category: product.category,
      sopGroup: product.sopGroup,
      brand: product.brand,
      sourceForecastUnits: [...product.sourceForecastUnits],
      launchMonth: product.launchMonth,
      upliftPct: Number(product.upliftPct) || 0,
    };
    this.innovations.push(newProd);
    return { ...newProd };
  }

  deleteInnovation(id: string): boolean {
    const idx = this.innovations.findIndex(i => i.id === id);
    if (idx === -1) return false;
    this.innovations.splice(idx, 1);
    return true;
  }

  getCombos(): ComboPack[] {
    return JSON.parse(JSON.stringify(this.combos));
  }

  createCombo(combo: Omit<ComboPack, 'id'>): ComboPack {
    const trimmedCode = (combo.code || '').trim();
    const trimmedName = (combo.name || '').trim();
    if (!trimmedName || !trimmedCode) {
      const err: any = new Error('Name and code are required for combo pack');
      err.statusCode = 400;
      throw err;
    }
    const newCombo: ComboPack = {
      id: `combo-${Date.now()}`,
      name: trimmedName,
      code: trimmedCode,
      components: (combo.components || []).map((c, i) => ({
        id: c.id || `comp-${Date.now()}-${i}`,
        name: c.name,
        code: c.code,
        quantity: Math.max(1, Number(c.quantity) || 1),
      })),
    };
    this.combos.push(newCombo);
    return { ...newCombo };
  }

  updateCombo(id: string, patch: Partial<ComboPack>): ComboPack | null {
    const combo = this.combos.find(c => c.id === id);
    if (!combo) return null;
    if (patch.name) combo.name = patch.name.trim();
    if (patch.code) combo.code = patch.code.trim();
    if (patch.components) {
      combo.components = patch.components.map((c, i) => ({
        id: c.id || `comp-${Date.now()}-${i}`,
        name: c.name,
        code: c.code,
        quantity: Math.max(1, Number(c.quantity) || 1),
      }));
    }
    return { ...combo };
  }

  deleteCombo(id: string): boolean {
    const idx = this.combos.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.combos.splice(idx, 1);
    return true;
  }

  signoff(req: SignoffRequest, defaultUserName: string = 'Demand Planner'): DataReviewReadinessResponse {
    const readiness = this.getReadiness();
    if (readiness.blockingItems.length > 0) {
      const err: any = new Error(
        `Cannot sign off: readiness checks incomplete. ${readiness.blockingItems.join(', ')}`
      );
      err.statusCode = 400;
      err.blockingItems = readiness.blockingItems;
      throw err;
    }

    this.signoffState.signedOff = true;
    this.signoffState.signedBy = req.signedBy || defaultUserName;
    this.signoffState.signedAt = req.signedAt || new Date().toISOString();
    if (req.cycle) {
      this.signoffState.cycle = req.cycle;
    }

    return this.getReadiness();
  }

  reopen(): DataReviewReadinessResponse {
    this.signoffState.signedOff = false;
    this.signoffState.signedBy = null;
    this.signoffState.signedAt = null;
    return this.getReadiness();
  }

  getTransactions(query: TransactionReviewQueryParams = {}): TransactionReviewResponse {
    const measure = query.measure || 'value';
    const groupBy = query.groupBy || 'category';

    const allMonths: string[] = masterDataRaw.months || [];
    let startIdx = 0;
    let endIdx = allMonths.length - 1;

    if (query.from) {
      const idx = allMonths.indexOf(query.from);
      if (idx !== -1) startIdx = idx;
    }
    if (query.to) {
      const idx = allMonths.indexOf(query.to);
      if (idx !== -1) endIdx = idx;
    }
    if (startIdx > endIdx) {
      const tmp = startIdx;
      startIdx = endIdx;
      endIdx = tmp;
    }

    const periods = allMonths.slice(startIdx, endIdx + 1);

    const items = masterDataRaw.items || [];
    const groupKey = groupBy === 'sop' ? 'sop' : groupBy === 'brand' ? 'brand' : 'category';

    const groupSet = new Set<string>();
    for (const item of items) {
      const val = (item as any)[groupKey];
      if (val) groupSet.add(val);
    }
    const groups = Array.from(groupSet);

    const itemsByGroup = new Map<string, typeof items>();
    for (const g of groups) {
      itemsByGroup.set(g, []);
    }
    for (const item of items) {
      const g = (item as any)[groupKey];
      if (g && itemsByGroup.has(g)) {
        itemsByGroup.get(g)!.push(item);
      }
    }

    const resultItems: TransactionReviewItem[] = [];
    let totalValue = 0;
    let totalRows = 0;
    let gapCount = 0;
    let spikeCount = 0;

    for (const p of periods) {
      for (const g of groups) {
        const groupItems = itemsByGroup.get(g) || [];
        let baseUnits = 0;
        let baseCases = 0;
        let baseVal = 0;
        let baseRows = 0;

        for (const it of groupItems) {
          const u =
            (it.pastActuals as Record<string, number>)?.[p] ||
            (it.weeklyActuals
              ? Math.round(
                  Object.values(it.weeklyActuals)
                    .slice(0, 4)
                    .reduce((a: number, b: any) => a + Number(b), 0)
                )
              : 1000);
          baseUnits += u;
          const upc = it.unitsPerCase || 12;
          baseCases += Math.round(u / upc);
          const pr = it.price || 150;
          baseVal += Math.round(u * pr);
          baseRows += Math.round(u / 20 + 35);
        }

        let finalValue = measure === 'cases' ? baseCases : measure === 'units' ? baseUnits : baseVal;
        let finalRows = baseRows;
        let isAnomaly: 'gap' | 'spike' | undefined;

        // Seeded gap: in Sep 25 for Home Care (or Fabric Solutions / Surf Excel)
        const isGapTarget =
          p === 'Sep 25' &&
          (g === 'Home Care' || g === 'Fabric Solutions' || g === 'Surf Excel');

        // Seeded spike: in Mar 26 for Beauty & Wellbeing (or Hair Care / Dove)
        const isSpikeTarget =
          p === 'Mar 26' &&
          (g === 'Beauty & Wellbeing' || g === 'Hair Care' || g === 'Dove');

        if (isGapTarget) {
          finalValue = 0;
          finalRows = 0;
          isAnomaly = 'gap';
          gapCount++;
        } else if (isSpikeTarget) {
          finalValue = Math.round(finalValue * 2.35);
          finalRows = Math.round(finalRows * 2.5);
          isAnomaly = 'spike';
          spikeCount++;
        }

        totalValue += finalValue;
        totalRows += finalRows;

        resultItems.push({
          period: p,
          group: g,
          value: finalValue,
          rowCount: finalRows,
          isAnomaly,
        });
      }
    }

    return {
      items: resultItems,
      periods,
      groups,
      measure,
      groupBy,
      summary: {
        totalValue,
        totalRows,
        gapCount,
        spikeCount,
      },
    };
  }
}

export const dataReviewRepository = new DataReviewRepository();

