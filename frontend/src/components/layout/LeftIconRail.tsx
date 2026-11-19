import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const NAV_RAIL_WIDTH = 72;

interface NavPageItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  enabled: boolean;
}

export const LeftIconRail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { layoutManifest } = useAuthStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const defaultPages: NavPageItem[] = [
    {
      id: 'dashboard',
      label: 'Summary dashboard',
      path: '/dashboard',
      icon: 'dashboard',
      enabled: true,
    },
    {
      id: 'data-review',
      label: 'Data review',
      path: '/data-review',
      icon: 'data-review',
      enabled: true,
    },
  ];

  // Driven by the role layout manifest so roles can hide pages
  const manifestPages = layoutManifest?.pages;
  const pages: NavPageItem[] = (
    manifestPages && manifestPages.length > 0 ? manifestPages : defaultPages
  ).filter(p => p.enabled !== false);

  const handleNavigate = (path: string) => {
    localStorage.setItem('unilever_last_page', path);
    navigate(path);
  };

  const getDisplayLabel = (label: string, id: string) => {
    if (id === 'dashboard' || label.toLowerCase().includes('dashboard') || label.toLowerCase().includes('summary')) return 'Summary';
    if (id === 'data-review' || label.toLowerCase().includes('review')) return 'Data review';
    return label;
  };

  const getFullPageName = (label: string, id: string) => {
    if (id === 'dashboard' || label.toLowerCase().includes('dashboard') || label.toLowerCase().includes('summary')) return 'Summary dashboard';
    if (id === 'data-review' || label.toLowerCase().includes('review')) return 'Data review';
    return label;
  };

  const renderIcon = (iconName: string, isActive: boolean) => {
    const iconClass = `w-[22px] h-[22px] transition-colors shrink-0 ${
      isActive ? 'text-[#0F0E9A]' : 'text-[#5A6078]'
    }`;
    switch (iconName) {
      case 'dashboard':
        return <LayoutDashboard className={iconClass} />;
      case 'data-review':
      default:
        return <Database className={iconClass} />;
    }
  };

  return (
    <>
      {/* Desktop Left Icon Rail: 72px */}
      <aside
        className="hidden md:flex flex-col items-center fixed top-0 bottom-0 left-0 w-[72px] min-w-[72px] bg-[#FFFFFF] border-r border-[#E0E3EC] select-none z-20"
        aria-label="Sidebar Navigation"
      >
        {/* Unilever Logo: height equals header bar (56px), centred, 12px padding */}
        <div className="flex items-center justify-center h-[56px] w-full p-3 shrink-0 border-b border-[#E0E3EC]">
          <div
            role="img"
            aria-label="Unilever"
            className="w-[40px] h-[44px] max-h-[44px] max-w-[48px]"
            style={{
              backgroundColor: '#0F0E9A',
              WebkitMask: 'url(/unilever-logo.png) center/contain no-repeat',
              WebkitMaskImage: 'url(/unilever-logo.png)',
              WebkitMaskPosition: 'center',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              mask: 'url(/unilever-logo.png) center/contain no-repeat',
              maskImage: 'url(/unilever-logo.png)',
              maskPosition: 'center',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
            }}
          />
        </div>

        {/* Nav Items (12px between them) */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center gap-3 w-full py-2 no-scrollbar">
          {pages.map(page => {
            const isActive =
              location.pathname.startsWith(page.path) ||
              (page.path === '/dashboard' && location.pathname === '/');
            const displayLabel = getDisplayLabel(page.label, page.id);
            const fullPageName = getFullPageName(page.label, page.id);

            return (
              <div
                key={page.id}
                className="relative flex items-center justify-center w-full px-1.5"
                onMouseEnter={() => setHoveredId(page.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <button
                  type="button"
                  onClick={() => handleNavigate(page.path)}
                  className={`w-full min-h-[60px] py-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer relative focus-visible:ring-2 focus-visible:ring-[#0F0E9A] focus:outline-none ${
                    isActive
                      ? 'bg-[#F3F3FB] text-[#0F0E9A]'
                      : 'text-[#5A6078] hover:bg-[#F3F3FB]'
                  }`}
                  aria-label={fullPageName}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Left active indicator bar: 3px primary */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#0F0E9A] rounded-r" />
                  )}
                  {renderIcon(page.icon, isActive)}
                  <span
                    className="text-[10.5px] font-medium leading-[1.15] text-center px-1 whitespace-normal line-clamp-2 w-full [overflow-wrap:normal] hyphens-none"
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 500,
                      lineHeight: 1.15,
                      paddingLeft: '4px',
                      paddingRight: '4px',
                      whiteSpace: 'normal',
                      overflowWrap: 'normal',
                      hyphens: 'none',
                      textAlign: 'center',
                    }}
                  >
                    {displayLabel}
                  </span>
                </button>

                {/* Label on Hover: floating tooltip to the right */}
                {hoveredId === page.id && (
                  <div className="absolute left-[76px] top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap z-50 pointer-events-none animate-in fade-in slide-in-from-left-1 duration-150">
                    {fullPageName}
                    {/* Tooltip arrow */}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-14 pb-[env(safe-area-inset-bottom)] bg-[#FFFFFF] border-t border-[#E0E3EC] flex items-center justify-around z-40 px-2"
        aria-label="Mobile Navigation"
      >
        {pages.map(page => {
          const isActive =
            location.pathname === page.path ||
            (page.path === '/dashboard' && location.pathname === '/');
          const displayLabel = getDisplayLabel(page.label, page.id);
          const fullPageName = getFullPageName(page.label, page.id);

          return (
            <button
              key={page.id}
              type="button"
              onClick={() => handleNavigate(page.path)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? 'text-[#0F0E9A] font-semibold' : 'text-[#5A6078] hover:bg-[#F3F3FB]'
              }`}
              aria-label={fullPageName}
              aria-current={isActive ? 'page' : undefined}
            >
              {renderIcon(page.icon, isActive)}
              <span className="text-[10px] mt-0.5 tracking-tight">{displayLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
