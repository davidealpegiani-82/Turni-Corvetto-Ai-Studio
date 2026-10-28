import { ShiftDefinition } from '../types';

export const SHIFT_CODES: Record<string, ShiftDefinition> = {
  M: {
    code: "M",
    label: "Mattina 06:30–14:30",
    shortLabel: "M",
    category: "morning",
    color: "#2563eb",
    bgColor: "#dbeafe",
    textColor: "#1e3a8a",
    hours: 8,
    startTime: "06:30",
    endTime: "14:30",
    timeRange: "06:30–12:00 / 13:00–14:30"
  },
  P: {
    code: "P",
    label: "Pomeriggio 08:30–17:30",
    shortLabel: "P",
    category: "afternoon",
    color: "#d97706",
    bgColor: "#fef3c7",
    textColor: "#92400e",
    hours: 8,
    startTime: "08:30",
    endTime: "17:30",
    timeRange: "08:30–13:00 / 14:00–17:30"
  },
  N: {
    code: "N",
    label: "Notte",
    shortLabel: "N",
    category: "night",
    color: "#7c3aed",
    bgColor: "#ede9fe",
    textColor: "#5b21b6",
    hours: 8,
    startTime: "22:00",
    endTime: "06:00",
    timeRange: "22:00–06:00"
  },
  R: {
    code: "R",
    label: "Riposo",
    shortLabel: "R",
    category: "rest",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    textColor: "#374151",
    hours: 0
  },
  F: {
    code: "F",
    label: "Ferie",
    shortLabel: "F",
    category: "leave",
    color: "#059669",
    bgColor: "#d1fae5",
    textColor: "#065f46",
    hours: 0
  },
  MC: {
    code: "MC",
    label: "Malattia",
    shortLabel: "MC",
    category: "leave",
    color: "#dc2626",
    bgColor: "#fee2e2",
    textColor: "#991b1b",
    hours: 0
  },
  PE: {
    code: "PE",
    label: "Permesso",
    shortLabel: "PE",
    category: "leave",
    color: "#0891b2",
    bgColor: "#cffafe",
    textColor: "#155e75",
    hours: 0
  },
  ROL: {
    code: "ROL",
    label: "ROL (Riduzione Orario Lavoro)",
    shortLabel: "ROL",
    category: "leave",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    textColor: "#5b21b6",
    hours: 8
  },
  TM: {
    code: "TM",
    label: "Turno Mattina 06:30–14:30",
    shortLabel: "TM",
    category: "special",
    color: "#2563eb",
    bgColor: "#bfdbfe",
    textColor: "#1e3a8a",
    hours: 8,
    startTime: "06:30",
    endTime: "14:30",
    timeRange: "06:30–12:00 / 13:00–14:30"
  },
  TP: {
    code: "TP",
    label: "Turno Pomeriggio 08:30–17:30",
    shortLabel: "TP",
    category: "special",
    color: "#d97706",
    bgColor: "#fde68a",
    textColor: "#92400e",
    hours: 8,
    startTime: "08:30",
    endTime: "17:30",
    timeRange: "08:30–13:00 / 14:00–17:30"
  },
  TN: {
    code: "TN",
    label: "Turno Notte",
    shortLabel: "TN",
    category: "special",
    color: "#7c3aed",
    bgColor: "#ddd6fe",
    textColor: "#5b21b6",
    hours: 8,
    startTime: "22:00",
    endTime: "06:00",
    timeRange: "22:00–06:00"
  },
  M7: {
    code: "M7",
    label: "Mattina 7h 06:30–14:30",
    shortLabel: "M7",
    category: "morning",
    color: "#2563eb",
    bgColor: "#dbeafe",
    textColor: "#1e3a8a",
    hours: 7,
    startTime: "06:30",
    endTime: "14:30",
    timeRange: "06:30–12:00 / 13:00–14:30"
  },
  P7: {
    code: "P7",
    label: "Pomeriggio 7h",
    shortLabel: "P7",
    category: "afternoon",
    color: "#d97706",
    bgColor: "#fef3c7",
    textColor: "#92400e",
    hours: 7,
    startTime: "14:00",
    endTime: "21:00",
    timeRange: "14:00–21:00"
  },
  N7: {
    code: "N7",
    label: "Notte 7h",
    shortLabel: "N7",
    category: "night",
    color: "#7c3aed",
    bgColor: "#ede9fe",
    textColor: "#5b21b6",
    hours: 7,
    startTime: "22:00",
    endTime: "05:00",
    timeRange: "22:00–05:00"
  },
  M8: {
    code: "M8",
    label: "Mattina 8h 06:30–15:30",
    shortLabel: "M8",
    category: "morning",
    color: "#2563eb",
    bgColor: "#dbeafe",
    textColor: "#1e3a8a",
    hours: 8,
    startTime: "06:30",
    endTime: "15:30",
    timeRange: "06:30–12:00 / 13:00–15:30"
  },
  P8: {
    code: "P8",
    label: "Pomeriggio 8h 08:30–17:30",
    shortLabel: "P8",
    category: "afternoon",
    color: "#d97706",
    bgColor: "#fef3c7",
    textColor: "#92400e",
    hours: 8,
    startTime: "08:30",
    endTime: "17:30",
    timeRange: "08:30–13:00 / 14:00–17:30"
  },
  N8: {
    code: "N8",
    label: "Notte 8h",
    shortLabel: "N8",
    category: "night",
    color: "#7c3aed",
    bgColor: "#ede9fe",
    textColor: "#5b21b6",
    hours: 8,
    startTime: "22:00",
    endTime: "06:00",
    timeRange: "22:00–06:00"
  },
  MSG: {
    code: "MSG",
    label: "Sabato Mattina 07:00–12:00",
    shortLabel: "SM",
    category: "morning",
    color: "#2563eb",
    bgColor: "#e0e7ff",
    textColor: "#1e3a8a",
    hours: 5,
    startTime: "07:00",
    endTime: "12:00",
    timeRange: "07:00–12:00"
  },
  PSG: {
    code: "PSG",
    label: "Sabato Pomeriggio",
    shortLabel: "SP",
    category: "afternoon",
    color: "#d97706",
    bgColor: "#fef3c7",
    textColor: "#92400e",
    hours: 7,
    startTime: "13:00",
    endTime: "20:00",
    timeRange: "13:00–20:00"
  },
  SV1: {
    code: "SV1",
    label: "Severin Lun 07:30–17:30 (9.5h)",
    shortLabel: "SV1",
    category: "morning",
    color: "#0891b2",
    bgColor: "#cffafe",
    textColor: "#155e75",
    hours: 9.5,
    startTime: "07:30",
    endTime: "17:30",
    timeRange: "07:30–12:30 / 13:00–17:30"
  },
  SV2: {
    code: "SV2",
    label: "Severin Mar/Mer 06:30–17:30 (10.5h)",
    shortLabel: "SV2",
    category: "morning",
    color: "#0891b2",
    bgColor: "#cffafe",
    textColor: "#155e75",
    hours: 10.5,
    startTime: "06:30",
    endTime: "17:30",
    timeRange: "06:30–12:30 / 13:00–17:30"
  },
  SV3: {
    code: "SV3",
    label: "Severin Gio/Ven 06:30–16:30 (9.5h)",
    shortLabel: "SV3",
    category: "morning",
    color: "#0891b2",
    bgColor: "#cffafe",
    textColor: "#155e75",
    hours: 9.5,
    startTime: "06:30",
    endTime: "16:30",
    timeRange: "06:30–12:30 / 13:00–16:30"
  },
  GIM: {
    code: "GIM",
    label: "Sandrini Mer 08:30–12:30 (4h)",
    shortLabel: "GIM",
    category: "morning",
    color: "#059669",
    bgColor: "#d1fae5",
    textColor: "#065f46",
    hours: 4,
    startTime: "08:30",
    endTime: "12:30",
    timeRange: "08:30–12:30"
  },
  GIS: {
    code: "GIS",
    label: "Sandrini Sab 08:00–12:00 (4h)",
    shortLabel: "GIS",
    category: "morning",
    color: "#059669",
    bgColor: "#d1fae5",
    textColor: "#065f46",
    hours: 4,
    startTime: "08:00",
    endTime: "12:00",
    timeRange: "08:00–12:00"
  },
  RSG: {
    code: "RSG",
    label: "Sabato Riposo",
    shortLabel: "SR",
    category: "rest",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    textColor: "#374151",
    hours: 0
  },
  "": {
    code: "",
    label: "Non assegnato",
    shortLabel: "—",
    category: "rest",
    color: "#94a3b8",
    bgColor: "#f8fafc",
    textColor: "#64748b",
    hours: 0
  }
};

export function getShift(code?: string): ShiftDefinition {
  if (!code) return SHIFT_CODES[""];
  return SHIFT_CODES[code] || {
    code,
    label: code,
    shortLabel: code,
    category: "special",
    color: "#64748b",
    bgColor: "#f1f5f9",
    textColor: "#1e293b",
    hours: 8
  };
}

export function isMorning(code?: string): boolean {
  if (!code) return false;
  const s = getShift(code);
  return s.category === 'morning' || code === 'M' || code === 'M7' || code === 'M8' || code === 'TM' || code.startsWith('SV') || code === 'GIM' || code === 'GIS' || code === 'MSG';
}

export function isAfternoon(code?: string): boolean {
  if (!code) return false;
  const s = getShift(code);
  return s.category === 'afternoon' || code === 'P' || code === 'P7' || code === 'P8' || code === 'TP' || code === 'PSG';
}

export function isNight(code?: string): boolean {
  if (!code) return false;
  const s = getShift(code);
  return s.category === 'night' || code === 'N' || code === 'N7' || code === 'N8' || code === 'TN';
}

export function isRest(code?: string): boolean {
  if (!code) return true;
  return code === 'R' || code === 'RSG' || code === '';
}

export function isLeave(code?: string): boolean {
  if (!code) return false;
  return code === 'F' || code === 'MC' || code === 'PE' || code === 'ROL';
}
