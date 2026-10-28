import {
  Worker,
  ShiftRecord,
  LeaveEntry,
  BranchEvent,
  AppSettings,
  RuleViolation,
  GeneratedProposal
} from '../types';
import { getShift, isMorning, isAfternoon, isNight, isRest, isLeave } from '../constants/shifts';
import { getWeekDetails, formatWeekKey, toIsoDate, GIORNI_SETTIMANA } from './dateUtils';
import { getHolidayForDate } from '../services/engine';

// Helper: Trova giorni in cui un lavoratore ha ferie/assenze approvate o richieste
export function getWorkerLeaveDays(workerId: string, leaves: LeaveEntry[], days: Date[]): Set<number> {
  const set = new Set<number>();
  for (const leave of leaves) {
    if (leave.worker_id !== workerId || leave.status === 'rejected') continue;
    days.forEach((day, idx) => {
      const dayIso = toIsoDate(day);
      if (dayIso >= leave.start_date && dayIso <= leave.end_date) {
        set.add(idx);
      }
    });
  }
  return set;
}

// Validazione Regole Complete M1-M45 e Coperture
export function validateRules(
  weekKey: string,
  workers: Worker[],
  shifts: ShiftRecord[],
  leaves: LeaveEntry[],
  settings: AppSettings,
  events: BranchEvent[] = []
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const weekDetails = getWeekDetails(weekKey);

  // Giorni di chiusura filiale da eventi e festività nazionali/patrono Milano
  const closureDays = new Set<number>();
  weekDetails.days.forEach((d, idx) => {
    if (getHolidayForDate(d)) {
      closureDays.add(idx);
    }
  });

  for (const ev of events) {
    if (ev.type === 'closure') {
      weekDetails.days.forEach((d, idx) => {
        if (toIsoDate(d) === ev.date) closureDays.add(idx);
      });
    }
  }

  // Mappa turni [workerId:dayIndex] -> shiftCode
  const shiftMap = new Map<string, string>();
  for (const s of shifts) {
    shiftMap.set(`${s.worker_id}:${s.day_index}`, s.shift_code);
  }

  // Verifica regole per ciascun lavoratore
  for (const worker of workers) {
    if (worker.active === false) continue;

    const leaveDays = getWorkerLeaveDays(worker.id, leaves, weekDetails.days);
    const workerSchedule: Record<number, string> = {};

    for (let day = 0; day < 7; day++) {
      if (leaveDays.has(day)) {
        const matchingLeave = leaves.find(l => {
          if (l.worker_id !== worker.id || l.status === 'rejected') return false;
          const dayIso = toIsoDate(weekDetails.days[day]);
          return dayIso >= l.start_date && dayIso <= l.end_date;
        });
        const lType = matchingLeave?.type || 'ferie';
        workerSchedule[day] = lType === 'malattia' || lType === 'ricovero' ? 'MC' : lType === 'rol' ? 'ROL' : lType === 'permesso' ? 'PE' : 'F';
        continue;
      }

      const key = `${worker.id}:${day}`;
      workerSchedule[day] = shiftMap.get(key) || 'R';
    }

    // Regole sequenziali per operatore
    let consecutiveAfternoon = 0;
    let maxConsecutiveAfternoon = 0;
    let consecutiveWorkDays = 0;
    let maxConsecutiveWorkDays = 0;
    let weeklyHours = 0;

    for (let day = 0; day < 7; day++) {
      const code = workerSchedule[day];
      const shiftDef = getShift(code);

      if (isMorning(code)) {
        consecutiveAfternoon = 0;
        consecutiveWorkDays++;
      } else if (isAfternoon(code)) {
        consecutiveAfternoon++;
        consecutiveWorkDays++;
        maxConsecutiveAfternoon = Math.max(maxConsecutiveAfternoon, consecutiveAfternoon);
      } else {
        consecutiveAfternoon = 0;
        if (isRest(code) || isLeave(code)) {
          consecutiveWorkDays = 0;
        }
      }

      maxConsecutiveWorkDays = Math.max(maxConsecutiveWorkDays, consecutiveWorkDays);
      weeklyHours += shiftDef.hours;
    }

    const maxAft = settings.maxConsecutiveAfternoon || 5;
    if (maxConsecutiveAfternoon > maxAft) {
      violations.push({
        ruleId: 'M38',
        ruleName: 'Turni pomeriggio consecutivi',
        severity: 'warning',
        message: `${worker.name}: ${maxConsecutiveAfternoon} turni pomeriggio consecutivi (max ${maxAft})`,
        workerId: worker.id,
        weekKey
      });
    }

    const maxWorkDays = settings.maxConsecutiveWorkDays || 6;
    if (maxConsecutiveWorkDays > maxWorkDays) {
      violations.push({
        ruleId: 'M40',
        ruleName: 'Giorni lavorativi consecutivi',
        severity: 'error',
        message: `${worker.name}: ${maxConsecutiveWorkDays} giorni lavorativi consecutivi (max ${maxWorkDays})`,
        workerId: worker.id,
        weekKey
      });
    }

    // Verifica Riposo Minimo Legale 11h continuative (D.Lgs 66/2003)
    for (let day = 0; day < 6; day++) {
      const code1 = workerSchedule[day];
      const code2 = workerSchedule[day + 1];
      if (isRest(code1) || isLeave(code1) || isRest(code2) || isLeave(code2)) continue;

      const shift1 = getShift(code1);
      const shift2 = getShift(code2);
      if (shift1.endTime && shift2.startTime) {
        const [h1, m1] = shift1.endTime.split(':').map(Number);
        const [h2, m2] = shift2.startTime.split(':').map(Number);
        const endMin = (h1 || 0) * 60 + (m1 || 0);
        const startMin = (h2 || 0) * 60 + (m2 || 0);
        const restMin = (1440 - endMin) + startMin;
        if (restMin < 660) {
          violations.push({
            ruleId: 'LEG_REST_11H',
            ruleName: 'Riposo minimo 11h (D.Lgs 66/2003)',
            severity: 'error',
            message: `${worker.name}: riposo continuativo tra ${GIORNI_SETTIMANA[day]} e ${GIORNI_SETTIMANA[day + 1]} insufficiente (${(restMin / 60).toFixed(1)}h < 11h)`,
            workerId: worker.id,
            weekKey
          });
        }
      }
    }

    const numHolidays = Array.from(closureDays).filter(d => d < 5).length;
    const targetHours = Math.max(0, 40 - numHolidays * 8);

    if (weeklyHours > targetHours + 0.05) {
      violations.push({
        ruleId: 'M45',
        ruleName: 'Ore settimanali eccessive',
        severity: 'error',
        message: `${worker.name}: ${weeklyHours.toFixed(1)}h settimanali (limite ${targetHours}h)`,
        workerId: worker.id,
        weekKey
      });
    } else if (weeklyHours > 0 && weeklyHours < (targetHours - 1.5) && leaveDays.size === 0 && closureDays.size === 0 && worker.brain?.officeProfile !== 'finiture') {
      violations.push({
        ruleId: 'M45',
        ruleName: 'Ore settimanali insufficienti',
        severity: 'warning',
        message: `${worker.name}: ${weeklyHours.toFixed(1)}h settimanali (attese ~${targetHours}h)`,
        workerId: worker.id,
        weekKey
      });
    }
  }

  // Verifica Coperture per ciascun giorno (Lun - Dom)
  for (let day = 0; day < 7; day++) {
    const req = settings.coverageRequirements?.[day];
    if (!req || closureDays.has(day)) continue;

    const dayIso = toIsoDate(weekDetails.days[day]);
    const absentWorkerIds = new Set<string>();

    for (const l of leaves) {
      if (l.status !== 'rejected' && dayIso >= l.start_date && dayIso <= l.end_date) {
        absentWorkerIds.add(l.worker_id);
      }
    }

    let morningCount = 0;
    let afternoonCount = 0;

    for (const s of shifts) {
      if (s.day_index === day && !absentWorkerIds.has(s.worker_id)) {
        if (isMorning(s.shift_code)) morningCount++;
        else if (isAfternoon(s.shift_code)) afternoonCount++;
      }
    }

    const dayName = GIORNI_SETTIMANA[day];
    if (morningCount < req.morning) {
      violations.push({
        ruleId: 'COV',
        ruleName: 'Copertura Mattina',
        severity: 'error',
        message: `${dayName}: copertura mattina insufficiente (${morningCount}/${req.morning})`,
        dayIndex: day,
        weekKey
      });
    }

    if (afternoonCount < req.afternoon) {
      violations.push({
        ruleId: 'COV',
        ruleName: 'Copertura Pomeriggio',
        severity: 'error',
        message: `${dayName}: copertura pomeriggio insufficiente (${afternoonCount}/${req.afternoon})`,
        dayIndex: day,
        weekKey
      });
    }
  }

  return violations;
}

// Analisi copertura giornaliera per la vista tabella
export interface DailyCoverageStatus {
  dayIndex: number;
  morning: { required: number; assigned: number };
  afternoon: { required: number; assigned: number };
  night: { required: number; assigned: number };
  satisfied: boolean;
}

export function computeDailyCoverage(
  shifts: ShiftRecord[],
  leaves: LeaveEntry[],
  settings: AppSettings,
  days: Date[]
): DailyCoverageStatus[] {
  const result: DailyCoverageStatus[] = [];

  for (let day = 0; day < 7; day++) {
    const req = settings.coverageRequirements?.[day] || { morning: 0, afternoon: 0, night: 0, dayIndex: day };
    let morningAssigned = 0;
    let afternoonAssigned = 0;
    let nightAssigned = 0;

    const dayIso = toIsoDate(days[day]);
    const absentWorkers = new Set<string>();
    for (const l of leaves) {
      if (l.status !== 'rejected' && dayIso >= l.start_date && dayIso <= l.end_date) {
        absentWorkers.add(l.worker_id);
      }
    }

    for (const s of shifts) {
      if (s.day_index === day && !absentWorkers.has(s.worker_id)) {
        if (isMorning(s.shift_code)) morningAssigned++;
        else if (isAfternoon(s.shift_code)) afternoonAssigned++;
        else if (isNight(s.shift_code)) nightAssigned++;
      }
    }

    result.push({
      dayIndex: day,
      morning: { required: req.morning, assigned: morningAssigned },
      afternoon: { required: req.afternoon, assigned: afternoonAssigned },
      night: { required: req.night, assigned: nightAssigned },
      satisfied: morningAssigned >= req.morning && afternoonAssigned >= req.afternoon && nightAssigned >= req.night
    });
  }

  return result;
}

// Calcolo punteggio equità storica
export function calculateEquityScore(workers: Worker[], pastShifts: ShiftRecord[]): number {
  if (workers.length === 0 || pastShifts.length === 0) return 92;

  const counts: Record<string, { morning: number; afternoon: number; total: number }> = {};
  for (const w of workers) {
    counts[w.id] = { morning: 0, afternoon: 0, total: 0 };
  }

  for (const s of pastShifts) {
    if (!counts[s.worker_id]) continue;
    if (isMorning(s.shift_code)) {
      counts[s.worker_id].morning++;
      counts[s.worker_id].total++;
    } else if (isAfternoon(s.shift_code)) {
      counts[s.worker_id].afternoon++;
      counts[s.worker_id].total++;
    }
  }

  const totals = Object.values(counts).map(c => c.total).filter(t => t > 0);
  if (totals.length < 2) return 94;

  const min = Math.min(...totals);
  const max = Math.max(...totals);
  const diff = max - min;
  const score = Math.max(60, Math.min(100, Math.round(100 - (diff * 2.5))));
  return score;
}

// Generatore Automatico Intelligente di Proposta Turni M37–M47
export function generateProposal(
  weekKey: string,
  workers: Worker[],
  leaves: LeaveEntry[],
  pastShifts: ShiftRecord[],
  settings: AppSettings,
  events: BranchEvent[] = []
): GeneratedProposal {
  const weekDetails = getWeekDetails(weekKey);
  const activeWorkers = workers.filter(w => w.active !== false);
  const assignmentsMap: Record<string, Record<number, string>> = {};
  const explanations: string[] = [];
  const workerLeaveDaysMap = new Map<string, Set<number>>();

  for (const w of activeWorkers) {
    const leaveSet = getWorkerLeaveDays(w.id, leaves, weekDetails.days);
    workerLeaveDaysMap.set(w.id, leaveSet);
    assignmentsMap[w.id] = {};

    for (const dayIdx of leaveSet) {
      const matchLeave = leaves.find(l => {
        if (l.worker_id !== w.id || l.status === 'rejected') return false;
        const dayIso = toIsoDate(weekDetails.days[dayIdx]);
        return dayIso >= l.start_date && dayIso <= l.end_date;
      });
      assignmentsMap[w.id][dayIdx] = matchLeave?.type === 'malattia' || matchLeave?.type === 'ricovero' ? 'MC' : matchLeave?.type === 'rol' ? 'ROL' : matchLeave?.type === 'permesso' ? 'PE' : 'F';
    }
  }

  // Identificazione Ruoli Speciali
  const severinWorker = activeWorkers.find(w => w.brain?.officeProfile === 'severin' || w.name.toUpperCase().includes('SEVERIN'));
  const sandriniWorker = activeWorkers.find(w => w.brain?.officeProfile === 'finiture' || w.name.toUpperCase().includes('SANDRINI'));
  const marioWorker = activeWorkers.find(w => w.name.toUpperCase().includes('RAGONE') || w.id === settings.marioId);

  // Sabato Rotazione Ufficio: Alpegiani Davide, Poppa Andrea, Caregnato Marco
  const officeSaturdayCandidates = activeWorkers.filter(w =>
    w.brain?.office &&
    w.brain?.officeProfile !== 'severin' &&
    w.brain?.officeProfile !== 'finiture' &&
    w.brain?.saturdayEligible !== false
  ).map(w => w.id);

  const rotationIds = settings.saturdayRotationIds && settings.saturdayRotationIds.length > 0
    ? settings.saturdayRotationIds
    : officeSaturdayCandidates;

  // Determina chi fa il sabato in base al numero settimana
  const officeSaturdayWorkerId = rotationIds.length > 0
    ? rotationIds[weekDetails.weekNumber % rotationIds.length]
    : null;

  // Coppie Magazzino A / B: A = [Pino Vartuca, Massimo Caruso], B = [Vincenzo Rallo, Mattia Drigo]
  const pairAIds = settings.warehousePairA || activeWorkers.filter(w => w.brain?.pair === 'A').map(w => w.id);
  const pairBIds = settings.warehousePairB || activeWorkers.filter(w => w.brain?.pair === 'B').map(w => w.id);
  const activePairSaturday = (weekDetails.weekNumber % 2 === 0) ? pairAIds : pairBIds;

  explanations.push(
    `Rotazione sabato ufficio: ${rotationIds.map(id => workers.find(w => w.id === id)?.name || id).join(' → ')}. Di turno: ${officeSaturdayWorkerId ? workers.find(w => w.id === officeSaturdayWorkerId)?.name : '—'}.`
  );
  explanations.push(
    `Coppia magazzino di turno sabato: ${activePairSaturday.map(id => workers.find(w => w.id === id)?.name || id).join(' + ')}.`
  );

  // 1. Mario Ragone (marioOre: 06:30-15:30)
  if (marioWorker) {
    for (let day = 0; day <= 4; day++) {
      if (!workerLeaveDaysMap.get(marioWorker.id)?.has(day) && !assignmentsMap[marioWorker.id][day]) {
        assignmentsMap[marioWorker.id][day] = 'M8';
      }
    }
    assignmentsMap[marioWorker.id][5] = 'R';
    assignmentsMap[marioWorker.id][6] = 'R';
  }

  // 2. Severin Marco (SV1 Lun, SV2 Mar/Mer, SV3 Gio, Ven speciale / riposo, Sab riposo)
  if (severinWorker) {
    const svShifts = [ 'SV1', 'SV2', 'SV2', 'SV3' ];
    for (let day = 0; day <= 3; day++) {
      if (!workerLeaveDaysMap.get(severinWorker.id)?.has(day) && !assignmentsMap[severinWorker.id][day]) {
        assignmentsMap[severinWorker.id][day] = svShifts[day];
      }
    }

    // Venerdì (day 4): se ci sono assenze in ufficio, fa mattina, altrimenti riposo
    if (!workerLeaveDaysMap.get(severinWorker.id)?.has(4) && !assignmentsMap[severinWorker.id][4]) {
      const officeAbsencesFri = officeSaturdayCandidates.filter(id => workerLeaveDaysMap.get(id)?.has(4)).length;
      if (officeAbsencesFri >= 1) {
        assignmentsMap[severinWorker.id][4] = 'SV3';
        explanations.push(`Severin venerdì: assenza colleghi ufficio rilevata, turno SV3 assegnato.`);
      } else {
        assignmentsMap[severinWorker.id][4] = 'R';
      }
    }

    assignmentsMap[severinWorker.id][5] = 'R';
    assignmentsMap[severinWorker.id][6] = 'R';
  }

  // 3. Sandrini Giuliano (Finiture: Mer GIM 4h, Sab GIS 4h Agrate, Lun/Mar/Gio/Ven P8 08:30-17:30, Dom R)
  if (sandriniWorker) {
    for (let day = 0; day <= 5; day++) {
      if (workerLeaveDaysMap.get(sandriniWorker.id)?.has(day) || assignmentsMap[sandriniWorker.id][day]) continue;
      if (day === 2) {
        assignmentsMap[sandriniWorker.id][day] = 'GIM'; // Mercoledì 4h
        explanations.push(`Sandrini mercoledì: GIM 08:30–12:30 (mezza giornata).`);
      } else if (day === 5) {
        assignmentsMap[sandriniWorker.id][day] = 'GIS'; // Sabato 4h Agrate
        explanations.push(`Sandrini sabato: GIS 08:00–12:00 (Filiale Agrate).`);
      } else {
        assignmentsMap[sandriniWorker.id][day] = 'P8'; // 08:30-17:30
      }
    }
    assignmentsMap[sandriniWorker.id][6] = 'R';
  }

  // 4. Sabato Ufficio e Magazzino
  for (const wId of officeSaturdayCandidates) {
    if (!workerLeaveDaysMap.get(wId)?.has(5) && !assignmentsMap[wId][5]) {
      assignmentsMap[wId][5] = (wId === officeSaturdayWorkerId) ? 'MSG' : 'R';
    }
  }

  for (const w of activeWorkers.filter(w => w.brain?.warehouse)) {
    if (w.id === marioWorker?.id) continue;
    if (!workerLeaveDaysMap.get(w.id)?.has(5) && !assignmentsMap[w.id][5]) {
      assignmentsMap[w.id][5] = activePairSaturday.includes(w.id) ? 'MSG' : 'R';
    }
  }

  // 5. Domenica (day 6) Riposo per tutti
  for (const w of activeWorkers) {
    if (!assignmentsMap[w.id][6]) assignmentsMap[w.id][6] = 'R';
  }

  // 6. Assegnazione Lun - Ven per Ufficio (Ciclo su 3 Settimane: Davide, Marco Caregnato, Andrea)
  // • 1ª settimana (Sabatista): M7 7h (06:30-14:30) Lun-Ven + Sabato MSG (07:00-12:00 = 5h) = 40h
  // • 2ª settimana (Apertura 8h): M8 8h (06:30-15:30) Lun-Ven + Sabato Riposo = 40h
  // • 3ª settimana (Chiusura 8h): P8 8h (08:30-17:30) Lun-Ven + Sabato Riposo = 40h
  const satWorkerIndex = officeSaturdayWorkerId ? rotationIds.indexOf(officeSaturdayWorkerId) : 0;
  const officeWeek2WorkerId = rotationIds[(satWorkerIndex - 1 + rotationIds.length) % rotationIds.length];
  const officeWeek3WorkerId = rotationIds.find(id => id !== officeSaturdayWorkerId && id !== officeWeek2WorkerId) || rotationIds[(satWorkerIndex + 1) % rotationIds.length];

  for (const wId of officeSaturdayCandidates) {
    const shiftCode = (wId === officeSaturdayWorkerId)
      ? 'M7' // 1ª settimana sabatista: 7h 06:30-14:30
      : (wId === officeWeek2WorkerId)
      ? 'M8' // 2ª settimana apertura: 8h 06:30-15:30
      : 'P8'; // 3ª settimana chiusura: 8h 08:30-17:30

    for (let day = 0; day <= 4; day++) {
      if (workerLeaveDaysMap.get(wId)?.has(day) || assignmentsMap[wId][day]) continue;
      assignmentsMap[wId][day] = shiftCode;
    }
  }

  // 7. Assegnazione Lun - Ven per Magazzino (Pino Vartuca, Vincenzo Rallo, Massimo Caruso, Mattia Drigo)
  const warehouseWorkers = activeWorkers.filter(w => w.brain?.warehouse && w.id !== marioWorker?.id);
  for (const w of warehouseWorkers) {
    const worksSaturday = activePairSaturday.includes(w.id);
    let restDayAssigned = false;

    for (let day = 0; day <= 4; day++) {
      if (workerLeaveDaysMap.get(w.id)?.has(day) || assignmentsMap[w.id][day]) continue;

      if (worksSaturday && !restDayAssigned && (day === 0 || day === 4)) {
        assignmentsMap[w.id][day] = 'R';
        restDayAssigned = true;
        continue;
      }

      // Alterna in base alla coppia: Coppia A fa mattina, Coppia B fa pomeriggio (o viceversa)
      const isPairA = pairAIds.includes(w.id);
      const isEvenWeek = (weekDetails.weekNumber % 2 === 0);
      const preferMorning = (isPairA && isEvenWeek) || (!isPairA && !isEvenWeek);

      assignmentsMap[w.id][day] = preferMorning ? 'M7' : 'P8';
    }
  }

  // Completa eventuali celle vuote residue con Riposo
  for (const w of activeWorkers) {
    for (let day = 0; day < 7; day++) {
      if (!assignmentsMap[w.id][day]) {
        assignmentsMap[w.id][day] = 'R';
      }
    }
  }

  // Costruisci ShiftRecord array
  const assignments: ShiftRecord[] = [];
  for (const [wId, daysObj] of Object.entries(assignmentsMap)) {
    for (const [dayStr, code] of Object.entries(daysObj)) {
      assignments.push({
        id: `proposal-${wId}-${dayStr}`,
        week_key: weekKey,
        worker_id: wId,
        day_index: parseInt(dayStr, 10),
        shift_code: code
      });
    }
  }

  // Convalida proposta e calcolo punteggio
  const violations = validateRules(weekKey, activeWorkers, assignments, leaves, settings, events);
  const errorCount = violations.filter(v => v.severity === 'error').length;
  const warnCount = violations.filter(v => v.severity === 'warning').length;
  const equityScore = calculateEquityScore(activeWorkers, pastShifts);

  let rawScore = 100 - (errorCount * 12) - (warnCount * 4);
  if (settings.equityBalancingEnabled) {
    rawScore = Math.round(rawScore * 0.7 + equityScore * 0.3);
  }
  const finalScore = Math.max(10, Math.min(100, rawScore));

  return {
    weekKey,
    score: finalScore,
    stats: {
      totalShifts: assignments.filter(a => !isRest(a.shift_code) && !isLeave(a.shift_code)).length,
      equityScore,
      violationsCount: violations.length
    },
    violations,
    assignments,
    explanations
  };
}
