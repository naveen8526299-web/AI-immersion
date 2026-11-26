import React, { useState } from 'react';
import { Calendar, Download, History, Plus, Printer, RotateCcw, Trash2, X } from 'lucide-react';
import { SubjectCard } from '../components/SubjectCard';
import { useAppState } from '../contexts/AppStateContext';
import { Subject } from '../types';
import { evaluateAttendance } from '../utils/attendanceMath';
import { toLocalDateIso } from '../utils/dateUtils';

export const AttendancePage: React.FC = () => {
  const { subjects, records, addSubject, updateSubject, deleteSubject, recordStudentAttendance, undoAttendanceRecord } =
    useAppState();

  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Subject | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [attended, setAttended] = useState(15);
  const [total, setTotal] = useState(20);
  const [minPercentage, setMinPercentage] = useState(75);
  const [remainingClasses, setRemainingClasses] = useState(14);
  const [weeklyPeriods, setWeeklyPeriods] = useState(4);

  const openAdd = () => {
    setEditingSubject(null);
    setCode('');
    setName('');
    setFacultyName('Assigned Faculty');
    setAttended(15);
    setTotal(20);
    setMinPercentage(75);
    setRemainingClasses(14);
    setWeeklyPeriods(4);
    setShowForm(true);
  };

  const openEdit = (s: Subject) => {
    setEditingSubject(s);
    setCode(s.code);
    setName(s.name);
    setFacultyName(s.facultyName);
    setAttended(s.attended);
    setTotal(s.total);
    setMinPercentage(s.minPercentage);
    setRemainingClasses(s.remainingClasses);
    setWeeklyPeriods(s.weeklyPeriods);
    setShowForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const safeTotal = Math.max(0, Math.floor(total));
    const safeAttended = Math.max(0, Math.min(safeTotal, Math.floor(attended)));
    const safeMin = Math.max(1, Math.min(99, Math.floor(minPercentage)));

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        facultyName: facultyName.trim(),
        attended: safeAttended,
        total: safeTotal,
        minPercentage: safeMin,
        remainingClasses: Math.max(0, remainingClasses),
        weeklyPeriods: Math.max(1, weeklyPeriods),
      });
    } else {
      addSubject({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        facultyName: facultyName.trim() || 'Assigned Faculty',
        attended: safeAttended,
        total: safeTotal,
        minPercentage: safeMin,
        remainingClasses: Math.max(0, remainingClasses),
        weeklyPeriods: Math.max(1, weeklyPeriods),
        color: '#38bdf8',
      });
    }
    setShowForm(false);
  };

  const exportCsv = () => {
    const header = 'Code,Subject,Attended,Total,Percentage,MinRequired,Status,SafeBunks,RecoveryNeeded\n';
    const rows = subjects
      .map((s) => {
        const ev = evaluateAttendance(s.attended, s.total, s.minPercentage);
        return `${s.code},"${s.name}",${ev.attended},${ev.total},${ev.displayPercentage},${ev.minPercentage}%,${ev.statusLabel},${ev.maxSafeAbsences},${ev.requiredRecoveryClasses}`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendanceguard-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build 14-day attendance streak calendar
  const last14Days = Array.from({ length: 14 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - idx));
    const iso = toLocalDateIso(d);
    const dayRecs = records.filter((r) => r.date === iso);
    const hasPresent = dayRecs.some((r) => r.status === 'PRESENT' || r.status === 'OD_CREDIT');
    const hasAbsent = dayRecs.some((r) => r.status === 'ABSENT');
    return {
      iso,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      dayNum: d.getDate(),
      state: hasPresent && !hasAbsent ? 'present' : hasAbsent ? 'mixed' : 'none',
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Subject Attendance Engine</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Exact integer eligibility checks (<code className="font-mono text-xs">100×A ≥ p×T</code>). Never rounded.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 no-print">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200/80 dark:bg-white/10 px-3.5 py-2 text-xs font-bold hover:bg-slate-300/70 dark:hover:bg-white/20 transition"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200/80 dark:bg-white/10 px-3.5 py-2 text-xs font-bold hover:bg-slate-300/70 dark:hover:bg-white/20 transition"
          >
            <Printer className="h-3.5 w-3.5" /> Print Summary
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-lg hover:brightness-110 transition"
          >
            <Plus className="h-4 w-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* Streak Calendar */}
      <div className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400" /> 14-Day Attendance Streak Calendar
          </h2>
          <span className="text-xs text-slate-500">Green = All Attended • Amber = Absence Logged</span>
        </div>
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
          {last14Days.map((d) => (
            <div
              key={d.iso}
              title={d.iso}
              className={`rounded-xl p-2 text-center border text-xs ${
                d.state === 'present'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-600 dark:text-emerald-300'
                  : d.state === 'mixed'
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-600 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-white/5 border-slate-200/70 dark:border-white/10 text-slate-400'
              }`}
            >
              <div className="text-[10px]">{d.label}</div>
              <div className="font-bold">{d.dayNum}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center space-y-3">
          <h2 className="font-display text-xl font-bold">No Subjects Added Yet</h2>
          <p className="text-xs text-slate-500 dark:text-slate-300 max-w-md mx-auto">
            Add your real college subjects along with your current attended and conducted class counts to start daily tracking.
          </p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-xs font-extrabold text-slate-950"
          >
            <Plus className="h-4 w-4" /> Add Your First Subject
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {subjects.map((subj) => (
            <SubjectCard
              key={subj.id}
              subject={subj}
              onAttend={(id) => recordStudentAttendance(id, 'PRESENT')}
              onAbsent={(id) => recordStudentAttendance(id, 'ABSENT')}
              onEdit={openEdit}
              onDelete={(s) => setConfirmDelete(s)}
            />
          ))}
        </div>
      )}

      {/* Attendance History Log */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-purple-400" /> Attendance History & Verification Ledger
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 uppercase">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Subject</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Updated By</th>
                <th className="py-2 pr-3">Note</th>
                <th className="py-2">Undo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/5">
              {records.slice(0, 20).map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5 pr-3 font-mono">{r.date}</td>
                  <td className="py-2.5 pr-3 font-semibold">
                    {r.subjectCode} • {r.subjectName}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`rounded-full px-2 py-0.5 font-bold ${
                        r.status === 'PRESENT'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : r.status === 'OD_CREDIT'
                          ? 'bg-cyan-500/15 text-cyan-400'
                          : 'bg-rose-500/15 text-rose-500'
                      }`}
                    >
                      {r.status} ({r.periods})
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-500">{r.source}</td>
                  <td className="py-2.5 pr-3">{r.updatedBy}</td>
                  <td className="py-2.5 pr-3 text-slate-500">{r.note || '—'}</td>
                  <td className="py-2.5">
                    {r.source === 'STUDENT_SELF' ? (
                      <button
                        onClick={() => undoAttendanceRecord(r.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-200/70 dark:bg-white/10 px-2 py-1 text-[11px] font-bold hover:bg-rose-500/20 hover:text-rose-400 transition"
                        title="Undo mistaken log"
                      >
                        <RotateCcw className="h-3 w-3" /> Undo
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Subject Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md rounded-2xl glass-card bg-white dark:bg-[#0b1233] p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Subject Code *</label>
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="CS506"
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Min Required %</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={minPercentage}
                  onChange={(e) => setMinPercentage(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Subject Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Compiler Design"
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Faculty Name</label>
              <input
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Attended Classes</label>
                <input
                  type="number"
                  min={0}
                  value={attended}
                  onChange={(e) => setAttended(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Total Conducted</label>
                <input
                  type="number"
                  min={0}
                  value={total}
                  onChange={(e) => setTotal(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Remaining Sem Classes</label>
                <input
                  type="number"
                  min={0}
                  value={remainingClasses}
                  onChange={(e) => setRemainingClasses(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Periods / Week</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={weeklyPeriods}
                  onChange={(e) => setWeeklyPeriods(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 py-2.5 text-sm font-extrabold text-slate-950"
            >
              {editingSubject ? 'Save Changes' : 'Create Subject'}
            </button>
          </form>
        </div>
      )}

      {/* Confirm Delete Subject Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl glass-card bg-white dark:bg-[#0b1233] p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-500 font-display text-lg font-bold">
              <Trash2 className="h-5 w-5" /> Delete {confirmDelete.code}?
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove <strong>{confirmDelete.name}</strong> from your semester tracker?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  deleteSubject(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-500"
              >
                Delete Subject
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl bg-slate-200 dark:bg-white/10 py-2 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
