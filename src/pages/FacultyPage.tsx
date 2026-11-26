import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Eye,
  GraduationCap,
  Info,
  Megaphone,
  MinusCircle,
  PlusCircle,
  Search,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { ThanosAdminArtwork } from '../components/HeroCharacters';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { evaluateAttendance, evaluateOverallSubjects } from '../utils/attendanceMath';

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
  const [studentSearch, setStudentSearch] = useState('');
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);

  // Roll Call ("Put Attendance") state
  const assignedCodes = user?.role === 'ADMIN' ? null : user?.assignedSubjectCodes || [];
  const allStudents = useMemo(
    () =>
      user && !user.isDemo
        ? demoCohort
        : [
            {
              id: 'demo-student-1',
              fullName: 'Arjun Karthik',
              heroAlias: 'CyberShield-07',
              registerNumber: '22CSE042',
              department: 'CSE (CoE AI)',
              semesterNumber: 5,
              subjects,
            },
            ...demoCohort,
          ],
    [subjects, demoCohort, user]
  );

  const authorizedSubjectCodes = useMemo(() => {
    const allCodes = Array.from(new Set(allStudents.flatMap((st) => st.subjects.map((s) => s.code))));
    return assignedCodes ? allCodes.filter((c) => assignedCodes.includes(c)) : allCodes;
  }, [allStudents, assignedCodes]);

  const [rollCallCode, setRollCallCode] = useState<string>(authorizedSubjectCodes[0] || 'MA501');
  const [sessionLabel, setSessionLabel] = useState<string>('Regular Lecture Period');

  const [annSubject, setAnnSubject] = useState(authorizedSubjectCodes[0] || 'MA501');
  const [annTitle, setAnnTitle] = useState('');
  const [annMsg, setAnnMsg] = useState('');

  if (!user || (user.role !== 'FACULTY' && user.role !== 'ADMIN')) {
    return null;
  }

  const activeRollCallCode = authorizedSubjectCodes.includes(rollCallCode)
    ? rollCallCode
    : authorizedSubjectCodes[0] || '';

  const rollCallRows = allStudents
    .map((st) => {
      const subj = st.subjects.find((s) => s.code === activeRollCallCode);
      if (!subj) return null;
      return {
        student: st,
        subject: subj,
        evalRes: evaluateAttendance(subj.attended, subj.total, subj.minPercentage),
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const authorizedRows = allStudents.flatMap((st) =>
    st.subjects
      .filter((subj) => !assignedCodes || assignedCodes.includes(subj.code))
      .filter((subj) => {
        const q = studentSearch.trim().toLowerCase();
        return (
          !q ||
          st.fullName.toLowerCase().includes(q) ||
          st.registerNumber.toLowerCase().includes(q) ||
          subj.code.toLowerCase().includes(q)
        );
      })
      .map((subj) => ({
        student: st,
        subject: subj,
        evalRes: evaluateAttendance(subj.attended, subj.total, subj.minPercentage),
      }))
  );

  const atRiskRows = allStudents.flatMap((st) =>
    st.subjects
      .filter((subj) => !assignedCodes || assignedCodes.includes(subj.code))
      .map((subj) => ({
        student: st,
        subject: subj,
        evalRes: evaluateAttendance(subj.attended, subj.total, subj.minPercentage),
      }))
      .filter((r) => !r.evalRes.isEligible)
  );

  const detailStudent = allStudents.find((st) => st.id === detailStudentId) || null;

  const handleMarkSingle = (
    studentId: string,
    studentName: string,
    subjectId: string,
    subjectCode: string,
    currentAttended: number,
    currentTotal: number,
    present: boolean
  ) => {
    const res = facultyUpdateStudentAttendance({
      studentId,
      subjectId,
      newAttended: present ? currentAttended + 1 : currentAttended,
      newTotal: currentTotal + 1,
      reason: `${sessionLabel.trim() || 'Class Roll Call'} (${present ? 'Present' : 'Absent'})`,
    });
    if (!res.ok) {
      setFeedback({ ok: false, text: res.error || 'Could not record attendance.' });
      return;
    }
    setFeedback({
      ok: true,
      text: `Marked ${present ? 'PRESENT' : 'ABSENT'} for ${studentName} in ${subjectCode}. Student dashboard & audit log updated.`,
    });
  };

  const handleMarkAllPresent = () => {
    if (rollCallRows.length === 0) return;
    let updated = 0;
    rollCallRows.forEach(({ student, subject }) => {
      const res = facultyUpdateStudentAttendance({
        studentId: student.id,
        subjectId: subject.id,
        newAttended: subject.attended + 1,
        newTotal: subject.total + 1,
        reason: `${sessionLabel.trim() || 'Batch Roll Call'} (Present)`,
      });
      if (res.ok) updated += 1;
    });
    setFeedback({
      ok: true,
      text: `Batch Roll Call complete: Marked ${updated} student(s) PRESENT in ${activeRollCallCode}.`,
    });
  };

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
            <GraduationCap className="h-3.5 w-3.5" /> Faculty Verification & Attendance Control
          </span>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold">Faculty Command Portal</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Signed in as <strong>{user.fullName}</strong> • Authorized Subjects:{' '}
            <strong className="font-mono text-[#00D9FF]">
              {assignedCodes ? assignedCodes.join(', ') : 'ALL INSTITUTIONAL SUBJECTS (ADMIN)'}
            </strong>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-3.5 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
        <span>
          Role Isolation Active: Faculty can view student details, put attendance, and verify records strictly for their
          assigned subjects. Every attendance change writes to the immutable audit log.
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

      {/* 1-Click Daily Roll Call ("Put Attendance") */}
      <div className="glass-card rounded-2xl p-5 space-y-4 border-[#00D9FF]/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-[#00D9FF]" /> Put Daily Attendance (Class Roll Call)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your subject and mark Present / Absent in 1 click—updates student dashboards immediately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={activeRollCallCode}
              onChange={(e) => setRollCallCode(e.target.value)}
              className="rounded-xl bg-slate-100 dark:bg-[#080817] border border-slate-300 dark:border-violet-400/30 px-3 py-2 text-xs font-mono font-bold"
            >
              {authorizedSubjectCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <input
              value={sessionLabel}
              onChange={(e) => setSessionLabel(e.target.value)}
              placeholder="Session note (e.g., Hour 2)"
              className="rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-xs"
            />
            <button
              onClick={handleMarkAllPresent}
              disabled={rollCallRows.length === 0}
              className="neon-button inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" /> Mark All Present
            </button>
          </div>
        </div>

        {rollCallRows.length === 0 ? (
          <p className="text-xs text-slate-500">
            No students enrolled under {activeRollCallCode || 'your assigned subjects'} in demo cohort yet.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rollCallRows.map(({ student, subject, evalRes }) => (
              <div
                key={`rc-${student.id}-${subject.id}`}
                className="rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-4 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display font-bold text-sm">{student.fullName}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {student.registerNumber} • {student.heroAlias}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-mono font-extrabold text-sm ${
                        evalRes.isEligible ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {evalRes.displayPercentage}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {subject.attended}/{subject.total}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() =>
                      handleMarkSingle(
                        student.id,
                        student.fullName,
                        subject.id,
                        subject.code,
                        subject.attended,
                        subject.total,
                        true
                      )
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 py-1.5 text-xs font-bold text-emerald-500 dark:text-emerald-300 transition"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Present
                  </button>
                  <button
                    onClick={() =>
                      handleMarkSingle(
                        student.id,
                        student.fullName,
                        subject.id,
                        subject.code,
                        subject.attended,
                        subject.total,
                        false
                      )
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/35 py-1.5 text-xs font-bold text-rose-500 dark:text-rose-300 transition"
                  >
                    <MinusCircle className="h-3.5 w-3.5" /> Absent
                  </button>
                  <button
                    onClick={() => setDetailStudentId(student.id)}
                    className="rounded-xl bg-white/10 hover:bg-white/20 p-2 text-cyan-400 transition"
                    title="View student details"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      {/* Authorized Subject Attendance Records & Student Details */}
      <div className="glass-card rounded-2xl p-5 overflow-x-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-[#00D9FF]" /> Student Details & Attendance Verification
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search student, Reg No, or subject..."
              className="rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 pl-8 pr-3 py-1.5 text-xs"
            />
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 uppercase">
              <th className="py-2 pr-3">Student</th>
              <th className="py-2 pr-3">Subject</th>
              <th className="py-2 pr-3">Attended / Total</th>
              <th className="py-2 pr-3">Exact %</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2">Actions</th>
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
                <td className="py-2.5 flex items-center gap-2">
                  <button
                    onClick={() => setDetailStudentId(student.id)}
                    className="rounded-lg bg-white/10 px-2.5 py-1.5 font-bold hover:bg-white/20 transition"
                  >
                    Details
                  </button>
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
                    Verify / Edit
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
          className="neon-button px-5 py-2 text-xs font-extrabold"
        >
          Publish Announcement
        </button>
      </form>

      {/* Student Details Modal (Strictly scoped to faculty's authorized subjects) */}
      {detailStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setDetailStudentId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-3xl glass-card bg-white dark:bg-[#17152D] p-6 space-y-4 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00D9FF]">
                  Authorized Student Details
                </span>
                <h3 className="font-display text-xl font-extrabold mt-0.5">{detailStudent.fullName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  Reg No: <span className="font-mono font-bold">{detailStudent.registerNumber}</span> •{' '}
                  {detailStudent.department} • Sem {detailStudent.semesterNumber} • Alias: {detailStudent.heroAlias}
                </p>
              </div>
              <button
                onClick={() => setDetailStudentId(null)}
                className="rounded-xl bg-white/10 p-2 hover:bg-white/20 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {(() => {
              const visibleSubjects = detailStudent.subjects.filter(
                (subj) => !assignedCodes || assignedCodes.includes(subj.code)
              );
              const scopedSummary = evaluateOverallSubjects(visibleSubjects);
              return (
                <div className="space-y-3">
                  <div className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3 text-xs flex items-center justify-between">
                    <span>Standing in Your Authorized Subjects:</span>
                    <span className="font-mono font-extrabold text-[#00D9FF]">
                      {scopedSummary.overallEval.displayPercentage} ({scopedSummary.attended}/{scopedSummary.total})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {visibleSubjects.map((subj) => {
                      const ev = evaluateAttendance(subj.attended, subj.total, subj.minPercentage);
                      return (
                        <div
                          key={subj.id}
                          className="rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3 text-xs flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-bold">
                              <span className="font-mono text-[#00D9FF]">{subj.code}</span> • {subj.name}
                            </div>
                            <div className="text-slate-400">
                              {ev.attended}/{ev.total} classes •{' '}
                              {ev.isEligible
                                ? `${ev.maxSafeAbsences} safe skip(s)`
                                : `Needs ${ev.requiredRecoveryClasses} straight`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold">{ev.displayPercentage}</div>
                            <div className={ev.isEligible ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {ev.statusLabel}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Edit Attendance Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveAttendance}
            className="w-full max-w-md rounded-2xl glass-card bg-white dark:bg-[#17152D] p-6 space-y-4"
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
                className="neon-button flex-1 py-2.5 text-xs font-extrabold"
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
