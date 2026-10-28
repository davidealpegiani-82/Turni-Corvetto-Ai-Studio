import { create } from 'zustand';
import {
  Worker,
  ShiftRecord,
  LeaveEntry,
  BranchEvent,
  AppSettings,
  GeneratedProposal,
  ViewMode,
  SyncStatus
} from '../types';
import { supabase } from '../lib/supabase';
import { getCurrentWeekKey } from '../lib/dateUtils';
import { generateProposal } from '../lib/rulesEngine';

const DEFAULT_SETTINGS: AppSettings = {
  teamName: "CORVETTO",
  marioId: "w_10",
  severinId: "w_4",
  giulianoId: "w_5",
  minSabatoImp: 1,
  minSabatoMag: 1,
  minAperturaImp: 2,
  minAperturaMag: 2,
  warehousePairA: ["w_6", "w_8"],
  warehousePairB: ["w_7", "w_9"],
  minWeeklyRestDays: 2,
  maxConsecutiveNight: 4,
  maxConsecutiveMorning: 5,
  maxConsecutiveAfternoon: 5,
  maxConsecutiveWorkDays: 6,
  minRestHoursBetweenShifts: 11,
  warehousePairsEnabled: true,
  saturdayRotationEnabled: true,
  equityBalancingEnabled: true,
  lunchBreakManagement: true,
  nightShiftFollowedByRest: true,
  intelligentRulesVersion: "M1-M45 + ROL/SEVERIN FIX",
  saturdayRotationIds: ["w_1", "w_2", "w_3"],
  coverageRequirements: [
    { dayIndex: 0, morning: 2, afternoon: 2, night: 0 },
    { dayIndex: 1, morning: 2, afternoon: 2, night: 0 },
    { dayIndex: 2, morning: 2, afternoon: 2, night: 0 },
    { dayIndex: 3, morning: 2, afternoon: 2, night: 0 },
    { dayIndex: 4, morning: 2, afternoon: 2, night: 0 },
    { dayIndex: 5, morning: 1, afternoon: 0, night: 0, saturdayMorning: 1, saturdayAfternoon: 0 },
    { dayIndex: 6, morning: 0, afternoon: 0, night: 0 }
  ],
  branchHours: {
    monFri: { open: "06:30", close: "17:30" },
    sat: { open: "07:00", close: "12:00" }
  }
};

interface TurniState {
  workers: Worker[];
  shifts: ShiftRecord[];
  leaveEntries: LeaveEntry[];
  events: BranchEvent[];
  settings: AppSettings;
  currentWeekKey: string;
  viewMode: ViewMode;
  loading: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  proposal: GeneratedProposal | null;
  proposalLoading: boolean;
  searchQuery: string;
  selectedWorkerId: string | null;

  // Actions
  loadData: () => Promise<void>;
  setWeekKey: (weekKey: string) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setSelectedWorkerId: (id: string | null) => void;
  addWorker: (name: string, role: string, group?: string, brain?: any) => Promise<void>;
  updateWorker: (id: string, updates: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  reorderWorkers: (id: string, direction: 'up' | 'down') => Promise<void>;
  setShift: (workerId: string, dayIndex: number, shiftCode: string, note?: string) => Promise<void>;
  deleteShift: (workerId: string, dayIndex: number) => Promise<void>;
  clearWeek: () => Promise<void>;
  addLeave: (leave: Omit<LeaveEntry, 'id' | 'created_at'>) => Promise<void>;
  updateLeave: (id: string, updates: Partial<LeaveEntry>) => Promise<void>;
  deleteLeave: (id: string) => Promise<void>;
  addEvent: (event: Omit<BranchEvent, 'id' | 'created_at'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<BranchEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  generateProposalAction: () => Promise<void>;
  applyProposal: (assignments: ShiftRecord[]) => Promise<void>;
}

export const useTurniStore = create<TurniState>((set, get) => ({
  workers: [],
  shifts: [],
  leaveEntries: [],
  events: [],
  settings: DEFAULT_SETTINGS,
  currentWeekKey: getCurrentWeekKey(),
  viewMode: 'grid',
  loading: true,
  error: null,
  syncStatus: 'idle',
  proposal: null,
  proposalLoading: false,
  searchQuery: '',
  selectedWorkerId: null,

  loadData: async () => {
    set({ loading: true, error: null });
    try {
      // 1. Prova prima la connessione diretta a Supabase
      const [wRes, sRes, lRes, eRes, setRes] = await Promise.all([
        supabase.from('workers').select('*').order('sort_order', { ascending: true }),
        supabase.from('shifts').select('*'),
        supabase.from('leave').select('*').order('start_date', { ascending: false }),
        supabase.from('events').select('*').order('date', { ascending: false }),
        supabase.from('settings').select('*')
      ]);

      if (wRes.error) throw wRes.error;
      if (sRes.error) throw sRes.error;
      if (lRes.error) throw lRes.error;
      if (eRes.error) throw eRes.error;

      let mergedSettings = DEFAULT_SETTINGS;
      if (setRes.data && setRes.data.length > 0) {
        const appSetRow = setRes.data.find((r: any) => r.key === 'app_settings');
        if (appSetRow && appSetRow.value) {
          mergedSettings = { ...DEFAULT_SETTINGS, ...appSetRow.value };
        }
      }

      set({
        workers: wRes.data || [],
        shifts: sRes.data || [],
        leaveEntries: lRes.data || [],
        events: eRes.data || [],
        settings: mergedSettings,
        loading: false
      });
    } catch (err: any) {
      console.warn('[TurniStore] Errore caricamento Supabase, fallback sui dati locali:', err);
      // Fallback a API locale del server o database salvato
      try {
        const localRes = await fetch('/api/supabase-dump');
        if (localRes.ok) {
          const dump = await localRes.json();
          let setVal = DEFAULT_SETTINGS;
          if (dump.settings && dump.settings[0]?.value) {
            setVal = { ...DEFAULT_SETTINGS, ...dump.settings[0].value };
          }
          set({
            workers: dump.workers || [],
            shifts: dump.shifts || [],
            leaveEntries: dump.leave || [],
            events: dump.events || [],
            settings: setVal,
            loading: false
          });
          return;
        }
      } catch (e) {
        console.error('Fallback locale fallito:', e);
      }
      set({ error: err?.message || 'Impossibile connettersi al database turni', loading: false });
    }
  },

  setWeekKey: (weekKey: string) => set({ currentWeekKey: weekKey, proposal: null }),
  setViewMode: (viewMode: ViewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  setSelectedWorkerId: (selectedWorkerId: string | null) => set({ selectedWorkerId }),

  addWorker: async (name: string, role: string, group = 'EDILE', brain = {}) => {
    set({ syncStatus: 'syncing' });
    try {
      const newOrder = get().workers.length;
      const { data, error } = await supabase.from('workers').insert({
        name,
        role,
        group,
        brain,
        sort_order: newOrder,
        active: true
      }).select().single();

      if (error) throw error;
      set(s => ({ workers: [...s.workers, data], syncStatus: 'saved' }));
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  },

  updateWorker: async (id: string, updates: Partial<Worker>) => {
    set({ syncStatus: 'syncing' });
    try {
      const { data, error } = await supabase.from('workers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      set(s => ({
        workers: s.workers.map(w => w.id === id ? { ...w, ...data } : w),
        syncStatus: 'saved'
      }));
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  },

  deleteWorker: async (id: string) => {
    set({ syncStatus: 'syncing' });
    try {
      const { error } = await supabase.from('workers').delete().eq('id', id);
      if (error) throw error;
      set(s => ({
        workers: s.workers.filter(w => w.id !== id),
        syncStatus: 'saved'
      }));
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  },

  reorderWorkers: async (id: string, direction: 'up' | 'down') => {
    const list = [...get().workers].sort((a, b) => a.sort_order - b.sort_order);
    const idx = list.findIndex(w => w.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const current = list[idx];
    const target = list[targetIdx];

    const currentOrder = current.sort_order;
    const targetOrder = target.sort_order;

    set({ syncStatus: 'syncing' });
    try {
      await Promise.all([
        supabase.from('workers').update({ sort_order: targetOrder }).eq('id', current.id),
        supabase.from('workers').update({ sort_order: currentOrder }).eq('id', target.id)
      ]);

      set(s => ({
        workers: s.workers.map(w => {
          if (w.id === current.id) return { ...w, sort_order: targetOrder };
          if (w.id === target.id) return { ...w, sort_order: currentOrder };
          return w;
        }),
        syncStatus: 'saved'
      }));
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  },

  setShift: async (workerId: string, dayIndex: number, shiftCode: string, note = '') => {
    const weekKey = get().currentWeekKey;
    set({ syncStatus: 'syncing' });
    try {
      const existing = get().shifts.find(s => s.week_key === weekKey && s.worker_id === workerId && s.day_index === dayIndex);

      if (!shiftCode || shiftCode === '') {
        if (existing) {
          const { error } = await supabase.from('shifts').delete().eq('id', existing.id);
          if (error) throw error;
          set(s => ({
            shifts: s.shifts.filter(x => x.id !== existing.id),
            syncStatus: 'saved'
          }));
        }
      } else {
        if (existing) {
          const { data, error } = await supabase.from('shifts').update({ shift_code: shiftCode, note }).eq('id', existing.id).select().single();
          if (error) throw error;
          set(s => ({
            shifts: s.shifts.map(x => x.id === existing.id ? data : x),
            syncStatus: 'saved'
          }));
        } else {
          const { data, error } = await supabase.from('shifts').insert({
            week_key: weekKey,
            worker_id: workerId,
            day_index: dayIndex,
            shift_code: shiftCode,
            note
          }).select().single();
          if (error) throw error;
          set(s => ({
            shifts: [...s.shifts, data],
            syncStatus: 'saved'
          }));
        }
      }
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  },

  deleteShift: async (workerId: string, dayIndex: number) => {
    const weekKey = get().currentWeekKey;
    const existing = get().shifts.find(s => s.week_key === weekKey && s.worker_id === workerId && s.day_index === dayIndex);
    if (!existing) return;
    set({ syncStatus: 'syncing' });
    try {
      await supabase.from('shifts').delete().eq('id', existing.id);
      set(s => ({
        shifts: s.shifts.filter(x => x.id !== existing.id),
        syncStatus: 'saved'
      }));
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  },

  clearWeek: async () => {
    const weekKey = get().currentWeekKey;
    set({ syncStatus: 'syncing' });
    try {
      const { error } = await supabase.from('shifts').delete().eq('week_key', weekKey);
      if (error) throw error;
      set(s => ({
        shifts: s.shifts.filter(x => x.week_key !== weekKey),
        syncStatus: 'saved'
      }));
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  },

  addLeave: async (leave) => {
    set({ syncStatus: 'syncing' });
    try {
      const { data, error } = await supabase.from('leave').insert(leave).select().single();
      if (error) throw error;
      set(s => ({
        leaveEntries: [data, ...s.leaveEntries],
        syncStatus: 'saved'
      }));
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  },

  updateLeave: async (id: string, updates: Partial<LeaveEntry>) => {
    set({ syncStatus: 'syncing' });
    try {
      const { data, error } = await supabase.from('leave').update(updates).eq('id', id).select().single();
      if (error) throw error;
      set(s => ({
        leaveEntries: s.leaveEntries.map(l => l.id === id ? data : l),
        syncStatus: 'saved'
      }));
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  },

  deleteLeave: async (id: string) => {
    set({ syncStatus: 'syncing' });
    try {
      const { error } = await supabase.from('leave').delete().eq('id', id);
      if (error) throw error;
      set(s => ({
        leaveEntries: s.leaveEntries.filter(l => l.id !== id),
        syncStatus: 'saved'
      }));
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  },

  addEvent: async (ev) => {
    set({ syncStatus: 'syncing' });
    try {
      const { data, error } = await supabase.from('events').insert(ev).select().single();
      if (error) throw error;
      set(s => ({
        events: [data, ...s.events],
        syncStatus: 'saved'
      }));
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  },

  updateEvent: async (id: string, updates: Partial<BranchEvent>) => {
    set({ syncStatus: 'syncing' });
    try {
      const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single();
      if (error) throw error;
      set(s => ({
        events: s.events.map(e => e.id === id ? data : e),
        syncStatus: 'saved'
      }));
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  },

  deleteEvent: async (id: string) => {
    set({ syncStatus: 'syncing' });
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      set(s => ({
        events: s.events.filter(e => e.id !== id),
        syncStatus: 'saved'
      }));
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  },

  updateSettings: async (updates: Partial<AppSettings>) => {
    const newSettings = { ...get().settings, ...updates };
    set({ settings: newSettings, syncStatus: 'syncing' });
    try {
      const { error } = await supabase.from('settings').upsert({
        key: 'app_settings',
        value: newSettings
      }, { onConflict: 'key' });
      if (error) throw error;
      set({ syncStatus: 'saved' });
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  },

  generateProposalAction: async () => {
    set({ proposalLoading: true });
    await new Promise(r => setTimeout(r, 150));
    const state = get();
    const pastShifts = state.shifts.filter(s => s.week_key !== state.currentWeekKey);
    const prop = generateProposal(
      state.currentWeekKey,
      state.workers,
      state.leaveEntries,
      pastShifts,
      state.settings,
      state.events
    );
    set({ proposal: prop, proposalLoading: false });
  },

  applyProposal: async (assignments: ShiftRecord[]) => {
    const weekKey = get().currentWeekKey;
    set({ syncStatus: 'syncing' });
    try {
      // 1. Cancella i turni esistenti della settimana corrente
      await supabase.from('shifts').delete().eq('week_key', weekKey);

      // 2. Prepara nuovi record da inserire (senza id di preview)
      const toInsert = assignments.map(a => ({
        week_key: weekKey,
        worker_id: a.worker_id,
        day_index: a.day_index,
        shift_code: a.shift_code,
        note: a.note || ''
      }));

      const { data, error } = await supabase.from('shifts').insert(toInsert).select();
      if (error) throw error;

      set(s => ({
        shifts: [...s.shifts.filter(x => x.week_key !== weekKey), ...(data || [])],
        proposal: null,
        syncStatus: 'saved'
      }));
      setTimeout(() => set({ syncStatus: 'idle' }), 2000);
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'error' });
    }
  }
}));
