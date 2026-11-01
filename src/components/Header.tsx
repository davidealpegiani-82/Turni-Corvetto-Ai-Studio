import React from 'react';
import {
  Calendar,
  Sparkles,
  Copy,
  Download,
  Wrench,
  HelpCircle,
  Sun,
  Moon,
  Bell,
  Users
} from 'lucide-react';
import { SocketStatus } from '../services/socket';
import { playGlassTap } from '../services/soundFx';

interface HeaderProps {
  title: string;
  appVersion: string;
  onEditTitle: () => void;
  activeView: 'turni' | 'oggi' | 'ferie' | 'eventi';
  setActiveView: (view: 'turni' | 'oggi' | 'ferie' | 'eventi') => void;
  socketStatus: SocketStatus;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onGenerateProposal: () => void;
  onCopyWeek: () => void;
  onOpenAICopilot: () => void;
  onOpenExportMenu: () => void;
  onOpenToolsMenu: () => void;
  onOpenHelpGuide: () => void;
  onOpenNotifications: () => void;
  onOpenAtmosphere?: () => void;
  weekNumber: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  appVersion,
  onEditTitle,
  onOpenAtmosphere,
  activeView,
  setActiveView,
  socketStatus,
  theme,
  onToggleTheme,
  onGenerateProposal,
  onCopyWeek,
  onOpenAICopilot,
  onOpenExportMenu,
  onOpenToolsMenu,
  onOpenHelpGuide,
  onOpenNotifications,
  weekNumber
}) => {
  return (
    <header className="rounded-3xl glass-panel p-4 sm:p-5 shadow-2xl mb-5 text-slate-900 dark:text-white transition-all">
      {/* Barra superiore */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10 dark:border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/20 text-2xl font-bold text-white shrink-0 backdrop-blur-md">
            📅
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1
                onClick={onEditTitle}
                className="text-lg sm:text-xl font-extrabold tracking-tight cursor-pointer text-slate-900 dark:text-white hover:text-blue-500 transition flex items-center gap-1.5"
                title="Clicca per modificare il titolo filiale"
              >
                {title} <span className="text-xs text-slate-400 font-normal">✏️</span>
              </h1>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                · v{appVersion}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
              {/* Stato sincronizzazione Firebase Realtime */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border backdrop-blur-md transition ${
                  socketStatus === 'connected'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : socketStatus === 'connecting'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    socketStatus === 'connected'
                      ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                      : socketStatus === 'connecting'
                      ? 'bg-blue-400'
                      : 'bg-amber-400'
                  }`}
                />
                {socketStatus === 'connected' ? (
                  <span>Cloud sincronizzato</span>
                ) : socketStatus === 'connecting' ? (
                  <span>Connessione cloud...</span>
                ) : (
                  <span>Cloud non disponibile</span>
                )}
              </div>




            </div>
          </div>
        </div>

        {/* Badge e Controlli Rapidi a Destra */}
        <div className="flex items-center gap-2 self-end md:self-center">
          <div className="px-3.5 py-1.5 rounded-xl glass-card border border-blue-500/30 text-blue-400 font-extrabold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 tabular-nums">
            <Calendar className="w-4 h-4 text-blue-400" />
            Settimana {weekNumber}
          </div>

          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl glass-btn-ghost transition cursor-pointer"
            title="Avvisi e stato sincronizzazione"
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            onClick={() => { playGlassTap(); onOpenAtmosphere?.(); }}
            className="p-2 rounded-xl glass-btn-ghost transition cursor-pointer text-purple-400 hover:text-purple-300"
            title="Personalizza Atmosfera Spaziale VisionOS (Aura & Profondità)"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl glass-btn-ghost transition cursor-pointer"
            title="Cambia tema chiaro/scuro"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Tabs di Navigazione & Azioni Rapide */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1.5 rounded-2xl glass-dock">
          <button
            type="button"
            onClick={() => { playGlassTap(); setActiveView('turni'); }}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'turni'
                ? 'glass-btn-primary shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>📅</span> Turni
          </button>
          <button
            type="button"
            onClick={() => { playGlassTap(); setActiveView('oggi'); }}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'oggi'
                ? 'glass-btn-primary shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>⚡</span> Oggi in Filiale
          </button>
          <button
            type="button"
            onClick={() => { playGlassTap(); setActiveView('ferie'); }}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'ferie'
                ? 'glass-btn-primary shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🏖️</span> Ferie & Permessi
          </button>
          <button
            type="button"
            onClick={() => { playGlassTap(); setActiveView('eventi'); }}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'eventi'
                ? 'glass-btn-primary shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>📌</span> Impegni & Corsi
          </button>
        </div>

        {/* Pulsanti Azione Principali */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Assistente controlli locali */}
          <button
            type="button"
            onClick={onOpenAICopilot}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/25 border border-white/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer backdrop-blur-md"
            title="Apri l'assistente locale per controlli su turni, coperture e monte ore"
          >
            <span className="text-sm">🧭</span>
            <span>Assistente controlli</span>
            
          </button>

          {activeView === 'turni' && (
            <>
              <button
                type="button"
                onClick={onGenerateProposal}
                className="glass-btn-primary px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Genera proposta automatica con regole intelligenti di rotazione e copertura"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Genera Proposta</span>
              </button>

              <button
                type="button"
                onClick={onCopyWeek}
                className="px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 border border-emerald-400/30 backdrop-blur-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Copia i turni dalla settimana precedente"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copia sett. prec.</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onOpenExportMenu}
            className="glass-btn-ghost px-3 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Esporta</span>
          </button>

          <button
            type="button"
            onClick={onOpenToolsMenu}
            className="glass-btn-ghost px-3 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>Strumenti</span>
          </button>

          <button
            type="button"
            onClick={onOpenHelpGuide}
            className="glass-btn-ghost px-2.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1 transition cursor-pointer"
            title="Guida rapida"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
