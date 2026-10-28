export type WorkerGroup = 'MANAGER' | 'EDILE' | 'FINITURE' | 'MAGAZZINO' | 'ALTRO';

export interface WorkerBrainProfile {
  office?: boolean;
  warehouse?: boolean;
  saturdayEligible?: boolean;
  sabatista?: boolean;
  canOpen?: boolean;
  canClose?: boolean;
  jolly?: boolean;
  fixed?: boolean;
  pair?: 'A' | 'B' | null;
  officeProfile?: 'standard' | 'severin' | 'finiture' | string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  group: string;
  sort_order: number;
  active: boolean;
  created_at?: string;
  phone?: string;
  dob?: string;
  brain?: WorkerBrainProfile;
}

export type ShiftCategory = 'morning' | 'afternoon' | 'night' | 'rest' | 'leave' | 'special';

export interface ShiftDefinition {
  code: string;
  label: string;
  shortLabel: string;
  category: ShiftCategory;
  color: string;
  bgColor: string;
  textColor: string;
  hours: number;
  startTime?: string;
  endTime?: string;
  timeRange?: string;
}

export interface ShiftRecord {
  id: string;
  week_key: string;
  worker_id: string;
  day_index: number; // 0 = Lunedi, 6 = Domenica
  shift_code: string;
  note?: string;
  created_at?: string;
}

export interface LeaveEntry {
  id: string;
  worker_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  type: string;       // 'ferie' | 'malattia' | 'permesso' | 'rol' | 'donazione' | 'ricovero'
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at?: string;
  mode?: 'single' | 'range';
  full_day?: boolean;
  from_time?: string | null;
  to_time?: string | null;
  hours?: number | null;
  place?: string;
  request_date?: string;
  sync_turns?: boolean;
}

export interface BranchEvent {
  id: string;
  worker_id?: string | null; // null = all team
  title: string;
  date: string; // YYYY-MM-DD
  type: string; // 'training' | 'meeting' | 'visit' | 'transfer' | 'closure' | 'other'
  notes?: string;
  created_at?: string;
  all_day?: boolean;
  from_time?: string;
  to_time?: string;
  location?: string;
}

export interface DayCoverageRequirement {
  dayIndex: number;
  morning: number;
  afternoon: number;
  night: number;
  saturdayMorning?: number;
  saturdayAfternoon?: number;
}

export interface ShiftTimeInterval {
  mIn: string;
  mOut: string;
  pIn: string;
  pOut: string;
}

export interface AppSettings {
  teamName: string;
  marioId?: string;
  severinId?: string;
  giulianoId?: string;
  warehousePairA?: string[];
  warehousePairB?: string[];
  saturdayRotationIds?: string[];
  minAperturaImp?: number;
  minAperturaMag?: number;
  minSabatoImp?: number;
  minSabatoMag?: number;
  minWeeklyRestDays?: number;
  maxConsecutiveWorkDays?: number;
  maxConsecutiveMorning?: number;
  maxConsecutiveAfternoon?: number;
  maxConsecutiveNight?: number;
  minRestHoursBetweenShifts?: number;
  warehousePairsEnabled?: boolean;
  saturdayRotationEnabled?: boolean;
  equityBalancingEnabled?: boolean;
  lunchBreakManagement?: boolean;
  nightShiftFollowedByRest?: boolean;
  intelligentRulesVersion?: string;
  coverageRequirements: DayCoverageRequirement[];
  shiftTimes?: Record<string, ShiftTimeInterval>;
  branchHours?: {
    monFri: { open: string; close: string };
    sat: { open: string; close: string };
  };
}

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  workerId?: string;
  dayIndex?: number;
  weekKey?: string;
}

export interface GeneratedProposal {
  weekKey: string;
  score: number;
  stats: {
    totalShifts: number;
    equityScore: number;
    violationsCount: number;
  };
  violations: RuleViolation[];
  assignments: ShiftRecord[];
  explanations?: string[];
}

export type ViewMode = 'grid' | 'proposal' | 'leave' | 'events' | 'stats' | 'settings';
export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error';
