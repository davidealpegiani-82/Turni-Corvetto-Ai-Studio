import React from 'react';
import {
  Calendar,
  Sparkles,
  Palmtree,
  CalendarDays,
  BarChart3,
  Settings,
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { ViewMode } from '../types';
import { useTurniStore } from '../store/useTurniStore';

interface NavTab {
  mode: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: NavTab[] = [
  { mode: 'grid', label: 'Tabella', icon: Calendar },
  { mode: 'proposal', label: 'Proposta', icon: Sparkles },
  { mode: 'leave', label: 'Ferie', icon: Palmtree },
  { mode: 'events', label: 'Eventi', icon: CalendarDays },
  { mode: 'stats', label: 'Statistiche', icon: BarChart3 },
  { mode: 'settings', label: 'Impostazioni', icon: Settings },
];

export const Navbar: React.FC = () => {
  const viewMode = useTurniStore(s => s.viewMode);
  const setViewMode = useTurniStore(s => s.setViewMode);
  const syncStatus = useTurniStore(s => s.syncStatus);
  const teamName = useTurniStore(s => s.settings.teamName) || 'CORVETTO';

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
                  Turni Manager
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {teamName.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Navigazione Tabs Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = viewMode === tab.mode;
              return (
                <button
                  key={tab.mode}
                  type="button"
                  onClick={() => setViewMode(tab.mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sync status indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              {syncStatus === 'syncing' && (
                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full text-[11px] font-medium border border-blue-200 dark:border-blue-800 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Sincronizzazione...</span>
                </span>
              )}
              {syncStatus === 'saved' && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full text-[11px] font-medium border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Salvato</span>
                </span>
              )}
              {syncStatus === 'error' && (
                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-full text-[11px] font-medium border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Errore sync</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800/80">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = viewMode === tab.mode;
            return (
              <button
                key={tab.mode}
                type="button"
                onClick={() => setViewMode(tab.mode)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
