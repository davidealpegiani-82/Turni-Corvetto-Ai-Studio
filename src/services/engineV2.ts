import type { AppData, DayShift, WeekShifts, Worker } from '../types/turni';

export type CoverageArea = 'warehouse' | 'office';
export type ValidationSeverity = 'error' | 'warning';

export interface CoveragePolicy {
  open: string;
  close: string;
  saturdayOpen?: string;
  saturdayClose?: string;
  warehouse: { minimum: number; openingMinimum?: number; openingUntil?: string; closingMinimum?: number };
  office: { minimum: number; openingMinimum?: number; openingUntil?: string; closingMinimum?: number };
  slotMinutes?: number;
  minimumRestMinutes?: number;
}

export interface ValidationFinding {
  id: string;
  severity: ValidationSeverity;
  code: string;
  day: number;
  area?: CoverageArea;
  time?: string;
  expected?: number;
  actual?: number;
  workerIds?: string[];
  message: string;
}

export interface WeekValidation {
  valid: boolean;
  findings: ValidationFinding[];
  checkedSlots: number;
  coverageGaps: number;
}

export interface ProposalMergeResult {
  week: WeekShifts;
  appliedCells: number;
  preservedCells: Array<{ workerId: string; day: number; reason: 'manual' | 'concurrent-edit' }>;
  conflicts: Array<{ workerId: string; day: number; reason: 'concurrent-edit' }>;
  stale: boolean;
}

type EditableDayShift = DayShift & { manualEdit?: boolean };

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export const DEFAULT_CORVETTO_POLICY: CoveragePolicy = {
  open: '06:30',
  close: '17:30',
  saturdayOpen: '07:00',
  saturdayClose: '12:00',
  warehouse: { minimum: 1, openingMinimum: 2, openingUntil: '08:30', closingMinimum: 1 },
  office: { minimum: 1, openingMinimum: 2, openingUntil: '08:30', closingMinimum: 1 },
  slotMinutes: 30,
  minimumRestMinutes: 660
};


/** Builds the validator policy from the live app configuration, with safe Corvetto defaults. */
export function policyFromAppData(appData: AppData): CoveragePolicy {
  const rules = appData.rules as unknown as Record<string, any>;
  const branchHours = rules?.branchHours || {};
  const weekday = branchHours.monFri || {};
  const saturday = branchHours.sat || {};
  const officeCoverage = rules?.officeCoverage || {};
  const positive = (value: unknown, fallback: number) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    open: weekday.open || rules?.branchMonFriOpen || DEFAULT_CORVETTO_POLICY.open,
    close: weekday.close || rules?.branchMonFriClose || DEFAULT_CORVETTO_POLICY.close,
    saturdayOpen: saturday.open || DEFAULT_CORVETTO_POLICY.saturdayOpen,
    saturdayClose: saturday.close || DEFAULT_CORVETTO_POLICY.saturdayClose,
    warehouse: {
      minimum: 1,
      openingMinimum: positive(rules?.minAperturaMag, 2),
      openingUntil: rules?.openingCoverageUntil || '08:30',
      closingMinimum: 1
    },
    office: {
      minimum: 1,
      openingMinimum: positive(rules?.minAperturaImp, 2),
      openingUntil: rules?.officeOpeningCoverageUntil || '08:30',
      closingMinimum: positive(officeCoverage.minClose, 1)
    },
    slotMinutes: 30,
    minimumRestMinutes: positive(rules?.minimumRestMinutes, 660)
  };
}

function toMinutes(value?: string): number | null {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function intervalsFor(shift?: DayShift | null): Array<[number, number]> {
  if (!shift || isUnavailable(shift)) return [];
  const intervals: Array<[number, number]> = [];
  const morningStart = toMinutes(shift.mIn);
  const morningEnd = toMinutes(shift.mOut);
  const afternoonStart = toMinutes(shift.pIn);
  const afternoonEnd = toMinutes(shift.pOut);
  if (morningStart !== null && morningEnd !== null && morningEnd > morningStart) intervals.push([morningStart, morningEnd]);
  if (afternoonStart !== null && afternoonEnd !== null && afternoonEnd > afternoonStart) intervals.push([afternoonStart, afternoonEnd]);
  const blocked = shift.coverageBlockedIntervals || [];
  return intervals.flatMap(([start, end]) => {
    let pieces: Array<[number, number]> = [[start, end]];
    for (const [blockedStart, blockedEnd] of blocked) {
      if (!Number.isFinite(blockedStart) || !Number.isFinite(blockedEnd) || blockedEnd <= blockedStart) continue;
      pieces = pieces.flatMap(([a, b]) => {
        if (blockedEnd <= a || blockedStart >= b) return [[a, b]];
        const next: Array<[number, number]> = [];
        if (blockedStart > a) next.push([a, Math.min(blockedStart, b)]);
        if (blockedEnd < b) next.push([Math.max(blockedEnd, a), b]);
        return next;
      });
    }
    return pieces;
  });
}

function isUnavailable(shift: DayShift): boolean {
  const status = String(shift.status || '').toUpperCase();
  return shift.leaveFullDay === true || ['FERIE', 'MALATTIA', 'ASSENTE', 'CHIUSO', 'RIPOSO'].includes(status);
}

function covers(shift: DayShift | undefined, start: number, end: number): boolean {
  return intervalsFor(shift).some(([a, b]) => a <= start && b >= end);
}

function workerInArea(worker: Worker, area: CoverageArea): boolean {
  if (area === 'warehouse') return worker.group === 'MAGAZZINO' || worker.brain?.warehouse === true;
  // FINITURE/Sandrini lavora su un presidio separato e non copre il banco edile Corvetto.
  if (worker.group === 'FINITURE' || worker.brain?.officeProfile === 'finiture') return false;
  return worker.brain?.office === true || worker.group === 'EDILE' || worker.group === 'MANAGER';
}

/** Independent validator: checks every configured time slice, not just opening/closing snapshots. */
export function validateWeekV2(
  appData: AppData,
  week: WeekShifts,
  policy: CoveragePolicy = DEFAULT_CORVETTO_POLICY
): WeekValidation {
  const findings: ValidationFinding[] = [];
  const slot = Math.max(15, policy.slotMinutes || 30);
  let checkedSlots = 0;
  let coverageGaps = 0;

  for (let day = 0; day <= 5; day++) {
    const isSaturday = day === 5;
    const open = toMinutes(isSaturday ? policy.saturdayOpen || '07:00' : policy.open) ?? 390;
    const close = toMinutes(isSaturday ? policy.saturdayClose || '12:00' : policy.close) ?? 1050;
    if (close <= open) continue;

    for (const area of ['warehouse', 'office'] as const) {
      const areaPolicy = policy[area];
      const eligible = appData.workers.filter(w => w.selected !== false && workerInArea(w, area));
      for (let start = open; start < close; start += slot) {
        const end = Math.min(start + slot, close);
        checkedSlots++;
        const present = eligible.filter(w => covers(week[w.id]?.[day], start, end));
        const openingUntil = toMinutes(areaPolicy.openingUntil || (isSaturday ? '07:00' : '08:30')) ?? open;
        let required = areaPolicy.minimum;
        // Il sabato è previsto un solo addetto ufficio; il minimo feriale non va trascinato al sabato.
        if (isSaturday && area === 'office') required = 1;
        else if (start < openingUntil) required = Math.max(required, areaPolicy.openingMinimum ?? areaPolicy.minimum);
        if (end >= close) required = areaPolicy.closingMinimum ?? areaPolicy.minimum;
        if (present.length < required) {
          coverageGaps++;
          const time = `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`;
          findings.push({
            id: `coverage-${day}-${area}-${start}`,
            severity: 'error',
            code: 'COVERAGE_GAP',
            day,
            area,
            time,
            expected: required,
            actual: present.length,
            workerIds: present.map(w => w.id),
            message: `${DAY_NAMES[day]} ${time}: ${area === 'warehouse' ? 'magazzino' : 'ufficio'} con ${present.length} presenti, minimo richiesto ${required}.`
          });
        }
      }
    }
  }

  // Structural checks: invalid and inverted shift intervals.
  for (const worker of appData.workers) {
    for (let day = 0; day <= 5; day++) {
      const shift = week[worker.id]?.[day];
      if (!shift || isUnavailable(shift)) continue;
      for (const [label, startValue, endValue] of [
        ['mattina', shift.mIn, shift.mOut],
        ['pomeriggio', shift.pIn, shift.pOut]
      ] as const) {
        if (!startValue && !endValue) continue;
        const start = toMinutes(startValue);
        const end = toMinutes(endValue);
        if (start === null || end === null || end <= start) {
          findings.push({
            id: `invalid-${worker.id}-${day}-${label}`,
            severity: 'error',
            code: 'INVALID_INTERVAL',
            day,
            workerIds: [worker.id],
            message: `${worker.name}: intervallo ${label} non valido (${startValue || '—'}–${endValue || '—'}).`
          });
        }
      }
    }
  }

  // Daily rest across adjacent working days, including split shifts.
  const restRequired = policy.minimumRestMinutes ?? 660;
  for (const worker of appData.workers) {
    for (let day = 0; day < 5; day++) {
      const today = intervalsFor(week[worker.id]?.[day]);
      const tomorrow = intervalsFor(week[worker.id]?.[day + 1]);
      if (!today.length || !tomorrow.length) continue;
      const lastEnd = Math.max(...today.map(x => x[1]));
      const nextStart = Math.min(...tomorrow.map(x => x[0]));
      const rest = 1440 - lastEnd + nextStart;
      if (rest < restRequired) {
        findings.push({
          id: `rest-${worker.id}-${day}`,
          severity: 'error',
          code: 'MINIMUM_REST',
          day,
          workerIds: [worker.id],
          expected: restRequired,
          actual: rest,
          message: `${worker.name}: riposo tra ${DAY_NAMES[day]} e ${DAY_NAMES[day + 1]} di ${Math.floor(rest / 60)}h ${rest % 60}m, inferiore alle ${Math.floor(restRequired / 60)}h richieste.`
        });
      }
    }
  }

  return { valid: findings.every(f => f.severity !== 'error'), findings, checkedSlots, coverageGaps };
}

function stable(value: unknown): string {
  if (value === undefined) return '__undefined__';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(k => `${JSON.stringify(k)}:${stable(record[k])}`).join(',')}}`;
}

/**
 * Three-way cell merge. User edits made after proposal generation win over the proposal.
 * Cells explicitly marked manualEdit are always preserved.
 */
export function mergeProposalSafely(
  baseSnapshot: WeekShifts,
  currentWeek: WeekShifts,
  proposedWeek: WeekShifts
): ProposalMergeResult {
  const merged: WeekShifts = JSON.parse(JSON.stringify(currentWeek || {}));
  const workerIds = new Set([...Object.keys(baseSnapshot || {}), ...Object.keys(currentWeek || {}), ...Object.keys(proposedWeek || {})]);
  const preservedCells: ProposalMergeResult['preservedCells'] = [];
  const conflicts: ProposalMergeResult['conflicts'] = [];
  let appliedCells = 0;

  for (const workerId of workerIds) {
    merged[workerId] ||= {};
    for (let day = 0; day <= 5; day++) {
      const base = baseSnapshot?.[workerId]?.[day];
      const current = currentWeek?.[workerId]?.[day];
      const proposed = proposedWeek?.[workerId]?.[day];
      const currentChanged = stable(current) !== stable(base);
      const proposalChanged = stable(proposed) !== stable(base);
      if (!proposalChanged) continue;
      if ((current as EditableDayShift | undefined)?.manualEdit) {
        preservedCells.push({ workerId, day, reason: 'manual' });
        continue;
      }
      if (currentChanged) {
        preservedCells.push({ workerId, day, reason: 'concurrent-edit' });
        conflicts.push({ workerId, day, reason: 'concurrent-edit' });
        continue;
      }
      if (proposed === undefined) delete merged[workerId][day];
      else merged[workerId][day] = JSON.parse(JSON.stringify(proposed));
      appliedCells++;
    }
    if (Object.keys(merged[workerId]).length === 0) delete merged[workerId];
  }

  return {
    week: merged,
    appliedCells,
    preservedCells,
    conflicts,
    stale: conflicts.length > 0
  };
}

/** Returns a human-readable summary suitable for the proposal review screen. */
export function summarizeValidation(result: WeekValidation): string {
  if (result.valid) return `Verifica superata: ${result.checkedSlots} intervalli controllati, nessuna violazione bloccante.`;
  const errors = result.findings.filter(f => f.severity === 'error').length;
  return `Proposta non applicabile: ${errors} violazioni rilevate su ${result.checkedSlots} intervalli controllati.`;
}
