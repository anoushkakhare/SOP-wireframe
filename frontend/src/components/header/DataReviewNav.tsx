import React from 'react';
import { Lock } from 'lucide-react';
import {
  SECTIONS,
  statusDotColor,
  useDataReviewNavStore,
  useSectionStatus,
  scrollToSection,
} from '../../pages/dataReview/sections';

export const DataReviewNav: React.FC = () => {
  const activeSectionId = useDataReviewNavStore((s) => s.activeSectionId);
  const { statuses } = useSectionStatus();

  return (
    <nav aria-label="Data review sections navigation" className="flex items-center justify-center">
      {/* Below 768px: Jump to section select */}
      <div className="flex md:hidden items-center">
        <label htmlFor="data-review-jump-select" className="sr-only">
          Jump to section
        </label>
        <select
          id="data-review-jump-select"
          aria-label="Jump to section"
          value={activeSectionId}
          onChange={(e) => scrollToSection(e.target.value)}
          className="bg-primary-900/90 text-white text-xs font-medium rounded-md px-2.5 py-1.5 border border-white/20 focus:outline-none focus:ring-1 focus:ring-white cursor-pointer"
        >
          {SECTIONS.map((section) => {
            const secStatus = statuses[section.id];
            return (
              <option key={section.id} value={section.id} className="bg-primary-900 text-white">
                {section.n}. {section.short} {secStatus?.detail ? `(${secStatus.detail})` : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* 768px and up: Numbered Stepper */}
      <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
        {SECTIONS.map((section, idx) => {
          const isActive = activeSectionId === section.id;
          const secStatus = statuses[section.id] || { status: 'not_started', detail: '' };
          const isLocked = section.id === 'signoff' && secStatus.isLocked;

          return (
            <React.Fragment key={section.id}>
              <button
                type="button"
                onClick={() => scrollToSection(section.id)}
                aria-current={isActive ? 'true' : undefined}
                title={isLocked ? 'Complete sections 1-5 first' : secStatus.detail}
                className={`group flex items-center gap-1.5 px-2 py-1 rounded transition-all cursor-pointer relative focus-visible:ring-2 focus-visible:ring-white focus:outline-none ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
              >
                {/* Number badge */}
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-white text-primary-700 shadow-xs'
                      : 'bg-white/20 text-white group-hover:bg-white/30'
                  }`}
                >
                  {section.n}
                </span>

                {/* Label: full label >= 1200px, short label < 1200px */}
                <span className="text-xs whitespace-nowrap hidden min-[1200px]:inline">
                  {section.label}
                </span>
                <span className="text-xs whitespace-nowrap inline min-[1200px]:hidden">
                  {section.short}
                </span>

                {/* Status dot */}
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${statusDotColor(secStatus.status)}`}
                  title={secStatus.detail}
                />

                {/* Lock icon for sign-off if blocked */}
                {isLocked && (
                  <span title="Complete sections 1-5 first" className="inline-flex items-center">
                    <Lock
                      className="w-3 h-3 text-amber-300 shrink-0 ml-0.5"
                      aria-label="Locked: Complete sections 1-5 first"
                    />
                  </span>
                )}

                {/* Active indicator underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-white rounded-full" />
                )}
              </button>

              {idx < SECTIONS.length - 1 && (
                <span className="text-white/35 text-xs select-none px-0.5" aria-hidden="true">
                  ›
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
