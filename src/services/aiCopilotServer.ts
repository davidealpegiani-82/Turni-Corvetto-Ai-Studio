import { GoogleGenAI } from '@google/genai';
import {
  AppData,
  DayShift,
  Worker,
  LeaveRequest,
  BranchEvent,
  AIProposedAction,
  DayCoverageStatus
} from '../types/turni';
import {
  getWeekInfo,
  getWeekKey,
  weekKeyToMonday,
  localDateKey,
  countableDayHours,
  analyzeCoverage,
  getItalianHolidays,
  timeToMin,
  isHardUnavailableCell
} from './engine';

// Inizializza Google GenAI con User-Agent obbligatorio
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

export interface AICopilotPayload {
  message: string;
  history?: Array<{ role: 'user' | 'model'; parts: string }>;
  weekKey?: string;
  currentDate?: string;
}

export interface AICopilotResponse {
  message: string;
  audit: {
    status: 'compliant' | 'warning' | 'error';
    summary: string;
    findings: string[];
  } | null;
  actions: AIProposedAction[];
  quickFollowUps: string[];
}

/**
 * Esegue un audit rapido e deterministico delle regole aziendali e legali sulla settimana target
 */
export function auditWeekCompliance(appData: AppData, weekKey: string): {
  status: 'compliant' | 'warning' | 'error';
  summary: string;
  findings: string[];
} {
  const workers = appData.workers || [];
  const rules = appData.rules;
  const week = appData.weeks?.[weekKey] || {};
  const findings: string[] = [];
  const dayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  const monday = weekKeyToMonday(weekKey);
  const holidays: Record<string, string> = getItalianHolidays(monday.getFullYear());
  const holidaysInWeek: string[] = [];

  for (let d = 0; d <= 5; d++) {
    const curDate = new Date(monday);
    curDate.setDate(curDate.getDate() + d);
    const iso = localDateKey(curDate);
    if (holidays[iso]) {
      holidaysInWeek.push(`${dayNames[d]} (${holidays[iso]})`);
    }
  }

  const numWeekdayHolidays = holidaysInWeek.filter((_, idx) => idx <= 4).length;
  const targetWeeklyHours = Math.max(0, 40 - (numWeekdayHolidays * 8));

  // 1. Controllo monte ore settimanale per ogni lavoratore
  for (const w of workers) {
    let totHours = 0;
    for (let d = 0; d <= 5; d++) {
      totHours += countableDayHours(w.id, d, week[w.id]?.[d], weekKey, appData);
    }
    const diff = Number((totHours - targetWeeklyHours).toFixed(1));
    if (diff > 1.5) {
      findings.push(`⚠️ ${w.name}: ${totHours.toFixed(1)}h programmate (supera il limite di ${targetWeeklyHours}h di +${diff}h straordinario).`);
    } else if (diff < -2.0 && totHours > 0) {
      findings.push(`ℹ️ ${w.name}: ${totHours.toFixed(1)}h programmate (inferiore al target di ${targetWeeklyHours}h di ${Math.abs(diff)}h).`);
    }
  }

  // 2. Controllo Riposo Legale 11h consecutive (D.Lgs 66/2003)
  for (const w of workers) {
    for (let d = 0; d <= 4; d++) {
      const c1 = week[w.id]?.[d];
      const c2 = week[w.id]?.[d + 1];
      if (!c1 || !c2 || isHardUnavailableCell(c1) || isHardUnavailableCell(c2)) continue;
      const end1 = c1.pOut || c1.mOut;
      const start2 = c2.mIn;
      if (end1 && start2) {
        const restMin = (1440 - timeToMin(end1)) + timeToMin(start2);
        if (restMin < 660) {
          findings.push(`🚨 Violazione Riposo 11h: ${w.name} finisce ${dayNames[d]} alle ${end1} e riprende ${dayNames[d + 1]} alle ${start2} (riposo: ${(restMin / 60).toFixed(1)}h < 11h di legge).`);
        }
      }
    }
  }

  // 3. Controllo Coperture Magazzino e Ufficio
  const coverageList = analyzeCoverage(week, rules, workers, weekKey);
  coverageList.forEach((cov, dayIdx) => {
    if (cov.isHoliday) return;
    if (dayIdx <= 4) {
      if (!cov.magOk) {
        findings.push(`⚠️ ${dayNames[dayIdx]}: Apertura piazzale ore 06:30 insufficiente (${cov.magOpen}/${cov.minMag} addetti magazzino). Rischio sicurezza carrelli elevatori.`);
      }
      if (!cov.impOk) {
        findings.push(`⚠️ ${dayNames[dayIdx]}: Chiusura filiale ore 17:30 non presidiata (${cov.impClose}/${cov.minImp} impiegati ufficio).`);
      }
    } else if (dayIdx === 5) {
      if (cov.magOpen < 2) {
        findings.push(`⚠️ Sabato mattina: presenza magazzino insufficiente (${cov.magOpen}/2 operatori richiesti).`);
      }
      if (cov.impOpen < 1) {
        findings.push(`⚠️ Sabato mattina: ufficio vendite non presidiato (nessun impiegato presente).`);
      }
    }
  });

  const hasErrors = findings.some(f => f.startsWith('🚨'));
  const hasWarnings = findings.some(f => f.startsWith('⚠️'));

  let status: 'compliant' | 'warning' | 'error' = 'compliant';
  let summary = 'Settimana 100% conforme: monte ore, riposi di legge (11h) e coperture rispettati.';

  if (hasErrors) {
    status = 'error';
    summary = `Rilevate criticità legali che richiedono intervento immediato (${findings.length} segnalazioni).`;
  } else if (hasWarnings) {
    status = 'warning';
    summary = `Rilevati punti di attenzione operativi o di copertura (${findings.length} segnalazioni).`;
  }

  return { status, summary, findings };
}

/**
 * Elabora la richiesta utente chiamando Gemini 3.8 Flash con contesto completo e schema strutturato
 */
export async function handleAICopilot(payload: AICopilotPayload, appData: AppData): Promise<AICopilotResponse> {
  const weekKey = payload.weekKey || getWeekKey(new Date(payload.currentDate || new Date()));
  const weekInfo = getWeekInfo(weekKeyToMonday(weekKey));
  const monday = weekKeyToMonday(weekKey);
  const dayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  const weekDays = [0, 1, 2, 3, 4, 5].map(idx => {
    const d = new Date(monday);
    d.setDate(d.getDate() + idx);
    return {
      dayIdx: idx,
      name: dayNames[idx],
      iso: localDateKey(d)
    };
  });

  // Prepara audit reale
  const currentAudit = auditWeekCompliance(appData, weekKey);

  // Costruisci il contesto compatto dei lavoratori e dei turni attuali
  const workersSummary = appData.workers.map(w => ({
    id: w.id,
    name: w.name,
    role: w.role,
    group: w.group
  }));

  const weekShifts = appData.weeks?.[weekKey] || {};
  const currentShiftsSummary: Record<string, Record<string, string>> = {};
  for (const w of appData.workers) {
    currentShiftsSummary[w.name] = {};
    for (let d = 0; d <= 5; d++) {
      const cell = weekShifts[w.id]?.[d];
      if (!cell) {
        currentShiftsSummary[w.name][dayNames[d]] = 'VUOTO';
      } else if (cell.status && cell.status !== 'LAVORO') {
        currentShiftsSummary[w.name][dayNames[d]] = cell.status + (cell.leaveType ? ` (${cell.leaveType})` : '');
      } else {
        const m = cell.mIn && cell.mOut ? `${cell.mIn}-${cell.mOut}` : '';
        const p = cell.pIn && cell.pOut ? `${cell.pIn}-${cell.pOut}` : '';
        currentShiftsSummary[w.name][dayNames[d]] = [m, p].filter(Boolean).join(' | ') || 'LAVORO';
      }
    }
  }

  // Eventi e ferie recenti
  const relevantLeaves = (appData.leaveRequests || []).slice(-10).map(l => ({
    worker: appData.workers.find(w => w.id === l.workerId)?.name || l.workerId,
    tipo: l.tipo,
    periodo: l.mode === 'single' ? l.day : `${l.fromDay} -> ${l.toDay}`,
    status: l.status
  }));

  const relevantEvents = (appData.events || []).slice(-8).map(e => ({
    titolo: e.title,
    giorno: e.date,
    orario: e.allDay ? 'Tutto il giorno' : `${e.fromTime || ''}-${e.toTime || ''}`,
    tipo: e.type
  }));

  const systemInstruction = `Sei l'Assistente AI Copilot della Filiale Corvetto (Milano), esperto in programmazione turni, ferie, permessi, impegni di filiale e conformità normativa CCNL / D.Lgs 66/2003.

OBIETTIVO PRINCIPALE:
Rispondi all'utente in modo professionale, cordiale, propositivo e operativo in lingua italiana. Puoi:
1. MODIFICARE TURNI: cambiare gli orari di uno o più lavoratori in un giorno specifico o in blocco, impostare riposo o scambiare turni.
2. INSERIRE FERIE / PERMESSI / MALATTIE / ROL: specificare collaboratore, data (o intervallo da-a), orario o giornata intera.
3. INSERIRE IMPEGNI DI FILIALE: riunioni, corsi sicurezza/antincendio, visite mediche, ispezioni o chiusure aziendali.
4. AUDIT E VERIFICA IN TEMPO REALE: analizzare le coperture (apertura carrellisti 06:30, chiusura ufficio 17:30, presidio sabato), il monte ore 40h standard e il riposo legale di 11h consecutive.
5. DARE CONSIGLI E SOLUZIONI: se un lavoratore è assente o malato, suggerisci subito la sostituzione migliore specificando il motivo e generando l'azione pronta all'uso.

REGOLE AZIENDALI CHIAVE:
- Mario Ragone: jolly magazzino (06:30-12:00, 13:00-15:30 = 8h), non lavora mai il sabato.
- Sicurezza Piazzale 06:30: OBBLIGATORI almeno 2 operatori magazzino per movimentazione carrelli elevatori. Se Mario è assente, un altro magazziniere DEVE essere anticipato alle 06:30.
- Sabato Ufficio (07:00-12:00): rotazione tra Marco Severin, Simone, Marco, Daniele. Chi lavora sabato fa 7h feriali (06:30-14:30), chi non lavora sabato fa 8h (08:00-17:30).
- Sabato Magazzino (07:00-12:00): alternanza Coppia A (Gianluca + Luca) e Coppia B (Daniele + Christian). Chi lavora fa 7h feriali.
- Marco Severin: orari dedicati (Lun 07:30-17:30, Mar-Mer 06:30-17:30, Gio 06:30-16:30, Ven riposo salvo assenze colleghi).
- Giuliano Sandrini: mercoledì riposo (4h), sabato trasferta Agrate (07:00-12:00).
- Chiusura ufficio 17:30: almeno 1 impiegato presente fino alle 17:30.
- Riposo continuativo: almeno 11 ore tra fine turno di un giorno e inizio del successivo (D.Lgs 66/2003).

FORMATO DI RISPOSTA:
Devi restituire ESCLUSIVAMENTE un JSON valido (senza backtick di markdown \`\`\`json all'esterno se possibile, oppure all'interno di un blocco JSON pulito) con questa struttura:
{
  "message": "Testo chiaro e cordiale per l'utente, spiegando le modifiche fatte, i consigli o l'esito della verifica.",
  "audit": {
    "status": "compliant" | "warning" | "error",
    "summary": "Breve frase di riepilogo dello stato della settimana",
    "findings": ["punto 1", "punto 2"]
  },
  "actions": [
    // Array di azioni strutturate pronte per essere applicate con 1 click.
    // Tipi supportati:
    // 1) update_shift: { "type": "update_shift", "id": "act_1", "title": "Modifica Turno", "description": "Descrizione", "shiftData": { "workerId": "...", "workerName": "...", "dayIdx": 0-5, "dayName": "Lun...", "mIn": "08:00", "mOut": "12:30", "pIn": "13:30", "pOut": "17:30", "status": "LAVORO" | "RIPOSO", "note": "..." } }
    // 2) create_leave: { "type": "create_leave", "id": "act_2", "title": "Richiesta Ferie/Permesso", "description": "...", "leaveData": { "workerId": "...", "workerName": "...", "tipo": "Ferie" | "Permesso" | "ROL" | "Malattia", "mode": "single" | "range", "day": "YYYY-MM-DD", "fromDay": "YYYY-MM-DD", "toDay": "YYYY-MM-DD", "hours": 8, "fullDay": true, "note": "..." } }
    // 3) create_event: { "type": "create_event", "id": "act_3", "title": "Impegno Filiale", "description": "...", "eventData": { "title": "...", "tipo": "riunione" | "corso" | "visita" | "chiusura" | "altro", "day": "YYYY-MM-DD", "fromTime": "14:00", "toTime": "15:30", "luogo": "..." } }
  ],
  "quickFollowUps": ["Domanda o azione rapida 1", "Domanda 2", "Domanda 3"]
}

SE L'UTENTE CHIEDE SOLO INFORMAZIONI O CONSIGLI:
"actions" può essere un array vuoto [].
SE L'UTENTE CHIEDE UNA MODIFICA:
Compila sempre l'array "actions" con i dati esatti (usa gli ID corretti dei lavoratori forniti nel contesto).`;

  const userContextPrompt = `CONTESTO SETTIMANA ATTUALE:
- Settimana: ${weekKey} (${weekInfo.label})
- Giorni: ${JSON.stringify(weekDays)}
- Lavoratori registrati: ${JSON.stringify(workersSummary)}
- Turni programmati attuali: ${JSON.stringify(currentShiftsSummary)}
- Richieste Ferie/Assenze recenti: ${JSON.stringify(relevantLeaves)}
- Impegni / Corsi filiale: ${JSON.stringify(relevantEvents)}
- Audit automatico preliminare del sistema: ${JSON.stringify(currentAudit)}

MESSAGGIO DELL'UTENTE:
"${payload.message}"`;

  // Se GEMINI_API_KEY non è configurata, usa direttamente il fallback euristico rule-based
  if (!process.env.GEMINI_API_KEY) {
    return generateFallbackResponse(payload.message, appData, weekKey, currentAudit);
  }

  try {
    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userContextPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout elaborazione Gemini (10s)')), 10000)
    );

    const response = await Promise.race([geminiPromise, timeoutPromise]);

    const rawText = response.text || '';
    let parsed: any;
    try {
      // Pulisci eventuale markdown
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn('[AI Copilot] Errore parsing JSON da Gemini:', parseErr, 'Raw text:', rawText);
      parsed = {
        message: rawText || 'Ho elaborato la tua richiesta.',
        audit: currentAudit,
        actions: [],
        quickFollowUps: ['Verifica conformità settimana', 'Mostra chi è di turno sabato']
      };
    }

    // Assicura che la risposta contenga i campi richiesti
    const sanitizedActions: AIProposedAction[] = Array.isArray(parsed.actions)
      ? parsed.actions.map((act: any, idx: number) => ({
          ...act,
          id: act.id || `act_${Date.now()}_${idx}`,
          applied: false
        }))
      : [];

    return {
      message: parsed.message || 'Ecco le informazioni richieste.',
      audit: parsed.audit || currentAudit,
      actions: sanitizedActions,
      quickFollowUps: Array.isArray(parsed.quickFollowUps) && parsed.quickFollowUps.length > 0
        ? parsed.quickFollowUps
        : ['Verifica conformità settimana', 'Controlla copertura sabato', 'Mostra ore totali']
    };
  } catch (err: any) {
    console.warn('[AI Copilot] Info/Fallback chiamata Gemini API:', err.message);
    return generateFallbackResponse(payload.message, appData, weekKey, currentAudit);
  }
}

/**
 * Fallback locale euristico ed intelligente: verifica regole, risponde a domande ed estrae azioni
 */
function generateFallbackResponse(
  userMsg: string,
  appData: AppData,
  weekKey: string,
  audit: { status: 'compliant' | 'warning' | 'error'; summary: string; findings: string[] }
): AICopilotResponse {
  const lower = userMsg.toLowerCase();
  const weekInfo = getWeekInfo(weekKeyToMonday(weekKey));
  const dayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const actions: AIProposedAction[] = [];

  // 1. Domanda su Verifica / Errori / Conformità
  if (lower.includes('verif') || lower.includes('controll') || lower.includes('error') || lower.includes('regol') || lower.includes('conform')) {
    const isClean = audit.findings.length === 0;
    const msg = isClean
      ? `✅ **Settimana ${weekInfo.weekNo} (${weekInfo.label}) Verificata al 100%**\n\n• **Monte ore**: tutti i collaboratori rispettano le 40h standard contrattuali.\n• **Riposo 11h Legale**: nessun turno infrange il D.Lgs 66/2003 tra giornate consecutive.\n• **Sicurezza carrellisti 06:30**: presenza di 2 operatori in piazzale garantita.\n• **Presidio Chiusura 17:30**: ufficio vendite coperto fino all'orario di chiusura.`
      : `⚠️ **Verifica Settimana ${weekInfo.weekNo} (${weekInfo.label})**\n\nHo esaminato i dati in tempo reale e ho individuato **${audit.findings.length} segnalazioni** che richiedono attenzione:\n\n${audit.findings.map(f => `• ${f}`).join('\n')}\n\n*Vuoi che ti proponga una soluzione automatica per bilanciare i turni o le coperture mancanti?*`;

    return {
      message: msg,
      audit,
      actions: [],
      quickFollowUps: ['Come risolvo le scoperture?', 'Chi è di turno sabato?', 'Consigli per il magazzino']
    };
  }

  // 2. Domanda sul Sabato
  if (lower.includes('sabato') || lower.includes('sabatist')) {
    const weekShifts = appData.weeks?.[weekKey] || {};
    const satWorkers: string[] = [];
    for (const w of appData.workers) {
      const c = weekShifts[w.id]?.[5];
      if (c && (c.mIn || c.pIn) && !['RIPOSO', 'CHIUSO', 'FERIE', 'MALATTIA'].includes((c.status || '').toUpperCase())) {
        satWorkers.push(`${w.name} (${w.group || 'Turno'})`);
      }
    }

    const msg = satWorkers.length > 0
      ? `📅 **Programmazione Sabato Mattina (Settimana ${weekInfo.weekNo}):**\n\nCollaboratori di turno previsti (07:00-12:00):\n${satWorkers.map(s => `• **${s}**`).join('\n')}\n\n*Ricorda: chi lavora il sabato effettua 7h feriali dal lunedì al venerdì (06:30-14:30) per completare le 40h totali senza generare straordinario spurio.*`
      : `ℹ️ Per il sabato della **Settimana ${weekInfo.weekNo}** non risulta ancora assegnato alcun turno o la filiale è chiusa per festività.\n\nPuoi generare automaticamente la proposta con il pulsante *"Genera Proposta"* o chiedermi di assegnare un turno.`;

    return {
      message: msg,
      audit,
      actions: [],
      quickFollowUps: ['Verifica conformità settimana', 'Controlla sicurezza carrellisti 06:30']
    };
  }

  // 3. Riconoscimento azioni di modifica turno (es: "Metti [Nome] dalle 06:30 alle 14:30 giovedì")
  const workerMatch = appData.workers.find(w => lower.includes(w.name.toLowerCase()) || lower.includes(w.name.split(' ')[0].toLowerCase()));
  const dayIdxMatch = dayNames.findIndex(dn => lower.includes(dn.toLowerCase().slice(0, 3)));
  const timeRegex = /(\d{1,2}[:.]\d{2})\s*(?:-|alle|a)\s*(\d{1,2}[:.]\d{2})/i;
  const timeMatch = userMsg.match(timeRegex);

  if (workerMatch && dayIdxMatch >= 0 && (timeMatch || lower.includes('riposo') || lower.includes('chiuso'))) {
    const isRest = lower.includes('riposo') || lower.includes('chiuso');
    const mIn = timeMatch ? timeMatch[1].replace('.', ':').padStart(5, '0') : '';
    const mOut = timeMatch ? timeMatch[2].replace('.', ':').padStart(5, '0') : '';

    actions.push({
      id: `act_${Date.now()}`,
      type: 'update_shift',
      title: `Modifica Turno: ${workerMatch.name}`,
      description: isRest
        ? `Imposta ${workerMatch.name} su RIPOSO per il giorno ${dayNames[dayIdxMatch]}`
        : `Assegna orario ${mIn}-${mOut} a ${workerMatch.name} il giorno ${dayNames[dayIdxMatch]}`,
      shiftData: {
        workerId: workerMatch.id,
        workerName: workerMatch.name,
        dayIdx: dayIdxMatch,
        dayName: dayNames[dayIdxMatch],
        mIn: isRest ? '' : mIn,
        mOut: isRest ? '' : mOut,
        pIn: '',
        pOut: '',
        status: isRest ? 'RIPOSO' : 'LAVORO',
        note: isRest ? 'Riposo' : ''
      }
    });

    return {
      message: `Ho preparato la modifica del turno per **${workerMatch.name}** il giorno **${dayNames[dayIdxMatch]}** (${isRest ? 'RIPOSO' : `${mIn}-${mOut}`}).\n\nPuoi applicarla immediatamente alla tabella con un click sulla card sottostante!`,
      audit,
      actions,
      quickFollowUps: ['Verifica conformità dopo la modifica', 'Controlla ore totali']
    };
  }

  // 4. Riconoscimento Ferie / Permessi / Malattia
  if (lower.includes('ferie') || lower.includes('permess') || lower.includes('malatt') || lower.includes('rol')) {
    const targetWorker = workerMatch || appData.workers[0];
    const leaveType = lower.includes('malatt') ? 'Malattia' : lower.includes('permess') ? 'Permesso' : lower.includes('rol') ? 'ROL' : 'Ferie';

    actions.push({
      id: `act_leave_${Date.now()}`,
      type: 'create_leave',
      title: `Richiesta ${leaveType}: ${targetWorker.name}`,
      description: `Registra ${leaveType} per ${targetWorker.name} con sincronizzazione automatica sui turni`,
      leaveData: {
        workerId: targetWorker.id,
        workerName: targetWorker.name,
        tipo: leaveType as any,
        mode: 'single',
        day: localDateKey(new Date()),
        hours: 8,
        fullDay: true,
        note: `Inserito da AI Copilot (${leaveType})`
      }
    });

    return {
      message: `Ho predisposto l'inserimento della richiesta di **${leaveType}** per **${targetWorker.name}**.\n\nPremi *"Applica Modifica"* sulla card per registrarla e allinearla subito ai turni e al saldo ore.`,
      audit,
      actions,
      quickFollowUps: ['Verifica conformità settimana', 'Controlla monte ore']
    };
  }

  // Risposta generale
  return {
    message: `Ho esaminato la tua richiesta per la **Settimana ${weekInfo.weekNo}** (${weekInfo.label}).\n\nPuoi chiedermi di:\n• **Modificare turni**: *"Metti Mario alle 06:30 lunedì"*\n• **Segnare ferie o malattie**: *"Inserisci ferie per Gianluca"*\n• **Pianificare impegni**: *"Aggiungi riunione di filiale giovedì alle 15:00"*\n• **Verificare conformità**: *"Controlla se ci sono errori o violazioni di legge"*\n• **Risolvere imprevisti**: *"Come sostituisco Mario se si assenta martedì?"*`,
    audit,
    actions: [],
    quickFollowUps: ['Verifica conformità settimana', 'Controlla sicurezza carrellisti 06:30', 'Chi è di turno sabato?']
  };
}
