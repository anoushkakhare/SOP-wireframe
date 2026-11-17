import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

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

  const renderIcon = (iconName: string, isActive: boolean) => {
    const iconClass = `w-5 h-5 transition-colors ${
      isActive ? 'text-primary-700' : 'text-gray-500 group-hover:text-primary-600'
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
      {/* Desktop Left Icon Rail: 56px */}
      <aside
        className="hidden md:flex flex-col items-center w-[56px] min-w-[56px] bg-white border-r border-gray-200 py-3 shrink-0 select-none z-20"
        aria-label="Sidebar Navigation"
      >
        <div className="flex flex-col items-center gap-3 w-full">
          {pages.map(page => {
            const isActive =
              location.pathname === page.path ||
              (page.path === '/dashboard' && location.pathname === '/');

            return (
              <div
                key={page.id}
                className="relative group flex items-center justify-center w-full"
                onMouseEnter={() => setHoveredId(page.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <button
                  type="button"
                  onClick={() => handleNavigate(page.path)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-xs ring-1 ring-primary-200'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                  }`}
                  aria-label={page.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Left active indicator pill */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-600 rounded-r-full" />
                  )}
                  {renderIcon(page.icon, isActive)}
                </button>

                {/* Label on Hover: floating tooltip to the right */}
                {hoveredId === page.id && (
                  <div className="absolute left-[62px] top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap z-50 pointer-events-none animate-in fade-in slide-in-from-left-1 duration-150">
                    {page.label}
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
        className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 flex items-center justify-around z-40 px-2 shadow-lg"
        aria-label="Mobile Navigation"
      >
        {pages.map(page => {
          const isActive =
            location.pathname === page.path ||
            (page.path === '/dashboard' && location.pathname === '/');

          return (
            <button
              key={page.id}
              type="button"
              onClick={() => handleNavigate(page.path)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? 'text-primary-700 font-semibold' : 'text-gray-500 hover:text-gray-900'
              }`}
              aria-label={page.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {renderIcon(page.icon, isActive)}
              <span className="text-[10px] mt-0.5 tracking-tight">{page.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

