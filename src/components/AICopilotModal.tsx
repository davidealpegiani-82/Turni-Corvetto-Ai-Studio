import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Check,
  Clock,
  Calendar,
  Umbrella,
  Briefcase,
  ChevronRight,
  RotateCcw,
  Maximize2,
  Minimize2,
  HelpCircle
} from 'lucide-react';
import {
  AIChatMessage,
  AIProposedAction,
  AppData
} from '../types/turni';
import { getWeekInfo, weekKeyToMonday } from '../services/engine';

interface AICopilotModalProps {
  open: boolean;
  onClose: () => void;
  appData: AppData;
  weekKey: string;
  currentDate: Date;
  onApplyAction: (action: AIProposedAction) => void;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  open,
  onClose,
  appData,
  weekKey,
  currentDate,
  onApplyAction
}) => {
  const weekInfo = getWeekInfo(currentDate);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: `👋 **Ciao! Sono il tuo Assistente AI Copilot per la gestione turni e conformità della Filiale Corvetto.**\n\nPuoi dirmi in linguaggio naturale cosa desideri fare, ad esempio:\n• *"Metti Gianluca alle 06:30 giovedì per coprire l'apertura"* \n• *"Inserisci ferie per Simone dal 10 al 14 Novembre"* \n• *"Aggiungi riunione di filiale lunedì alle 14:30"* \n• *"Verifica se ci sono errori, violazioni o scoperture questa settimana"* \n• *"Mario ha la febbre mercoledì: come mi consigli di risolvere?"*\n\nVerificherò tutte le regole contrattuali, di sicurezza carrellisti (06:30) e di riposo 11h in tempo reale!`,
      timestamp: Date.now(),
      quickFollowUps: [
        'Verifica conformità settimana',
        'Controlla sicurezza carrellisti 06:30',
        'Chi è di turno questo sabato?',
        'Verifica monte ore 40h e riposi'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedActions, setAppliedActions] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 150);
    }
  }, [open, messages.length]);

  if (!open) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg: AIChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          weekKey,
          currentDate: currentDate.toISOString()
        })
      });

      if (!res.ok) {
        throw new Error(`Errore server (${res.status})`);
      }

      const data = await res.json();

      const botMsg: AIChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: data.message || 'Elaborazione completata.',
        timestamp: Date.now(),
        audit: data.audit || null,
        actions: data.actions || [],
        quickFollowUps: data.quickFollowUps || []
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('[AICopilot] Errore invio messaggio:', err);
      const errMsg: AIChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ Si è verificato un problema nella connessione con il motore AI (${err.message || 'Errore di rete'}). Puoi riprovare o usare uno dei prompt rapidi sottostanti.`,
        timestamp: Date.now(),
        quickFollowUps: ['Verifica conformità settimana', 'Controlla sicurezza carrellisti 06:30']
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySingleAction = (action: AIProposedAction) => {
    onApplyAction(action);
    setAppliedActions(prev => ({ ...prev, [action.id]: true }));
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'assistant',
        text: `Conversazione reimpostata. Sono pronto ad aiutarti per la **Settimana ${weekInfo.weekNo}** (${weekInfo.label}). Di cosa hai bisogno?`,
        timestamp: Date.now(),
        quickFollowUps: [
          'Verifica conformità settimana',
          'Controlla sicurezza carrellisti 06:30',
          'Chi è di turno questo sabato?'
        ]
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 w-full ${
          isExpanded ? 'h-[96vh] max-w-5xl' : 'h-[86vh] max-w-3xl'
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-xl shadow-inner shrink-0">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">AI Copilot Turni & Compliance</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400 text-slate-950 uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-950 animate-pulse" />
                  Gemini Flash Live
                </span>
              </div>
              <p className="text-xs text-purple-100 flex items-center gap-1.5">
                <span>Contesto attivo:</span>
                <span className="font-bold text-white underline decoration-purple-300">
                  Settimana {weekInfo.weekNo} ({weekInfo.label})
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition text-xs flex items-center gap-1 cursor-pointer"
              title="Nuova conversazione"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Reset</span>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
              title={isExpanded ? 'Riduci' : 'Espandi'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Action Chips Bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs shrink-0 no-scrollbar">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Suggeriti:
          </span>
          <button
            onClick={() => handleSendMessage('Verifica conformità e regole della settimana corrente')}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 font-semibold whitespace-nowrap transition cursor-pointer shadow-2xs"
          >
            🔍 Verifica Settimana
          </button>
          <button
            onClick={() => handleSendMessage('Controlla sicurezza carrellisti 06:30 per tutti i giorni feriali')}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 font-semibold whitespace-nowrap transition cursor-pointer shadow-2xs"
          >
            🛡️ Carrellisti 06:30
          </button>
          <button
            onClick={() => handleSendMessage('Verifica rispetto riposo legale 11h consecutive D.Lgs 66/2003')}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 font-semibold whitespace-nowrap transition cursor-pointer shadow-2xs"
          >
            ⚖️ Riposo 11h Legale
          </button>
          <button
            onClick={() => handleSendMessage('Chi è di turno questo sabato sia per ufficio che magazzino?')}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 font-semibold whitespace-nowrap transition cursor-pointer shadow-2xs"
          >
            📅 Presidio Sabato
          </button>
        </div>

        {/* Chat Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[78%] space-y-2.5`}>
                {/* Bubble testo principale */}
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700/80 shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Audit Card (se presente) */}
                {msg.audit && (
                  <div
                    className={`p-3 rounded-xl border text-xs shadow-xs ${
                      msg.audit.status === 'compliant'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : msg.audit.status === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1.5">
                      {msg.audit.status === 'compliant' && <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      {msg.audit.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                      {msg.audit.status === 'error' && <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                      <span>{msg.audit.summary}</span>
                    </div>

                    {msg.audit.findings.length > 0 && (
                      <ul className="space-y-1 mt-2 pl-1 border-t border-slate-200 dark:border-slate-700/60 pt-2 font-normal text-slate-700 dark:text-slate-300">
                        {msg.audit.findings.map((finding, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-1.5">
                            <span className="text-slate-400 select-none">•</span>
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Proposed Actions Cards */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Azioni Proposte dall'AI ({msg.actions.length})
                    </div>

                    {msg.actions.map(action => {
                      const isApplied = appliedActions[action.id];

                      return (
                        <div
                          key={action.id}
                          className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-purple-200 dark:border-purple-800/60 shadow-sm space-y-2 transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                                {action.type === 'update_shift' && <Clock className="w-4 h-4" />}
                                {action.type === 'create_leave' && <Umbrella className="w-4 h-4" />}
                                {action.type === 'create_event' && <Briefcase className="w-4 h-4" />}
                                {action.type === 'batch_update_shifts' && <Calendar className="w-4 h-4" />}
                              </span>
                              <div>
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                  {action.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {action.description}
                                </p>
                              </div>
                            </div>

                            {/* Badge Dettagli Tipo */}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                              {action.type === 'update_shift' ? 'Turno' : action.type === 'create_leave' ? 'Assenza' : 'Evento'}
                            </span>
                          </div>

                          {/* Dettagli specifici azione */}
                          {action.shiftData && (
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {action.shiftData.workerName}
                                </span>
                                <span className="text-slate-500 ml-1.5">({action.shiftData.dayName})</span>
                              </div>
                              <div className="font-bold text-indigo-600 dark:text-indigo-400">
                                {action.shiftData.status && action.shiftData.status !== 'LAVORO' ? (
                                  action.shiftData.status
                                ) : (
                                  <>
                                    {action.shiftData.mIn && `${action.shiftData.mIn}-${action.shiftData.mOut}`}
                                    {action.shiftData.pIn && ` · ${action.shiftData.pIn}-${action.shiftData.pOut}`}
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {action.leaveData && (
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {action.leaveData.workerName}
                                </span>
                                <span className="text-amber-600 dark:text-amber-400 font-bold ml-1.5">
                                  [{action.leaveData.tipo}]
                                </span>
                              </div>
                              <div className="text-slate-600 dark:text-slate-300">
                                {action.leaveData.mode === 'single'
                                  ? action.leaveData.day
                                  : `${action.leaveData.fromDay} ➔ ${action.leaveData.toDay}`}
                              </div>
                            </div>
                          )}

                          {action.eventData && (
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {action.eventData.title}
                              </span>
                              <span className="text-slate-600 dark:text-slate-300">
                                {action.eventData.day} ({action.eventData.fromTime}-{action.eventData.toTime})
                              </span>
                            </div>
                          )}

                          {/* Pulsante di applicazione */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            {isApplied ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                                <Check className="w-3.5 h-3.5" />
                                Applicato alla tabella!
                              </span>
                            ) : (
                              <button
                                onClick={() => handleApplySingleAction(action)}
                                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Applica Modifica</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Follow-up Chips contestuali */}
                {msg.quickFollowUps && msg.quickFollowUps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.quickFollowUps.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => handleSendMessage(chip)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition cursor-pointer flex items-center gap-1"
                      >
                        <span>{chip}</span>
                        <ChevronRight className="w-3 h-3 text-purple-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-600 animate-ping" />
                <span>L'AI sta analizzando i turni, le ferie e le regole di filiale...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Chiedi all'AI: modifica turni, segna ferie, verifica o chiedi consigli..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Invia</span>
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>💡 Suggerimento: puoi anche scrivere nomi dei lavoratori, date o orari (es. 06:30-14:30)</span>
            <span className="hidden sm:inline font-mono">D.Lgs 66/2003 · 40h standard</span>
          </div>
        </div>
      </div>
    </div>
  );
};
