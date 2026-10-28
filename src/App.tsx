import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Printer, Download, X } from 'lucide-react';
import { Header } from './components/Header';
import { TurniView } from './components/TurniView';
import { FerieView } from './components/FerieView';
import { EventiView } from './components/EventiView';
import { ProposalModal } from './components/ProposalModal';
import { DayShiftModal } from './components/DayShiftModal';
import { LeaveModal } from './components/LeaveModal';
import { MalattiaModal } from './components/MalattiaModal';
import { BranchEventModal } from './components/BranchEventModal';
import { SpecificheImpegnoModal, RolModalData } from './components/SpecificheImpegnoModal';
import { ExportMenuModal } from './components/ExportMenuModal';
import { ToolsMenuModal } from './components/ToolsMenuModal';
import { TeamModal } from './components/TeamModal';
import { WorkerEditModal } from './components/WorkerEditModal';
import { RulesModal } from './components/RulesModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { LeaveRequestPreviewModal } from './components/LeaveRequestFacsimile';
import { AICopilotModal } from './components/AICopilotModal';
import { TodayBranchDashboard } from './components/TodayBranchDashboard';
import { QuickSwapModal } from './components/QuickSwapModal';
import { GlassAtmosphereModal, GlassIntensity, GlassAura } from './components/GlassAtmosphereModal';

import { createDefaultAppData } from './data/initialData';
import {
  AppData,
  DayShift,
  LeaveRequest,
  BranchEvent,
  RulesConfig,
  GeneratedProposal,
  Worker,
  WorkerQualificationsMap,
  WorkerSkillsProfile,
  AIProposedAction
} from './types/turni';
import {
  getWeekInfo,
  getWeekKey,
  generateAutoProposal,
  localDateKey,
  deepClone,
  calculateAbsenceWorkingHours,
  syncLeaveRequestToWeeks,
  reconcileAllLeavesWithWeeks,
  getWorkerNastroForDate
} from './services/engine';
import {
  socketManager,
  SocketStatus
} from './services/socket';
import {
  registerServiceWorker,
  getPushSubscription,
  requestPushSubscription,
  triggerPushNotification,
  playNotificationChime
} from './services/push';
import {
  buildWeeklyTurniPDF,
  buildLeaveRequestPDF,
  downloadBlob
} from './services/pdf';
import {
  buildCalendarICS,
  downloadICS,
  formatEventWhatsAppText,
  buildWeeklyFullICS
} from './services/ics';
import {
  playGlassTap,
  playGlassSuccess,
  playGlassShimmer
} from './services/soundFx';

export default function App() {
  const [appData, setAppData] = useState<AppData>(createDefaultAppData());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<'turni' | 'oggi' | 'ferie' | 'eventi'>('turni');
  const [quickSwapModal, setQuickSwapModal] = useState<{ open: boolean; dayIdx: number }>({ open: false, dayIdx: 0 });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('turni-theme') === 'light' ? 'light' : 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const [atmosphereModalOpen, setAtmosphereModalOpen] = useState(false);
  const [glassIntensity, setGlassIntensity] = useState<GlassIntensity>(() => {
    try {
      return (localStorage.getItem('turni-glass-intensity') as GlassIntensity) || 'frosted';
    } catch (e) {
      return 'frosted';
    }
  });
  const [glassAura, setGlassAura] = useState<GlassAura>(() => {
    try {
      return (localStorage.getItem('turni-glass-aura') as GlassAura) || 'cosmic';
    } catch (e) {
      return 'cosmic';
    }
  });

  const handleChangeIntensity = (val: GlassIntensity) => {
    setGlassIntensity(val);
    try { localStorage.setItem('turni-glass-intensity', val); } catch (e) {}
  };
  const handleChangeAura = (val: GlassAura) => {
    setGlassAura(val);
    try { localStorage.setItem('turni-glass-aura', val); } catch (e) {}
  };

  // Sincronizza classe tema e profondità vetro su document
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.documentElement.classList.add('light-theme');
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    } else {
      document.body.classList.remove('light-theme');
      document.documentElement.classList.remove('light-theme');
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    }

    // Applica intensità di sfocatura (blur)
    const blurValue = glassIntensity === 'deep' ? '36px' : glassIntensity === 'crystal' ? '16px' : '28px';
    document.documentElement.style.setProperty('--glass-blur', blurValue);
  }, [theme, glassIntensity]);

  // Specular Spotlight Cursore Dinamico: riflette la luce fisica sul vetro satinato
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('.glass-card, .glass-panel, .glass-dock');
      if (target) {
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (target as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (target as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Stato sincronizzazione e push
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('disconnected');
  const [connectedClients, setConnectedClients] = useState<number>(1);
  const [pushSubscribed, setPushSubscribed] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; body: string; type?: 'info' | 'success' | 'warn' } | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Modali
  const [proposal, setProposal] = useState<GeneratedProposal | null>(null);
  const [dayModal, setDayModal] = useState<{ open: boolean; workerId: string | null; dayIdx: number | null; dateObj: Date | null }>({
    open: false, workerId: null, dayIdx: null, dateObj: null
  });
  const [leaveModal, setLeaveModal] = useState<{ open: boolean; leaveId?: string | null }>({ open: false, leaveId: null });
  const [malattiaModal, setMalattiaModal] = useState<{ open: boolean; leaveId?: string | null }>({ open: false, leaveId: null });
  const [eventModal, setEventModal] = useState<{ open: boolean; eventId?: string | null }>({ open: false, eventId: null });
  const [specificheModal, setSpecificheModal] = useState<{
    open: boolean;
    event?: BranchEvent | null;
    rolData?: RolModalData | null;
  }>({ open: false, event: null, rolData: null });
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [workerEditModal, setWorkerEditModal] = useState<{ open: boolean; workerId?: string | null }>({ open: false, workerId: null });
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [diagnosticsModalOpen, setDiagnosticsModalOpen] = useState(false);
  const [helpGuideOpen, setHelpGuideOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [aiCopilotOpen, setAiCopilotOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState<string>('Anteprima Documento PDF');
  const [facsimilePreview, setFacsimilePreview] = useState<{
    req: LeaveRequest;
    workerName: string;
  } | null>(null);
  const globalPdfIframeRef = useRef<HTMLIFrameElement>(null);

  // Modali Interattive per Sostituire prompt/confirm/alert (Zero Blocchi Browser)
  const [editTitleModal, setEditTitleModal] = useState<{ open: boolean; title: string }>({ open: false, title: '' });
  const [editSpettantiModal, setEditSpettantiModal] = useState<{ open: boolean; workerId: string; workerName: string; year: number; days: number }>({
    open: false, workerId: '', workerName: '', year: 2026, days: 26
  });
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const showToast = useCallback((title: string, body: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setToastMessage({ title, body, type });
    if (type === 'success') {
      playGlassSuccess();
    } else {
      playNotificationChime();
    }
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Inizializzazione WebSocket e Service Worker
  useEffect(() => {
    const enrichWorkerProfiles = (workers: Worker[]): Worker[] => {
      const defaultWorkers = createDefaultAppData().workers;
      return (workers || []).map(w => {
        if (!w.profile || !w.profile.qualifications || Object.keys(w.profile.qualifications).length === 0) {
          const def = defaultWorkers.find(dw => dw.id === w.id || dw.name.trim().toUpperCase() === w.name.trim().toUpperCase());
          if (def?.profile) {
            return {
              ...w,
              profile: {
                ...def.profile,
                ...(w.profile || {})
              }
            };
          }
        }
        return w;
      });
    };

    // 1. Carica subito i dati completi via REST API per idratazione immediata
    fetch('/api/data')
      .then(res => res.json())
      .then(res => {
        if (res.data && res.data.workers && res.data.workers.length) {
          const d = res.data;
          d.leaveBalances = d.leaveBalances || {};
          d.leaveRequests = d.leaveRequests || [];
          d.events = d.events || [];
          d.weeks = d.weeks || {};
          d.workers = enrichWorkerProfiles(d.workers);
          reconcileAllLeavesWithWeeks(d.weeks, d.leaveRequests, d);
          setAppData(d);
        }
      })
      .catch(err => console.warn('Caricamento iniziale /api/data:', err));

    // 2. Registra Service Worker per PWA e Push
    registerServiceWorker().then(async () => {
      const sub = await getPushSubscription();
      setPushSubscribed(!!sub);
    });

    // 3. Connetti al WebSocket
    socketManager.connect();

    const unsubStatus = socketManager.onStatusChange((status, count) => {
      setSocketStatus(status);
      setConnectedClients(count);
    });

    const unsubData = socketManager.onDataUpdate((incomingData, meta) => {
      if (incomingData) {
        incomingData.leaveBalances = incomingData.leaveBalances || {};
        incomingData.leaveRequests = incomingData.leaveRequests || [];
        incomingData.events = incomingData.events || [];
        incomingData.weeks = incomingData.weeks || {};
        if (incomingData.workers) {
          incomingData.workers = enrichWorkerProfiles(incomingData.workers);
        }
        reconcileAllLeavesWithWeeks(incomingData.weeks, incomingData.leaveRequests, incomingData);
        setAppData(incomingData);
      }
    });

    const unsubNotif = socketManager.onRemoteNotification((title, body) => {
      showToast(title, body, 'info');
      setUnreadCount(c => c + 1);
    });

    return () => {
      unsubStatus();
      unsubData();
      unsubNotif();
    };
  }, [showToast]);

  // Gestione tema chiaro / scuro
  const handleToggleTheme = () => {
    playGlassTap();
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('turni-theme', next);
    } catch (e) {}
  };

  // Richiesta attivazione notifiche push
  const handleRequestPush = async () => {
    const res = await requestPushSubscription();
    if (res.success) {
      setPushSubscribed(true);
      showToast('🔔 Notifiche Push Attivate', 'Riceverai avvisi in tempo reale su questo dispositivo!', 'success');
      triggerPushNotification({
        title: 'Turni Corvetto Live',
        body: 'Dispositivo registrato con successo alle Notifiche Push!'
      });
    } else {
      showToast('Notifiche Push', res.error || 'Verifica i permessi delle notifiche del browser.', 'warn');
    }
  };

  const handleSendTestPush = async () => {
    const success = await triggerPushNotification({
      title: 'Notifica di Prova — Corvetto Live',
      body: 'Test di sincronizzazione e notifica push riuscito!'
    });
    if (success) {
      showToast('🔔 Notifica Push Inviata', 'Inviata a tutti i dispositivi registrati.', 'success');
    }
  };

  // Funzione di aggiornamento centralizzata con broadcast realtime
  const updateAppDataAuthoritative = useCallback((
    updater: (prev: AppData) => AppData,
    changeType: string,
    description: string,
    pushNotif?: { title: string; body: string; url?: string }
  ) => {
    setAppData((prev) => {
      const next = updater(deepClone(prev));
      next.updatedAt = Date.now();
      next.updatedBy = socketManager.getClientId();
      next.updatedRevision = (next.updatedRevision || 0) + 1;

      // Broadcast su WebSocket
      socketManager.sendDataUpdate(next, changeType, description, pushNotif);

      return next;
    });
  }, []);

  // 1. Modifica Cella Turno Singola
  const handleSaveDay = (workerId: string, dayIdx: number, data: DayShift) => {
    const weekKey = getWeekKey(currentDate);
    updateAppDataAuthoritative(
      (prev) => {
        if (!prev.weeks[weekKey]) prev.weeks[weekKey] = {};
        if (!prev.weeks[weekKey][workerId]) prev.weeks[weekKey][workerId] = {};
        prev.weeks[weekKey][workerId][dayIdx] = data;
        return prev;
      },
      'edit_shift',
      `Modificato turno per ${appData.workers.find(w => w.id === workerId)?.name || 'collaboratore'}`
    );
    showToast('Turno Salvato', 'Sincronizzato in tempo reale su tutti i dispositivi.', 'success');
  };

  const handleClearDay = (workerId: string, dayIdx: number) => {
    const weekKey = getWeekKey(currentDate);
    updateAppDataAuthoritative(
      (prev) => {
        if (prev.weeks[weekKey]?.[workerId]) {
          delete prev.weeks[weekKey][workerId][dayIdx];
        }
        return prev;
      },
      'clear_shift',
      `Cella turno svuotata`
    );
    showToast('Cella Svuotata', 'Dato aggiornato in tempo reale.', 'info');
  };

  const handleCopyPreviousDay = (workerId: string, dayIdx: number) => {
    if (dayIdx === 0) return;
    const weekKey = getWeekKey(currentDate);
    const prevDayData = appData.weeks[weekKey]?.[workerId]?.[dayIdx - 1];
    if (prevDayData) {
      handleSaveDay(workerId, dayIdx, deepClone(prevDayData));
    }
  };

  // 2. Generazione Proposta Automatica
  const handleOpenProposal = () => {
    const prop = generateAutoProposal(appData, currentDate);
    setProposal(prop);
  };

  const handleApplyProposal = () => {
    if (!proposal) return;
    const weekKey = proposal.weekKey;
    const weekInfo = getWeekInfo(currentDate);

    updateAppDataAuthoritative(
      (prev) => {
        prev.weeks[weekKey] = proposal.week;
        const officeSatWorker = proposal.meta?.actualOfficeSatId || proposal.meta?.nextUfficioId;
        if (officeSatWorker) {
          prev.rules.lastSaturdayUfficioId = officeSatWorker;
        }
        return prev;
      },
      'apply_proposal',
      `Applicata proposta automatica per la Settimana ${weekInfo.weekNo}`,
      {
        title: `✨ Nuovi Turni — Settimana ${weekInfo.weekNo}`,
        body: `È stata pubblicata la nuova programmazione dei turni per ${weekInfo.label}.`
      }
    );

    setProposal(null);
    showToast('✨ Proposta Applicata', `Turni della settimana ${weekInfo.weekNo} pubblicati e sincronizzati!`, 'success');
  };

  const handleSelectChoice = (choiceId: string, optionId: string) => {
    if (!proposal) return;
    setProposal((prev) => {
      if (!prev) return null;
      const next = deepClone(prev);
      const ch = next.choices.find(c => c.id === choiceId);
      if (ch) ch.selected = optionId;
      return next;
    });
  };

  const handleRecalculateProposal = () => {
    if (!proposal) return;
    const choicesMap: Record<string, string> = {};
    (proposal.choices || []).forEach(c => {
      if (c.selected) choicesMap[c.id] = c.selected;
    });
    const nextProp = generateAutoProposal(appData, currentDate, choicesMap);
    setProposal(nextProp);
    showToast('Ricalcolo Effettuato', 'Scelte applicate al motore di generazione.', 'info');
  };

  // 3. Copia Settimana Precedente
  const handleCopyPreviousWeek = () => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 7);
    const prevKey = getWeekKey(prevDate);
    const curKey = getWeekKey(currentDate);

    if (appData.weeks[prevKey]) {
      updateAppDataAuthoritative(
        (prev) => {
          prev.weeks[curKey] = deepClone(prev.weeks[prevKey]);
          if (prev.notes[prevKey]) prev.notes[curKey] = prev.notes[prevKey];
          return prev;
        },
        'copy_week',
        `Copiati turni dalla settimana precedente`
      );
    } else {
      showToast('Nessun Dato Precedente', 'La settimana precedente non contiene turni registrati da copiare.', 'warn');
    }
  };

  // 4. Gestione Richieste Ferie & Permessi
  const handleSaveLeave = (partialReq: Partial<LeaveRequest>) => {
    updateAppDataAuthoritative(
      (prev) => {
        const id = partialReq.id || `lr_${Date.now()}`;
        const nastroHours = partialReq.day ? getWorkerNastroForDate(partialReq.workerId || '', partialReq.day, prev) : 8;
        const finalHours = partialReq.mode === 'single'
          ? (partialReq.fullDay ? (partialReq.hours ?? nastroHours) : calculateAbsenceWorkingHours(partialReq.fromTime, partialReq.toTime, false, partialReq.workerId, partialReq.day, prev))
          : 8;

        const newReq: LeaveRequest = {
          id,
          workerId: partialReq.workerId || '',
          tipo: partialReq.tipo || 'Ferie',
          mode: partialReq.mode || 'single',
          day: partialReq.day,
          fullDay: partialReq.fullDay ?? true,
          fromTime: partialReq.fullDay ? undefined : partialReq.fromTime,
          toTime: partialReq.fullDay ? undefined : partialReq.toTime,
          hours: finalHours,
          fromDay: partialReq.fromDay,
          toDay: partialReq.toDay,
          note: partialReq.note,
          status: partialReq.status || 'richiesta',
          place: partialReq.place || 'Milano',
          requestDate: partialReq.requestDate || localDateKey(new Date()),
          syncTurns: partialReq.syncTurns ?? true,
          createdAt: new Date().toISOString()
        };

        const idx = prev.leaveRequests.findIndex(r => r.id === id);
        if (idx >= 0) prev.leaveRequests[idx] = newReq;
        else prev.leaveRequests.push(newReq);

        reconcileAllLeavesWithWeeks(prev.weeks, prev.leaveRequests, prev);

        return prev;
      },
      'save_leave',
      `Richiesta ${partialReq.tipo} salvata per ${appData.workers.find(w => w.id === partialReq.workerId)?.name}`,
      {
        title: `🏖️ Richiesta ${partialReq.tipo || 'Ferie'}`,
        body: `Nuova richiesta registrata per ${appData.workers.find(w => w.id === partialReq.workerId)?.name}.`
      }
    );
    showToast('Richiesta Registrata', 'Salvata e sincronizzata in tempo reale.', 'success');
  };

  const handleSaveMalattia = (partialReq: Partial<LeaveRequest>) => {
    updateAppDataAuthoritative(
      (prev) => {
        const id = partialReq.id || `mal_${Date.now()}`;
        const newReq: LeaveRequest = {
          id,
          workerId: partialReq.workerId || '',
          tipo: partialReq.tipo || 'Malattia',
          mode: 'range',
          fromDay: partialReq.fromDay,
          toDay: partialReq.toDay,
          openEnded: partialReq.openEnded ?? false,
          isMalattia: true,
          note: partialReq.note,
          status: partialReq.status || 'approvata',
          place: 'Milano',
          requestDate: localDateKey(new Date()),
          syncTurns: true,
          createdAt: new Date().toISOString()
        };

        const idx = prev.leaveRequests.findIndex(r => r.id === id);
        if (idx >= 0) prev.leaveRequests[idx] = newReq;
        else prev.leaveRequests.push(newReq);

        reconcileAllLeavesWithWeeks(prev.weeks, prev.leaveRequests, prev);

        return prev;
      },
      'save_malattia',
      `Registrata assenza ${partialReq.tipo}`,
      {
        title: `🤒 Certificato ${partialReq.tipo || 'Malattia'} Registrato`,
        body: `Assenza per malattia registrata per ${appData.workers.find(w => w.id === partialReq.workerId)?.name}.`
      }
    );
    showToast('Malattia Registrata', 'Turni e causali aggiornati istantaneamente.', 'success');
  };

  const handleUpdateLeaveStatus = (id: string, newStatus: 'richiesta' | 'approvata' | 'rifiutata') => {
    const req = appData.leaveRequests.find(r => r.id === id);
    const workerName = appData.workers.find(w => w.id === req?.workerId)?.name || 'collaboratore';

    updateAppDataAuthoritative(
      (prev) => {
        const target = prev.leaveRequests.find(r => r.id === id);
        if (target) {
          target.status = newStatus;
        }
        reconcileAllLeavesWithWeeks(prev.weeks, prev.leaveRequests, prev);
        return prev;
      },
      'update_leave_status',
      `Stato richiesta ${req?.tipo} aggiornato a ${newStatus}`,
      {
        title: `Richiesta ${req?.tipo} ${newStatus.toUpperCase()}`,
        body: `La richiesta di ${workerName} è stata impostata su: ${newStatus.toUpperCase()}.`
      }
    );
    showToast('Stato Aggiornato', `Richiesta ${newStatus.toUpperCase()} e sincronizzata.`, 'success');
  };

  const handleDeleteLeave = (id: string) => {
    updateAppDataAuthoritative(
      (prev) => {
        prev.leaveRequests = prev.leaveRequests.filter(r => r.id !== id);
        reconcileAllLeavesWithWeeks(prev.weeks, prev.leaveRequests, prev);
        return prev;
      },
      'delete_leave',
      'Richiesta eliminata'
    );
    showToast('Eliminata', 'Richiesta rimossa dal sistema.', 'info');
  };

  // 5. Gestione Impegni & Corsi
  const handleSaveEvent = (partialEvent: Partial<BranchEvent>) => {
    updateAppDataAuthoritative(
      (prev) => {
        const id = partialEvent.id || `ev_${Date.now()}`;
        const newEv: BranchEvent = {
          id,
          type: partialEvent.type || 'Corso',
          title: partialEvent.title || 'Nuovo Impegno',
          date: partialEvent.date || localDateKey(new Date()),
          allDay: partialEvent.allDay ?? false,
          fromTime: partialEvent.fromTime,
          toTime: partialEvent.toTime,
          location: partialEvent.location,
          participantIds: partialEvent.participantIds || [],
          notes: partialEvent.notes,
          reminderMinutes: partialEvent.reminderMinutes ?? 60,
          updatedAt: new Date().toISOString()
        };

        const idx = prev.events.findIndex(e => e.id === id);
        if (idx >= 0) prev.events[idx] = newEv;
        else prev.events.push(newEv);

        return prev;
      },
      'save_event',
      `Impegno filiale: ${partialEvent.title}`,
      {
        title: `📌 ${partialEvent.type || 'Impegno'}: ${partialEvent.title}`,
        body: `Programmato per il ${partialEvent.date} (${partialEvent.allDay ? 'Intera giornata' : `${partialEvent.fromTime}-${partialEvent.toTime}`}).`
      }
    );
    showToast('Impegno Salvato', 'Pianificato e sincronizzato con i turni.', 'success');
  };

  const handleDeleteEvent = (id: string) => {
    updateAppDataAuthoritative(
      (prev) => {
        prev.events = prev.events.filter(e => e.id !== id);
        return prev;
      },
      'delete_event',
      'Impegno eliminato'
    );
    showToast('Impegno Eliminato', 'Rimosso dalla programmazione.', 'info');
  };

  const handleOpenEventDetails = (eventId: string, defaultDate?: string, defaultWorkerId?: string) => {
    let ev = (appData.events || []).find(e => e.id === eventId);
    if (!ev) {
      ev = (appData.events || []).find(e => e.title.toLowerCase() === eventId.toLowerCase());
    }
    if (!ev) {
      ev = (appData.events || []).find(e => 
        e.title.toLowerCase().includes(eventId.toLowerCase()) || 
        eventId.toLowerCase().includes(e.title.toLowerCase())
      );
    }
    if (ev) {
      setSpecificheModal({ open: true, event: ev, rolData: null });
    } else {
      const isRiunione = eventId.toLowerCase().includes('riunione');
      const isCorso = eventId.toLowerCase().includes('corso');
      const isTrasferta = eventId.toLowerCase().includes('trasferta');
      const isVisita = eventId.toLowerCase().includes('visita');
      const provisionalEvent: BranchEvent = {
        id: `ev_${Date.now()}`,
        type: isRiunione ? 'Riunione' : isCorso ? 'Corso' : isTrasferta ? 'Trasferta' : isVisita ? 'Visita medica' : 'Altro',
        title: eventId,
        date: defaultDate || localDateKey(currentDate),
        allDay: isCorso,
        fromTime: isRiunione ? '18:00' : '08:30',
        toTime: isRiunione ? '19:30' : '17:30',
        location: isTrasferta ? 'Filiale di Via Arquà' : 'Filiale Corvetto',
        participantIds: defaultWorkerId ? [defaultWorkerId] : appData.workers.map(w => w.id),
        notes: `Impegno da programmazione turni: ${eventId}`,
        reminderMinutes: 60,
        updatedAt: new Date().toISOString()
      };
      setSpecificheModal({ open: true, event: provisionalEvent, rolData: null });
    }
  };

  const handleOpenRolDetails = (rolData: RolModalData) => {
    setSpecificheModal({ open: true, event: null, rolData });
  };

  // 6. Applicazione Azioni Consigliate dall'AI Copilot
  const handleApplyAIAction = (action: AIProposedAction) => {
    if (action.type === 'update_shift' && action.shiftData) {
      const s = action.shiftData;
      const targetWeekKey = getWeekKey(currentDate);
      const workerName = appData.workers.find(w => w.id === s.workerId)?.name || s.workerName || 'collaboratore';

      updateAppDataAuthoritative(
        (prev) => {
          if (!prev.weeks[targetWeekKey]) prev.weeks[targetWeekKey] = {};
          if (!prev.weeks[targetWeekKey][s.workerId]) prev.weeks[targetWeekKey][s.workerId] = {};
          prev.weeks[targetWeekKey][s.workerId][s.dayIdx] = {
            mIn: s.mIn || '',
            mOut: s.mOut || '',
            pIn: s.pIn || '',
            pOut: s.pOut || '',
            status: s.status || 'LAVORO',
            note: s.note || '',
            generated: false
          };
          return prev;
        },
        'ai_update_shift',
        `Modificato turno per ${workerName} (${s.dayName}) via AI Copilot`,
        {
          title: `🤖 Turno Aggiornato da AI`,
          body: `${workerName}: turno ${s.dayName} aggiornato.`
        }
      );
      showToast('Turno Applicato', `Turno di ${workerName} salvato e sincronizzato in tempo reale.`, 'success');
    } else if (action.type === 'create_leave' && action.leaveData) {
      const l = action.leaveData;
      handleSaveLeave({
        workerId: l.workerId,
        tipo: l.tipo,
        mode: l.mode,
        day: l.day,
        fromDay: l.fromDay,
        toDay: l.toDay,
        hours: l.hours,
        fullDay: l.fullDay ?? true,
        fromTime: l.fromTime,
        toTime: l.toTime,
        note: l.note || 'Richiesta creata da AI Copilot',
        status: 'approvata',
        syncTurns: true
      });
      showToast('Assenza Registrata', `Richiesta ${l.tipo} salvata e applicata ai turni.`, 'success');
    } else if (action.type === 'create_event' && action.eventData) {
      const ev = action.eventData;
      handleSaveEvent({
        title: ev.title,
        type: ev.tipo === 'corso' ? 'Corso' : ev.tipo === 'visita' ? 'Visita medica' : ev.tipo === 'chiusura' ? 'Chiusura' : 'Riunione',
        date: ev.day,
        allDay: false,
        fromTime: ev.fromTime,
        toTime: ev.toTime,
        location: ev.luogo || 'Filiale Corvetto',
        notes: ev.note || 'Inserito da AI Copilot',
        participantIds: ev.partecipanti || [],
        reminderMinutes: 30
      });
      showToast('Impegno Creato', `${ev.title} registrato nel calendario di filiale.`, 'success');
    } else if (action.type === 'batch_update_shifts' && action.batchShifts) {
      const targetWeekKey = getWeekKey(currentDate);
      updateAppDataAuthoritative(
        (prev) => {
          if (!prev.weeks[targetWeekKey]) prev.weeks[targetWeekKey] = {};
          for (const s of action.batchShifts || []) {
            if (!prev.weeks[targetWeekKey][s.workerId]) prev.weeks[targetWeekKey][s.workerId] = {};
            prev.weeks[targetWeekKey][s.workerId][s.dayIdx] = {
              mIn: s.mIn || '',
              mOut: s.mOut || '',
              pIn: s.pIn || '',
              pOut: s.pOut || '',
              status: s.status || 'LAVORO',
              note: s.note || '',
              generated: false
            };
          }
          return prev;
        },
        'ai_batch_update',
        action.description || 'Turni multipli aggiornati da AI Copilot'
      );
      showToast('Modifiche Multiple Applicate', 'Tutti i turni proposti sono stati salvati.', 'success');
    }
  };

  // 6. Esportazioni PDF e ICS
  const handleExportWeeklyPDF = () => {
    const doc = buildWeeklyTurniPDF(appData, currentDate);
    const weekInfo = getWeekInfo(currentDate);
    doc.save(`Turni_${appData.title}_Settimana_${weekInfo.weekNo}.pdf`);
    showToast('PDF Scaricato', 'Documento A4 generato con successo.', 'success');
  };

  const handlePreviewWeeklyPDF = () => {
    const doc = buildWeeklyTurniPDF(appData, currentDate);
    const weekInfo = getWeekInfo(currentDate);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setPdfPreviewTitle(`Programmazione Turni — Settimana ${weekInfo.weekNo} (${weekInfo.label})`);
    setPdfPreviewUrl(url);
  };

  const handleExportFacsimilePDF = (reqId: string) => {
    const req = appData.leaveRequests.find(r => r.id === reqId);
    if (!req) return;
    const worker = appData.workers.find(w => w.id === req.workerId);
    setFacsimilePreview({
      req,
      workerName: worker?.name || req.workerId
    });
  };

  const handleExportWeekICS = () => {
    const weekInfo = getWeekInfo(currentDate);
    const icsText = buildWeeklyFullICS(appData, currentDate);
    downloadICS(`Turni_${appData.title.replace(/\s+/g, '_')}_Settimana_${weekInfo.weekNo}.ics`, icsText);
    showToast('Calendario iCal Scaricato', 'File .ics con turni ed impegni della settimana generato con successo.', 'success');
  };

  const handleShareWhatsAppWeek = () => {
    const weekInfo = getWeekInfo(currentDate);
    const weekKey = getWeekKey(currentDate);
    const eventsThisWeek = (appData.events || []).filter(e => {
      const d = new Date(e.date + 'T12:00:00');
      return d >= weekInfo.monday && d <= weekInfo.saturday;
    });

    const lines = [
      `📌 *Programmazione Filiale ${appData.title}*`,
      `📅 Settimana ${weekInfo.weekNo} (${weekInfo.label})`,
      ''
    ];

    if (eventsThisWeek.length > 0) {
      lines.push('*Impegni e Corsi della Settimana:*');
      eventsThisWeek.forEach(e => {
        lines.push(`• *${e.title}* (${e.date} ${e.allDay ? 'tutto il giorno' : `${e.fromTime || ''}-${e.toTime || ''}`})`);
      });
      lines.push('');
    }

    if (appData.notes && appData.notes[weekKey]) {
      lines.push(`*Note di Filiale:*\n${appData.notes[weekKey]}\n`);
    }

    lines.push('_Turni Corvetto Live_');
    const text = lines.join('\n');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      }
    } catch (e) {}

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    try {
      window.open(url, '_blank');
    } catch (e) {}

    showToast('WhatsApp & Appunti', 'Riepilogo copiato negli appunti e link WhatsApp preparato.', 'success');
  };

  // 7. Configurazione Team e Collaboratori
  const handleSaveWorker = (partialWorker: Partial<Worker>) => {
    updateAppDataAuthoritative(
      (prev) => {
        const id = partialWorker.id || `w_${Date.now()}`;
        const existingIdx = prev.workers.findIndex(w => w.id === id);
        const existingWorker = existingIdx >= 0 ? prev.workers[existingIdx] : undefined;

        // Estrazione accurata e deep merge di profile, qualifications ed experiences
        const existingProfile = existingWorker?.profile || {};
        const incomingProfile = partialWorker.profile || (partialWorker as any)?.skillsProfile || {};

        const existingQuals = existingProfile.qualifications || {};
        const incomingQuals = incomingProfile.qualifications || (partialWorker as any)?.qualifications || {};

        // Merge sicuro delle singole abilitazioni formali (forklift, loader, firstAid, fireSafety)
        const mergedQuals: WorkerQualificationsMap = {
          ...existingQuals,
          ...incomingQuals
        };

        (['forklift', 'loader', 'firstAid', 'fireSafety'] as const).forEach(k => {
          const inQ = incomingQuals[k];
          const exQ = existingQuals[k];
          if (inQ) {
            mergedQuals[k] = {
              status: inQ.status || exQ?.status || 'none',
              expiry: inQ.expiry !== undefined ? inQ.expiry : (exQ?.expiry || '')
            };
          } else if (exQ) {
            mergedQuals[k] = { ...exQ };
          }
        });

        // Estrazione delle esperienze lavorative (sia campo experience che experiences alias)
        const incomingExp = incomingProfile.experience !== undefined
          ? incomingProfile.experience
          : (incomingProfile.experiences !== undefined
            ? incomingProfile.experiences
            : ((partialWorker as any)?.experiences !== undefined ? (partialWorker as any).experiences : existingProfile.experience || existingProfile.experiences || ''));

        // Profilo competenze completo e sicuro senza sovrascritture accidentali
        const mergedProfile: WorkerSkillsProfile = {
          ...existingProfile,
          ...incomingProfile,
          openingExperience: incomingProfile.openingExperience || existingProfile.openingExperience || 'unknown',
          sandExperience: incomingProfile.sandExperience || existingProfile.sandExperience || 'unknown',
          loaderExperience: incomingProfile.loaderExperience || existingProfile.loaderExperience || 'unknown',
          loadingExperience: incomingProfile.loadingExperience || existingProfile.loadingExperience || 'unknown',
          competencies: incomingProfile.competencies !== undefined ? incomingProfile.competencies : (existingProfile.competencies || ''),
          experience: typeof incomingExp === 'string' ? incomingExp : JSON.stringify(incomingExp || ''),
          experiences: incomingExp,
          otherQualifications: incomingProfile.otherQualifications !== undefined ? incomingProfile.otherQualifications : (existingProfile.otherQualifications || ''),
          qualifications: mergedQuals
        };

        const newW: Worker = {
          id,
          order: partialWorker.order || (existingWorker?.order ?? (prev.workers.length + 1)),
          name: partialWorker.name || existingWorker?.name || 'NUOVO',
          role: partialWorker.role !== undefined ? partialWorker.role : (existingWorker?.role || ''),
          group: partialWorker.group || existingWorker?.group || 'MAGAZZINO',
          phone: partialWorker.phone !== undefined ? partialWorker.phone : existingWorker?.phone,
          dob: partialWorker.dob !== undefined ? partialWorker.dob : existingWorker?.dob,
          selected: partialWorker.selected !== undefined ? partialWorker.selected : (existingWorker?.selected ?? true),
          brain: {
            ...(existingWorker?.brain || {}),
            ...(partialWorker.brain || {})
          },
          profile: mergedProfile
        };

        if (existingIdx >= 0) {
          prev.workers[existingIdx] = newW;
        } else {
          prev.workers.push(newW);
        }

        // Allinea rotazione sabato se applicabile
        if (newW.brain?.saturdayEligible && ['MANAGER', 'EDILE'].includes(newW.group)) {
          if (!prev.rules.sabatoUfficioIds.includes(id)) {
            prev.rules.sabatoUfficioIds.push(id);
          }
        }
        return prev;
      },
      'save_worker',
      `Modificato collaboratore ${partialWorker.name}`
    );
    showToast('Collaboratore Salvato', 'Competenze, abilitazioni ed esperienze salvate con successo.', 'success');
  };

  const handleMoveWorkerOrder = (workerId: string, delta: number) => {
    updateAppDataAuthoritative(
      (prev) => {
        const sorted = [...prev.workers].sort((a, b) => (a.order || 99) - (b.order || 99));
        const idx = sorted.findIndex(w => w.id === workerId);
        if (idx < 0) return prev;
        const targetIdx = idx + delta;
        if (targetIdx < 0 || targetIdx >= sorted.length) return prev;

        const tmp = sorted[idx].order;
        sorted[idx].order = sorted[targetIdx].order;
        sorted[targetIdx].order = tmp;

        prev.workers = sorted;
        return prev;
      },
      'reorder_worker',
      'Riordinato team'
    );
  };

  const handleToggleWorkerActive = (workerId: string) => {
    updateAppDataAuthoritative(
      (prev) => {
        const w = prev.workers.find(item => item.id === workerId);
        if (w) w.selected = !w.selected;
        return prev;
      },
      'toggle_worker_active',
      'Stato collaboratore modificato'
    );
  };

  const handleDeleteWorker = (workerId: string) => {
    const w = appData.workers.find(item => item.id === workerId);
    setConfirmModal({
      open: true,
      title: 'Elimina Collaboratore',
      message: `Sei sicuro di voler eliminare definitivamente ${w?.name || 'questo collaboratore'}? Verrà rimosso dal team e da tutte le rotazioni.`,
      confirmText: 'Elimina Definitivamente',
      isDanger: true,
      onConfirm: () => {
        updateAppDataAuthoritative(
          (prev) => {
            prev.workers = prev.workers.filter(x => x.id !== workerId);
            prev.rules.sabatoUfficioIds = prev.rules.sabatoUfficioIds.filter(id => id !== workerId);
            prev.rules.magPairA = prev.rules.magPairA.filter(id => id !== workerId);
            prev.rules.magPairB = prev.rules.magPairB.filter(id => id !== workerId);
            return prev;
          },
          'delete_worker',
          'Collaboratore eliminato'
        );
        showToast('Collaboratore Eliminato', 'Team e rotazioni aggiornati con successo.', 'info');
      }
    });
  };

  // 8. Backup e Ripristino JSON
  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `turni_corvetto_backup_${Date.now()}.json`);
    showToast('Backup Scaricato', 'Tutti i dati, turni e regole salvati in locale.', 'success');
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed.workers && Array.isArray(parsed.workers)) {
          updateAppDataAuthoritative(
            () => parsed,
            'restore_backup',
            'Ripristinato backup JSON'
          );
          showToast('Backup Ripristinato', 'Tutti i dati sono stati riallineati con successo!', 'success');
        } else {
          showToast('File Non Valido', 'Il file selezionato non è un backup valido di Turni Corvetto.', 'warn');
        }
      } catch (err: any) {
        showToast('Errore File', `Impossibile leggere il file JSON: ${err.message}`, 'warn');
      }
    };
    input.click();
  };

  // 9. Reset turni settimana corrente (mantenendo ferie, note ed eventi)
  const handleResetWeekTurns = () => {
    const curKey = getWeekKey(currentDate);
    const weekInfo = getWeekInfo(currentDate);
    setConfirmModal({
      open: true,
      title: 'Svuota Turni Settimana',
      message: `Vuoi davvero svuotare tutti i turni lavorativi della Settimana ${weekInfo.weekNo} (${weekInfo.label})? Ferie, permessi, note ed impegni collegati verranno mantenuti intatti.`,
      confirmText: 'Svuota Turni Settimana',
      isDanger: true,
      onConfirm: () => {
        updateAppDataAuthoritative(
          (prev) => {
            if (prev.weeks[curKey]) {
              const week = prev.weeks[curKey];
              Object.keys(week).forEach(wId => {
                Object.keys(week[wId] || {}).forEach(dayIdxStr => {
                  const d = week[wId][Number(dayIdxStr)];
                  if (d && (d.status === 'LAVORO' || d.status === 'RIPOSO' || !d.status)) {
                    delete week[wId][Number(dayIdxStr)];
                  }
                });
              });
            }
            return prev;
          },
          'reset_week',
          'Svuotati turni settimana'
        );
        showToast('Settimana Svuotata', 'I turni lavorativi sono stati azzerati mantenendo ferie e note.', 'info');
      }
    });
  };

  const weekInfo = getWeekInfo(currentDate);

  // Scambio turno rapido con 1-click
  const handleConfirmSwap = (workerAId: string, workerBId: string, dayIdx: number) => {
    const k = getWeekKey(currentDate);
    updateAppDataAuthoritative(
      prev => {
        if (!prev.weeks) prev.weeks = {};
        if (!prev.weeks[k]) prev.weeks[k] = {};
        const curWeek = prev.weeks[k];
        const cellA = curWeek[workerAId]?.[dayIdx] ? { ...curWeek[workerAId][dayIdx] } : { status: 'RIPOSO', mIn: '', mOut: '', pIn: '', pOut: '' };
        const cellB = curWeek[workerBId]?.[dayIdx] ? { ...curWeek[workerBId][dayIdx] } : { status: 'RIPOSO', mIn: '', mOut: '', pIn: '', pOut: '' };

        if (!prev.weeks[k][workerAId]) prev.weeks[k][workerAId] = {};
        if (!prev.weeks[k][workerBId]) prev.weeks[k][workerBId] = {};

        prev.weeks[k][workerAId][dayIdx] = { ...cellB, movedByEngine: true };
        prev.weeks[k][workerBId][dayIdx] = { ...cellA, movedByEngine: true };
        return prev;
      },
      'swap_shift',
      `Scambio turno tra ${appData.workers.find(w => w.id === workerAId)?.name || 'collega'} e ${appData.workers.find(w => w.id === workerBId)?.name || 'collega'}`
    );
    playGlassShimmer();
    showToast('Turni Scambiati', 'Gli orari dei due colleghi sono stati scambiati con successo.', 'success');
  };

  return (
    <div className="relative min-h-screen text-slate-100 overflow-x-hidden">
      {/* Ambient Mesh Lighting Background for Glassmorphism Refraction */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {theme === 'dark' ? (
          <>
            {/* Dark Aurora Mesh dinamica in base alla palette scelta */}
            {glassAura === 'emerald' ? (
              <>
                <div className="absolute -top-[15%] -left-[10%] w-[750px] h-[750px] rounded-full bg-gradient-to-br from-emerald-500/35 via-teal-400/25 to-transparent blur-[140px] animate-ambient-glow" />
                <div className="absolute top-[18%] -right-[15%] w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-teal-600/30 via-cyan-600/25 to-transparent blur-[150px] animate-ambient-glow" style={{ animationDelay: '-6s' }} />
                <div className="absolute top-[48%] left-[10%] w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-green-500/25 via-emerald-600/20 to-transparent blur-[140px] animate-ambient-glow" style={{ animationDelay: '-12s' }} />
                <div className="absolute -bottom-[18%] right-[20%] w-[720px] h-[720px] rounded-full bg-gradient-to-tl from-blue-600/22 via-teal-700/25 to-transparent blur-[160px] animate-ambient-glow" style={{ animationDelay: '-4s' }} />
                <div className="absolute top-[75%] -left-[5%] w-[500px] h-[500px] rounded-full bg-lime-500/16 blur-[130px]" />
              </>
            ) : glassAura === 'solar' ? (
              <>
                <div className="absolute -top-[15%] -left-[10%] w-[750px] h-[750px] rounded-full bg-gradient-to-br from-amber-500/35 via-orange-500/25 to-transparent blur-[140px] animate-ambient-glow" />
                <div className="absolute top-[18%] -right-[15%] w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-orange-600/30 via-yellow-600/20 to-transparent blur-[150px] animate-ambient-glow" style={{ animationDelay: '-6s' }} />
                <div className="absolute top-[48%] left-[10%] w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-amber-600/25 via-slate-700/30 to-transparent blur-[140px] animate-ambient-glow" style={{ animationDelay: '-12s' }} />
                <div className="absolute -bottom-[18%] right-[20%] w-[720px] h-[720px] rounded-full bg-gradient-to-tl from-red-600/20 via-amber-700/22 to-transparent blur-[160px] animate-ambient-glow" style={{ animationDelay: '-4s' }} />
                <div className="absolute top-[75%] -left-[5%] w-[500px] h-[500px] rounded-full bg-yellow-500/18 blur-[130px]" />
              </>
            ) : glassAura === 'rose' ? (
              <>
                <div className="absolute -top-[15%] -left-[10%] w-[750px] h-[750px] rounded-full bg-gradient-to-br from-pink-600/35 via-purple-500/25 to-transparent blur-[140px] animate-ambient-glow" />
                <div className="absolute top-[18%] -right-[15%] w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-purple-600/30 via-indigo-700/25 to-transparent blur-[150px] animate-ambient-glow" style={{ animationDelay: '-6s' }} />
                <div className="absolute top-[48%] left-[10%] w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-rose-500/25 via-pink-600/20 to-transparent blur-[140px] animate-ambient-glow" style={{ animationDelay: '-12s' }} />
                <div className="absolute -bottom-[18%] right-[20%] w-[720px] h-[720px] rounded-full bg-gradient-to-tl from-violet-700/25 via-fuchsia-600/20 to-transparent blur-[160px] animate-ambient-glow" style={{ animationDelay: '-4s' }} />
                <div className="absolute top-[75%] -left-[5%] w-[500px] h-[500px] rounded-full bg-rose-500/18 blur-[130px]" />
              </>
            ) : (
              <>
                <div className="absolute -top-[15%] -left-[10%] w-[750px] h-[750px] rounded-full bg-gradient-to-br from-blue-600/30 via-cyan-500/20 to-transparent blur-[140px] animate-ambient-glow" />
                <div className="absolute top-[18%] -right-[15%] w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-purple-600/28 via-indigo-600/22 to-transparent blur-[150px] animate-ambient-glow" style={{ animationDelay: '-6s' }} />
                <div className="absolute top-[48%] left-[10%] w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-emerald-600/20 via-teal-500/15 to-transparent blur-[140px] animate-ambient-glow" style={{ animationDelay: '-12s' }} />
                <div className="absolute -bottom-[18%] right-[20%] w-[720px] h-[720px] rounded-full bg-gradient-to-tl from-indigo-700/25 via-blue-600/20 to-transparent blur-[160px] animate-ambient-glow" style={{ animationDelay: '-4s' }} />
                <div className="absolute top-[75%] -left-[5%] w-[500px] h-[500px] rounded-full bg-amber-500/14 blur-[130px]" />
              </>
            )}
          </>
        ) : (
          <>
            {/* Light Iridescent Crystal Mesh */}
            <div className="absolute -top-[10%] -left-[8%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-sky-200/70 via-blue-100/50 to-transparent blur-[130px] animate-ambient-glow" />
            <div className="absolute top-[22%] -right-[12%] w-[650px] h-[650px] rounded-full bg-gradient-to-bl from-violet-200/60 via-purple-100/40 to-transparent blur-[140px] animate-ambient-glow" style={{ animationDelay: '-5s' }} />
            <div className="absolute bottom-[5%] left-[15%] w-[720px] h-[720px] rounded-full bg-gradient-to-tr from-emerald-100/65 via-teal-50/40 to-transparent blur-[150px]" />
          </>
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Toast Notifiche Realtime */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl glass-panel text-white flex items-start gap-3 max-w-sm animate-bounce-short">
            <div className="h-8 w-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              🔔
            </div>
            <div>
              <strong className="text-xs font-bold block">{toastMessage.title}</strong>
              <span className="text-[11px] text-slate-300 leading-snug block">{toastMessage.body}</span>
            </div>
          </div>
        )}

      {/* Header Applicazione */}
      <Header
        title={appData.title}
        appVersion={appData.appVersion}
        onEditTitle={() => setEditTitleModal({ open: true, title: appData.title })}
        activeView={activeView}
        setActiveView={setActiveView}
        socketStatus={socketStatus}
        connectedClients={connectedClients}
        pushSubscribed={pushSubscribed}
        onRequestPush={handleRequestPush}
        onSendTestPush={handleSendTestPush}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onGenerateProposal={handleOpenProposal}
        onCopyWeek={handleCopyPreviousWeek}
        onOpenAICopilot={() => setAiCopilotOpen(true)}
        onOpenExportMenu={() => setExportMenuOpen(true)}
        onOpenToolsMenu={() => setToolsMenuOpen(true)}
        onOpenHelpGuide={() => setHelpGuideOpen(true)}
        onOpenNotifications={() => { setNotificationsModalOpen(true); setUnreadCount(0); }}
        onOpenAtmosphere={() => setAtmosphereModalOpen(true)}
        unreadCount={unreadCount}
        weekNumber={weekInfo.weekNo}
      />

      {/* Viste Principali */}
      <main>
        {activeView === 'turni' && (
          <TurniView
            appData={appData}
            currentDate={currentDate}
            onChangeWeek={(offset) => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() + offset * 7);
              setCurrentDate(d);
            }}
            onOpenDayModal={(wId, dayIdx, dateObj) => {
              setDayModal({ open: true, workerId: wId, dayIdx, dateObj });
            }}
            onOpenWorkerModal={(wId) => {
              setWorkerEditModal({ open: true, workerId: wId });
            }}
            onOpenAddWorker={() => {
              setWorkerEditModal({ open: true, workerId: null });
            }}
            onUpdateNotes={(notesText) => {
              const k = getWeekKey(currentDate);
              updateAppDataAuthoritative(
                prev => { prev.notes[k] = notesText; return prev; },
                'update_notes',
                'Aggiornate note settimanali'
              );
            }}
            onToggleWorkerSelection={(workerId) => {
              updateAppDataAuthoritative(
                prev => {
                  const w = prev.workers.find(item => item.id === workerId);
                  if (w) w.selected = w.selected === false ? true : false;
                  return prev;
                },
                'toggle_select',
                'Aggiornata visibilità riga'
              );
            }}
            onToggleSelectAll={() => {
              updateAppDataAuthoritative(
                prev => {
                  const allActive = prev.workers.every(w => w.selected !== false);
                  prev.workers.forEach(w => { w.selected = !allActive; });
                  return prev;
                },
                'select_all',
                'Seleziona/deseleziona tutti'
              );
            }}
            onOpenEventDetails={handleOpenEventDetails}
            onOpenRolDetails={handleOpenRolDetails}
            onOpenSwapModal={() => setQuickSwapModal(prev => ({ ...prev, open: true }))}
            onSwitchToToday={() => setActiveView('oggi')}
            onGoToCurrentWeek={() => setCurrentDate(new Date())}
          />
        )}

        {activeView === 'oggi' && (
          <TodayBranchDashboard
            appData={appData}
            onOpenShiftModal={(workerId, dayIdx) => {
              const d = new Date(weekInfo.monday);
              d.setDate(d.getDate() + dayIdx);
              setDayModal({ open: true, workerId, dayIdx, dateObj: d });
            }}
            onOpenLeaveModal={() => setLeaveModal({ open: true, leaveId: null })}
            onOpenEventModal={(id) => setEventModal({ open: true, eventId: id || null })}
            onQuickSwap={(dayIdx) => setQuickSwapModal({ open: true, dayIdx })}
            onOpenAICopilot={() => setAiCopilotOpen(true)}
          />
        )}

        {activeView === 'ferie' && (
          <FerieView
            appData={appData}
            onOpenLeaveModal={(id) => setLeaveModal({ open: true, leaveId: id })}
            onOpenMalattiaModal={(id) => setMalattiaModal({ open: true, leaveId: id })}
            onUpdateStatus={handleUpdateLeaveStatus}
            onDeleteRequest={handleDeleteLeave}
            onExportLeavePDF={() => {
              handleExportWeeklyPDF();
            }}
            onExportFacsimilePDF={handleExportFacsimilePDF}
            onOpenRolDetails={handleOpenRolDetails}
            onEditSpettanti={(workerId, year) => {
              const cur = appData.leaveBalances?.[workerId]?.[year]?.spettanti ?? 26;
              const wName = appData.workers.find(w => w.id === workerId)?.name || 'Collaboratore';
              setEditSpettantiModal({
                open: true,
                workerId,
                workerName: wName,
                year,
                days: cur
              });
            }}
          />
        )}

        {activeView === 'eventi' && (
          <EventiView
            appData={appData}
            onOpenEventModal={(id) => setEventModal({ open: true, eventId: id })}
            onOpenEventDetails={handleOpenEventDetails}
            onDeleteEvent={handleDeleteEvent}
            onTriggerNotification={(title, body) => showToast(title, body, 'info')}
          />
        )}
      </main>

      {/* Banner Installazione PWA per smartphone */}
      <PWAInstallBanner />

      {/* Modali e Dialoghi */}
      <ProposalModal
        proposal={proposal}
        onClose={() => setProposal(null)}
        onApply={handleApplyProposal}
        onSelectChoice={handleSelectChoice}
        onRecalculate={handleRecalculateProposal}
      />

      <DayShiftModal
        isOpen={dayModal.open}
        onClose={() => setDayModal(m => ({ ...m, open: false }))}
        workerId={dayModal.workerId}
        dayIdx={dayModal.dayIdx}
        dateObj={dayModal.dateObj}
        appData={appData}
        onSaveDay={handleSaveDay}
        onClearDay={handleClearDay}
        onCopyPreviousDay={handleCopyPreviousDay}
        onOpenEventDetails={handleOpenEventDetails}
        onOpenRolDetails={handleOpenRolDetails}
      />

      <LeaveModal
        isOpen={leaveModal.open}
        onClose={() => setLeaveModal({ open: false, leaveId: null })}
        leaveId={leaveModal.leaveId}
        appData={appData}
        onSaveLeave={handleSaveLeave}
        onDeleteLeave={handleDeleteLeave}
        onExportPDF={handleExportFacsimilePDF}
      />

      <MalattiaModal
        isOpen={malattiaModal.open}
        onClose={() => setMalattiaModal({ open: false, leaveId: null })}
        leaveId={malattiaModal.leaveId}
        appData={appData}
        onSaveMalattia={handleSaveMalattia}
        onDeleteMalattia={handleDeleteLeave}
      />

      <BranchEventModal
        isOpen={eventModal.open}
        onClose={() => setEventModal({ open: false, eventId: null })}
        eventId={eventModal.eventId}
        appData={appData}
        onSaveEvent={handleSaveEvent}
        onDeleteEvent={handleDeleteEvent}
      />

      <SpecificheImpegnoModal
        isOpen={specificheModal.open}
        onClose={() => setSpecificheModal({ open: false, event: null, rolData: null })}
        event={specificheModal.event}
        rolData={specificheModal.rolData}
        appData={appData}
        onSaveEvent={handleSaveEvent}
        onDeleteEvent={handleDeleteEvent}
        onEditShiftDay={(workerId, dayIdx, dateObj) => {
          setDayModal({ open: true, workerId, dayIdx, dateObj });
        }}
        onOpenLeaveFacsimile={(req, workerName) => {
          setFacsimilePreview({ req, workerName });
        }}
        onExportFacsimilePDF={handleExportFacsimilePDF}
        onClearDayRol={(workerId, dayIdx) => {
          handleClearDay(workerId, dayIdx);
        }}
      />

      <ExportMenuModal
        isOpen={exportMenuOpen}
        onClose={() => setExportMenuOpen(false)}
        onExportPDF={handleExportWeeklyPDF}
        onPreviewPDF={handlePreviewWeeklyPDF}
        onExportEmail={() => {
          handleExportWeeklyPDF();
          window.location.href = `mailto:?subject=${encodeURIComponent(`Turni Filiale ${appData.title} - Settimana ${weekInfo.weekNo}`)}&body=${encodeURIComponent(`In allegato la programmazione turni per la settimana ${weekInfo.label}.\n\nSaluti,\nFiliale Corvetto`)}`;
        }}
        onExportJPG={() => {
          handleExportWeeklyPDF();
        }}
        onExportICS={handleExportWeekICS}
        onShareWhatsApp={handleShareWhatsAppWeek}
      />

      <ToolsMenuModal
        isOpen={toolsMenuOpen}
        onClose={() => setToolsMenuOpen(false)}
        onOpenTeam={() => setTeamModalOpen(true)}
        onOpenRules={() => setRulesModalOpen(true)}
        onOpenDiagnostics={() => setDiagnosticsModalOpen(true)}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
        onResetWeekTurns={handleResetWeekTurns}
        onResyncFirebase={async () => {
          try {
            showToast('Sincronizzazione Cloud', 'Recupero dati da Firebase RTDB...', 'info');
            const res = await fetch('/api/firebase/resync', { method: 'POST' });
            const json = await res.json();
            if (json.success) {
              const dataRes = await fetch('/api/data');
              const dataJson = await dataRes.json();
              if (dataJson.data) {
                setAppData(dataJson.data);
              }
              showToast('Dati Recuperati con Successo', `Riallineate ${json.weeksCount} settimane, ${json.leavesCount} ferie/permessi, ${json.eventsCount} impegni!`, 'success');
            } else {
              showToast('Errore Sincronizzazione', json.error || 'Verifica la connessione o i dati Cloud.', 'warn');
            }
          } catch (e: any) {
            showToast('Errore Rete', 'Errore recupero dati: ' + e.message, 'warn');
          }
        }}
      />

      <TeamModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        workers={appData.workers}
        onOpenWorkerEdit={(id) => setWorkerEditModal({ open: true, workerId: id })}
        onOpenAddWorker={() => setWorkerEditModal({ open: true, workerId: null })}
        onMoveOrder={handleMoveWorkerOrder}
        onToggleActive={handleToggleWorkerActive}
        onDeleteWorker={handleDeleteWorker}
      />

      <WorkerEditModal
        isOpen={workerEditModal.open}
        onClose={() => setWorkerEditModal({ open: false, workerId: null })}
        workerId={workerEditModal.workerId}
        workers={appData.workers}
        onSaveWorker={handleSaveWorker}
        onDeleteWorker={handleDeleteWorker}
        onDeactivateWorker={handleToggleWorkerActive}
      />

      <RulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        appData={appData}
        onSaveRules={(newRules) => {
          updateAppDataAuthoritative(
            prev => { prev.rules = newRules; return prev; },
            'update_rules',
            'Salvate nuove regole di generazione turni'
          );
          showToast('Regole Salvate', 'Configurazione aggiornata.', 'success');
        }}
      />

      <DiagnosticsModal
        isOpen={diagnosticsModalOpen}
        onClose={() => setDiagnosticsModalOpen(false)}
        appData={appData}
        socketStatus={socketStatus}
        connectedClients={connectedClients}
      />

      <HelpGuideModal
        isOpen={helpGuideOpen}
        onClose={() => setHelpGuideOpen(false)}
      />

      <QuickSwapModal
        isOpen={quickSwapModal.open}
        onClose={() => setQuickSwapModal(prev => ({ ...prev, open: false }))}
        dayIdx={quickSwapModal.dayIdx}
        appData={appData}
        weekKey={getWeekKey(currentDate)}
        onConfirmSwap={handleConfirmSwap}
      />

      <NotificationCenterModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        pushSubscribed={pushSubscribed}
        onRequestPush={handleRequestPush}
        onSendTestPush={handleSendTestPush}
        connectedClients={connectedClients}
      />

      {/* Modale Anteprima Facsimile Ufficiale (Zero blocchi di Chrome) */}
      {facsimilePreview && (
        <LeaveRequestPreviewModal
          isOpen={true}
          onClose={() => setFacsimilePreview(null)}
          req={facsimilePreview.req}
          workerName={facsimilePreview.workerName}
          title={appData.title || 'CORVETTO'}
        />
      )}

      {/* Anteprima PDF Settimanale in Modal */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
          <div className="w-full max-w-4xl h-[90vh] rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <strong className="text-white text-sm sm:text-base font-bold">{pdfPreviewTitle}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (globalPdfIframeRef.current && globalPdfIframeRef.current.contentWindow) {
                      try {
                        globalPdfIframeRef.current.contentWindow.focus();
                        globalPdfIframeRef.current.contentWindow.print();
                        return;
                      } catch (err) {
                        console.warn('Iframe print error, falling back to window.print', err);
                      }
                    }
                    window.print();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  title="Stampa documento"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Stampa</span>
                </button>
                <a
                  href={pdfPreviewUrl}
                  download="Programmazione_Turni.pdf"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition cursor-pointer"
                  title="Scarica file PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Scarica</span>
                </a>
                <button
                  onClick={() => { URL.revokeObjectURL(pdfPreviewUrl); setPdfPreviewUrl(null); }}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Chiudi anteprima"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Avviso in caso di blocco plugin PDF in Chrome */}
            <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
                💡 Se Chrome blocca la visualizzazione PDF all'interno del riquadro, premi <strong>Scarica</strong> o <strong>Stampa</strong> in alto.
              </span>
              <a
                href={pdfPreviewUrl}
                download="Programmazione_Turni.pdf"
                className="px-2.5 py-1 rounded-lg bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 text-[11px] font-semibold transition"
              >
                Scarica File
              </a>
            </div>

            <iframe
              ref={globalPdfIframeRef}
              src={pdfPreviewUrl}
              className="w-full flex-1 rounded-2xl border border-slate-800 bg-white"
              title="Anteprima PDF"
            />
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => { URL.revokeObjectURL(pdfPreviewUrl); setPdfPreviewUrl(null); }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Chiudi Anteprima
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button AI Copilot per accesso immediato su tutti i dispositivi */}
      <button
        type="button"
        onClick={() => setAiCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl shadow-purple-600/35 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-white dark:ring-slate-900 group"
        title="Apri l'Assistente AI Copilot per modificare turni, ferie e verificare conformità"
      >
        <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">🤖</span>
        <div className="text-left hidden sm:block">
          <div className="font-extrabold text-xs leading-tight tracking-wide">AI Copilot</div>
          <div className="text-[10px] text-purple-200">Turni & Verifiche</div>
        </div>
        <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
          Live
        </span>
      </button>

      {/* Modale AI Copilot Interattivo */}
      <AICopilotModal
        open={aiCopilotOpen}
        onClose={() => setAiCopilotOpen(false)}
        appData={appData}
        weekKey={getWeekKey(currentDate)}
        currentDate={currentDate}
        onApplyAction={handleApplyAIAction}
      />

      {/* Modale Rinomina Filiale / Titolo App (Zero blocchi di Chrome) */}
      {editTitleModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✏️</span> Modifica Nome Filiale / Titolo
              </h3>
              <button
                onClick={() => setEditTitleModal({ open: false, title: '' })}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Nome Filiale</label>
              <input
                type="text"
                value={editTitleModal.title}
                onChange={(e) => setEditTitleModal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Es. CORVETTO"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white mt-1 focus:outline-none focus:border-blue-500 uppercase"
                autoFocus
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Il nome apparirà in intestazione, nei PDF scaricati e nelle esportazioni ufficiali.
              </span>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditTitleModal({ open: false, title: '' })}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={!editTitleModal.title.trim()}
                onClick={() => {
                  const t = editTitleModal.title.trim().toUpperCase();
                  if (t) {
                    updateAppDataAuthoritative(
                      prev => { prev.title = t; return prev; },
                      'edit_title',
                      `Rinominata filiale in ${t}`
                    );
                    showToast('Titolo Aggiornato', `Filiale rinominata in "${t}"`, 'success');
                  }
                  setEditTitleModal({ open: false, title: '' });
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow transition cursor-pointer"
              >
                Salva Titolo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Modifica Giorni Ferie Spettanti (Zero blocchi di Chrome) */}
      {editSpettantiModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🏖️</span> Ferie Spettanti Annuali
              </h3>
              <button
                onClick={() => setEditSpettantiModal(prev => ({ ...prev, open: false }))}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-extrabold text-white">{editSpettantiModal.workerName}</div>
              <label className="text-xs text-slate-400 block pt-1">
                Giorni lavorativi retribuiti di ferie spettanti per l'anno {editSpettantiModal.year}:
              </label>
              <input
                type="number"
                min={0}
                max={60}
                step={0.5}
                value={editSpettantiModal.days}
                onChange={(e) => setEditSpettantiModal(prev => ({ ...prev, days: parseFloat(e.target.value) || 0 }))}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-base font-black text-white mt-1 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditSpettantiModal(prev => ({ ...prev, open: false }))}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  const days = editSpettantiModal.days;
                  const wId = editSpettantiModal.workerId;
                  const yr = editSpettantiModal.year;
                  updateAppDataAuthoritative(
                    prev => {
                      if (!prev.leaveBalances) prev.leaveBalances = {};
                      if (!prev.leaveBalances[wId]) prev.leaveBalances[wId] = {};
                      prev.leaveBalances[wId][yr] = { spettanti: days };
                      return prev;
                    },
                    'edit_balance',
                    `Modificati giorni spettanti per ${editSpettantiModal.workerName}`
                  );
                  showToast('Ferie Spettanti Aggiornate', `${editSpettantiModal.workerName}: ${days} giorni spettanti impostati per il ${yr}.`, 'success');
                  setEditSpettantiModal(prev => ({ ...prev, open: false }));
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition cursor-pointer"
              >
                Salva Spettanti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale di Conferma Azioni Critiche (Zero blocchi di Chrome) */}
      {confirmModal && confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{confirmModal.isDanger ? '⚠️' : 'ℹ️'}</span> {confirmModal.title}
              </h3>
              <button
                onClick={() => setConfirmModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {confirmModal.message}
            </p>
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  const cb = confirmModal.onConfirm;
                  setConfirmModal(null);
                  cb();
                }}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow transition cursor-pointer ${
                  confirmModal.isDanger
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                }`}
              >
                {confirmModal.confirmText || 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modale Personalizzazione Atmosfera Spaziale VisionOS */}
      <GlassAtmosphereModal
        open={atmosphereModalOpen}
        onClose={() => setAtmosphereModalOpen(false)}
        intensity={glassIntensity}
        onChangeIntensity={handleChangeIntensity}
        aura={glassAura}
        onChangeAura={handleChangeAura}
      />
      </div>
    </div>
  );
}
