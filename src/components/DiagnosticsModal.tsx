import React, { useState } from 'react';
import { X, Activity, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { AppData } from '../types/turni';
import { SocketStatus } from '../services/socket';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  socketStatus: SocketStatus;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  appData,
  socketStatus
}) => {
  if (!isOpen) return null;

  const [testsRun, setTestsRun] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ name: string; pass: boolean; detail?: string }>>([]);

  const runDiagnostics = async () => {
    const list: Array<{ name: string; pass: boolean; detail?: string }> = [];

    // 1. Sincronizzazione Firebase RTDB / SSE
    list.push({
      name: 'Connessione Firebase Realtime',
      pass: socketStatus === 'connected',
      detail: socketStatus === 'connected' ? 'Firebase raggiungibile e streaming attivo' : `Stato: ${socketStatus}`
    });

    // Normalizza i contenitori prima di leggerli: la diagnostica deve poter segnalare
    // dati incompleti senza andare in errore a sua volta.
    const workers = Array.isArray(appData?.workers) ? appData.workers : [];
    const rules = appData?.rules || {};

    // 2. Integrità Team Collaboratori
    const activeWorkers = workers.filter(w => w && w.selected !== false);
    list.push({
      name: 'Anagrafica Collaboratori',
      pass: activeWorkers.length >= 8,
      detail: `${activeWorkers.length} collaboratori attivi configurati`
    });

    // 3. Rotazione Sabato Ufficio
    const saturdayIds = Array.isArray(rules.sabatoUfficioIds) ? rules.sabatoUfficioIds : [];
    list.push({
      name: 'Rotazione Sabato Ufficio',
      pass: saturdayIds.length >= 3,
      detail: `${saturdayIds.length} addetti in rotazione sequenziale`
    });

    // 4. Coppie Magazzino
    const pairA = Array.isArray(rules.magPairA) ? rules.magPairA : [];
    const pairB = Array.isArray(rules.magPairB) ? rules.magPairB : [];
    list.push({
      name: 'Coppie Magazzino A e B',
      pass: pairA.length >= 2 && pairB.length >= 2,
      detail: `Coppia A (${pairA.length}) e Coppia B (${pairB.length})`
    });

    // 5. Profilo Severin e Orari Fissi
    const sev = workers.find(w => w.id === rules.severinId);
    list.push({
      name: 'Profilo Orario Speciale Severin (Pausa 30 min)',
      pass: !!sev,
      detail: sev ? `${sev.name} configurato` : 'ID Severin non trovato'
    });

    // 6. Stato effettivo del Service Worker PWA (non vengono dichiarate push non attive).
    let swRegistration: ServiceWorkerRegistration | undefined;
    try {
      if ('serviceWorker' in navigator) {
        swRegistration = await navigator.serviceWorker.getRegistration();
      }
    } catch (error) {
      console.warn('[Diagnostica] Lettura Service Worker non riuscita:', error);
    }
    list.push({
      name: 'Service Worker PWA',
      pass: !!swRegistration,
      detail: swRegistration ? 'Service Worker registrato per cache e uso PWA' : 'Service Worker non registrato su questo browser'
    });

    setTestResults(list);
    setTestsRun(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-white my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Diagnostica Sistema & Controlli Integrità</h3>
              <span className="text-xs text-slate-400">Verifica integrità dati, regole e sincronizzazione Firebase</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pulsante Esegui Controlli */}
        <div>
          <button
            onClick={runDiagnostics}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Esegui Tutti i Controlli di Sistema</span>
          </button>
        </div>

        {/* Risultati dei Test */}
        {testsRun && (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {testResults.map((t, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  t.pass
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                {t.pass ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="block text-white">{t.name}</strong>
                  {t.detail && <span className="text-[11px] text-slate-300">{t.detail}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chiusura */}
        <div className="pt-2 text-right border-t border-slate-800">
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
