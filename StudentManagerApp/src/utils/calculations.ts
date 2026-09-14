import { AttendanceRecord, MarkRecord, GradeBand, AttendanceRule } from '../types';
import { AVATAR_COLORS } from '../theme/colors';

export function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

export function todayStr(): string {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

export function round(n: number, d = 0): number {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

export function initials(name?: string): string {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function colorFor(seed?: string): string {
  let h = 0;
  const s = String(seed || '');
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export interface AttendanceStatsResult {
  present: number;
  absent: number;
  leave: number;
  holiday: number;
  total: number;
  working: number;
  presentPct: number;
  absentPct: number;
  leavePct: number;
  pct: number;
}

export function attendanceStats(records: AttendanceRecord[]): AttendanceStatsResult {
  const c = { present: 0, absent: 0, leave: 0, holiday: 0 };
  (records || []).forEach((r) => {
    const st = String(r.status || '').toLowerCase();
    if (st === 'sick' || st === 'leave') c.leave++;
    else if (st === 'late' || st === 'present') c.present++;
    else if (st === 'absent') c.absent++;
    else if (st === 'holiday' || st === 'excused') c.holiday++;
  });
  const totalWorking = c.present + c.absent + c.leave;
  const presentPct = totalWorking ? Math.round((c.present / totalWorking) * 100) : 0;
  const absentPct = totalWorking ? Math.round((c.absent / totalWorking) * 100) : 0;
  const leavePct = totalWorking ? Math.round((c.leave / totalWorking) * 100) : 0;
  const pct = totalWorking ? presentPct : 0;
  return {
    present: c.present,
    absent: c.absent,
    leave: c.leave,
    holiday: c.holiday,
    total: (records || []).length,
    working: totalWorking,
    presentPct,
    absentPct,
    leavePct,
    pct,
  };
}

export function filterAttendanceByPeriod(
  records: AttendanceRecord[],
  period: string,
  selectedMonths: number[],
  startDate?: string,
  endDate?: string
): AttendanceRecord[] {
  if (!records || !records.length) return [];
  period = period || 'all';

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1; // 1-12

  if (period === 'this-month') {
    const prefix = curYear + '-' + pad2(curMonth);
    return records.filter((r) => String(r.date || '').slice(0, 7) === prefix);
  }

  if (period === 'last-3-months') {
    const prefixes: string[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(curYear, curMonth - 1 - i, 1);
      prefixes.push(d.getFullYear() + '-' + pad2(d.getMonth() + 1));
    }
    return records.filter((r) => {
      const ym = String(r.date || '').slice(0, 7);
      return prefixes.indexOf(ym) >= 0;
    });
  }

  if (period === 'last-6-months') {
    const prefixes6: string[] = [];
    for (let j = 0; j < 6; j++) {
      const d6 = new Date(curYear, curMonth - 1 - j, 1);
      prefixes6.push(d6.getFullYear() + '-' + pad2(d6.getMonth() + 1));
    }
    return records.filter((r) => {
      const ym = String(r.date || '').slice(0, 7);
      return prefixes6.indexOf(ym) >= 0;
    });
  }

  if (period === 'this-year') {
    const yrStr = String(curYear);
    return records.filter((r) => String(r.date || '').slice(0, 4) === yrStr);
  }

  if (period === 'custom-months') {
    if (!Array.isArray(selectedMonths) || !selectedMonths.length) return records;
    return records.filter((r) => {
      const dStr = String(r.date || '');
      if (dStr.length < 7) return false;
      const mNum = parseInt(dStr.slice(5, 7), 10);
      return selectedMonths.indexOf(mNum) >= 0;
    });
  }

  if (period === 'date-range') {
    return records.filter((r) => {
      const d = String(r.date || '');
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }

  return records;
}

export interface MonthlyBreakdownItem {
  ym: string;
  label: string;
  stats: AttendanceStatsResult;
}

export function getMonthlyAttendanceBreakdown(records: AttendanceRecord[]): MonthlyBreakdownItem[] {
  const groups: Record<string, AttendanceRecord[]> = {};
  (records || []).forEach((r) => {
    const ym = String(r.date || '').slice(0, 7);
    if (!ym || ym.length < 7) return;
    if (!groups[ym]) groups[ym] = [];
    groups[ym].push(r);
  });
  const monthKeys = Object.keys(groups).sort().reverse();
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return monthKeys.map((ym) => {
    const parts = ym.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const st = attendanceStats(groups[ym]);
    const name = (monthNames[m - 1] || 'Month') + ' ' + y;
    return {
      ym,
      label: name,
      stats: st,
    };
  });
}

export interface RuleBonusResult {
  threshold: number;
  bonus: number;
  penalty: number;
  isEligible: boolean;
  bonusAwarded: number;
  academicObt: number;
  academicMax: number;
  finalObtained: number;
  finalPct: number;
}

export function calculateAttendanceRuleBonus(
  attRate: number,
  studentMarksList: MarkRecord[],
  rule?: AttendanceRule
): RuleBonusResult {
  const r = rule || { threshold: 50, bonusMarks: 20, penaltyMarks: 0 };
  const threshold = Number(r.threshold) || 50;
  const bonus = Number(r.bonusMarks) || 20;
  const penalty = Number(r.penaltyMarks) || 0;

  const isEligible = attRate >= threshold;
  const bonusAwarded = isEligible ? bonus : penalty;

  let academicObt = 0;
  let academicMax = 0;
  if (Array.isArray(studentMarksList)) {
    studentMarksList.forEach((m) => {
      if (m.obtained !== '' && m.obtained !== null && !isNaN(Number(m.obtained))) {
        academicObt += Number(m.obtained);
        academicMax += Number(m.maxMarks) || 100;
      }
    });
  }

  const finalObtained = Math.max(0, academicObt + bonusAwarded);
  const finalPct = academicMax > 0 ? round((finalObtained / academicMax) * 100, 1) : 0;

  return {
    threshold,
    bonus,
    penalty,
    isEligible,
    bonusAwarded,
    academicObt: round(academicObt, 1),
    academicMax,
    finalObtained: round(finalObtained, 1),
    finalPct,
  };
}

export interface MarksSummaryResult {
  obtained: number;
  max: number;
  pct: number;
  count: number;
  grade: string;
}

export function gradeFor(pct: number, grades?: GradeBand[]): string {
  const list = (grades || [
    { min: 90, grade: 'A+' },
    { min: 80, grade: 'A' },
    { min: 70, grade: 'B' },
    { min: 60, grade: 'C' },
    { min: 50, grade: 'D' },
    { min: 40, grade: 'E' },
    { min: 0, grade: 'F' },
  ])
    .slice()
    .sort((a, b) => Number(b.min) - Number(a.min));

  for (let i = 0; i < list.length; i++) {
    if (pct >= Number(list[i].min)) return list[i].grade;
  }
  return list.length ? list[list.length - 1].grade : '—';
}

export function marksSummary(records: MarkRecord[], grades?: GradeBand[]): MarksSummaryResult {
  let obtained = 0;
  let max = 0;
  let count = 0;
  (records || []).forEach((m) => {
    if (m.obtained !== '' && m.obtained !== null && !isNaN(Number(m.obtained))) {
      obtained += Number(m.obtained);
      max += Number(m.maxMarks) || 100;
      count++;
    }
  });
  const pct = max ? round((obtained / max) * 100, 1) : 0;
  return { obtained, max, pct, count, grade: max ? gradeFor(pct, grades) : '—' };
}
