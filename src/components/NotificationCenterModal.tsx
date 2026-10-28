import React, { useState } from 'react';
import { X, Bell, Radio, Send, CheckCircle2, AlertCircle, Smartphone, Volume2 } from 'lucide-react';
import { playNotificationChime } from '../services/push';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  pushSubscribed: boolean;
  onRequestPush: () => void;
  onSendTestPush: () => void;
  connectedClients: number;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  pushSubscribed,
  onRequestPush,
  onSendTestPush,
  connectedClients
}) => {
  if (!isOpen) return null;

  const [testTitle, setTestTitle] = useState('Turni Corvetto Live');
  const [testBody, setTestBody] = useState('Aggiornamento in tempo reale: nuova programmazione disponibile!');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const handleSendCustomPush = async () => {
    setIsSending(true);
    setSendSuccess(null);
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testTitle,
          body: testBody,
          url: '/'
        })
      });
      const data = await res.json();
      playNotificationChime();
      setSendSuccess(`Notifica inviata con successo a ${data.sent || 1} dispositivo/i!`);
    } catch (e: any) {
      setSendSuccess(`Errore invio: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 text-white my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Centro Notifiche Push & Real-Time</h3>
              <span className="text-xs text-slate-400">Avvisi istantanei su smartphone, tablet e PC</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stato Sottoscrizione Browser Corrente */}
        <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${pushSubscribed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs font-bold block text-white">
                {pushSubscribed ? 'Notifiche Push Abilitate sul Dispositivo' : 'Notifiche Push Non Attive su Questo Browser'}
              </strong>
              <span className="text-[11px] text-slate-400">
                {pushSubscribed
                  ? 'Questo dispositivo riceverà avvisi su cambi turno, approvazioni e corsi.'
                  : 'Abilita il permesso per ricevere avvisi istantanei anche ad app chiusa.'}
              </span>
            </div>
          </div>

          {!pushSubscribed ? (
            <button
              onClick={onRequestPush}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 shadow-md transition"
            >
              Abilita Ora
            </button>
          ) : (
            <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Attivo
            </span>
          )}
        </div>

        {/* Test Suono */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span>Verifica segnale acustico di notifica:</span>
          </div>
          <button
            onClick={playNotificationChime}
            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition"
          >
            Riproduci Suono
          </button>
        </div>

        {/* Invio Notifica di Prova */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Invia Notifica Push di Prova a Tutti i Dispositivi
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Titolo</label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white mt-0.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Messaggio</label>
              <input
                type="text"
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white mt-0.5 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSendCustomPush}
              disabled={isSending}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Invio in corso...' : 'Invia Notifica a Tutti i Colleghi'}</span>
            </button>

            {sendSuccess && (
              <p className="text-xs text-emerald-400 font-semibold text-center mt-1">
                {sendSuccess}
              </p>
            )}
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
