import React from 'react';
import { X, FileText, Eye, Mail, Image, Calendar, MessageSquare, Download } from 'lucide-react';

interface ExportMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPDF: () => void;
  onPreviewPDF: () => void;
  onExportEmail: () => void;
  onExportJPG: () => void;
  onExportICS: () => void;
  onShareWhatsApp: () => void;
}

export const ExportMenuModal: React.FC<ExportMenuModalProps> = ({
  isOpen,
  onClose,
  onExportPDF,
  onPreviewPDF,
  onExportEmail,
  onExportJPG,
  onExportICS,
  onShareWhatsApp
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-white my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Esporta & Condividi Turni</h3>
            <span className="text-xs text-slate-400">Scarica e invia la programmazione settimanale</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pulsanti Opzioni */}
        <div className="space-y-2">
          <button
            onClick={() => { onExportPDF(); onClose(); }}
            className="w-full p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 group-hover:bg-blue-500/25">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-bold text-white block">Documento PDF Ufficiale</strong>
                <span className="text-xs text-slate-400">Formato A4 orizzontale pronto per stampa e bacheca</span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
          </button>

          <button
            onClick={() => { onPreviewPDF(); onClose(); }}
            className="w-full p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 group-hover:bg-indigo-500/25">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-bold text-white block">Anteprima Visiva PDF</strong>
                <span className="text-xs text-slate-400">Visualizza il PDF direttamente a schermo intero</span>
              </div>
            </div>
            <Eye className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
          </button>

          <button
            onClick={() => { onExportEmail(); onClose(); }}
            className="w-full p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 group-hover:bg-purple-500/25">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-bold text-white block">Invia per Email</strong>
                <span className="text-xs text-slate-400">Prepara il messaggio con allegato per colleghi e direzione</span>
              </div>
            </div>
            <Mail className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
          </button>

          <button
            onClick={() => { onExportICS(); onClose(); }}
            className="w-full p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 group-hover:bg-amber-500/25">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-bold text-white block">Calendario iCal / Outlook (.ics)</strong>
                <span className="text-xs text-slate-400">Sincronizza gli impegni su Google Calendar e smartphone</span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
          </button>

          <button
            onClick={() => { onShareWhatsApp(); onClose(); }}
            className="w-full p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-emerald-500 hover:bg-slate-800 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500/25">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-bold text-white block">Condividi su WhatsApp</strong>
                <span className="text-xs text-slate-400">Invia riassunto della settimana e impegni in chat</span>
              </div>
            </div>
            <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
          </button>

          <a
            href="/turni-standalone.html"
            download="Turni_Corvetto_v9.11.19.html"
            onClick={onClose}
            className="w-full p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-cyan-500 hover:bg-slate-800 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 group-hover:bg-cyan-500/25">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-bold text-white block">Scarica File HTML Standalone (.html)</strong>
                <span className="text-xs text-slate-400">File singolo autonomo offline (v9.11.19 / Netlify Drop)</span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
          </a>
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
