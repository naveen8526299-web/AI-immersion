import { ODRequest, SemesterSettings, SquadTask, Subject, SurvivalZone } from '../types';
import {
  calculateMaxSafeAbsences,
  calculateRequiredRecoveryClasses,
  evaluateAttendance,
  isAttendanceEligible,
} from './attendanceMath';
import { toLocalDateIso } from './dateUtils';

export interface SubjectSurvivalPrediction {
  subject: Subject;
  currentEval: ReturnType<typeof evaluateAttendance>;
  approvedODCredits: number;
  pendingODCredits: number;
  remainingClasses: number;
  maxPossibleAttended: number;
  finalTotalClasses: number;
  maxPossiblePercentage: number;
  canReachThreshold: boolean;
  canComfortablyMaintain: boolean;
  minFutureClassesNeeded: number;
  maxFutureAbsencesAllowed: number;
  latestRecoveryPointBuffer: number; // how many more misses before recovery becomes impossible
  zone: SurvivalZone;
  recommendation: string;
}

export interface HallTicketSurvivalSummary {
  overallZone: SurvivalZone;
  survivalScore: number; // 0..100 transparent indicator
  scoreBreakdown: {
    eligibilityPoints: number;
    bufferPoints: number;
    recoveryFeasibilityPoints: number;
    examProximityPoints: number;
    obligationPoints: number;
  };
  daysUntilExam: number;
  remainingWorkingDays: number;
  totalRemainingClasses: number;
  subjectPredictions: SubjectSurvivalPrediction[];
  suggestedImprovements: string[];
  disclaimer: string;
}

export interface RecoveryPlan {
  subject: Subject;
  currentPercentage: number;
  shortageClasses: number; // classes behind exact p%
  requiredConsecutiveClasses: number;
  availableRemainingClasses: number;
  isRecoveryPossible: boolean;
  latestRecoveryMargin: number; // max misses allowed before impossible
  predictedFinalIfRecovered: number;
  scheduledDates: string[];
  heroAdvice: string;
}

export function countWorkingDaysBetween(
  fromDateStr: string,
  toDateStr: string,
  workingDaysOfWeek: number[],
  holidayDates: string[]
): { workingDays: number; dates: string[] } {
  const start = new Date(`${fromDateStr}T00:00:00`);
  const end = new Date(`${toDateStr}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return { workingDays: 0, dates: [] };
  }

  const holidaySet = new Set(holidayDates);
  const workingSet = new Set(workingDaysOfWeek);
  const dates: string[] = [];

  const cur = new Date(start);
  let safetyCounter = 0;
  while (cur <= end && safetyCounter < 400) {
    safetyCounter += 1;
    const iso = toLocalDateIso(cur);
    const day = cur.getDay(); // 0=Sun, 1=Mon..6=Sat
    if (workingSet.has(day) && !holidaySet.has(iso)) {
      dates.push(iso);
    }
    cur.setDate(cur.getDate() + 1);
  }

  return { workingDays: dates.length, dates };
}

export function calculateDaysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00`);
  const to = new Date(`${toDateStr}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  const diff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/**
 * Predicts subject-wise & overall Hall Ticket Survival using exact integer math,
 * remaining semester classes, approved OD credits, and task obligations.
 */
export function predictHallTicketSurvival(
  subjects: Subject[],
  semester: SemesterSettings,
  odRequests: ODRequest[],
  tasks: SquadTask[],
  todayIso: string = toLocalDateIso()
): HallTicketSurvivalSummary {
  const holidayDates = semester.holidays.map((h) => h.date);
  const effectiveEnd = semester.endDate <= semester.examDate ? semester.endDate : semester.examDate;
  const { workingDays: remainingWorkingDays } = countWorkingDaysBetween(
    todayIso,
    effectiveEnd,
    semester.workingDaysOfWeek,
    holidayDates
  );
  const daysUntilExam = calculateDaysBetween(todayIso, semester.examDate);

  const subjectPredictions: SubjectSurvivalPrediction[] = subjects.map((subject) => {
    const currentEval = evaluateAttendance(subject.attended, subject.total, subject.minPercentage);
    const approvedODCredits = odRequests
      .filter((od) => od.status === 'APPROVED' && od.subjectIds.includes(subject.id))
      .reduce((sum, od) => sum + od.periodsPerSubject, 0);
    const pendingODCredits = odRequests
      .filter((od) => od.status === 'PENDING' && od.subjectIds.includes(subject.id))
      .reduce((sum, od) => sum + od.periodsPerSubject, 0);

    const remaining = Math.max(0, subject.remainingClasses);
    const finalTotal = subject.total + remaining;
    const maxPossibleAttended = subject.attended + remaining;
    const maxPossiblePercentage = finalTotal === 0 ? 100 : (maxPossibleAttended * 100) / finalTotal;

    const p = subject.minPercentage;
    const canReachThreshold = isAttendanceEligible(maxPossibleAttended, finalTotal, p);

    // Minimum future classes to attend out of remaining classes so 100*(A + x) >= p*(T + remaining)
    const targetAttendedAtEnd = Math.ceil((p * finalTotal) / 100);
    const minFutureClassesNeeded = Math.max(0, targetAttendedAtEnd - subject.attended);
    const maxFutureAbsencesAllowed = Math.max(0, remaining - minFutureClassesNeeded);
    const latestRecoveryPointBuffer = canReachThreshold ? maxFutureAbsencesAllowed : 0;

    // Comfortable if currently eligible with >= 2 safe absences or future margin >= 25% of remaining
    const canComfortablyMaintain =
      currentEval.isEligible &&
      (currentEval.maxSafeAbsences >= 2 || (remaining > 0 && maxFutureAbsencesAllowed >= Math.ceil(remaining * 0.2)));

    let zone: SurvivalZone = 'GREEN';
    let recommendation = '';

    if (!canReachThreshold) {
      zone = 'RED';
      recommendation = `Critical: Even attending all ${remaining} remaining classes yields ${maxPossiblePercentage.toFixed(
        2
      )}% (below ${p}%). Contact faculty / check eligible OD credits immediately.`;
    } else if (!currentEval.isEligible || currentEval.maxSafeAbsences <= 1 || maxFutureAbsencesAllowed <= 2) {
      zone = 'YELLOW';
      if (!currentEval.isEligible) {
        recommendation = `Recoverable: Attend your next ${currentEval.requiredRecoveryClasses} classes consecutively without missing to cross ${p}%.`;
      } else {
        recommendation = `Thin Margin: You are at ${currentEval.displayPercentage} with only ${currentEval.maxSafeAbsences} immediate safe bunk(s) and ${maxFutureAbsencesAllowed} semester buffer.`;
      }
    } else {
      zone = 'GREEN';
      recommendation = `On Track: You can miss up to ${maxFutureAbsencesAllowed} of your remaining ${remaining} classes and stay >= ${p}%.`;
    }

    return {
      subject,
      currentEval,
      approvedODCredits,
      pendingODCredits,
      remainingClasses: remaining,
      maxPossibleAttended,
      finalTotalClasses: finalTotal,
      maxPossiblePercentage,
      canReachThreshold,
      canComfortablyMaintain,
      minFutureClassesNeeded,
      maxFutureAbsencesAllowed,
      latestRecoveryPointBuffer,
      zone,
      recommendation,
    };
  });

  const totalSubjects = Math.max(1, subjectPredictions.length);
  const eligibleCount = subjectPredictions.filter((sp) => sp.currentEval.isEligible).length;
  const reachableCount = subjectPredictions.filter((sp) => sp.canReachThreshold).length;
  const avgBuffer =
    subjectPredictions.reduce((sum, sp) => sum + Math.min(8, sp.currentEval.maxSafeAbsences), 0) / totalSubjects;

  const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const overdueTasks = pendingTasks.filter((t) => t.deadline < todayIso);

  // Transparent 0-100 scoring breakdown:
  // 40 pts: current subject eligibility
  // 25 pts: recovery feasibility across remaining classes
  // 20 pts: attendance safety buffer
  // 10 pts: exam runway comfort
  // 5 pts: academic task discipline
  const eligibilityPoints = Math.round((eligibleCount / totalSubjects) * 40);
  const recoveryFeasibilityPoints = Math.round((reachableCount / totalSubjects) * 25);
  const bufferPoints = Math.round((avgBuffer / 8) * 20);
  const examProximityPoints = daysUntilExam >= 21 ? 10 : Math.max(3, Math.round((daysUntilExam / 21) * 10));
  const obligationPoints = Math.max(0, 5 - overdueTasks.length * 2 - Math.floor(pendingTasks.length / 4));

  const survivalScore = Math.max(
    0,
    Math.min(100, eligibilityPoints + recoveryFeasibilityPoints + bufferPoints + examProximityPoints + obligationPoints)
  );

  const hasRed = subjectPredictions.some((sp) => sp.zone === 'RED');
  const hasYellow = subjectPredictions.some((sp) => sp.zone === 'YELLOW');
  const overallZone: SurvivalZone = hasRed ? 'RED' : hasYellow ? 'YELLOW' : 'GREEN';

  const suggestedImprovements: string[] = [];
  subjectPredictions
    .filter((sp) => sp.zone !== 'GREEN')
    .forEach((sp) => {
      if (sp.zone === 'RED') {
        suggestedImprovements.push(
          `${sp.subject.code}: Recovery shortfall detected. Escalate to ${sp.subject.facultyName} or apply eligible OD if applicable.`
        );
      } else if (sp.currentEval.requiredRecoveryClasses > 0) {
        suggestedImprovements.push(
          `${sp.subject.code}: Attend next ${sp.currentEval.requiredRecoveryClasses} classes straight to restore ${sp.subject.minPercentage}% eligibility.`
        );
      } else {
        suggestedImprovements.push(`${sp.subject.code}: Avoid absences this week (only ${sp.currentEval.maxSafeAbsences} safe bunk left).`);
      }
    });

  if (overdueTasks.length > 0) {
    suggestedImprovements.push(`Complete ${overdueTasks.length} overdue academic task(s) to protect your semester score.`);
  }
  if (suggestedImprovements.length === 0) {
    suggestedImprovements.push('All subjects are comfortably above threshold! Protect your streak and aim for Avengers Shield (100%).');
  }

  const totalRemainingClasses = subjects.reduce((sum, s) => sum + Math.max(0, s.remainingClasses), 0);

  return {
    overallZone,
    survivalScore,
    scoreBreakdown: {
      eligibilityPoints,
      bufferPoints,
      recoveryFeasibilityPoints,
      examProximityPoints,
      obligationPoints,
    },
    daysUntilExam,
    remainingWorkingDays,
    totalRemainingClasses,
    subjectPredictions,
    suggestedImprovements,
    disclaimer:
      'Internal planning indicator only: Mathematical eligibility predictions do not guarantee official hall-ticket approval by your college administration or university ERP.',
  };
}

/**
 * Generates personalized recovery schedules for subjects below threshold (or borderline).
 */
export function buildRecoveryPlans(
  subjects: Subject[],
  semester: SemesterSettings,
  todayIso: string = toLocalDateIso()
): RecoveryPlan[] {
  const holidayDates = semester.holidays.map((h) => h.date);
  const { dates: workingDates } = countWorkingDaysBetween(
    todayIso,
    semester.endDate,
    semester.workingDaysOfWeek,
    holidayDates
  );

  return subjects
    .filter((s) => !isAttendanceEligible(s.attended, s.total, s.minPercentage))
    .map((subject) => {
      const evalRes = evaluateAttendance(subject.attended, subject.total, subject.minPercentage);
      const req = calculateRequiredRecoveryClasses(subject.attended, subject.total, subject.minPercentage);
      const remaining = Math.max(0, subject.remainingClasses);

      // Shortage against current conducted classes
      const targetNow = Math.ceil((subject.minPercentage * subject.total) / 100);
      const shortageClasses = Math.max(0, targetNow - subject.attended);

      const finalTotal = subject.total + remaining;
      const maxAttended = subject.attended + remaining;
      const isRecoveryPossible = isAttendanceEligible(maxAttended, finalTotal, subject.minPercentage);

      const targetEnd = Math.ceil((subject.minPercentage * finalTotal) / 100);
      const minFutureNeeded = Math.max(0, targetEnd - subject.attended);
      const latestRecoveryMargin = isRecoveryPossible ? Math.max(0, remaining - minFutureNeeded) : 0;

      const recoveredAttended = subject.attended + req;
      const recoveredTotal = subject.total + req;
      const predictedFinalIfRecovered =
        recoveredTotal === 0 ? 100 : Number(((recoveredAttended * 100) / recoveredTotal).toFixed(2));

      // Map required classes onto upcoming timetable dates
      const subjectScheduledInWeek = Object.values(semester.timetable).some((codes) =>
        codes.includes(subject.code)
      );
      const scheduledDates: string[] = [];
      for (const dateIso of workingDates) {
        if (scheduledDates.length >= req) break;
        const day = new Date(`${dateIso}T00:00:00`).getDay();
        const daySubjects = semester.timetable[day] || [];
        const occurrences = daySubjects.filter((code) => code === subject.code).length;
        const slots = subjectScheduledInWeek ? occurrences : 1;
        for (let i = 0; i < slots && scheduledDates.length < req; i += 1) {
          scheduledDates.push(dateIso);
        }
      }

      const heroAdvice = isRecoveryPossible
        ? `Don't panic, hero. Attend your next ${req} ${subject.name} classes without absence to restore your ${subject.minPercentage}% shield!`
        : `Urgent Alert: With only ${remaining} classes left, reaching ${subject.minPercentage}% mathematically requires ${req} consecutive classes. Contact ${subject.facultyName} or administration immediately.`;

      return {
        subject,
        currentPercentage: Number(evalRes.exactPercentage.toFixed(2)),
        shortageClasses,
        requiredConsecutiveClasses: req,
        availableRemainingClasses: remaining,
        isRecoveryPossible,
        latestRecoveryMargin,
        predictedFinalIfRecovered,
        scheduledDates,
        heroAdvice,
      };
    });
}

export function getSafeBunksForSubject(subject: Subject): number {
  return calculateMaxSafeAbsences(subject.attended, subject.total, subject.minPercentage);
}
