import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, GraduationCap, Info, Megaphone, XCircle } from 'lucide-react';
import { ThanosAdminArtwork } from '../components/HeroCharacters';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { evaluateAttendance } from '../utils/attendanceMath';

export const FacultyPage: React.FC = () => {
  const { user } = useAuth();
  const {
    subjects,
    demoCohort,
    odRequests,
    reviewODRequest,
    facultyUpdateStudentAttendance,
    addAnnouncement,
    triggerThanosAlert,
  } = useAppState();

  const [odRemarks, setOdRemarks] = useState<Record<string, string>>({});
  const [editTarget, setEditTarget] = useState<{
    studentId: string;
    studentName: string;
    subjectId: string;
    subjectCode: string;
    attended: number;
    total: number;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const [annSubject, setAnnSubject] = useState('MA501');
  const [annTitle, setAnnTitle] = useState('');
  const [annMsg, setAnnMsg] = useState('');

  // Combine main demo student + demo cohort
  const allStudents = useMemo(
    () => [
      {
        id: 'demo-student-1',
        fullName: 'Arjun Karthik',
        heroAlias: 'CyberShield-07',
        registerNumber: '22CSE042',
        subjects,
      },
      ...demoCohort,
    ],
    [subjects, demoCohort]
  );

  if (!user || (user.role !== 'FACULTY' && user.role !== 'ADMIN')) {
    return null;
  }

  const assignedCodes = user.role === 'ADMIN' ? null : user.assignedSubjectCodes || [];

  // Filter student-subject rows strictly to faculty's assigned subjects
  const authorizedRows = allStudents.flatMap((st) =>
    st.subjects
      .filter((subj) => !assignedCodes || assignedCodes.includes(subj.code))
      .map((subj) => ({
        student: st,
        subject: subj,
        evalRes: evaluateAttendance(subj.attended, subj.total, subj.minPercentage),
      }))
  );

  const atRiskRows = authorizedRows.filter((r) => !r.evalRes.isEligible);

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const res = facultyUpdateStudentAttendance({
      studentId: editTarget.studentId,
      subjectId: editTarget.subjectId,
      newAttended: editTarget.attended,
      newTotal: editTarget.total,
      reason,
    });
    if (!res.ok) {
      setFeedback({ ok: false, text: res.error || 'Update failed.' });
      return;
    }
    setFeedback({
      ok: true,
      text: `Verified update logged for ${editTarget.studentName} (${editTarget.subjectCode}). Student dashboard updated immediately.`,
    });
    setEditTarget(null);
    setReason('');
  };

  const handleReviewOD = (odId: string, decision: 'APPROVED' | 'REJECTED') => {
    const res = reviewODRequest(odId, decision, odRemarks[odId] || '');
    setFeedback(
      res.ok
        ? { ok: true, text: `OD ${decision.toLowerCase()} (Simulated demo reconciliation complete).` }
        : { ok: false, text: res.error || 'Failed to review OD.' }
    );
  };

  const handleAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMsg.trim()) return;
    addAnnouncement(annSubject, annTitle.trim(), annMsg.trim());
    setAnnTitle('');
    setAnnMsg('');
    setFeedback({ ok: true, text: 'Academic announcement published to student notifications.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 px-3 py-1 text-[11px] font-bold text-indigo-400">
            <GraduationCap className="h-3.5 w-3.5" /> Faculty Verification & Risk Portal
          </span>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold">Faculty Command Portal</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Authorized Subjects:{' '}
            <strong className="font-mono text-cyan-400">
              {assignedCodes ? assignedCodes.join(', ') : 'ALL INSTITUTIONAL SUBJECTS (ADMIN)'}
            </strong>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-3.5 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
        <span>
          Simulated Demo Scope: Changes made here immediately update the demo student dashboard and audit logs.
          Unauthorized subjects are hidden and blocked from faculty edits.
        </span>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-bold ${
            feedback.ok
              ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-400'
              : 'bg-rose-500/15 border-rose-400/40 text-rose-400'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Smart Faculty Risk Alerts */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 text-rose-400">
            <AlertTriangle className="h-5 w-5" /> Smart Faculty Risk Reports ({atRiskRows.length} At-Risk Record(s))
          </h2>
          {atRiskRows.length > 0 && (
            <button
              onClick={() =>
                triggerThanosAlert(
                  {
                    subjectCode: atRiskRows[0].subject.code,
                    subjectName: atRiskRows[0].subject.name,
                    percentage: atRiskRows[0].evalRes.exactPercentage,
                    requiredPercentage: atRiskRows[0].subject.minPercentage,
                    recoveryNeeded: atRiskRows[0].evalRes.requiredRecoveryClasses,
                    isSimulation: false,
                  },
                  true
                )
              }
              className="rounded-xl bg-purple-600/80 hover:bg-purple-500 px-3.5 py-2 text-xs font-bold text-white transition self-start"
            >
              Preview Student Thanos Alert
            </button>
          )}
        </div>
        {atRiskRows.length === 0 ? (
          <p className="text-xs text-slate-500">All students in your assigned subjects are currently ≥ threshold.</p>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-5">
            <div className="shrink-0">
              <ThanosAdminArtwork size={112} />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-3 flex-1 w-full">
              {atRiskRows.map(({ student, subject, evalRes }) => (
                <div
                  key={`${student.id}-${subject.id}`}
                  className="rounded-xl bg-rose-500/10 border border-rose-400/30 p-3.5 text-xs space-y-1"
                >
                  <div className="font-bold">
                    {student.fullName} ({student.registerNumber})
                  </div>
                  <div className="font-mono text-rose-400">
                    {subject.code}: {evalRes.displayPercentage} ({evalRes.attended}/{evalRes.total})
                  </div>
                  <div className="text-slate-400">Needs {evalRes.requiredRecoveryClasses} straight classes to recover</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Authorized Subject Attendance Records */}
      <div className="glass-card rounded-2xl p-5 overflow-x-auto">
        <h2 className="font-display text-lg font-bold mb-4">Assigned Subject Attendance & Verification</h2>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 uppercase">
              <th className="py-2 pr-3">Student</th>
              <th className="py-2 pr-3">Subject</th>
              <th className="py-2 pr-3">Attended / Total</th>
              <th className="py-2 pr-3">Exact %</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-white/5">
            {authorizedRows.map(({ student, subject, evalRes }) => (
              <tr key={`${student.id}-${subject.id}`}>
                <td className="py-2.5 pr-3 font-semibold">
                  {student.fullName}
                  <div className="text-[11px] font-mono text-slate-500">{student.registerNumber}</div>
                </td>
                <td className="py-2.5 pr-3">
                  <span className="font-mono font-bold text-cyan-400">{subject.code}</span> • {subject.name}
                </td>
                <td className="py-2.5 pr-3 font-mono">
                  {subject.attended} / {subject.total}
                </td>
                <td className="py-2.5 pr-3 font-mono font-bold">{evalRes.displayPercentage}</td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 font-bold ${
                      evalRes.isEligible ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {evalRes.statusLabel}
                  </span>
                </td>
                <td className="py-2.5">
                  <button
                    onClick={() =>
                      setEditTarget({
                        studentId: student.id,
                        studentName: student.fullName,
                        subjectId: subject.id,
                        subjectCode: subject.code,
                        attended: subject.attended,
                        total: subject.total,
                      })
                    }
                    className="rounded-lg bg-electric-500/15 px-3 py-1.5 font-bold text-electric-500 dark:text-cyan-300 hover:bg-electric-500/25"
                  >
                    Verify / Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* OD Verification Queue */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg font-bold">On-Duty (OD) Verification Queue</h2>
        <div className="space-y-3">
          {odRequests.map((od) => (
            <div
              key={od.id}
              className="rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
            >
              <div>
                <div className="font-bold text-sm">
                  {od.eventName} <span className="text-cyan-400">({od.eventType})</span>
                </div>
                <div className="text-slate-500 mt-0.5">
                  Student: <strong>{od.studentName}</strong> • {od.startDate} to {od.endDate} • +{od.periodsPerSubject}{' '}
                  periods/subject
                </div>
                <div className="text-slate-400 mt-0.5">Proof: {od.documentNote || 'None provided'}</div>
              </div>

              {od.status === 'PENDING' ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    value={odRemarks[od.id] || ''}
                    onChange={(e) => setOdRemarks({ ...odRemarks, [od.id]: e.target.value })}
                    placeholder="Verification remarks..."
                    className="rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 px-3 py-1.5 text-xs"
                  />
                  <button
                    onClick={() => handleReviewOD(od.id, 'APPROVED')}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 font-bold text-slate-950"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Reconcile
                  </button>
                  <button
                    onClick={() => handleReviewOD(od.id, 'REJECTED')}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 font-bold text-white"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              ) : (
                <span className="font-bold text-emerald-400">
                  {od.status} {od.reconciled ? '• Reconciled (Locked)' : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Post Academic Announcement */}
      <form onSubmit={handleAnnouncement} className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-cyan-400" /> Post Academic Announcement
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            value={annSubject}
            onChange={(e) => setAnnSubject(e.target.value)}
            placeholder="Subject Code (e.g., MA501)"
            className="rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
          />
          <input
            required
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            placeholder="Announcement title"
            className="sm:col-span-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
          />
        </div>
        <textarea
          required
          value={annMsg}
          onChange={(e) => setAnnMsg(e.target.value)}
          rows={2}
          placeholder="Write notice for students..."
          className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2 text-xs font-extrabold text-slate-950"
        >
          Publish Announcement
        </button>
      </form>

      {/* Edit Attendance Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveAttendance}
            className="w-full max-w-md rounded-2xl glass-card bg-white dark:bg-[#0b1233] p-6 space-y-4"
          >
            <h3 className="font-display text-lg font-bold">
              Update {editTarget.subjectCode} for {editTarget.studentName}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Attended</label>
                <input
                  type="number"
                  min={0}
                  value={editTarget.attended}
                  onChange={(e) => setEditTarget({ ...editTarget, attended: Number(e.target.value) })}
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Total Conducted</label>
                <input
                  type="number"
                  min={0}
                  value={editTarget.total}
                  onChange={(e) => setEditTarget({ ...editTarget, total: Number(e.target.value) })}
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Mandatory Audit Reason *</label>
              <input
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Verified physical lab register correction"
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 py-2.5 text-xs font-extrabold text-slate-950"
              >
                Save & Log Audit
              </button>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="rounded-xl bg-slate-200 dark:bg-white/10 px-4 py-2.5 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
