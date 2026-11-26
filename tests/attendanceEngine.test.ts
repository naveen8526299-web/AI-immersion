import { describe, expect, it } from 'vitest';
import {
  calculateMaxSafeAbsences,
  calculateRequiredRecoveryClasses,
  evaluateAttendance,
  isAttendanceEligible,
  simulateFutureClasses,
} from '../src/utils/attendanceMath';
import { computeSquadPrivacyTier, hasClaimedReward } from '../src/utils/gamification';
import { buildRecoveryPlans, countWorkingDaysBetween, predictHallTicketSurvival } from '../src/utils/survivalPredictor';
import { DEFAULT_FEATURE_CONTROLS, INITIAL_SEMESTER, INITIAL_SUBJECTS } from '../src/services/demoData';
import { RewardTransaction } from '../src/types';

describe('AttendanceGuard Exact Integer Mathematical Engine', () => {
  it('Case 1: Attended 30, Total 40 -> 75%, Eligible, Max safe absences = 0', () => {
    const res = evaluateAttendance(30, 40, 75);
    expect(res.exactPercentage).toBe(75);
    expect(res.isEligible).toBe(true);
    expect(res.maxSafeAbsences).toBe(0);
    expect(res.requiredRecoveryClasses).toBe(0);
    expect(res.status).toBe('BORDERLINE');
  });

  it('Case 2: Attended 32, Total 40 -> 80%, Max safe absences = 2', () => {
    const res = evaluateAttendance(32, 40, 75);
    expect(res.exactPercentage).toBe(80);
    expect(res.isEligible).toBe(true);
    expect(res.maxSafeAbsences).toBe(2);
    expect(res.status).toBe('SAFE_ZONE');
  });

  it('Case 3: Attended 28, Total 40 -> 70%, Required recovery classes = 8', () => {
    const res = evaluateAttendance(28, 40, 75);
    expect(res.exactPercentage).toBe(70);
    expect(res.isEligible).toBe(false);
    expect(res.requiredRecoveryClasses).toBe(8);
    expect(res.status).toBe('THANOS_RISK');
  });

  it('Case 4: Attended 40, Total 40 -> 100%, Avengers Shield unlocked', () => {
    const res = evaluateAttendance(40, 40, 75);
    expect(res.exactPercentage).toBe(100);
    expect(res.isPerfect).toBe(true);
    expect(res.status).toBe('AVENGERS_SHIELD');
    expect(res.statusLabel).toBe('Avengers Shield');
  });

  it('Case 5: Attended 20, Total 30 -> 66.67%, Required recovery classes = 10', () => {
    const res = evaluateAttendance(20, 30, 75);
    expect(res.exactPercentage.toFixed(2)).toBe('66.67');
    expect(res.isEligible).toBe(false);
    expect(res.requiredRecoveryClasses).toBe(10);
  });

  it('Never uses rounded percentages to falsely pass 74.67% as 75%', () => {
    // 56 / 75 = 74.6666...% which rounds to 75% in 0-decimal display, MUST fail 75% integer check
    expect(isAttendanceEligible(56, 75, 75)).toBe(false);
    expect(calculateMaxSafeAbsences(56, 75, 75)).toBe(0);
    expect(calculateRequiredRecoveryClasses(56, 75, 75)).toBe(1);
  });
});

describe('Simulation Isolation & Predictive Engines', () => {
  it('Simulating bunks never mutates source subject objects', () => {
    const subject = { ...INITIAL_SUBJECTS[1] }; // 32/40
    const simResult = simulateFutureClasses(subject.attended, subject.total, subject.minPercentage, 0, 5);
    expect(simResult.isEligible).toBe(false);
    expect(subject.attended).toBe(32);
    expect(subject.total).toBe(40);
  });

  it('Predicts Hall Ticket Survival and flags mathematically impossible recovery', () => {
    const impossibleSubjects = [
      {
        ...INITIAL_SUBJECTS[0],
        attended: 10,
        total: 40, // 25% -> needs 80 recovery classes
        remainingClasses: 12,
      },
    ];
    const summary = predictHallTicketSurvival(impossibleSubjects, INITIAL_SEMESTER, [], []);
    expect(summary.overallZone).toBe('RED');
    expect(summary.subjectPredictions[0].canReachThreshold).toBe(false);

    const plans = buildRecoveryPlans(impossibleSubjects, INITIAL_SEMESTER);
    expect(plans[0].isRecoveryPossible).toBe(false);
  });
});

describe('Gamification Deduplication & Squad Privacy', () => {
  it('Prevents duplicate reward claims using unique eventKey', () => {
    const ledger: RewardTransaction[] = [
      {
        id: 'r1',
        eventKey: 'task-complete-1',
        description: 'Task',
        coinsDelta: 25,
        xpDelta: 25,
        source: 'TASK',
        createdAt: new Date().toISOString(),
      },
    ];
    expect(hasClaimedReward(ledger, 'task-complete-1')).toBe(true);
    expect(hasClaimedReward(ledger, 'task-complete-2')).toBe(false);
  });

  it('Masks exact attendance percentages into squad privacy tiers', () => {
    const tier = computeSquadPrivacyTier(INITIAL_SUBJECTS);
    expect(['Safe Zone', 'Needs Backup', 'At Risk', 'Attendance Hero', 'Protected']).toContain(tier);
  });

  it('Maps recovery dates in local calendar time without UTC off-by-one shifts', () => {
    const { workingDays, dates } = countWorkingDaysBetween('2026-11-26', '2026-11-27', [1, 2, 3, 4, 5], []);
    expect(workingDays).toBe(2);
    expect(dates).toEqual(['2026-11-26', '2026-11-27']);
  });

  it('Enforces strict college ERP defaults in DEFAULT_FEATURE_CONTROLS', () => {
    expect(DEFAULT_FEATURE_CONTROLS.studentSelfAttendanceLocked).toBe(true);
    expect(DEFAULT_FEATURE_CONTROLS.allowStudentSubjectManagement).toBe(false);
    expect(DEFAULT_FEATURE_CONTROLS.allowBunkSimulator).toBe(true);
    expect(DEFAULT_FEATURE_CONTROLS.allowODRequests).toBe(true);
    expect(DEFAULT_FEATURE_CONTROLS.allowSquadConnect).toBe(true);
    expect(DEFAULT_FEATURE_CONTROLS.allowHeroGamification).toBe(true);
  });

  it('Builds MA501 recovery plan on /recovery starting today and matching scheduled timetable days', () => {
    const plans = buildRecoveryPlans(INITIAL_SUBJECTS, INITIAL_SEMESTER, '2026-11-26');
    expect(plans.length).toBe(1);
    expect(plans[0].subject.code).toBe('MA501');
    expect(plans[0].requiredConsecutiveClasses).toBe(8);
    expect(plans[0].isRecoveryPossible).toBe(true);
    expect(plans[0].scheduledDates[0]).toBe('2026-11-26');
    // Friday 2026-11-27 does not have MA501 in INITIAL_SEMESTER.timetable[5]
    expect(plans[0].scheduledDates).not.toContain('2026-11-27');
  });
});
