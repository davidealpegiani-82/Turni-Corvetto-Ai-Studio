export type WorkerGroup = 'MANAGER' | 'EDILE' | 'FINITURE' | 'MAGAZZINO' | 'ALTRO';

export type WorkerExperienceLevel = 'unknown' | 'assisted' | 'autonomous' | 'mentor';
export type QualificationStatus = 'unknown' | 'valid' | 'expired' | 'none';

export interface WorkerQualification {
  status: QualificationStatus;
  expiry?: string; // YYYY-MM-DD
}

export interface WorkerQualificationsMap {
  forklift?: WorkerQualification;      // Muletto / Carrello Elevatore
  loader?: WorkerQualification;        // Pala Caricatrice / Ruspa
  firstAid?: WorkerQualification;      // Addetto Primo Soccorso (D.Lgs 81/08)
  fireSafety?: WorkerQualification;    // Addetto Antincendio (D.Lgs 81/08)
  [key: string]: WorkerQualification | undefined;
}

export interface WorkerSkillsProfile {
  openingExperience?: WorkerExperienceLevel; // Autonomia apertura magazzino
  sandExperience?: WorkerExperienceLevel;    // Vendita e preparazione sabbia sfusa
  loaderExperience?: WorkerExperienceLevel;  // Uso pala caricatrice nella pratica
  loadingExperience?: WorkerExperienceLevel; // Carico camion / preparazione ordini
  competencies?: string;                     // Note competenze pratiche
  experience?: string;                       // Anni di esperienza / autonomia / limitazioni
  experiences?: string | any;                // Esperienze lavorative (alias compatibilità)
  otherQualifications?: string;              // Altre abilitazioni / incarichi sicurezza
  qualifications?: WorkerQualificationsMap;  // Abilitazioni formali con scadenze
}

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
  lunchBreakMinutes?: number;
  preferredLunchSlot?: '12:00-13:00' | '12:30-13:00' | '13:00-14:00' | 'auto';
}

export interface Worker {
  id: string;
  order: number;
  name: string;
  role: string;
  group: WorkerGroup;
  phone?: string;
  dob?: string;
  selected?: boolean;
  brain?: WorkerBrainProfile;
  profile?: WorkerSkillsProfile;
}

export interface DayShift {
  mIn?: string;
  mOut?: string;
  pIn?: string;
  pOut?: string;
  status?: string; // "LAVORO", "FERIE", "MALATTIA", "ROL", "RIPOSO", "CHIUSO", "ASSENTE", "EVENTO"
  note?: string;
  noteColor?: string;
  generated?: boolean;
  movedByEngine?: boolean;
  leaveType?: string;
  leaveFullDay?: boolean;
  leaveHours?: number;
  leaveRequestId?: string;
  eventIds?: string[];
  eventLabel?: string;
  eventMinutes?: number;
  coverageBlockedIntervals?: [number, number][];
  rolFrom?: string;
  rolTo?: string;
  leaveFromTime?: string;
  leaveToTime?: string;
}

export interface WeekShifts {
  [workerId: string]: {
    [dayIndex: number]: DayShift;
  };
}

export interface LeaveRequest {
  id: string;
  workerId: string;
  tipo: string; // 'Ferie' | 'Permesso retribuito' | 'Permesso Non retribuito' | 'Congedo Matrimoniale' | 'Visita Medica' | 'Visita c/o cantiere' | 'Partecipazione corso' | 'Visita Fiera' | 'Donazione Sangue' | 'Malattia' | 'Ricovero'
  mode: 'single' | 'range';
  day?: string; // YYYY-MM-DD
  fullDay?: boolean;
  fromTime?: string;
  toTime?: string;
  hours?: number | null;
  fromDay?: string;
  toDay?: string;
  openEnded?: boolean;
  isMalattia?: boolean;
  status: 'richiesta' | 'approvata' | 'rifiutata';
  note?: string;
  place?: string;
  requestDate?: string;
  syncTurns?: boolean;
  createdAt: string;
  turnsBefore?: Record<string, DayShift | null>;
  autoImpact?: Record<string, Record<string, { before: DayShift | null; after: DayShift | null }>>;
}

export interface BranchEvent {
  id: string;
  type: string; // 'Corso' | 'Riunione' | 'Visita medica' | 'Appuntamento' | 'Trasferta' | 'Altro'
  title: string;
  date: string; // YYYY-MM-DD
  allDay: boolean;
  fromTime?: string;
  toTime?: string;
  location?: string;
  participantIds: string[];
  notes?: string;
  reminderMinutes: number;
  updatedAt: string;
}

export interface PresetShift {
  label: string;
  mIn: string;
  mOut: string;
  pIn: string;
  pOut: string;
}

export interface ShiftStatus {
  name: string;
  color: string;
  hours: number;
}

export interface NotePreset {
  text: string;
  color: string;
}

export interface RulesConfig {
  sabatoUfficioIds: string[];
  magPairA: string[];
  magPairB: string[];
  marioId: string;
  severinId: string;
  giulianoId: string;
  ufficio7h: { mIn: string; mOut: string; pIn: string; pOut: string };
  ufficio8h: { mIn: string; mOut: string; pIn: string; pOut: string };
  ufficio8hApertura?: { mIn: string; mOut: string; pIn: string; pOut: string };
  ufficio2t: { mIn: string; mOut: string; pIn: string; pOut: string };
  mag7h: { mIn: string; mOut: string; pIn: string; pOut: string };
  mag8h: { mIn: string; mOut: string; pIn: string; pOut: string };
  turnoSabato: { mIn: string; mOut: string; pIn: string; pOut: string };
  marioOre: { mIn: string; mOut: string; pIn: string; pOut: string };
  giulianoSabato: { mIn: string; mOut: string; pIn: string; pOut: string };
  giulianoMercoledi: { mIn: string; mOut: string; pIn: string; pOut: string };
  giulianoNormale: { mIn: string; mOut: string; pIn: string; pOut: string };
  minAperturaMag: number;
  minAperturaImp: number;
  minSabatoMag: number;
  minSabatoImp: number;
  branchMonFriOpen: string;
  branchMonFriClose: string;
  lastSaturdayUfficioId?: string | null;
  groupOrder?: string[];
  lunchBreakWindowStart?: string;
  lunchBreakWindowEnd?: string;
  lunchBreakDefaultMinutes?: number;
  lunchBreakShortMinutes?: number;
  lunchFixedWorkers13to14Ids?: string[];
  lunchShortBreakWorkerIds?: string[];
  lunchRuleScheme?: 'staggered_12_13' | string;
  warehouseClosingBackupStrategy?: 'shift_morning_worker' | string;
  officeOpeningBackupIds?: string[];
  afternoonLeaveLunchPolicy?: 'keep_lunch_hour' | string;
  contingencyStrategy?: 'equal_40h_shift_swap' | string;
  sabatistaRotationRuleEnabled?: boolean;
  severinDynamicLunchRuleEnabled?: boolean;
  operationalRules?: BranchOperationalRule[];
}

export interface BranchOperationalRule {
  id: string;
  num: number;
  category: 'orari_pause' | 'sabati_rotazioni' | 'profili_speciali' | 'assenze_monteore' | 'politiche_aziendali';
  categoryLabel: string;
  title: string;
  ruleText: string;
  detail: string;
}

export interface AppData {
  title: string;
  appVersion: string;
  updatedAt?: number;
  updatedBy?: string;
  updatedRevision?: number;
  workers: Worker[];
  weeks: { [weekKey: string]: WeekShifts };
  presets: PresetShift[];
  statuses: ShiftStatus[];
  notePresets: NotePreset[];
  notes: { [weekKey: string]: string };
  notesTitle: string;
  rules: RulesConfig;
  leaveRequests: LeaveRequest[];
  leaveBalances: { [workerId: string]: { [year: number]: { spettanti: number } } };
  events: BranchEvent[];
  auditLog?: Array<{ ts: string; action: string; detail: string; by: string }>;
  archive?: {
    weeks: { [weekKey: string]: WeekShifts };
    leaveRequests?: LeaveRequest[];
  };
}

export interface ProposalChoiceOption {
  id: string;
  name: string;
  shift: DayShift | null;
  hint?: string;
  leaveAsIs?: boolean;
  smartScore?: number;
  smartReason?: string;
}

export interface ProposalChoice {
  id: string;
  area: 'magazzino' | 'ufficio';
  kind: 'apertura' | 'chiusura';
  day: number;
  userRequired?: boolean;
  label: string;
  options: ProposalChoiceOption[];
  selected?: string | null;
}

export interface ProposalDiff {
  workerId: string;
  name: string;
  day: number;
  dayLabel: string;
  before: string;
  after: string;
  generated?: boolean;
  moved?: boolean;
}

export interface TrafficSlotInfo {
  slotKey: 'early_morning' | 'peak_morning' | 'lunch_time' | 'afternoon_closing';
  label: string;
  timeRange: string;
  expectedTraffic: string;
  officeCount: number;
  magCount: number;
  totalCount: number;
  ratingText: string;
  ratingColor: string;
}

export interface DayCoverageStatus {
  day: string;
  magOpen: number;
  magClose: number;
  impOpen: number;
  impClose: number;
  minMag: number;
  minImp: number;
  magOk: boolean;
  impOk: boolean;
  isHoliday?: boolean;
  holidayName?: string;
  trafficSlots?: TrafficSlotInfo[];
  morningPeakRatio?: number;
  trafficAssessment?: string;
  // Presidio Competenze Piazzale Magazzino (Muletto & Ruspa)
  hasForkliftCoverage?: boolean;      // Almeno 1 magazziniere con patentino muletto abilitato in turno
  forkliftDriversCount?: number;      // Numero magazzinieri muletto presenti al mattino
  hasLoaderCoverage?: boolean;        // Almeno 1 magazziniere con patentino ruspa/pala abilitato in turno
  loaderDriversCount?: number;        // Numero magazzinieri ruspa/pala presenti al mattino
  // Supporto Opzionale da Ufficio (solo comunicazione di opzione, non considerata soluzione effettiva)
  officeForkliftBackups?: string[];   // Operatori ufficio con patentino muletto presenti (opzione di supporto)
  officeLoaderBackups?: string[];     // Operatori ufficio con patentino ruspa/pala presenti (opzione di supporto)
  // Presidi non vincolanti (informativi)
  hasFirstAidCoverage?: boolean;      // Presenza addetto primo soccorso (non vincolante)
  hasFireSafetyCoverage?: boolean;    // Presenza addetto antincendio (non vincolante)
  hasOpeningAutonomy?: boolean;       // Almeno 1 magazziniere con autonomia in apertura
  qualificationAlerts?: string[];     // Allerte e comunicazioni opzionali
}

export interface EdgeCaseDecision {
  id: string;
  category: 'sabato_ufficio' | 'sabato_magazzino' | 'festivita' | 'riposo_legale' | 'sicurezza_piazzale' | 'affluenza_clienti';
  title: string;
  detail: string;
  actionTaken: string;
  affectedWorkers: string[];
  status: 'handled' | 'info' | 'warning';
}

export interface GeneratedProposal {
  weekKey: string;
  baseWeekSnapshot: WeekShifts;
  week: WeekShifts;
  notes: string[];
  overtime: string[];
  changes: ProposalDiff[];
  coverage: DayCoverageStatus[];
  hoursSummary: Array<{ id: string; name: string; hours: number }>;
  choices: ProposalChoice[];
  edgeCaseDecisions?: EdgeCaseDecision[];
  meta: {
    nextUfficio: string;
    thisPair: string;
    otherPair: string;
    prevUfficio: string;
    thisPairIds: string[];
    otherPairIds: string[];
    nextUfficioId: string;
    prevUfficioId: string;
    actualOfficeSatId?: string;
    actualMagSatIds?: string[];
    targetWeeklyHours?: number;
    holidaysInWeek?: Array<{ date: string; name: string }>;
    smartBrain?: string;
    smartScore?: number;
    smartCoverageGaps?: number;
    smartOvertime?: number;
    smartPairSplits?: number;
    smartFairnessPenalty?: number;
    smartHistoryWeeks?: number;
    smartFairnessReport?: any[];
  };
}

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: string;
}

export interface AIProposedAction {
  id: string;
  type: 'update_shift' | 'create_leave' | 'create_event' | 'batch_update_shifts';
  title: string;
  description: string;
  applied?: boolean;
  shiftData?: {
    workerId: string;
    workerName: string;
    dayIdx: number;
    dayName: string;
    date?: string;
    mIn: string;
    mOut: string;
    pIn: string;
    pOut: string;
    status?: string;
    note?: string;
  };
  batchShifts?: Array<{
    workerId: string;
    workerName: string;
    dayIdx: number;
    dayName: string;
    mIn: string;
    mOut: string;
    pIn: string;
    pOut: string;
    status?: string;
    note?: string;
  }>;
  leaveData?: {
    workerId: string;
    workerName: string;
    tipo: 'Ferie' | 'Permesso' | 'ROL' | 'Malattia';
    mode: 'single' | 'range';
    day?: string;
    fromDay?: string;
    toDay?: string;
    hours?: number;
    fullDay?: boolean;
    fromTime?: string;
    toTime?: string;
    note?: string;
  };
  eventData?: {
    title: string;
    tipo: 'riunione' | 'corso' | 'visita' | 'chiusura' | 'altro';
    day: string;
    fromTime: string;
    toTime: string;
    luogo?: string;
    note?: string;
    partecipanti?: string[];
    isBranchClosure?: boolean;
  };
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  audit?: {
    status: 'compliant' | 'warning' | 'error';
    summary: string;
    findings: string[];
  } | null;
  actions?: AIProposedAction[];
  quickFollowUps?: string[];
}
