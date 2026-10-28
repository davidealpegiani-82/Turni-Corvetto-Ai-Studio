import React from 'react';
import { X, Users, Settings, Activity, Download, Upload, Radio, ChevronRight, RefreshCw } from 'lucide-react';

interface ToolsMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTeam: () => void;
  onOpenRules: () => void;
  onOpenDiagnostics: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onOpenNotifications: () => void;
  onResetWeekTurns: () => void;
  onResyncFirebase: () => void;
}

export const ToolsMenuModal: React.FC<ToolsMenuModalProps> = ({
  isOpen,
  onClose,
  onOpenTeam,
  onOpenRules,
  onOpenDiagnostics,
  onExportBackup,
  onImportBackup,
  onOpenNotifications,
  onResetWeekTurns,
  onResyncFirebase
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-white my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">🧰 Strumenti di Amministrazione</h3>
            <span className="text-xs text-slate-400">Configurazione team, regole e gestione dati</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categorie Strumenti */}
        <div className="space-y-2 text-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Persone & Regole di Filiale
          </div>

          <button
            onClick={() => { onOpenTeam(); onClose(); }}
            className="w-full p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-bold text-white block">Gestione Team Collaboratori</strong>
                <span className="text-slate-400 text-xs">Aggiungi, ordina in griglia, imposta mansioni e orari</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
          </button>

          <button
            onClick={() => { onOpenRules(); onClose(); }}
            className="w-full p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-bold text-white block">Regole Generazione Automatica</strong>
                <span className="text-slate-400 text-xs">Rotazione sabato, coppie magazzino, nastri 7h/8h e minimi</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
          </button>

          <button
            onClick={() => { onOpenNotifications(); onClose(); }}
            className="w-full p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-purple-500 hover:bg-slate-800 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-bold text-white block">Centro Notifiche Push & Real-Time</strong>
                <span className="text-slate-400 text-xs">Gestisci registrazioni push e invia messaggi di prova</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
          </button>

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-2">
            Integrità & Backup Dati
          </div>

          <button
            onClick={() => { onResyncFirebase(); onClose(); }}
            className="w-full p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-sky-500 hover:bg-slate-800 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-bold text-white block">Sincronizza / Ricarica da Cloud Firebase</strong>
                <span className="text-slate-400 text-xs">Scarica e riconcilia turni, ferie e impegni da RTDB</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
          </button>

          <button
            onClick={() => { onOpenDiagnostics(); onClose(); }}
            className="w-full p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-emerald-500 hover:bg-slate-800 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-bold text-white block">Diagnostica & Test Motore (M1–M47)</strong>
                <span className="text-slate-400 text-xs">Verifica integrità regole, socket e conformità coperture</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => { onExportBackup(); onClose(); }}
              className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-left transition"
            >
              <Download className="w-4 h-4 text-blue-400 mb-1" />
              <div className="font-bold text-white text-xs">Scarica Backup</div>
              <div className="text-[10px] text-slate-400">Salva file JSON completo</div>
            </button>

            <button
              onClick={() => { onImportBackup(); onClose(); }}
              className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-left transition"
            >
              <Upload className="w-4 h-4 text-amber-400 mb-1" />
              <div className="font-bold text-white text-xs">Ripristina JSON</div>
              <div className="text-[10px] text-slate-400">Carica file di backup</div>
            </button>

            <a
              href="/turni-standalone.html"
              download="Turni_Corvetto_v9.11.19.html"
              onClick={onClose}
              className="col-span-2 p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-bold text-cyan-300 text-xs">Scarica File HTML Standalone</div>
                  <div className="text-[10px] text-slate-400">Pacchetto autonomo v9.11.19 (Netlify Drop / Uso Locale)</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
            </a>
          </div>

          <div className="pt-2">
            <button
              onClick={() => { onResetWeekTurns(); onClose(); }}
              className="w-full p-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Svuota turni settimana corrente (mantiene ferie/note)</span>
            </button>
          </div>
        </div>

        {/* Chiusura */}
        <div className="pt-2 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
