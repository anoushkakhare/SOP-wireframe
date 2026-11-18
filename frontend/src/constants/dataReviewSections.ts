export interface DataReviewSectionConfig {
  id: string;
  label: string;
  navLabel: string;
}

export const DATA_REVIEW_SECTIONS: DataReviewSectionConfig[] = [
  { id: 'section-pipeline', label: 'Integration pipeline & schedule', navLabel: 'Pipeline' },
  { id: 'section-data-review', label: 'Data review', navLabel: 'Data review' },
  { id: 'section-validation', label: 'Data validation', navLabel: 'Validation' },
  { id: 'section-innovation', label: 'Innovation', navLabel: 'Innovation' },
  { id: 'section-special-packs', label: 'Special packs', navLabel: 'Special packs' },
  { id: 'section-signoff', label: 'Sign-off', navLabel: 'Sign-off' },
];

export const DATA_REVIEW_TOTAL_STEPS = DATA_REVIEW_SECTIONS.length; // 6
