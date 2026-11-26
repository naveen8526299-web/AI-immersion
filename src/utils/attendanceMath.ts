import { AttendanceStatus, Subject } from '../types';

export interface AttendanceEvaluation {
  attended: number;
  total: number;
  minPercentage: number;
  exactPercentage: number;
  displayPercentage: string;
  isEligible: boolean;
  isPerfect: boolean;
  maxSafeAbsences: number;
  requiredRecoveryClasses: number;
  status: AttendanceStatus;
  statusLabel: string;
}

/**
 * Validates and normalizes attendance inputs so integer arithmetic stays exact.
 */
export function normalizeAttendanceInputs(attended: number, total: number, minPercentage = 75) {
  const safeTotal = Math.max(0, Math.floor(Number.isFinite(total) ? total : 0));
  const safeAttended = Math.max(0, Math.min(safeTotal, Math.floor(Number.isFinite(attended) ? attended : 0)));
  const safeMin = Math.max(1, Math.min(99, Math.floor(Number.isFinite(minPercentage) ? minPercentage : 75)));
  return { A: safeAttended, T: safeTotal, p: safeMin };
}

/**
 * Exact integer eligibility check: 100 * A >= p * T.
 * Never uses floating-point or rounded percentages.
 */
export function isAttendanceEligible(attended: number, total: number, minPercentage = 75): boolean {
  const { A, T, p } = normalizeAttendanceInputs(attended, total, minPercentage);
  if (T === 0) return true;
  return 100 * A >= p * T;
}

/**
 * Maximum consecutive future absences while staying >= p%:
 * floor((100 * A - p * T) / p)
 */
export function calculateMaxSafeAbsences(attended: number, total: number, minPercentage = 75): number {
  const { A, T, p } = normalizeAttendanceInputs(attended, total, minPercentage);
  if (T === 0) return 0;
  if (100 * A < p * T) return 0;
  return Math.floor((100 * A - p * T) / p);
}

/**
 * Minimum consecutive classes to attend without missing any to reach p%:
 * ceil((p * T - 100 * A) / (100 - p))
 */
export function calculateRequiredRecoveryClasses(attended: number, total: number, minPercentage = 75): number {
  const { A, T, p } = normalizeAttendanceInputs(attended, total, minPercentage);
  if (T === 0 || 100 * A >= p * T) return 0;
  return Math.ceil((p * T - 100 * A) / (100 - p));
}

/**
 * Exact classification using integer comparisons (100*A vs threshold*T).
 * Never uses rounded percentage strings to cross boundaries.
 */
export function classifyAttendanceStatus(
  attended: number,
  total: number,
  minPercentage = 75
): { status: AttendanceStatus; label: string } {
  const { A, T, p } = normalizeAttendanceInputs(attended, total, minPercentage);
  if (T === 0) {
    return { status: 'SAFE_ZONE', label: 'No Classes Yet' };
  }
  if (A === T) {
    return { status: 'AVENGERS_SHIELD', label: 'Avengers Shield' };
  }
  if (100 * A < p * T) {
    return { status: 'THANOS_RISK', label: 'Thanos Risk' };
  }
  // Borderline: [p%, max(p+5, 80)%)
  const safeThreshold = Math.max(p + 5, 80);
  if (100 * A >= 90 * T) {
    return { status: 'EXCELLENT', label: 'Excellent' };
  }
  if (100 * A >= safeThreshold * T) {
    return { status: 'SAFE_ZONE', label: 'Safe Zone' };
  }
  return { status: 'BORDERLINE', label: 'Borderline' };
}

export function evaluateAttendance(attended: number, total: number, minPercentage = 75): AttendanceEvaluation {
  const { A, T, p } = normalizeAttendanceInputs(attended, total, minPercentage);
  const exactPercentage = T === 0 ? 100 : (A * 100) / T;
  const displayPercentage = T === 0 ? '100.00%' : `${exactPercentage.toFixed(2)}%`;
  const eligible = isAttendanceEligible(A, T, p);
  const isPerfect = T > 0 && A === T;
  const maxSafeAbsences = calculateMaxSafeAbsences(A, T, p);
  const requiredRecoveryClasses = calculateRequiredRecoveryClasses(A, T, p);
  const { status, label } = classifyAttendanceStatus(A, T, p);

  return {
    attended: A,
    total: T,
    minPercentage: p,
    exactPercentage,
    displayPercentage,
    isEligible: eligible,
    isPerfect,
    maxSafeAbsences,
    requiredRecoveryClasses,
    status,
    statusLabel: label,
  };
}

/**
 * Pure non-destructive simulation: returns a new evaluation without mutating inputs.
 */
export function simulateFutureClasses(
  attended: number,
  total: number,
  minPercentage: number,
  simulatedAttend: number,
  simulatedMiss: number
): AttendanceEvaluation {
  const addAttend = Math.max(0, Math.floor(simulatedAttend));
  const addMiss = Math.max(0, Math.floor(simulatedMiss));
  return evaluateAttendance(attended + addAttend, total + addAttend + addMiss, minPercentage);
}

export function evaluateOverallSubjects(subjects: Subject[]) {
  const totals = subjects.reduce(
    (acc, s) => {
      acc.attended += s.attended;
      acc.total += s.total;
      acc.remaining += Math.max(0, s.remainingClasses);
      const evalRes = evaluateAttendance(s.attended, s.total, s.minPercentage);
      if (evalRes.status === 'THANOS_RISK') acc.atRiskCount += 1;
      else if (evalRes.status === 'BORDERLINE') acc.borderlineCount += 1;
      else acc.safeCount += 1;
      if (evalRes.isPerfect) acc.shieldCount += 1;
      return acc;
    },
    {
      attended: 0,
      total: 0,
      remaining: 0,
      safeCount: 0,
      borderlineCount: 0,
      atRiskCount: 0,
      shieldCount: 0,
    }
  );

  const overallEval = evaluateAttendance(totals.attended, totals.total, 75);
  return {
    ...totals,
    overallEval,
  };
}
