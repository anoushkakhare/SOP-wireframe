import {
  Database,
  BarChart2,
  ShieldCheck,
  Sparkles,
  Package,
  CheckSquare,
  LucideIcon,
} from 'lucide-react';
import { create } from 'zustand';
import { useDataReviewPipeline, useDataReviewReadiness } from '../../hooks/useDataReview';

export interface DataReviewSection {
  id: 'pipeline' | 'review' | 'validation' | 'innovation' | 'packs' | 'signoff' | string;
  n: number;
  label: string;
  short: string;
  icon: LucideIcon;
}

export const SECTIONS: DataReviewSection[] = [
  { id: 'pipeline', n: 1, label: 'Integration pipeline', short: 'Pipeline', icon: Database },
  { id: 'review', n: 2, label: 'Data review', short: 'Review', icon: BarChart2 },
  { id: 'validation', n: 3, label: 'Data validation', short: 'Validation', icon: ShieldCheck },
  { id: 'innovation', n: 4, label: 'Innovation', short: 'Innovation', icon: Sparkles },
  { id: 'packs', n: 5, label: 'Special packs', short: 'Packs', icon: Package },
  { id: 'signoff', n: 6, label: 'Sign-off', short: 'Sign-off', icon: CheckSquare },
];

export type SectionStatusType = 'done' | 'attention' | 'blocked' | 'not_started';

export interface SectionStatus {
  status: SectionStatusType;
  detail: string;
  isLocked?: boolean;
}

export const statusDotColor = (status: SectionStatusType): string => {
  switch (status) {
    case 'done':
      return 'bg-emerald-500';
    case 'attention':
      return 'bg-amber-500';
    case 'blocked':
      return 'bg-rose-500';
    case 'not_started':
    default:
      return 'bg-gray-400';
  }
};

interface NavStore {
  activeSectionId: string;
  setActiveSectionId: (id: string) => void;
}

export const useDataReviewNavStore = create<NavStore>((set) => ({
  activeSectionId: (typeof window !== 'undefined' && window.location.hash.slice(1)) || 'pipeline',
  setActiveSectionId: (id) => set({ activeSectionId: id }),
}));

export const scrollToSection = (sectionId: string) => {
  window.dispatchEvent(new CustomEvent('sop-data-review-nav-click', { detail: sectionId }));
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  useDataReviewNavStore.getState().setActiveSectionId(sectionId);
  if (typeof window !== 'undefined') {
    window.history.replaceState(null, '', `#${sectionId}`);
  }
};

export function useSectionStatus(): {
  statuses: Record<string, SectionStatus>;
  getStatus: (id: string) => SectionStatus;
  hasBlockers: boolean;
  isLoading: boolean;
} {
  const { data: readiness, isLoading: isReadinessLoading } = useDataReviewReadiness();
  const { data: pipeline = [], isLoading: isPipelineLoading } = useDataReviewPipeline();

  const checklist = readiness?.checklist || [];
  const blockingItems = readiness?.blockingItems || [];
  const signedOff = Boolean(readiness?.signedOff);

  // 1. Pipeline status
  const feedsLoadedItem = checklist.find((c) => c.id === 'feeds_loaded');
  const totalFeeds = pipeline.length || 5;
  const loadedFeeds =
    pipeline.length > 0
      ? pipeline.filter((f) => f.status === 'loaded').length
      : feedsLoadedItem?.checked
      ? 5
      : parseInt(feedsLoadedItem?.details?.match(/(\d+)\/5/)?.[1] || '3', 10);

  const hasDelayedOrFailed =
    pipeline.length > 0
      ? pipeline.some((f) => f.status === 'delayed' || f.status === 'failed')
      : blockingItems.some(
          (b) => b.toLowerCase().includes('delayed') || b.toLowerCase().includes('failed')
        );

  let pipelineStatus: SectionStatusType = 'not_started';
  if (loadedFeeds === totalFeeds && totalFeeds > 0) {
    pipelineStatus = 'done';
  } else if (hasDelayedOrFailed) {
    pipelineStatus = 'blocked';
  } else if (loadedFeeds > 0) {
    pipelineStatus = 'attention';
  }
  const pipelineDetail = `${loadedFeeds} of ${totalFeeds} feeds loaded`;

  // 2. Review status
  let reviewStatus: SectionStatusType = 'not_started';
  let reviewDetail = 'Pending review';
  if (loadedFeeds === totalFeeds) {
    reviewStatus = 'done';
    reviewDetail = 'Review complete';
  } else if (pipelineStatus === 'blocked') {
    reviewStatus = 'blocked';
    reviewDetail = 'Awaiting pipeline fix';
  } else if (loadedFeeds > 0) {
    reviewStatus = 'attention';
    reviewDetail = 'Review in progress';
  }

  // 3. Validation status
  const mappingGapsItem = checklist.find((c) => c.id === 'mapping_gaps');
  const nullValuesItem = checklist.find((c) => c.id === 'null_values');
  const mappingGapsCount = parseInt(mappingGapsItem?.label?.match(/\d+/)?.[0] || '0', 10);
  const nullValuesCount = parseInt(nullValuesItem?.label?.match(/\d+/)?.[0] || '0', 10);
  const openIssues = mappingGapsCount + nullValuesCount;

  let validationStatus: SectionStatusType = 'not_started';
  let validationDetail = '0 open issues';
  if (mappingGapsItem || nullValuesItem) {
    if (openIssues === 0) {
      validationStatus = 'done';
      validationDetail = '0 open issues';
    } else {
      validationStatus = 'attention';
      validationDetail = `${openIssues} open ${openIssues === 1 ? 'issue' : 'issues'}`;
    }
  }

  // 4. Innovation status
  const innovationItem = checklist.find((c) => c.id === 'innovation_reviewed');
  const isInnovationDone = Boolean(innovationItem?.checked);
  const innovationStatus: SectionStatusType = isInnovationDone ? 'done' : 'attention';
  const innovationDetail = isInnovationDone ? 'Reviewed' : 'Pending review';

  // 5. Special packs status
  const comboItem = checklist.find((c) => c.id === 'combo_packs_reviewed');
  const isPacksDone = Boolean(comboItem?.checked);
  const packsStatus: SectionStatusType = isPacksDone ? 'done' : 'attention';
  const packsDetail = isPacksDone ? 'Reviewed' : 'Pending review';

  // 6. Sign-off status
  const hasBlockers = blockingItems.length > 0;
  let signoffStatus: SectionStatusType = 'not_started';
  let signoffDetail = 'Complete sections 1-5 first';
  let isSignoffLocked = false;

  if (signedOff) {
    signoffStatus = 'done';
    signoffDetail = `Signed off by ${readiness?.signoff?.signedBy || 'Demand Planner'}`;
    isSignoffLocked = false;
  } else if (!hasBlockers) {
    signoffStatus = 'attention';
    signoffDetail = 'Ready for sign-off';
    isSignoffLocked = false;
  } else {
    signoffStatus = 'blocked';
    signoffDetail = 'Complete sections 1-5 first';
    isSignoffLocked = true;
  }

  const statuses: Record<string, SectionStatus> = {
    pipeline: { status: pipelineStatus, detail: pipelineDetail },
    review: { status: reviewStatus, detail: reviewDetail },
    validation: { status: validationStatus, detail: validationDetail },
    innovation: { status: innovationStatus, detail: innovationDetail },
    packs: { status: packsStatus, detail: packsDetail },
    signoff: { status: signoffStatus, detail: signoffDetail, isLocked: isSignoffLocked },
  };

  const getStatus = (id: string): SectionStatus =>
    statuses[id] || { status: 'not_started', detail: '' };

  return {
    statuses,
    getStatus,
    hasBlockers,
    isLoading: isReadinessLoading || isPipelineLoading,
  };
}
