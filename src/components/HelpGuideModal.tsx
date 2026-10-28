import React from 'react';
import { X, Sparkles, Radio, Users, Calendar, FileText, CheckCircle } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 text-white my-auto max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Guida Rapida all'Uso</h3>
            <span className="text-xs text-slate-400">Come gestire al meglio turni, ferie e notifiche in tempo reale</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Punti Guida */}
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <strong className="text-blue-400 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4" /> 1. Genera Proposta Turni
            </strong>
            <p>
              Scegli la settimana e premi <strong>Genera Proposta</strong>: il sistema calcola la rotazione sequenziale del sabato (Alpegiani → Poppa → Caregnato per l'ufficio; coppie A e B per il magazzino), i nastri 7h/8h per 40 ore complessive, le aperture a 06:30 e chiusure a 17:30.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <strong className="text-emerald-400 flex items-center gap-1.5 text-sm">
              <Radio className="w-4 h-4" /> 2. Sincronizzazione Real-Time
            </strong>
            <p>
              Qualsiasi modifica effettuata (un turno salvato, una ferie approvata, un corso aggiunto) viene trasmessa istantaneamente via WebSocket a tutti gli altri telefoni, tablet e PC connessi, senza bisogno di ricaricare la pagina.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <strong className="text-purple-400 flex items-center gap-1.5 text-sm">
              🔔 3. Notifiche Push
            </strong>
            <p>
              Clicca su <strong>Attiva Notifiche Push</strong> nella barra superiore per ricevere avvisi immediati su pubblicazione turni, approvazione ferie o nuovi corsi, anche con l'applicazione chiusa.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <strong className="text-amber-400 flex items-center gap-1.5 text-sm">
              🏖️ 4. Ferie, Permessi e Malattia
            </strong>
            <p>
              Inserisci le richieste con il modulo conforme CENTROEDILE. Se approvate con "Aggiorna Turni", i giorni di assenza entrano automaticamente nella pianificazione e nel computo orario.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <strong className="text-indigo-400 flex items-center gap-1.5 text-sm">
              <FileText className="w-4 h-4" /> 5. Esportazione PDF e WhatsApp
            </strong>
            <p>
              Dal pulsante <strong>Esporta</strong> puoi generare il PDF per la bacheca aziendale, scaricare il file calendario (.ics) per Google Calendar o condividere il testo formattato su WhatsApp.
            </p>
          </div>
        </div>

        {/* Chiusura */}
        <div className="pt-2 text-right border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition"
          >
            Ho Capito
          </button>
        </div>
      </div>
    </div>
  );
};
