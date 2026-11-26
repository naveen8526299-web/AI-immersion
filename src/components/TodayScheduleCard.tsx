import React, { useState } from 'react';
import { CalendarCheck, CheckCircle2, Clock, Lock, RotateCcw, Settings2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { evaluateAttendance } from '../utils/attendanceMath';
import { toLocalDateIso } from '../utils/dateUtils';

export const TodayScheduleCard: React.FC = () => {
  const { subjects, records, semester, featureControls, recordStudentAttendance, undoAttendanceRecord } = useAppState();
  const [confirmingPeriodIdx, setConfirmingPeriodIdx] = useState<number | null>(null);
  const isLocked = featureControls.studentSelfAttendanceLocked;

  const now = new Date();
  const todayIso = toLocalDateIso(now);
  const weekday = now.getDay(); // 0=Sun..6=Sat
  const weekdayLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  const holidayToday = semester.holidays.find((h) => h.date === todayIso);
  const isWorkingDay = semester.workingDaysOfWeek.includes(weekday) && !holidayToday;
  const scheduledCodes = semester.timetable[weekday] || [];

  const todayPeriodRecords = records.filter((r) => r.date === todayIso);

  return (
    <section className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-cyan-400" />
            <h2 className="font-display text-lg sm:text-xl font-bold">Today’s College Check-In</h2>
            <span className="rounded-full bg-cyan-500/15 border border-cyan-400/30 px-2.5 py-0.5 text-[11px] font-bold text-cyan-500 dark:text-cyan-300">
              {weekdayLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isLocked
              ? 'Official college roll call mode: Faculty & Admin mark attendance. Track period status or plan ahead.'
              : 'Tap once as you attend each period in college. Duplicate period logs are prevented automatically.'}
          </p>
        </div>

        <Link
          to="/semester"
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200/80 dark:bg-white/10 px-3.5 py-2 text-xs font-bold hover:bg-slate-300/70 dark:hover:bg-white/20 transition self-start"
        >
          <Settings2 className="h-3.5 w-3.5 text-cyan-400" /> {isLocked ? 'View Timetable' : 'Edit Timetable'}
        </Link>
      </div>

      {holidayToday ? (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/30 p-4 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
          Today is marked as a holiday: <strong>{holidayToday.name}</strong>. Enjoy your break!
        </div>
      ) : !isWorkingDay ? (
        <div className="rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 text-xs text-slate-500 dark:text-slate-300">
          Today is configured as a non-working day. Use the Subject Cards below if you have an extra special class.
        </div>
      ) : scheduledCodes.length === 0 ? (
        <div className="rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 text-xs flex items-center justify-between gap-3">
          <span className="text-slate-500 dark:text-slate-300">
            No periods configured for today’s timetable yet.
          </span>
          <Link to="/semester" className="font-bold text-cyan-400 hover:underline">
            Configure Timetable →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scheduledCodes.map((code, idx) => {
            const subject = subjects.find((s) => s.code === code);
            const periodTag = `Period #${idx + 1}`;
            const loggedRec = todayPeriodRecords.find(
              (r) => r.subjectCode === code && r.note?.includes(periodTag)
            );

            if (!subject) {
              return (
                <div
                  key={`${code}-${idx}`}
                  className="rounded-2xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-3.5 text-xs"
                >
                  <div className="text-[10px] font-bold uppercase text-slate-400">{periodTag}</div>
                  <div className="font-bold mt-1">{code}</div>
                  <div className="text-slate-500 mt-1">Subject not added yet</div>
                </div>
              );
            }

            const evalRes = evaluateAttendance(subject.attended, subject.total, subject.minPercentage);

            return (
              <div
                key={`${subject.id}-${idx}`}
                className={`rounded-2xl border p-3.5 flex flex-col justify-between gap-3 ${
                  loggedRec
                    ? loggedRec.status === 'PRESENT'
                      ? 'bg-emerald-500/10 border-emerald-400/35'
                      : 'bg-rose-500/10 border-rose-400/35'
                    : 'bg-slate-100/80 dark:bg-white/5 border-slate-200/80 dark:border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-500 dark:text-slate-400">
                      <Clock className="h-3 w-3 text-cyan-400" /> {periodTag}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        evalRes.isEligible ? 'text-emerald-500' : 'text-rose-400'
                      }`}
                    >
                      {evalRes.displayPercentage}
                    </span>
                  </div>
                  <div className="mt-1 font-display font-bold text-sm truncate">{subject.name}</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {subject.code} • {subject.attended}/{subject.total}
                  </div>
                </div>

                {isLocked ? (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {loggedRec ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          loggedRec.status === 'PRESENT' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {loggedRec.status === 'PRESENT' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {loggedRec.status === 'PRESENT' ? 'Marked Present' : 'Marked Absent'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <Lock className="h-3 w-3 text-[#00D9FF]" />
                        Pending Faculty Roll Call
                      </span>
                    )}
                    {featureControls.allowBunkSimulator && (
                      <Link
                        to="/simulator"
                        className="rounded-lg bg-[#00D9FF]/15 border border-[#00D9FF]/30 px-2 py-0.5 text-[10px] font-bold text-[#00D9FF] hover:bg-[#00D9FF]/25 transition"
                      >
                        Simulate
                      </Link>
                    )}
                  </div>
                ) : loggedRec ? (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        loggedRec.status === 'PRESENT' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {loggedRec.status === 'PRESENT' ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {loggedRec.status === 'PRESENT' ? 'Attended' : 'Missed'}
                    </span>
                    <button
                      onClick={() => undoAttendanceRecord(loggedRec.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-bold hover:bg-white/25 transition"
                      title="Undo this check-in"
                    >
                      <RotateCcw className="h-3 w-3" /> Undo
                    </button>
                  </div>
                ) : confirmingPeriodIdx === idx ? (
                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        setConfirmingPeriodIdx(null);
                        recordStudentAttendance(subject.id, 'ABSENT', `${periodTag} daily check-in`);
                      }}
                      className="flex-1 rounded-lg bg-rose-600 py-1.5 text-[11px] font-bold text-white"
                    >
                      Confirm Miss
                    </button>
                    <button
                      onClick={() => setConfirmingPeriodIdx(null)}
                      className="rounded-lg bg-slate-200 dark:bg-white/10 px-2.5 py-1.5 text-[11px] font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() =>
                        recordStudentAttendance(subject.id, 'PRESENT', `${periodTag} daily check-in`)
                      }
                      className="flex-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/35 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-300 transition"
                    >
                      Present
                    </button>
                    <button
                      onClick={() => setConfirmingPeriodIdx(idx)}
                      className="rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/30 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-300 transition"
                    >
                      Absent
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
