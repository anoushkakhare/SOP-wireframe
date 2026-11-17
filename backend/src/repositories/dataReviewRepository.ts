import dataReviewRaw from '../data/dataReview.json';
import masterDataRaw from '../data/masterData.json';
import {
  DataReviewFeed,
  DataReviewHistoryItem,
  DataReviewReadinessResponse,
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

    const mappingGapsCount = 0;
    const nullValuesCount = 0;

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
        label: '0 mapping gaps',
        status: 'passed',
        checked: true,
        isManual: false,
        details: '0 mapping gaps detected across master hierarchies',
      },
      {
        id: 'null_values',
        label: '0 null values',
        status: 'passed',
        checked: true,
        isManual: false,
        details: '0 null values in critical attributes',
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

