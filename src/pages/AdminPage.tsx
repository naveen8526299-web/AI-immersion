import React, { useMemo, useState } from 'react';
import {
  BellRing,
  Building2,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileText,
  Info,
  KeyRound,
  Lock,
  Megaphone,
  Plus,
  Search,
  ShieldCheck,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Unlock,
  UserPlus,
  X,
} from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { AppNotification, FeatureControlFlags } from '../types';
import { evaluateAttendance, evaluateOverallSubjects } from '../utils/attendanceMath';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const {
    subjects,
    demoCohort,
    odRequests,
    auditLogs,
    semester,
    featureControls,
    updateSemester,
    updateFeatureControls,
    adminAddStudent,
    adminBroadcastNotification,
    facultyUpdateStudentAttendance,
    reviewODRequest,
  } = useAppState();

  const [search, setSearch] = useState('');
  const [anonymizeView, setAnonymizeView] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [dossierReason, setDossierReason] = useState('Official Admin roll-call update');

  // Enroll Student form state
  const [enrollName, setEnrollName] = useState('');
  const [enrollReg, setEnrollReg] = useState('');
  const [enrollDept, setEnrollDept] = useState('CSE (CoE AI)');
  const [enrollSem, setEnrollSem] = useState(5);
  const [enrollAlias, setEnrollAlias] = useState('');
  const [enrollFeedback, setEnrollFeedback] = useState<string | null>(null);

  // Official Notification Broadcast state
  const [notifTarget, setNotifTarget] = useState<'ALL' | 'AT_RISK'>('ALL');
  const [notifCategory, setNotifCategory] = useState<AppNotification['category']>('ANNOUNCEMENT');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  const allStudents = useMemo(
    () => [
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
    [subjects, demoCohort]
  );

  const filteredStudents = allStudents.filter((s) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.heroAlias.toLowerCase().includes(q) ||
      s.registerNumber.toLowerCase().includes(q)
    );
  });

  const selectedStudent = useMemo(
    () => allStudents.find((s) => s.id === selectedStudentId) || null,
    [allStudents, selectedStudentId]
  );

  if (!user || user.role !== 'ADMIN') return null;

  const handleEnrollStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminAddStudent({
      fullName: enrollName,
      registerNumber: enrollReg,
      department: enrollDept,
      semesterNumber: enrollSem,
      heroAlias: enrollAlias,
    });
    if (!res.ok) {
      setEnrollFeedback(res.error || 'Could not enroll student.');
      return;
    }
    setEnrollFeedback(`Enrolled ${enrollName.trim()} (${enrollReg.trim().toUpperCase()}) into college directory.`);
    setEnrollName('');
    setEnrollReg('');
    setEnrollAlias('');
  };

  const handleBroadcastNotification = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminBroadcastNotification({
      target: notifTarget,
      category: notifCategory,
      title: notifTitle,
      message: notifMessage,
    });
    if (!res.ok) {
      setNotifFeedback(res.error || 'Could not dispatch notification.');
      return;
    }
    setNotifFeedback(`Official circular sent to ${notifTarget === 'ALL' ? 'all enrolled students' : 'at-risk students (<75%)'}.`);
    setNotifTitle('');
    setNotifMessage('');
  };

  const featureToggleRows: Array<{
    key: keyof FeatureControlFlags;
    label: string;
    desc: string;
    invertedDanger?: boolean;
  }> = [
    {
      key: 'studentSelfAttendanceLocked',
      label: 'Lock Student Self-Attendance Editing',
      desc: 'Recommended for official ERP mode: only Faculty and Admin can mark or edit student attendance.',
      invertedDanger: true,
    },
    {
      key: 'allowStudentSubjectManagement',
      label: 'Allow Student Subject Add / Edit / Delete',
      desc: 'When OFF, college curriculum subjects are fixed by Administration.',
    },
    {
      key: 'allowBunkSimulator',
      label: 'Enable Bunk & Survival Simulator',
      desc: 'Allows students to run non-destructive What-If scenarios without altering official counts.',
    },
    {
      key: 'allowODRequests',
      label: 'Enable Student OD / Leave Requests',
      desc: 'Allows students to submit On-Duty claims for Faculty/Admin verification.',
    },
    {
      key: 'allowSquadConnect',
      label: 'Enable Squad Connect',
      desc: 'Privacy-safe peer accountability module for students.',
    },
    {
      key: 'allowHeroGamification',
      label: 'Enable Hero Companions, Armory & XP',
      desc: 'Controls cosmic mascot companions, badges, and reward shop visibility.',
    },
  ];

  const exportInstitutionalReport = () => {
    const header = 'RegisterNo,Alias,OverallPct,SafeSubjects,AtRiskSubjects\n';
    const rows = allStudents
      .map((st) => {
        const sum = evaluateOverallSubjects(st.subjects);
        return `${st.registerNumber},${st.heroAlias},${sum.overallEval.displayPercentage},${sum.safeCount},${sum.atRiskCount}`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendanceguard-admin-eligibility-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-400/30 px-3 py-1 text-[11px] font-bold text-purple-400">
            <Building2 className="h-3.5 w-3.5" /> Institutional Administration Portal
          </span>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold">College Administration Command</h1>
        </div>
        <button
          onClick={exportInstitutionalReport}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-xs font-extrabold text-slate-950 self-start"
        >
          <Download className="h-4 w-4" /> Export Eligibility CSV
        </button>
      </div>

      <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-3.5 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
        <span>
          Simulated Institutional Mode: Demonstrates college-wide eligibility reporting, rule configuration, OD
          governance, and immutable audit logs. Live ERP synchronization requires authorized college API / Supabase deployment.
        </span>
      </div>

      {/* Website Feature Access Control */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              {featureControls.studentSelfAttendanceLocked ? (
                <Lock className="h-4 w-4 text-emerald-400" />
              ) : (
                <Unlock className="h-4 w-4 text-amber-400" />
              )}
              Website Feature Access Control (Admin Only)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control student permissions across the college portal in real time. Every change is logged to the audit trail.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold self-start ${
              featureControls.studentSelfAttendanceLocked
                ? 'bg-emerald-500/15 border border-emerald-400/35 text-emerald-500 dark:text-emerald-300'
                : 'bg-amber-500/15 border border-amber-400/35 text-amber-500 dark:text-amber-300'
            }`}
          >
            {featureControls.studentSelfAttendanceLocked ? 'Strict ERP Lock Active' : 'Student Self-Edit Open'}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-3 text-xs">
          {featureToggleRows.map((item) => {
            const active = featureControls[item.key];
            return (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-3.5"
              >
                <div>
                  <div className="font-bold text-slate-800 dark:text-white">{item.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateFeatureControls({ [item.key]: !active })}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold shrink-0 transition ${
                    active
                      ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-600 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/15 text-slate-500 dark:text-slate-300'
                  }`}
                >
                  {active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  {active ? 'ON' : 'OFF'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enroll New Student + Official Notification Broadcast */}
      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={handleEnrollStudent} className="glass-card rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#00D9FF]" /> Enroll Student into College Registry
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Student Full Name</label>
              <input
                required
                value={enrollName}
                onChange={(e) => setEnrollName(e.target.value)}
                placeholder="e.g. Kavya Sundaram"
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Register Number</label>
              <input
                required
                value={enrollReg}
                onChange={(e) => setEnrollReg(e.target.value)}
                placeholder="e.g. 22CSE118"
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Department</label>
              <input
                required
                value={enrollDept}
                onChange={(e) => setEnrollDept(e.target.value)}
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Semester & Optional Alias</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={enrollSem}
                  onChange={(e) => setEnrollSem(Math.max(1, Math.min(8, Number(e.target.value))))}
                  className="rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-2.5 py-2 font-mono font-bold"
                />
                <input
                  value={enrollAlias}
                  onChange={(e) => setEnrollAlias(e.target.value)}
                  placeholder="Alias"
                  className="col-span-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-2.5 py-2"
                />
              </div>
            </div>
          </div>
          {enrollFeedback && (
            <div className="rounded-xl bg-cyan-500/10 border border-cyan-400/30 px-3 py-2 text-xs text-cyan-600 dark:text-cyan-300">
              {enrollFeedback}
            </div>
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#1677FF] px-4 py-2.5 text-xs font-extrabold text-slate-950 hover:brightness-110 transition"
          >
            <Plus className="h-4 w-4" /> Add Student & Assign Subjects
          </button>
        </form>

        <form onSubmit={handleBroadcastNotification} className="glass-card rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-[#FFC857]" /> Official College Notification Broadcast
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Target Audience</label>
              <select
                value={notifTarget}
                onChange={(e) => setNotifTarget(e.target.value as 'ALL' | 'AT_RISK')}
                className="w-full rounded-xl bg-slate-100 dark:bg-[#17152D] border border-slate-300 dark:border-white/15 px-3 py-2 font-semibold"
              >
                <option value="ALL">All Enrolled Students</option>
                <option value="AT_RISK">At-Risk Students (&lt; 75% Attendance)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Notice Category</label>
              <select
                value={notifCategory}
                onChange={(e) => setNotifCategory(e.target.value as AppNotification['category'])}
                className="w-full rounded-xl bg-slate-100 dark:bg-[#17152D] border border-slate-300 dark:border-white/15 px-3 py-2 font-semibold"
              >
                <option value="ANNOUNCEMENT">Official College Circular</option>
                <option value="WARNING">Thanos Detention Warning</option>
                <option value="EXAM">Exam / Hall Ticket Notice</option>
                <option value="RECOVERY">Mandatory Recovery Notice</option>
              </select>
            </div>
          </div>
          <div className="space-y-2.5 text-xs">
            <input
              required
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              placeholder="Circular Title (e.g. End-Semester Hall Ticket Cut-off Notice)"
              className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2"
            />
            <textarea
              required
              rows={2}
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Official message delivered to Student Notification Center..."
              className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2"
            />
          </div>
          {notifFeedback && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-400/30 px-3 py-2 text-xs text-amber-600 dark:text-amber-300">
              {notifFeedback}
            </div>
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8138F5] to-[#1677FF] px-4 py-2.5 text-xs font-extrabold text-white hover:brightness-110 transition"
          >
            <BellRing className="h-4 w-4" /> Send College Notification
          </button>
        </form>
      </div>

      {/* Institutional Rules Configuration */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Sliders className="h-4 w-4 text-cyan-400" /> Institutional Attendance & OD Rules
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Default Minimum Attendance (%)</label>
            <input
              type="number"
              min={50}
              max={95}
              value={semester.defaultMinPercentage}
              onChange={(e) => updateSemester({ defaultMinPercentage: Math.max(50, Math.min(95, Number(e.target.value))) })}
              className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 font-mono font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Semester Title</label>
            <input
              value={semester.semesterName}
              onChange={(e) => updateSemester({ semesterName: e.target.value })}
              className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => updateSemester({ allowODAutoReconcileOnApproval: !semester.allowODAutoReconcileOnApproval })}
              className="w-full rounded-xl bg-emerald-500/15 border border-emerald-400/30 py-2 font-bold text-emerald-400"
            >
              Auto-Reconcile Approved ODs: {semester.allowODAutoReconcileOnApproval ? 'ENABLED' : 'MANUAL'}
            </button>
          </div>
        </div>
      </div>

      {/* Student Search & Eligibility Report */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Student Eligibility Reports</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student / reg no..."
                className="rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 pl-8 pr-3 py-1.5 text-xs"
              />
            </div>
            <button
              onClick={() => setAnonymizeView(!anonymizeView)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold"
            >
              {anonymizeView ? <EyeOff className="h-3.5 w-3.5 text-cyan-400" /> : <Eye className="h-3.5 w-3.5" />}
              {anonymizeView ? 'Anonymized' : 'Full Names'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 uppercase">
                <th className="py-2 pr-3">Identity</th>
                <th className="py-2 pr-3">Reg No</th>
                <th className="py-2 pr-3">Department</th>
                <th className="py-2 pr-3">Overall %</th>
                <th className="py-2 pr-3">At-Risk Subjects</th>
                <th className="py-2 pr-3">Eligibility</th>
                <th className="py-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/5">
              {filteredStudents.map((st) => {
                const sum = evaluateOverallSubjects(st.subjects);
                return (
                  <tr key={st.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5 transition">
                    <td className="py-2.5 pr-3 font-bold">{anonymizeView ? st.heroAlias : st.fullName}</td>
                    <td className="py-2.5 pr-3 font-mono">{anonymizeView ? `ID-${st.registerNumber.slice(-3)}` : st.registerNumber}</td>
                    <td className="py-2.5 pr-3">{st.department}</td>
                    <td className="py-2.5 pr-3 font-mono font-bold">{sum.overallEval.displayPercentage}</td>
                    <td className="py-2.5 pr-3">{sum.atRiskCount}</td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 font-bold ${
                          sum.atRiskCount === 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {sum.atRiskCount === 0 ? 'All Eligible' : 'Review Required'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => setSelectedStudentId(st.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#00D9FF]/15 border border-[#00D9FF]/35 px-2.5 py-1 text-[11px] font-bold text-cyan-600 dark:text-[#00D9FF] hover:bg-[#00D9FF]/25 transition"
                      >
                        View Subjects <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Account Provisioning Guide */}
      <div className="glass-card rounded-2xl p-5 space-y-2 text-xs">
        <h2 className="font-display text-base font-bold flex items-center gap-2 text-[#FFC857]">
          <KeyRound className="h-4 w-4" /> Creating a Real Institutional Admin Account (Supabase Production)
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          For security, public sign-up on <code className="font-mono">/register</code> only creates <strong>STUDENT</strong> accounts. To promote a real college administrator in Supabase:
        </p>
        <pre className="rounded-xl bg-[#080817] border border-violet-400/25 p-3 font-mono text-[11px] text-[#00D9FF] overflow-x-auto">
{`-- 1. Create the user in Supabase Auth (Dashboard -> Authentication -> Users -> Add User)
-- 2. Run in Supabase SQL Editor to grant ADMIN role:
INSERT INTO public.profiles (id, email, full_name, hero_alias, role)
SELECT id, email, 'College Admin', 'AdminCommand', 'ADMIN'
FROM auth.users WHERE email = 'admin@yourcollege.edu'
ON CONFLICT (id) DO UPDATE SET role = 'ADMIN';`}
        </pre>
      </div>

      {/* Pending OD Governance */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Institutional OD Governance
        </h2>
        {odRequests.map((od) => (
          <div
            key={od.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-slate-100/80 dark:bg-white/5 px-4 py-3 text-xs"
          >
            <div>
              <strong>{od.eventName}</strong> ({od.eventType}) — {od.studentAlias} • Status:{' '}
              <span className="font-bold">{od.status}</span>
            </div>
            {od.status === 'PENDING' && (
              <div className="flex gap-2">
                <button
                  onClick={() => reviewODRequest(od.id, 'APPROVED', 'Admin approved')}
                  className="rounded-lg bg-emerald-500 px-3 py-1 font-bold text-slate-950"
                >
                  Approve
                </button>
                <button
                  onClick={() => reviewODRequest(od.id, 'REJECTED', 'Admin rejected')}
                  className="rounded-lg bg-rose-600 px-3 py-1 font-bold text-white"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Immutable Audit Logs */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-purple-400" /> Audit History Trail
        </h2>
        <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="rounded-xl bg-slate-100/80 dark:bg-white/5 px-3.5 py-2.5">
              <div className="flex items-center justify-between font-bold">
                <span>
                  {log.action} • {log.targetType} ({log.targetId})
                </span>
                <span className="text-[11px] font-normal text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <div className="text-slate-500 dark:text-slate-300 mt-0.5">
                By {log.actorName} ({log.actorRole}) • Reason: {log.reason}
              </div>
              {log.previousValue && (
                <div className="font-mono text-[11px] text-cyan-400 mt-0.5">
                  {log.previousValue} → {log.newValue}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Student Subject-Wise Detail Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedStudentId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl glass-card bg-white dark:bg-[#17152D] p-6 space-y-4 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00D9FF]">
                  Student Attendance Dossier
                </span>
                <h3 className="font-display text-xl font-extrabold mt-0.5">
                  {anonymizeView ? selectedStudent.heroAlias : selectedStudent.fullName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  Reg No:{' '}
                  <span className="font-mono">
                    {anonymizeView ? `ID-${selectedStudent.registerNumber.slice(-3)}` : selectedStudent.registerNumber}
                  </span>{' '}
                  • {selectedStudent.department} • Sem {selectedStudent.semesterNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentId(null)}
                className="rounded-xl bg-white/10 p-2 hover:bg-white/20 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Admin Direct Attendance Override Reason:
              </span>
              <input
                value={dossierReason}
                onChange={(e) => setDossierReason(e.target.value)}
                placeholder="Reason logged to student ledger..."
                className="sm:w-72 rounded-lg bg-white dark:bg-[#080817] border border-slate-300 dark:border-white/15 px-2.5 py-1 text-xs"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 uppercase">
                    <th className="py-2 pr-3">Code</th>
                    <th className="py-2 pr-3">Subject</th>
                    <th className="py-2 pr-3">Attended / Total</th>
                    <th className="py-2 pr-3">Exact %</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Margin / Recovery</th>
                    <th className="py-2">Admin Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-white/5">
                  {selectedStudent.subjects.map((subj) => {
                    const ev = evaluateAttendance(subj.attended, subj.total, subj.minPercentage);
                    return (
                      <tr key={subj.id}>
                        <td className="py-2.5 pr-3 font-mono font-bold text-[#00D9FF]">{subj.code}</td>
                        <td className="py-2.5 pr-3">
                          <div className="font-semibold">{subj.name}</div>
                          <div className="text-[11px] text-slate-400">{subj.facultyName}</div>
                        </td>
                        <td className="py-2.5 pr-3 font-mono">
                          {ev.attended} / {ev.total}
                        </td>
                        <td className="py-2.5 pr-3 font-mono font-bold">{ev.displayPercentage}</td>
                        <td className="py-2.5 pr-3">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 font-bold ${
                              ev.isEligible ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {ev.statusLabel}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-300">
                          {ev.isEligible
                            ? `${ev.maxSafeAbsences} safe skip(s)`
                            : `Attend ${ev.requiredRecoveryClasses} straight`}
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                facultyUpdateStudentAttendance({
                                  studentId: selectedStudent.id,
                                  subjectId: subj.id,
                                  newAttended: subj.attended + 1,
                                  newTotal: subj.total + 1,
                                  reason: dossierReason.trim() || 'Admin roll call: Present',
                                })
                              }
                              className="rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/35 px-2 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-300 transition"
                            >
                              +Present
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                facultyUpdateStudentAttendance({
                                  studentId: selectedStudent.id,
                                  subjectId: subj.id,
                                  newAttended: subj.attended,
                                  newTotal: subj.total + 1,
                                  reason: dossierReason.trim() || 'Admin roll call: Absent',
                                })
                              }
                              className="rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/35 px-2 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-300 transition"
                            >
                              +Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
