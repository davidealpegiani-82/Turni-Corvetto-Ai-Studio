import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppData, WeekShifts } from '../types/turni';
import { mergeProposalSafely, policyFromAppData, validateWeekV2 } from './engineV2';
import { corvettoW44App, corvettoW44Week } from './fixtures/corvettoW44';

const app = {
  workers: [
    { id: 'mag1', name: 'Mag 1', group: 'MAGAZZINO', selected: true },
    { id: 'mag2', name: 'Mag 2', group: 'MAGAZZINO', selected: true },
    { id: 'office1', name: 'Ufficio 1', group: 'EDILE', selected: true, brain: { office: true } },
    { id: 'office2', name: 'Ufficio 2', group: 'EDILE', selected: true, brain: { office: true } }
  ]
} as unknown as AppData;

test('validator checks all half-hour slots and detects a midday gap', () => {
  const week: WeekShifts = {
    mag1: { 0: { mIn: '06:30', mOut: '10:00' } },
    mag2: { 0: { mIn: '06:30', mOut: '10:00' } },
    office1: { 0: { mIn: '06:30', mOut: '12:00', pIn: '13:00', pOut: '17:30' } },
    office2: { 0: { mIn: '06:30', mOut: '12:00', pIn: '13:00', pOut: '17:30' } }
  };
  const result = validateWeekV2(app, week);
  assert.ok(result.checkedSlots > 40);
  assert.ok(result.findings.some(f => f.code === 'COVERAGE_GAP' && f.area === 'warehouse' && f.day === 0 && f.time === '10:00'));
});

test('validator rejects malformed time intervals', () => {
  const week: WeekShifts = {
    mag1: { 0: { mIn: '09:00', mOut: '06:30' } },
    office1: { 0: { mIn: '06:30', mOut: '12:00', pIn: '13:00', pOut: '17:30' } },
    office2: { 0: { mIn: '06:30', mOut: '12:00', pIn: '13:00', pOut: '17:30' } }
  };
  assert.ok(validateWeekV2(app, week).findings.some(f => f.code === 'INVALID_INTERVAL'));
});

test('three-way merge preserves manual and concurrently edited cells', () => {
  const base: WeekShifts = { mag1: { 0: { mIn: '06:30', mOut: '15:30' }, 1: { mIn: '06:30', mOut: '15:30' } } };
  const current: WeekShifts = { mag1: { 0: { mIn: '07:00', mOut: '15:30', manualEdit: true } as any, 1: { mIn: '07:30', mOut: '16:00' } } };
  const proposed: WeekShifts = { mag1: { 0: { mIn: '08:30', mOut: '17:30' }, 1: { mIn: '08:30', mOut: '17:30' } } };
  const result = mergeProposalSafely(base, current, proposed);
  assert.equal(result.week.mag1[0].mIn, '07:00');
  assert.equal(result.week.mag1[1].mIn, '07:30');
  assert.equal(result.appliedCells, 0);
  assert.equal(result.preservedCells.length, 2);
  assert.equal(result.stale, true);
});

test('three-way merge applies untouched proposal cells only', () => {
  const base: WeekShifts = { mag1: { 0: { mIn: '06:30', mOut: '15:30' } } };
  const current: WeekShifts = { mag1: { 0: { mIn: '06:30', mOut: '15:30' } } };
  const proposed: WeekShifts = { mag1: { 0: { mIn: '08:30', mOut: '17:30' } } };
  const result = mergeProposalSafely(base, current, proposed);
  assert.equal(result.week.mag1[0].mIn, '08:30');
  assert.equal(result.appliedCells, 1);
  assert.equal(result.stale, false);
});

test('Saturday office coverage correctly requires one person, not the weekday opening minimum', () => {
  const week: WeekShifts = {
    mag1: { 5: { mIn: '07:00', mOut: '12:00' } },
    mag2: { 5: { mIn: '07:00', mOut: '12:00' } },
    office1: { 5: { mIn: '07:00', mOut: '12:00' } }
  };
  const result = validateWeekV2(app, week);
  assert.equal(result.findings.some(f => f.code === 'COVERAGE_GAP' && f.area === 'office' && f.day === 5), false);
});

test('policy uses one-person weekday office closing minimum even with a stale hidden minClose value', () => {
  const configured = {
    ...app,
    rules: {
      branchHours: { monFri: { open: '06:30', close: '17:30' }, sat: { open: '07:00', close: '12:00' } },
      minAperturaMag: 2,
      minAperturaImp: 2,
      minSabatoMag: 1,
      minSabatoImp: 1,
      officeCoverage: { minClose: 2 }
    }
  } as unknown as AppData;
  const policy = policyFromAppData(configured);
  assert.equal(policy.open, '06:30');
  assert.equal(policy.close, '17:30');
  assert.equal(policy.warehouse.openingMinimum, 2);
  assert.equal(policy.office.closingMinimum, 1);
  assert.equal(policy.saturdayOpen, '07:00');
  assert.equal(policy.saturdayWarehouseMinimum, 1);
  assert.equal(policy.saturdayOfficeMinimum, 1);
});

test('separate FINITURE showroom is not counted as branch office coverage', () => {
  const showroomOnly = {
    workers: [
      { id: 'showroom', name: 'Showroom', group: 'FINITURE', selected: true, brain: { office: true, officeProfile: 'finiture' } }
    ]
  } as unknown as AppData;
  const week: WeekShifts = { showroom: { 5: { mIn: '07:00', mOut: '12:00' } } };
  const result = validateWeekV2(showroomOnly, week);
  assert.ok(result.findings.some(f => f.code === 'COVERAGE_GAP' && f.area === 'office' && f.day === 5));
});

test('real sanitized Corvetto week W44 is checked across the full timetable', () => {
  const policy = policyFromAppData(corvettoW44App, '2026-10-26');
  const result = validateWeekV2(corvettoW44App, corvettoW44Week, policy);
  assert.equal(result.checkedSlots, 240);
  assert.equal(result.findings.some(f => f.code === 'COVERAGE_GAP' && f.day === 5), false);
  const fridayClosing = result.findings.find(f => f.code === 'COVERAGE_GAP' && f.day === 4 && f.area === 'office' && f.time === '17:00');
  assert.equal(fridayClosing, undefined, 'un solo addetto presente in chiusura deve soddisfare il minimo feriale');
  const saturdayLoaderAlert = result.findings.find(f => f.code === 'SKILL_COVERAGE_WARNING' && f.day === 5 && f.message.includes('ruspa/pala'));
  assert.equal(saturdayLoaderAlert?.severity, 'warning');
});

test('missing equipment qualification is a warning, not an automatic block', () => {
  const skillApp = {
    workers: [
      { id: 'mag1', name: 'Mag 1', group: 'MAGAZZINO', selected: true, brain: { warehouse: true }, profile: { qualifications: { forklift: { status: 'valid' }, loader: { status: 'none' } } } },
      { id: 'mag2', name: 'Mag 2', group: 'MAGAZZINO', selected: true, brain: { warehouse: true }, profile: { qualifications: { forklift: { status: 'valid' }, loader: { status: 'none' } } } },
      { id: 'office1', name: 'Office 1', group: 'MANAGER', selected: true, brain: { office: true }, profile: { qualifications: { firstAid: { status: 'valid' }, fireSafety: { status: 'valid' } } } },
      { id: 'office2', name: 'Office 2', group: 'EDILE', selected: true, brain: { office: true }, profile: { qualifications: { firstAid: { status: 'valid' }, fireSafety: { status: 'valid' } } } }
    ]
  } as unknown as AppData;
  const weekday = () => ({ mIn: '06:30', mOut: '17:30' });
  const saturday = () => ({ mIn: '07:00', mOut: '12:00' });
  const week: WeekShifts = {
    mag1: { 0: weekday(), 1: weekday(), 2: weekday(), 3: weekday(), 4: weekday(), 5: saturday() },
    mag2: { 0: weekday(), 1: weekday(), 2: weekday(), 3: weekday(), 4: weekday(), 5: saturday() },
    office1: { 0: weekday(), 1: weekday(), 2: weekday(), 3: weekday(), 4: weekday(), 5: saturday() },
    office2: { 0: weekday(), 1: weekday(), 2: weekday(), 3: weekday(), 4: weekday() }
  };
  const result = validateWeekV2(skillApp, week);
  assert.equal(result.valid, true, JSON.stringify(result.findings.filter(f => f.severity === 'error')));
  assert.ok(result.findings.some(f => f.code === 'SKILL_COVERAGE_WARNING' && f.area === 'warehouse'));
  assert.ok(result.findings.some(f => f.code === 'OPENING_EXPERIENCE_WARNING' && f.area === 'warehouse'));
});
