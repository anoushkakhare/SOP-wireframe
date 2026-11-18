import React, { useEffect, useState } from 'react';
import { DATA_REVIEW_SECTIONS } from '../../constants/dataReviewSections';

export const DataReviewNav: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>(DATA_REVIEW_SECTIONS[0].id);

  useEffect(() => {
    const handleActive = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveSectionId(customEvent.detail);
      }
    };
    window.addEventListener('sop-data-review-active-section', handleActive);

    // Also observe directly if present on page
    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible sections intersecting
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by highest intersection ratio or top position
          visibleEntries.sort(
            (a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top)
          );
          setActiveSectionId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -40% 0px',
        threshold: [0, 0.2, 0.5],
      }
    );

    DATA_REVIEW_SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener('sop-data-review-active-section', handleActive);
      observer.disconnect();
    };
  }, []);

  const handleNavClick = (sectionId: string) => {
    // Dispatch request event so DataReviewPage can expand the target section if collapsed
    window.dispatchEvent(new CustomEvent('sop-data-review-nav-click', { detail: sectionId }));

    const el = document.getElementById(sectionId);
    if (el) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      setActiveSectionId(sectionId);
    }
  };

  return (
    <nav
      aria-label="Data review sections navigation"
      className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 max-w-[50vw] sm:max-w-[42vw] md:max-w-none"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {DATA_REVIEW_SECTIONS.map((section, idx) => {
        const isActive = activeSectionId === section.id;
        const number = idx + 1;
        const label = `${number} ${section.navLabel}`;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => handleNavClick(section.id)}
            aria-current={isActive ? 'true' : undefined}
            className={`whitespace-nowrap px-2.5 py-1 text-xs font-medium rounded-full transition-all shrink-0 cursor-pointer ${
              isActive
                ? 'bg-white text-primary-700 shadow-xs font-semibold'
                : 'bg-transparent text-white border border-white/30 hover:bg-white/10 hover:border-white/50'
            }`}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
};
