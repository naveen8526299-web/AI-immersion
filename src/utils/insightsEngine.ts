import { AttendanceRecord, ODRequest, Squad, SquadTask, Subject } from '../types';
import { evaluateAttendance } from './attendanceMath';
import { addLocalDaysIso } from './dateUtils';

export interface AttendanceInsight {
  id: string;
  severity: 'INFO' | 'POSITIVE' | 'WARNING' | 'CRITICAL';
  title: string;
  detail: string;
  metricBadge: string;
}

export function generateAttendanceInsights(
  subjects: Subject[],
  records: AttendanceRecord[],
  odRequests: ODRequest[],
  tasks: SquadTask[],
  squad: Squad | null
): AttendanceInsight[] {
  const insights: AttendanceInsight[] = [];

  subjects.forEach((subj) => {
    const evalRes = evaluateAttendance(subj.attended, subj.total, subj.minPercentage);
    if (evalRes.status === 'THANOS_RISK') {
      insights.push({
        id: `risk-${subj.id}`,
        severity: 'CRITICAL',
        title: `${subj.name} is below ${subj.minPercentage}%`,
        detail: `You can recover your attendance in ${subj.code} by attending the next ${evalRes.requiredRecoveryClasses} consecutive class(es).`,
        metricBadge: `${evalRes.displayPercentage}`,
      });
    } else if (evalRes.maxSafeAbsences === 1) {
      insights.push({
        id: `tight-${subj.id}`,
        severity: 'WARNING',
        title: `${subj.name} has only 1 safe absence left`,
        detail: `${subj.code} is currently eligible at ${evalRes.displayPercentage}, but one more skip leaves zero margin.`,
        metricBadge: '1 Bunk Left',
      });
    } else if (evalRes.isPerfect) {
      insights.push({
        id: `shield-${subj.id}`,
        severity: 'POSITIVE',
        title: `Avengers Shield active in ${subj.name}`,
        detail: `You have 100% attendance (${subj.attended}/${subj.total}) and earn +10 extra shield coins per attended class.`,
        metricBadge: '100% Shield',
      });
    }
  });

  // Recent 7-day trend check from real attendance records
  const weekIso = addLocalDaysIso(-7);
  const recentAbsences = records.filter((r) => r.date >= weekIso && r.status === 'ABSENT');
  if (recentAbsences.length > 0) {
    insights.push({
      id: 'recent-absences',
      severity: 'WARNING',
      title: `${recentAbsences.length} absence(s) recorded in the last 7 days`,
      detail: `Recent skips affected ${Array.from(new Set(recentAbsences.map((r) => r.subjectCode))).join(', ')}. Protect this week's streak!`,
      metricBadge: '7-Day Watch',
    });
  }

  const approvedODs = odRequests.filter((o) => o.status === 'APPROVED');
  if (approvedODs.length > 0) {
    const totalPeriods = approvedODs.reduce((sum, o) => sum + o.periodsPerSubject * o.subjectIds.length, 0);
    insights.push({
      id: 'od-boost',
      severity: 'POSITIVE',
      title: 'OD approval strengthened your semester eligibility',
      detail: `${approvedODs.length} approved OD claim(s) reconciled ${totalPeriods} period(s) into your subject attendance records.`,
      metricBadge: `+${totalPeriods} OD Periods`,
    });
  }

  if (tasks.length > 0) {
    const doneCount = tasks.filter((t) => t.status === 'COMPLETED').length;
    const pct = Math.round((doneCount / tasks.length) * 100);
    insights.push({
      id: 'squad-tasks',
      severity: pct >= 70 ? 'POSITIVE' : 'INFO',
      title: `${squad ? squad.name : 'Your squad'} has completed ${pct}% of project & study tasks`,
      detail: `${doneCount} of ${tasks.length} tracked academic tasks are marked complete.`,
      metricBadge: `${pct}% Done`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'baseline',
      severity: 'INFO',
      title: 'All attendance metrics look steady',
      detail: 'Add subjects or log today’s classes to unlock deeper predictive recommendations.',
      metricBadge: 'Steady',
    });
  }

  return insights;
}
