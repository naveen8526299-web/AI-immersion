import React from 'react';
import { AlertTriangle, CheckCircle2, Compass, Info, ShieldAlert, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppState } from '../contexts/AppStateContext';

export const PredictorPage: React.FC = () => {
  const { survivalSummary, semester } = useAppState();

  const zoneStyles = {
    GREEN: {
      bg: 'from-emerald-500/20 to-cyan-500/10 border-emerald-400/40',
      badge: 'bg-emerald-500 text-slate-950',
      label: 'GREEN — Comfortably Eligible',
    },
    YELLOW: {
      bg: 'from-amber-500/20 to-orange-500/10 border-amber-400/40',
      badge: 'bg-amber-400 text-slate-950',
      label: 'YELLOW — Attend Carefully to Stay Eligible',
    },
    RED: {
      bg: 'from-rose-500/20 to-purple-500/10 border-rose-500/40',
      badge: 'bg-rose-500 text-white',
      label: 'RED — Recovery Shortfall Under Current Assumptions',
    },
  }[survivalSummary.overallZone];

  const radarChartData = survivalSummary.subjectPredictions.map((sp) => ({
    code: sp.subject.code,
    current: Number(sp.currentEval.exactPercentage.toFixed(1)),
    maxPossible: Number(sp.maxPossiblePercentage.toFixed(1)),
    required: sp.subject.minPercentage,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-400/30 px-3 py-1 text-[11px] font-bold text-purple-600 dark:text-purple-300">
            <Compass className="h-3.5 w-3.5" /> Core Predictive Engine
          </span>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold">
            AI Hall Ticket Survival Predictor & Radar
          </h1>
        </div>
        <Link
          to="/semester"
          className="rounded-xl bg-slate-200 dark:bg-white/10 px-4 py-2 text-xs font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition self-start"
        >
          Configure Remaining Classes & Holidays →
        </Link>
      </div>

      {/* Survival Score & Visual Radar */}
      <div className={`rounded-3xl border bg-gradient-to-br ${zoneStyles.bg} p-6 grid lg:grid-cols-12 gap-6 items-center`}>
        <div className="lg:col-span-5 flex flex-col items-center text-center">
          {/* SVG Animated Survival Radar Ring */}
          <div className="relative flex items-center justify-center h-48 w-48">
            <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
              <circle cx="70" cy="70" r="56" stroke="rgba(148,163,184,0.2)" strokeWidth="12" fill="none" />
              <circle
                cx="70"
                cy="70"
                r="56"
                stroke={
                  survivalSummary.overallZone === 'GREEN'
                    ? '#10b981'
                    : survivalSummary.overallZone === 'YELLOW'
                    ? '#f59e0b'
                    : '#f43f5e'
                }
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${(survivalSummary.survivalScore / 100) * 351.8} 351.8`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                Survival Score
              </span>
              <span className="font-display text-4xl font-extrabold">{survivalSummary.survivalScore}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>

          <span className={`mt-2 rounded-full px-3.5 py-1 text-xs font-extrabold ${zoneStyles.badge}`}>
            {zoneStyles.label}
          </span>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-white/70 dark:bg-black/30 p-3">
              <div className="text-slate-500 dark:text-slate-400">Exam Date</div>
              <div className="mt-1 font-bold">{semester.examDate}</div>
              <div className="text-[11px] text-cyan-500">{survivalSummary.daysUntilExam} days left</div>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-black/30 p-3">
              <div className="text-slate-500 dark:text-slate-400">Working Days Left</div>
              <div className="mt-1 font-bold">{survivalSummary.remainingWorkingDays} days</div>
              <div className="text-[11px] text-slate-400">Excludes weekends & holidays</div>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-black/30 p-3">
              <div className="text-slate-500 dark:text-slate-400">Remaining Classes</div>
              <div className="mt-1 font-bold">{survivalSummary.totalRemainingClasses} periods</div>
              <div className="text-[11px] text-slate-400">Across {survivalSummary.subjectPredictions.length} subjects</div>
            </div>
          </div>

          {/* Transparent Score Breakdown */}
          <div className="rounded-2xl bg-white/70 dark:bg-black/30 p-4 text-xs space-y-2">
            <div className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
              Transparent Score Breakdown
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>Eligibility: {survivalSummary.scoreBreakdown.eligibilityPoints}/40</div>
              <div>Feasibility: {survivalSummary.scoreBreakdown.recoveryFeasibilityPoints}/25</div>
              <div>Buffer: {survivalSummary.scoreBreakdown.bufferPoints}/20</div>
              <div>Runway: {survivalSummary.scoreBreakdown.examProximityPoints}/10</div>
              <div>Tasks: {survivalSummary.scoreBreakdown.obligationPoints}/5</div>
            </div>
          </div>

          <div className="space-y-1.5">
            {survivalSummary.suggestedImprovements.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current vs Max Possible Chart */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-display text-lg font-bold mb-1">Current vs. Maximum Achievable Semester-End %</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Assumes attending all remaining configured classes for each subject.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={radarChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
              <XAxis dataKey="code" stroke="#94a3b8" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: 'rgba(56,189,248,0.35)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="current" name="Current %" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="maxPossible" name="Max Semester-End %" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject-wise Examination Eligibility Table */}
      <div className="glass-card rounded-2xl p-5 overflow-x-auto">
        <h2 className="font-display text-lg font-bold mb-4">Subject-Wise Examination Survival Forecast</h2>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 uppercase">
              <th className="py-2 pr-3">Subject</th>
              <th className="py-2 pr-3">Current</th>
              <th className="py-2 pr-3">OD Credits</th>
              <th className="py-2 pr-3">Remaining</th>
              <th className="py-2 pr-3">Max End %</th>
              <th className="py-2 pr-3">Min Future Needed</th>
              <th className="py-2 pr-3">Future Buffer</th>
              <th className="py-2 pr-3">Zone</th>
              <th className="py-2">Action Plan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-white/5">
            {survivalSummary.subjectPredictions.map((sp) => (
              <tr key={sp.subject.id}>
                <td className="py-3 pr-3 font-bold">
                  {sp.subject.code}
                  <div className="font-normal text-slate-500">{sp.subject.name}</div>
                </td>
                <td className="py-3 pr-3 font-mono">{sp.currentEval.displayPercentage}</td>
                <td className="py-3 pr-3">
                  <span className="text-emerald-500 font-semibold">{sp.approvedODCredits} app</span>
                  {sp.pendingODCredits > 0 && (
                    <span className="text-amber-400 block">{sp.pendingODCredits} pend</span>
                  )}
                </td>
                <td className="py-3 pr-3">{sp.remainingClasses}</td>
                <td className="py-3 pr-3 font-mono">{sp.maxPossiblePercentage.toFixed(2)}%</td>
                <td className="py-3 pr-3 font-bold">{sp.minFutureClassesNeeded}</td>
                <td className="py-3 pr-3 font-bold">{sp.maxFutureAbsencesAllowed}</td>
                <td className="py-3 pr-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold ${
                      sp.zone === 'GREEN'
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : sp.zone === 'YELLOW'
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-rose-500/15 text-rose-500'
                    }`}
                  >
                    {sp.zone === 'GREEN' ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : sp.zone === 'YELLOW' ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <ShieldAlert className="h-3 w-3" />
                    )}
                    {sp.zone}
                  </span>
                </td>
                <td className="py-3 max-w-xs text-slate-600 dark:text-slate-300">{sp.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explicit Planning Disclaimer */}
      <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
        <span>{survivalSummary.disclaimer}</span>
      </div>
    </div>
  );
};
