import React, { useMemo } from 'react';
import { Flame, Sparkles, TrendingUp } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { generateAttendanceInsights } from '../utils/insightsEngine';

export const InsightsPage: React.FC = () => {
  const { subjects, records, odRequests, tasks, squad, survivalSummary } = useAppState();

  const insights = useMemo(
    () => generateAttendanceInsights(subjects, records, odRequests, tasks, squad),
    [subjects, records, odRequests, tasks, squad]
  );

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 px-3 py-1 text-[11px] font-bold text-cyan-500 dark:text-cyan-300">
          <Sparkles className="h-3.5 w-3.5" /> Explainable Rule-Based Intelligence
        </span>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold">AI Attendance Insights</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Computed strictly from your live attendance records, OD reconciliations, and squad tasks.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {insights.map((ins) => (
          <div key={ins.id} className="glass-card rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-bold text-base flex items-center gap-2">
                <Flame
                  className={`h-4 w-4 ${
                    ins.severity === 'CRITICAL'
                      ? 'text-rose-400'
                      : ins.severity === 'WARNING'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                />
                {ins.title}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-cyan-400">
                {ins.metricBadge}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{ins.detail}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-purple-400" /> Semester Survival Recommendations
        </h2>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
          {survivalSummary.suggestedImprovements.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
