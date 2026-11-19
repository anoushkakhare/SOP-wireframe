import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';
import { UserCheck, Shield, ArrowRight } from 'lucide-react';
import { labels } from '../constants/labels';

/**
 * LoginPage – role selector for demo access.
 * Uses design-system tokens: primary-700 brand, white surface, indigo button.
 */
export const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const [selectedRole, setSelectedRole] = React.useState<Role>('demand_planner');
  const { auth: l } = labels;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(selectedRole);
      navigate(from, { replace: true });
    } catch {
      // Error handled by hook
    }
  };

  const roleOption = (
    role: Role,
    Icon: typeof UserCheck,
    title: string,
    description: string
  ) => {
    const active = selectedRole === role;
    return (
      <label
        onClick={() => setSelectedRole(role)}
        className={`flex items-center justify-between p-3 border rounded-card cursor-pointer transition-all ${
          active
            ? 'border-2 border-primary-700 bg-primary-50 shadow-sm'
            : 'border-border hover:border-border-strong bg-surface'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 ${active ? 'text-primary-700' : 'text-text-secondary'}`} />
          <div>
            <div className={`text-xs font-semibold ${active ? 'text-primary-700' : 'text-text-primary'}`}>
              {title}
            </div>
            <div className="text-[10px] text-text-secondary">{description}</div>
          </div>
        </div>
        <div
          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
            active ? 'border-primary-700 bg-primary-700' : 'border-border-strong'
          }`}
        >
          {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </label>
    );
  };

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-card shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Brand header */}
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center text-white shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary tracking-tight">
              {labels.app.name}
            </h1>
            <p className="text-xs text-text-secondary">S&amp;OP planning workspace</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-negative-bg border border-negative/40 text-xs text-negative rounded-card font-medium" role="alert">
            {l.error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Select role for demo access
            </label>
            <div className="space-y-2">
              {roleOption('demand_planner', UserCheck, 'Demand Planner', 'Full planning, edits & scenarios')}
              {roleOption('leadership', Shield, 'Executive', 'High-level executive read-only view')}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-primary-700 hover:bg-primary-900 text-white font-semibold text-sm rounded-card flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
          >
            {isLoading ? l.loggingIn : 'Enter workspace'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center border-t border-border">
          <p className="text-[11px] text-text-secondary">
            Role-driven layout is loaded dynamically from the backend.
          </p>
        </div>
      </div>
    </div>
  );
};
