import React, { useState } from 'react';
import {
  Plus,
  Clock,
  MapPin,
  Users,
  Share2,
  Download,
  Trash2,
  Edit
} from 'lucide-react';
import { AppData, BranchEvent } from '../types/turni';
import { formatEventWhatsAppText, downloadICS, buildCalendarICS } from '../services/ics';

interface EventiViewProps {
  appData: AppData;
  onOpenEventModal: (id?: string) => void;
  onOpenEventDetails?: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onTriggerNotification: (title: string, body: string) => void;
}

export const EventiView: React.FC<EventiViewProps> = ({
  appData,
  onOpenEventModal,
  onOpenEventDetails,
  onDeleteEvent,
}) => {
  const [typeFilter, setTypeFilter] = useState('');
  const [showArchive, setShowArchive] = useState(false);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const workerNamesMap: Record<string, string> = {};
  appData.workers.forEach(w => { workerNamesMap[w.id] = w.name; });

  const filteredEvents = (appData.events || []).filter(e => {
    if (typeFilter && e.type !== typeFilter) return false;
    return true;
  });

  const activeEvents = filteredEvents.filter(e => {
    return e.date >= todayStr;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const pastEvents = filteredEvents.filter(e => {
    return e.date < todayStr;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const handleShareWhatsApp = (e: BranchEvent) => {
    const text = formatEventWhatsAppText(e, workerNamesMap);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDownloadICS = (e: BranchEvent) => {
    const ics = buildCalendarICS([e], e.title);
    downloadICS(`impegno_${e.date}_${e.title.replace(/\s+/g, '_')}.ics`, ics);
  };

  return (
    <div className="space-y-4">
      {/* Banner Informativo */}
      <div className="p-4 rounded-2xl glass-panel text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 text-xl border border-blue-500/20 shadow-inner">
            📌
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white text-sm font-extrabold block">
              Impegni Aziendali, Corsi e Trasferte Filiale
            </strong>
            <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed font-medium">
              Gli eventi vengono presi in considerazione dal motore turni per evitare sovrapposizioni e calcolare le ore di presenza. Sincronizzati in tempo reale su tutti i dispositivi.
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenEventModal()}
          className="glass-btn-primary px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nuovo Impegno</span>
        </button>
      </div>

      {/* Toolbar Filtri */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl glass-panel text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-700 dark:text-slate-300">Filtra per tipo:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-tile text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">Tutti i tipi</option>
            <option value="Corso">Corso Formazione</option>
            <option value="Riunione">Riunione</option>
            <option value="Visita medica">Visita medica</option>
            <option value="Appuntamento">Appuntamento</option>
            <option value="Trasferta">Trasferta</option>
            <option value="Altro">Altro</option>
          </select>
        </div>

        <button
          onClick={() => setShowArchive(s => !s)}
          className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
        >
          {showArchive ? 'Nascondi Archivio' : `📁 Archivio Passati (${pastEvents.length})`}
        </button>
      </div>

      {/* Lista Eventi Futuri / In Corso */}
      <div className="space-y-3">
        {activeEvents.length === 0 ? (
          <div className="p-8 text-center rounded-2xl glass-panel text-slate-600 dark:text-slate-400 text-xs space-y-2">
            <p className="font-medium">Nessun impegno o corso programmato nei prossimi giorni.</p>
            <button
              onClick={() => onOpenEventModal()}
              className="glass-btn-primary px-3.5 py-1.5 rounded-xl text-white font-bold text-xs transition"
            >
              + Aggiungi il primo impegno
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeEvents.map(e => renderEventCard(e))}
          </div>
        )}
      </div>

      {/* Archivio Passati */}
      {showArchive && (
        <div className="pt-4 border-t border-white/10 dark:border-white/10 space-y-3">
          <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Archivio Impegni Conclusi ({pastEvents.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 opacity-80">
            {pastEvents.map(e => renderEventCard(e, true))}
          </div>
        </div>
      )}
    </div>
  );

  function renderEventCard(e: BranchEvent, isPast = false) {
    const participants = (e.participantIds || [])
      .map(id => workerNamesMap[id] || id)
      .join(', ');

    const typeBadges: Record<string, string> = {
      Corso: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      Riunione: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
      'Visita medica': 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
      Appuntamento: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      Trasferta: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
    };

    return (
      <div
        key={e.id}
        onClick={() => (onOpenEventDetails || onOpenEventModal)(e.id)}
        className={`p-4 rounded-2xl glass-card flex flex-col justify-between gap-3 transition-all hover:scale-[1.01] hover:border-blue-500/50 cursor-pointer ${
          isPast ? 'opacity-70' : ''
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${typeBadges[e.type] || 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30'}`}>
              {e.type}
            </span>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <span>📅</span>
              <span>{e.date}</span>
            </span>
          </div>

          <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1.5 hover:text-blue-500 transition flex items-center justify-between">
            <span>{e.title}</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold underline">
              Specifiche →
            </span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs text-slate-700 dark:text-slate-300 font-semibold">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span>{e.allDay ? 'Tutto il giorno' : `${e.fromTime || ''} – ${e.toTime || ''}`}</span>
            </div>
            {e.location && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                <span className="truncate">{e.location}</span>
              </div>
            )}
          </div>

          {participants && (
            <div className="flex items-start gap-1.5 mt-2 text-xs text-slate-800 dark:text-slate-300">
              <Users className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed font-bold">{participants}</span>
            </div>
          )}

          {e.notes && (
            <div className="mt-2 text-[11px] text-slate-700 dark:text-slate-400 italic glass-tile p-2 rounded-xl font-medium">
              📝 {e.notes}
            </div>
          )}
        </div>

        {/* Azioni Scheda */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/10 dark:border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={(ev) => { ev.stopPropagation(); handleDownloadICS(e); }}
              className="p-1.5 rounded-lg glass-tile hover:text-blue-500 text-blue-600 dark:text-blue-400 transition"
              title="Scarica file calendario (.ics)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(ev) => { ev.stopPropagation(); handleShareWhatsApp(e); }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 flex items-center gap-1 font-bold transition"
              title="Condividi su WhatsApp"
            >
              <Share2 className="w-3 h-3" />
              <span>WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(ev) => { ev.stopPropagation(); onOpenEventModal(e.id); }}
              className="p-1.5 rounded-lg glass-tile text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              title="Modifica impegno"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(ev) => { ev.stopPropagation(); onDeleteEvent(e.id); }}
              className="p-1.5 rounded-lg glass-tile hover:bg-red-500/20 text-red-500 dark:text-red-400 transition"
              title="Elimina"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
};
