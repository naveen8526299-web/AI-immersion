import React, { useMemo, useState } from 'react';
import { Building2, Download, Eye, EyeOff, FileText, Info, Search, ShieldCheck, Sliders } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { evaluateOverallSubjects } from '../utils/attendanceMath';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { subjects, demoCohort, odRequests, auditLogs, semester, updateSemester, reviewODRequest } = useAppState();

  const [search, setSearch] = useState('');
  const [anonymizeView, setAnonymizeView] = useState(true);

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

  if (!user || user.role !== 'ADMIN') return null;

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
                <th className="py-2">Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/5">
              {filteredStudents.map((st) => {
                const sum = evaluateOverallSubjects(st.subjects);
                return (
                  <tr key={st.id}>
                    <td className="py-2.5 pr-3 font-bold">{anonymizeView ? st.heroAlias : st.fullName}</td>
                    <td className="py-2.5 pr-3 font-mono">{anonymizeView ? `ID-${st.registerNumber.slice(-3)}` : st.registerNumber}</td>
                    <td className="py-2.5 pr-3">{st.department}</td>
                    <td className="py-2.5 pr-3 font-mono font-bold">{sum.overallEval.displayPercentage}</td>
                    <td className="py-2.5 pr-3">{sum.atRiskCount}</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 font-bold ${
                          sum.atRiskCount === 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {sum.atRiskCount === 0 ? 'All Eligible' : 'Review Required'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
    </div>
  );
};
