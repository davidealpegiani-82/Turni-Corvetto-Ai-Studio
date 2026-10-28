import { AppData, Worker, RulesConfig, PresetShift, ShiftStatus, NotePreset } from '../types/turni';
import { official25OperationalRules } from './operationalRulesData';

export const initialWorkers: Worker[] = [
  {
    id: "w_1",
    order: 1,
    name: "ALPEGIANI DAVIDE",
    role: "Store Manager",
    group: "MANAGER",
    phone: "",
    dob: "",
    selected: true,
    brain: { office: true, warehouse: false, saturdayEligible: true, sabatista: true, canOpen: true, canClose: true },
    profile: {
      openingExperience: 'mentor',
      competencies: 'Coordinamento generale filiale, gestione casse, ordini e sicurezza',
      experience: 'Store Manager con piena padronanza operativa e direzionale',
      otherQualifications: 'Responsabile Filiale e Preposto alla Sicurezza D.Lgs 81/08',
      qualifications: {
        firstAid: { status: 'valid', expiry: '2027-11-30' },
        fireSafety: { status: 'valid', expiry: '2027-10-15' },
        forklift: { status: 'none' },
        loader: { status: 'none' }
      }
    }
  },
  {
    id: "w_2",
    order: 2,
    name: "CAREGNATO MARCO",
    role: "Add. Vendite Banco Edile",
    group: "EDILE",
    phone: "",
    dob: "",
    selected: true,
    brain: { office: true, warehouse: false, saturdayEligible: true, sabatista: true, canOpen: true, canClose: true },
    profile: {
      openingExperience: 'autonomous',
      competencies: 'Vendita banco, preventivazione, tintometro, ordini clienti',
      experience: 'Autonomia completa in apertura banco edile e gestione incassi',
      qualifications: {
        firstAid: { status: 'valid', expiry: '2027-05-20' },
        fireSafety: { status: 'none' },
        forklift: { status: 'none' },
        loader: { status: 'none' }
      }
    }
  },
  {
    id: "w_3",
    order: 3,
    name: "POPPA ANDREA",
    role: "Add. Vendite Banco Edile",
    group: "EDILE",
    phone: "",
    dob: "",
    selected: true,
    brain: { office: true, warehouse: false, saturdayEligible: true, sabatista: true, canOpen: true, canClose: true },
    profile: {
      openingExperience: 'autonomous',
      competencies: 'Consulenza tecnica banco edile, emissione bolle/fatture, apertura e chiusura',
      experience: 'Pluriennale esperienza di vendita e gestione clientela professionale',
      qualifications: {
        firstAid: { status: 'none' },
        fireSafety: { status: 'valid', expiry: '2027-04-10' },
        forklift: { status: 'none' },
        loader: { status: 'none' }
      }
    }
  },
  {
    id: "w_4",
    order: 4,
    name: "SEVERIN MARCO",
    role: "Add. Vendite Banco Edile",
    group: "EDILE",
    phone: "",
    dob: "",
    selected: true,
    brain: { office: true, warehouse: false, saturdayEligible: false, sabatista: false, canOpen: true, canClose: true, officeProfile: 'severin' },
    profile: {
      openingExperience: 'mentor',
      competencies: 'Specialista banco, apertura speciale, cassa e controllo bolle',
      experience: 'Esperto di riferimento per apertura e chiusura continuativa banco',
      qualifications: {
        firstAid: { status: 'valid', expiry: '2027-08-30' },
        fireSafety: { status: 'valid', expiry: '2027-06-15' },
        forklift: { status: 'none' },
        loader: { status: 'none' }
      }
    }
  },
  {
    id: "w_5",
    order: 5,
    name: "SANDRINI GIULIANO",
    role: "Add. Vendite Finiture (Idalia)",
    group: "FINITURE",
    phone: "",
    dob: "",
    selected: true,
    brain: { office: true, warehouse: false, saturdayEligible: false, sabatista: false, canOpen: false, canClose: false, fixed: true, officeProfile: 'finiture' },
    profile: {
      openingExperience: 'unknown',
      competencies: 'Showroom finiture d\'interni, pavimenti, rivestimenti e arredobagno',
      experience: 'Consulente finiture con orario fisso e coordinamento con Agrate',
      qualifications: {
        firstAid: { status: 'none' },
        fireSafety: { status: 'none' },
        forklift: { status: 'none' },
        loader: { status: 'none' }
      }
    }
  },
  {
    id: "w_6",
    order: 6,
    name: "VARTUCA PINO",
    role: "Magazziniere",
    group: "MAGAZZINO",
    phone: "",
    dob: "",
    selected: true,
    brain: { office: false, warehouse: true, pair: 'A', saturdayEligible: true, sabatista: true, canOpen: true, canClose: true },
    profile: {
      openingExperience: 'mentor',
      sandExperience: 'mentor',
      loaderExperience: 'mentor',
      loadingExperience: 'mentor',
      competencies: 'Preparazione ordini pesanti, scarico bilici, gestione piazzale, sabbia sfusa',
      experience: 'Tutor e referente piazzale magazzino; piena autonomia in apertura',
      qualifications: {
        forklift: { status: 'valid', expiry: '2027-06-15' },
        loader: { status: 'valid', expiry: '2027-06-15' },
        firstAid: { status: 'valid', expiry: '2027-03-12' },
        fireSafety: { status: 'none' }
      }
    }
  },
  {
    id: "w_7",
    order: 7,
    name: "RALLO VINCENZO",
    role: "Magazziniere",
    group: "MAGAZZINO",
    phone: "",
    dob: "",
    selected: true,
    brain: { office: false, warehouse: true, pair: 'B', saturdayEligible: true, sabatista: true, canOpen: true, canClose: true },
    profile: {
      openingExperience: 'autonomous',
      sandExperience: 'autonomous',
      loaderExperience: 'autonomous',
      loadingExperience: 'autonomous',
      competencies: 'Carico/scarico mezzi, movimentazione merci pesanti, preparazione ordini',
      experience: 'Autonomia completa in magazzino e carico autocarri',
      qualifications: {
        forklift: { status: 'valid', expiry: '2027-09-20' },
        loader: { status: 'none' },
        firstAid: { status: 'none' },
        fireSafety: { status: 'valid', expiry: '2027-08-14' }
      }
    }
  },
  {
    id: "w_8",
    order: 8,
    name: "CARUSO MASSIMO",
    role: "Magazziniere",
    group: "MAGAZZINO",
    phone: "",
    dob: "",
    selected: true,
    brain: { office: false, warehouse: true, pair: 'A', saturdayEligible: true, sabatista: true, canOpen: true, canClose: true },
    profile: {
      openingExperience: 'mentor',
      sandExperience: 'mentor',
      loaderExperience: 'mentor',
      loadingExperience: 'mentor',
      competencies: 'Pala caricatrice per sabbia sfusa e inerti, muletto, ordini pesanti',
      experience: 'Massima esperienza nell\'uso dei mezzi pesanti di cantiere e magazzino',
      qualifications: {
        forklift: { status: 'valid', expiry: '2027-04-30' },
        loader: { status: 'valid', expiry: '2027-04-30' },
        firstAid: { status: 'none' },
        fireSafety: { status: 'none' }
      }
    }
  },
  {
    id: "w_9",
    order: 9,
    name: "DRIGO MATTIA",
    role: "Magazziniere",
    group: "MAGAZZINO",
    phone: "",
    dob: "",
    selected: true,
    brain: { office: false, warehouse: true, pair: 'B', saturdayEligible: true, sabatista: true, canOpen: true, canClose: true },
    profile: {
      openingExperience: 'autonomous',
      sandExperience: 'autonomous',
      loaderExperience: 'assisted',
      loadingExperience: 'autonomous',
      competencies: 'Carrello elevatore, preparazione commesse clienti, stoccaggio',
      experience: 'Autonomo su carrello elevatore e carico camion; pala in affiancamento',
      qualifications: {
        forklift: { status: 'valid', expiry: '2027-12-10' },
        loader: { status: 'none' },
        firstAid: { status: 'valid', expiry: '2027-09-18' },
        fireSafety: { status: 'none' }
      }
    }
  },
  {
    id: "w_10",
    order: 10,
    name: "RAGONE MARIO",
    role: "Magazziniere",
    group: "MAGAZZINO",
    phone: "",
    dob: "",
    selected: true,
    brain: { office: false, warehouse: true, jolly: true, saturdayEligible: false, sabatista: false, canOpen: true, canClose: true },
    profile: {
      openingExperience: 'mentor',
      sandExperience: 'autonomous',
      loaderExperience: 'autonomous',
      loadingExperience: 'mentor',
      competencies: 'Jolly polivalente: muletto, pala, carico camion, flessibilità aperture/chiusure',
      experience: 'Grande affidabilità e versatilità su tutti i mezzi e mansioni piazzale',
      qualifications: {
        forklift: { status: 'valid', expiry: '2027-08-05' },
        loader: { status: 'valid', expiry: '2027-08-05' },
        firstAid: { status: 'none' },
        fireSafety: { status: 'valid', expiry: '2027-07-22' }
      }
    }
  }
];

export const defaultPresets: PresetShift[] = [
  { label: "06:30 - 12:00 / 13:00 - 14:30 (1ª sett. sabatista 7h)", mIn: "06:30", mOut: "12:00", pIn: "13:00", pOut: "14:30" },
  { label: "06:30 - 12:00 / 13:00 - 15:30 (2ª sett. apertura 8h)", mIn: "06:30", mOut: "12:00", pIn: "13:00", pOut: "15:30" },
  { label: "08:30 - 13:00 / 14:00 - 17:30 (3ª sett. chiusura 8h)", mIn: "08:30", mOut: "13:00", pIn: "14:00", pOut: "17:30" },
  { label: "06:30 - 12:30 / 13:00 - 17:30 (Severin ven)", mIn: "06:30", mOut: "12:30", pIn: "13:00", pOut: "17:30" },
  { label: "07:00 - 12:00 (Sabato mattina 5h)", mIn: "07:00", mOut: "12:00", pIn: "", pOut: "" }
];

export const defaultStatuses: ShiftStatus[] = [
  { name: "LAVORO", color: "#10b981", hours: 0 },
  { name: "MALATTIA", color: "#ef4444", hours: 8 },
  { name: "FERIE", color: "#059669", hours: 8 },
  { name: "RIPOSO", color: "#3b82f6", hours: 0 },
  { name: "CHIUSO", color: "#dc2626", hours: 0 },
  { name: "ASSENTE", color: "#eab308", hours: 0 },
  { name: "ROL", color: "#8b5cf6", hours: 8 }
];

export const defaultNotePresets: NotePreset[] = [
  { text: "ROL", color: "#8b5cf6" },
  { text: "Visita Medica", color: "#ef4444" },
  { text: "Permesso", color: "#3b82f6" },
  { text: "Uscita Anticipata", color: "#f59e0b" },
  { text: "Filiale Agrate", color: "#64748b" },
  { text: "Corso Formazione", color: "#a855f7" }
];

export const defaultRules: RulesConfig = {
  sabatoUfficioIds: ["w_1", "w_2", "w_3"], // Davide Alpegiani → Marco Caregnato → Andrea Poppa
  magPairA: ["w_6", "w_8"], // Pino Vartuca + Massimo Caruso
  magPairB: ["w_7", "w_9"], // Vincenzo Rallo + Mattia Drigo
  marioId: "w_10",
  severinId: "w_4",
  giulianoId: "w_5",
  ufficio7h: { mIn: "06:30", mOut: "12:00", pIn: "13:00", pOut: "14:30" },
  ufficio8h: { mIn: "08:30", mOut: "13:00", pIn: "14:00", pOut: "17:30" },
  ufficio8hApertura: { mIn: "06:30", mOut: "12:00", pIn: "13:00", pOut: "15:30" },
  ufficio2t: { mIn: "08:30", mOut: "13:00", pIn: "14:00", pOut: "17:30" },
  mag7h: { mIn: "06:30", mOut: "12:00", pIn: "13:00", pOut: "14:30" },
  mag8h: { mIn: "08:30", mOut: "13:00", pIn: "14:00", pOut: "17:30" },
  turnoSabato: { mIn: "07:00", mOut: "12:00", pIn: "", pOut: "" },
  marioOre: { mIn: "06:30", mOut: "12:00", pIn: "13:00", pOut: "15:30" },
  giulianoSabato: { mIn: "08:00", mOut: "12:00", pIn: "", pOut: "" },
  giulianoMercoledi: { mIn: "08:30", mOut: "12:30", pIn: "", pOut: "" },
  giulianoNormale: { mIn: "08:30", mOut: "13:00", pIn: "14:00", pOut: "17:30" },
  minAperturaMag: 2,
  minAperturaImp: 2,
  minSabatoMag: 1,
  minSabatoImp: 1,
  branchMonFriOpen: "06:30",
  branchMonFriClose: "17:30",
  lastSaturdayUfficioId: null,
  groupOrder: ["MANAGER", "EDILE", "FINITURE", "MAGAZZINO"],
  lunchBreakWindowStart: "12:00",
  lunchBreakWindowEnd: "14:00",
  lunchBreakDefaultMinutes: 60,
  lunchBreakShortMinutes: 30,
  lunchFixedWorkers13to14Ids: ["w_1", "w_2", "w_3", "w_5"],
  lunchShortBreakWorkerIds: ["w_4"],
  lunchRuleScheme: "staggered_12_13",
  warehouseClosingBackupStrategy: "shift_morning_worker",
  officeOpeningBackupIds: ["w_2", "w_3"],
  afternoonLeaveLunchPolicy: "keep_lunch_hour",
  contingencyStrategy: "equal_40h_shift_swap",
  sabatistaRotationRuleEnabled: true,
  severinDynamicLunchRuleEnabled: true,
  operationalRules: official25OperationalRules
};

export function createDefaultAppData(): AppData {
  return {
    title: "CORVETTO",
    appVersion: "8.0.0-live",
    updatedAt: Date.now(),
    updatedBy: "system_init",
    updatedRevision: 1,
    workers: JSON.parse(JSON.stringify(initialWorkers)),
    weeks: {},
    presets: JSON.parse(JSON.stringify(defaultPresets)),
    statuses: JSON.parse(JSON.stringify(defaultStatuses)),
    notePresets: JSON.parse(JSON.stringify(defaultNotePresets)),
    notes: {},
    notesTitle: "Note / Comunicazioni Filiale:",
    rules: JSON.parse(JSON.stringify(defaultRules)),
    leaveRequests: [],
    leaveBalances: {},
    events: [],
    auditLog: [
      {
        ts: new Date().toISOString(),
        action: "init",
        detail: "Inizializzazione database Turni Corvetto Live con WebSockets e Push",
        by: "system"
      }
    ]
  };
}
