import React from 'react';
import { X, Radio, Wifi, WifiOff, AlertCircle, Volume2 } from 'lucide-react';
import { playNotificationChime } from '../services/push';
import type { SocketStatus } from '../services/socket';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  socketStatus: SocketStatus;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  socketStatus
}) => {
  if (!isOpen) return null;

  const connected = socketStatus === 'connected';
  const connecting = socketStatus === 'connecting';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 text-white my-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Avvisi e sincronizzazione</h3>
              <span className="text-xs text-slate-400">Aggiornamenti in tempo reale mentre l’app è aperta</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white" aria-label="Chiudi">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-start gap-3">
          {connected
            ? <Wifi className="w-5 h-5 text-emerald-400 mt-0.5" />
            : connecting
              ? <Radio className="w-5 h-5 text-amber-400 mt-0.5 animate-pulse" />
              : <WifiOff className="w-5 h-5 text-rose-400 mt-0.5" />}
          <div className="min-w-0">
            <strong className="text-sm block">{connected ? 'Cloud collegato' : connecting ? 'Connessione in corso' : 'Cloud non collegato'}</strong>
            <p className="text-xs text-slate-400 mt-1">
              {connected
                ? 'Le modifiche confermate da Firebase vengono sincronizzate sugli altri dispositivi che hanno l’app aperta.'
                : 'Le modifiche non possono essere considerate sincronizzate finché la connessione non torna attiva.'}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-100">
            Le notifiche push in background e l’invio di messaggi a tutti i colleghi non sono disponibili su questa versione GitHub Pages. Restano attivi gli avvisi interni e gli aggiornamenti cloud in tempo reale quando l’app è aperta.
          </p>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span>Segnale acustico locale</span>
          </div>
          <button type="button" onClick={playNotificationChime} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition">
            Prova suono
          </button>
        </div>

        <div className="pt-2 text-right">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition">
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
