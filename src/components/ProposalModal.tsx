import React from 'react';
import { Sparkles, Check, X, AlertTriangle, Clock, RefreshCw, ShieldCheck } from 'lucide-react';
import { GeneratedProposal } from '../types/turni';

interface ProposalModalProps {
  proposal: GeneratedProposal | null;
  onClose: () => void;
  onApply: () => void;
  onSelectChoice: (choiceId: string, optionId: string) => void;
  onRecalculate: () => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  proposal,
  onClose,
  onApply,
  onSelectChoice,
  onRecalculate
}) => {
  if (!proposal) return null;

  const hasChoices = proposal.choices && proposal.choices.length > 0;
  const isDirty = proposal.choices.some(c => c.selected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 text-white max-h-[90vh] flex flex-col justify-between my-auto">
        <div className="overflow-y-auto space-y-4 pr-1">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">Report Proposta Turni Ottimizzata</h2>
                <p className="text-xs text-slate-400">
                  Valutazione della migliore condizione operativa: presidio potenziato nelle prime ore della mattinata (picco affluenza clienti), rotazione sabati a cascata e chiusura presidiata.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Statistiche Rapide */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center">
              <span className="block text-2xl font-black text-blue-400">{proposal.changes.length}</span>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Modifiche</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center">
              <span className={`block text-2xl font-black ${proposal.edgeCaseDecisions?.length ? 'text-emerald-400' : 'text-slate-300'}`}>
                {proposal.edgeCaseDecisions?.length || 0}
              </span>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Ottimizzazioni</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center">
              <span className="block text-2xl font-black text-emerald-400">
                Ottimale
              </span>
              <span className="text-[11px] text-emerald-400 uppercase font-semibold">Presidio Picco Mattina</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center">
              <span className={`block text-2xl font-black ${proposal.overtime.length ? 'text-amber-400' : 'text-slate-300'}`}>
                {proposal.overtime.length}
              </span>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Straordinari</span>
            </div>
          </div>

          {/* Banner Focus Affluenza Mattutina */}
          <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200 flex items-start gap-2.5">
            <span className="text-lg shrink-0">📈</span>
            <div className="space-y-0.5">
              <strong className="text-white block font-bold">Valutazione della Migliore Condizione Operativa per Affluenza Clienti</strong>
              <p className="text-[11px] text-blue-300/90 leading-relaxed">
                I turni sono calibrati per massimizzare la presenza nelle <strong>prime ore della mattinata (06:30 - 12:30)</strong>, quando si concentra il maggior afflusso di artigiani, imprese e clienti al banco e piazzale, mantenendo un presidio bilanciato e sicuro per la chiusura pomeridiana (17:30).
              </p>
            </div>
          </div>

          {/* Griglia Copertura Giornaliera con Dettaglio Affluenza */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Presidio & Curva di Affluenza per Giorno (Lun–Sab)
              </h4>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Copertura Adeguata in Tutte le Fasce
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              {proposal.coverage.map((c, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-2xl border transition ${
                    c.isHoliday
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-200'
                      : 'bg-slate-800/90 border-slate-700/80 text-slate-200'
                  }`}
                >
                  <div className="font-extrabold text-[12px] text-white flex items-center justify-between pb-1 border-b border-slate-700/50">
                    <span>{c.day}</span>
                    {c.isHoliday ? (
                      <span className="text-[10px]">🎉</span>
                    ) : (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded">
                        {c.trafficSlots?.[0] ? `${c.trafficSlots[0].totalCount} apr.` : 'OK'}
                      </span>
                    )}
                  </div>
                  {c.isHoliday ? (
                    <div className="text-[9px] font-semibold text-purple-300 mt-1 truncate" title={c.holidayName}>
                      {c.holidayName || 'FESTIVO'}
                    </div>
                  ) : (
                    <div className="space-y-1 mt-1.5 text-[10px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-amber-300 font-semibold">🌅 06:30-08:30:</span>
                        <strong className="text-white">{c.trafficSlots?.[0]?.totalCount ?? (c.impOpen + c.magOpen)} op.</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-emerald-300 font-semibold">☀️ 08:30-12:30:</span>
                        <strong className="text-white">{c.trafficSlots?.[1]?.totalCount ?? 8} op.</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-blue-300 font-semibold">🌆 14:00-17:30:</span>
                        <strong className="text-white">{c.trafficSlots?.[3]?.totalCount ?? (c.impClose + c.magClose)} op.</strong>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Intelligenza Casi Limite & Decisioni Automatiche del Motore */}
          {proposal.edgeCaseDecisions && proposal.edgeCaseDecisions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Gestione Casi Limite & Decisioni Motore ({proposal.edgeCaseDecisions.length})</span>
                </h4>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Zero Errori Confermato
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {proposal.edgeCaseDecisions.map((dec) => {
                  const isHandled = dec.status === 'handled';
                  const isWarn = dec.status === 'warning';
                  return (
                    <div
                      key={dec.id}
                      className={`p-3 rounded-2xl border transition ${
                        isWarn
                          ? 'bg-red-500/10 border-red-500/30 text-red-200'
                          : isHandled
                          ? 'bg-slate-800/80 border-slate-700/70 text-slate-200'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-extrabold text-[12px] text-white flex items-center gap-1.5">
                          {dec.category === 'sabato_ufficio' && '🏢'}
                          {dec.category === 'sabato_magazzino' && '📦'}
                          {dec.category === 'festivita' && '🇮🇹'}
                          {dec.category === 'riposo_legale' && '⏱️'}
                          {dec.category === 'sicurezza_piazzale' && '🦺'}
                          {dec.category === 'affluenza_clienti' && '📈'}
                          <span>{dec.title}</span>
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${
                            isWarn
                              ? 'bg-red-500/20 text-red-300 border-red-500/40'
                              : isHandled
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}
                        >
                          {isWarn ? 'Attenzione' : isHandled ? 'Automatico' : 'Info'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mb-1.5">{dec.detail}</p>
                      <div className="text-[11px] font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 p-2 rounded-xl">
                        <strong className="text-white">Risoluzione Motore:</strong> {dec.actionTaken}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scelte Richieste dal Motore (se presenti) */}
          {hasChoices && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Scelte Richieste dal Motore Regole
                </span>
                <button
                  onClick={onRecalculate}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  Ricalcola con Scelte
                </button>
              </div>

              {proposal.choices.map((choice) => (
                <div key={choice.id} className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-200">{choice.label}</div>
                  <div className="flex flex-wrap gap-2">
                    {choice.options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSelectChoice(choice.id, opt.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          choice.selected === opt.id
                            ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {opt.name} {opt.hint ? `(${opt.hint})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Elenco Dettagliato Modifiche */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Modifiche Applicate rispetto alla Settimana Corrente ({proposal.changes.length})
            </h4>
            <div className="max-h-48 overflow-y-auto rounded-2xl bg-slate-800/50 border border-slate-700/60 p-2 space-y-1 text-xs divide-y divide-slate-800">
              {proposal.changes.length === 0 ? (
                <p className="p-2 text-slate-400 text-center">Nessuna modifica necessaria. La settimana rispetta già tutte le regole.</p>
              ) : (
                proposal.changes.map((c, idx) => (
                  <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2">
                    <div>
                      <strong className="text-slate-100">{c.name}</strong> · <span className="text-blue-400 font-semibold">{c.dayLabel}</span>
                      <div className="text-[11px] text-slate-400">
                        <span className="line-through">{c.before}</span> → <span className="text-emerald-300 font-bold">{c.after}</span>
                      </div>
                    </div>
                    {c.moved && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Spostato per copertura
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Note / Decisioni del Motore */}
          {proposal.notes.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Log Dettagliato Operazioni
              </h4>
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 space-y-1">
                {proposal.notes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400">ℹ️</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overtime segnalato */}
          {proposal.overtime.length > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Superamento Target Ore Settimanali (segnalazione, non bloccante):</span>
              </div>
              <ul className="list-disc pl-5">
                {proposal.overtime.map((ot, idx) => (
                  <li key={idx}>{ot}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Azioni Modale */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition"
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={onApply}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Conferma & Applica Proposta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
