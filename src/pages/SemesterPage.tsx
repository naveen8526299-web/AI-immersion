import React, { useState } from 'react';
import { Calendar, Clock, Grid, Plus, Trash2, X } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';

const WEEKDAYS = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
];

export const SemesterPage: React.FC = () => {
  const { semester, subjects, survivalSummary, updateSemester, updateSubject } = useAppState();
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'EXAM' | 'DEADLINE' | 'EVENT'>('DEADLINE');
  const [selectedDayForAdd, setSelectedDayForAdd] = useState<number>(1);
  const [selectedCodeForAdd, setSelectedCodeForAdd] = useState<string>(subjects[0]?.code || '');

  const toggleWorkingDay = (day: number) => {
    const exists = semester.workingDaysOfWeek.includes(day);
    const next = exists
      ? semester.workingDaysOfWeek.filter((d) => d !== day)
      : [...semester.workingDaysOfWeek, day].sort();
    updateSemester({ workingDaysOfWeek: next });
  };

  const addHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate || !holidayName.trim()) return;
    updateSemester({
      holidays: [
        ...semester.holidays,
        { id: `hol-${Date.now()}`, date: holidayDate, name: holidayName.trim() },
      ],
    });
    setHolidayDate('');
    setHolidayName('');
  };

  const removeHoliday = (id: string) => {
    updateSemester({ holidays: semester.holidays.filter((h) => h.id !== id) });
  };

  const addImportantEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate || !eventTitle.trim()) return;
    updateSemester({
      importantEvents: [
        ...semester.importantEvents,
        { id: `ev-${Date.now()}`, date: eventDate, title: eventTitle.trim(), type: eventType },
      ],
    });
    setEventDate('');
    setEventTitle('');
  };

  const removeImportantEvent = (id: string) => {
    updateSemester({ importantEvents: semester.importantEvents.filter((ev) => ev.id !== id) });
  };

  const addPeriodToDay = () => {
    const code = selectedCodeForAdd || subjects[0]?.code;
    if (!code) return;
    const currentDayList = semester.timetable[selectedDayForAdd] || [];
    updateSemester({
      timetable: {
        ...semester.timetable,
        [selectedDayForAdd]: [...currentDayList, code],
      },
    });
  };

  const removePeriodFromDay = (day: number, idx: number) => {
    const currentDayList = semester.timetable[day] || [];
    updateSemester({
      timetable: {
        ...semester.timetable,
        [day]: currentDayList.filter((_, i) => i !== idx),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Semester Radar & Weekly Timetable</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Configure your real college timetable, working days, holidays, exam dates, and subject-wise remaining classes.
        </p>
      </div>

      {/* Countdown KPIs */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="text-xs font-bold uppercase text-slate-500">Days Until Examination</div>
          <div className="mt-2 font-display text-3xl font-extrabold text-cyan-400">{survivalSummary.daysUntilExam}</div>
          <div className="text-xs text-slate-500 mt-1">Exam Date: {semester.examDate}</div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="text-xs font-bold uppercase text-slate-500">Remaining Working Days</div>
          <div className="mt-2 font-display text-3xl font-extrabold text-emerald-400">
            {survivalSummary.remainingWorkingDays}
          </div>
          <div className="text-xs text-slate-500 mt-1">Excludes non-working days & holidays</div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="text-xs font-bold uppercase text-slate-500">Total Remaining Periods</div>
          <div className="mt-2 font-display text-3xl font-extrabold text-purple-400">
            {survivalSummary.totalRemainingClasses}
          </div>
          <div className="text-xs text-slate-500 mt-1">Across {subjects.length} subjects</div>
        </div>
      </div>

      {/* Interactive Weekly Timetable Builder */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Grid className="h-4 w-4 text-cyan-400" /> Weekly College Timetable Builder
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Powers Today’s 1-Tap Check-In on your Dashboard and your Smart Recovery schedule.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDayForAdd}
              onChange={(e) => setSelectedDayForAdd(Number(e.target.value))}
              className="rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/15 px-3 py-1.5 text-xs font-bold"
            >
              {WEEKDAYS.map((w) => (
                <option key={w.day} value={w.day}>
                  {w.label}
                </option>
              ))}
            </select>
            <select
              value={selectedCodeForAdd || subjects[0]?.code || ''}
              onChange={(e) => setSelectedCodeForAdd(e.target.value)}
              className="rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/15 px-3 py-1.5 text-xs font-bold"
            >
              {subjects.length === 0 ? (
                <option value="">Add subjects first</option>
              ) : (
                subjects.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.code} — {s.name}
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              onClick={addPeriodToDay}
              disabled={subjects.length === 0}
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add Period
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {WEEKDAYS.map((w) => {
            const periods = semester.timetable[w.day] || [];
            const isWorking = semester.workingDaysOfWeek.includes(w.day);
            return (
              <div
                key={w.day}
                className={`rounded-2xl border p-3.5 space-y-2 ${
                  isWorking
                    ? 'bg-slate-100/80 dark:bg-white/5 border-slate-200 dark:border-white/10'
                    : 'opacity-55 bg-slate-100/40 dark:bg-white/[0.02] border-dashed border-slate-300 dark:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{w.label}</span>
                  <span className="text-[11px] text-slate-500">{isWorking ? `${periods.length} period(s)` : 'Off day'}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {periods.length === 0 ? (
                    <span className="text-[11px] text-slate-400">No periods scheduled</span>
                  ) : (
                    periods.map((code, idx) => (
                      <span
                        key={`${w.day}-${code}-${idx}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-electric-500/15 border border-electric-400/30 px-2 py-1 text-[11px] font-mono font-bold text-electric-600 dark:text-cyan-300"
                      >
                        P{idx + 1}: {code}
                        <button
                          type="button"
                          onClick={() => removePeriodFromDay(w.day, idx)}
                          className="hover:text-rose-400"
                          title="Remove period"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Dates & Working Days Configuration */}
        <div className="lg:col-span-6 glass-card rounded-2xl p-5 space-y-5">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400" /> Semester Dates & Working Days
          </h2>

          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Semester Start</label>
              <input
                type="date"
                value={semester.startDate}
                onChange={(e) => updateSemester({ startDate: e.target.value })}
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Last Instruction Day</label>
              <input
                type="date"
                value={semester.endDate}
                onChange={(e) => updateSemester({ endDate: e.target.value })}
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Exam Start Date</label>
              <input
                type="date"
                value={semester.examDate}
                onChange={(e) => updateSemester({ examDate: e.target.value })}
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold mb-2">College Working Days</div>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((w) => {
                const active = semester.workingDaysOfWeek.includes(w.day);
                return (
                  <button
                    key={w.day}
                    type="button"
                    onClick={() => toggleWorkingDay(w.day)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold border transition ${
                      active
                        ? 'bg-electric-600 text-white border-electric-400'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-500'
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Holidays */}
          <div className="space-y-3">
            <div className="text-xs font-semibold">Planned Holidays</div>
            <form onSubmit={addHoliday} className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                className="rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-xs"
              />
              <input
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder="Holiday name..."
                className="flex-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </form>
            <div className="space-y-1.5">
              {semester.holidays.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-xl bg-slate-100/80 dark:bg-white/5 px-3 py-2 text-xs"
                >
                  <span>
                    <strong className="font-mono">{h.date}</strong> — {h.name}
                  </span>
                  <button onClick={() => removeHoliday(h.id)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subject Remaining Classes + Events */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" /> Subject-Wise Remaining Classes
            </h2>
            <div className="space-y-2.5">
              {subjects.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-100/80 dark:bg-white/5 px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <div className="font-bold">
                      {s.code} • {s.name}
                    </div>
                    <div className="text-slate-500">{s.weeklyPeriods} periods/week</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Remaining:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={s.remainingClasses}
                      onChange={(e) => updateSubject(s.id, { remainingClasses: Math.max(0, Number(e.target.value)) })}
                      className="w-16 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 px-2 py-1 text-center font-mono font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-lg font-bold">Important Academic Events & Deadlines</h2>
            <form onSubmit={addImportantEvent} className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-xs"
              />
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Exam / CIA / Review title..."
                className="flex-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-xs"
              />
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as 'EXAM' | 'DEADLINE' | 'EVENT')}
                className="rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/15 px-2.5 py-2 text-xs font-bold"
              >
                <option value="DEADLINE">DEADLINE</option>
                <option value="EXAM">EXAM</option>
                <option value="EVENT">EVENT</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </form>
            <div className="space-y-2">
              {semester.importantEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between rounded-xl bg-slate-100/80 dark:bg-white/5 px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <div className="font-bold">{ev.title}</div>
                    <div className="font-mono text-slate-500">{ev.date}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-bold text-purple-400">
                      {ev.type}
                    </span>
                    <button onClick={() => removeImportantEvent(ev.id)} className="text-rose-400 hover:text-rose-300">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
