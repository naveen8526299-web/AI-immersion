import React, { useMemo } from 'react';
import { Activity, AlertOctagon, CalendarCheck, CheckCircle2, PlusCircle, ShieldAlert, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { HeroAvatarSVG, ThanosAdminArtwork } from '../components/HeroCharacters';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { buildRecoveryPlans } from '../utils/survivalPredictor';

export const RecoveryPage: React.FC = () => {
  const { user } = useAuth();
  const { subjects, semester, recordStudentAttendance } = useAppState();

  const plans = useMemo(() => buildRecoveryPlans(subjects, semester), [subjects, semester]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-400/30 px-3 py-1 text-[11px] font-bold text-rose-500 dark:text-rose-300">
            <Activity className="h-3.5 w-3.5" /> Smart Recovery Engine
          </span>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold">Smart Recovery Planner</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Personalized consecutive recovery schedules mapped directly onto your semester working days & timetable.
          </p>
        </div>
        <Link
          to="/od"
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-xs font-extrabold text-slate-950 self-start"
        >
          Check OD Credit Options →
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 flex flex-col items-center text-center">
          <HeroAvatarSVG heroId={user?.selectedHero || 'captain-campus'} mood="celebration" size={120} auraId={user?.equippedAura} />
          <CheckCircle2 className="mt-4 h-8 w-8 text-emerald-400" />
          <h2 className="mt-2 font-display text-2xl font-bold">Zero Subjects Below Threshold!</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300 max-w-md">
            Every subject is currently meeting its minimum attendance requirement. Keep guarding your streak or test
            what-if scenarios in the Bunk Simulator!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Cosmic Thanos Boss Banner */}
          <div className="rounded-3xl border border-purple-400/45 bg-gradient-to-r from-[#1c073a] via-[#2e1065] to-[#11183c] p-5 text-white flex flex-col sm:flex-row items-center gap-5 shadow-xl">
            <ThanosAdminArtwork size={115} />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Thanos Alert Active • {plans.length} Subject(s) Below Threshold
              </div>
              <h2 className="mt-1 font-display text-xl font-extrabold">
                Defeat Thanos by Completing Your Recovery Streak!
              </h2>
              <p className="mt-1 text-xs text-purple-200">
                Follow the exact timetable sessions below without skipping to restore your 75% hall-ticket shield.
              </p>
            </div>
          </div>

          {plans.map((plan) => {
            const stepsCount = Math.min(20, Math.max(1, plan.requiredConsecutiveClasses));
            const trajectoryData = Array.from({ length: stepsCount + 1 }, (_, step) => {
              const a = plan.subject.attended + step;
              const t = plan.subject.total + step;
              const pct = t === 0 ? 100 : Number(((a * 100) / t).toFixed(2));
              return {
                step: step === 0 ? 'Now' : `+${step}`,
                percentage: pct,
              };
            });

            return (
              <div
                key={plan.subject.id}
                className={`rounded-3xl border p-5 sm:p-6 space-y-5 ${
                  plan.isRecoveryPossible
                    ? 'glass-card border-amber-400/40'
                    : 'bg-rose-950/30 border-rose-500/50 text-white'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold rounded-md bg-rose-500/20 text-rose-400 px-2 py-0.5">
                        {plan.subject.code}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Current: {plan.currentPercentage}% ({plan.subject.attended}/{plan.subject.total}) • Target:{' '}
                        {plan.subject.minPercentage}%
                      </span>
                    </div>
                    <h2 className="mt-1 font-display text-2xl font-extrabold">{plan.subject.name}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Faculty: {plan.subject.facultyName}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-black/20 border border-white/10 p-3.5">
                      <HeroAvatarSVG
                        heroId={user?.selectedHero || 'captain-campus'}
                        mood={plan.isRecoveryPossible ? 'worried' : 'warning'}
                        size={60}
                      />
                      <p className="text-xs max-w-xs leading-relaxed">“{plan.heroAdvice}”</p>
                    </div>
                    <button
                      onClick={() => recordStudentAttendance(plan.subject.id, 'PRESENT', 'Recovery session attended')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 px-4 py-3 text-xs font-extrabold text-emerald-500 dark:text-emerald-300 transition shrink-0"
                    >
                      <PlusCircle className="h-4 w-4" /> Log Next Class (+10🪙)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3">
                    <div className="text-slate-500 dark:text-slate-400">Current Shortage</div>
                    <div className="mt-1 font-display text-xl font-bold text-rose-500">{plan.shortageClasses} classes</div>
                  </div>
                  <div className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3">
                    <div className="text-slate-500 dark:text-slate-400">Required Streak</div>
                    <div className="mt-1 font-display text-xl font-bold text-amber-400">
                      {plan.requiredConsecutiveClasses} straight
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3">
                    <div className="text-slate-500 dark:text-slate-400">Remaining Classes</div>
                    <div className="mt-1 font-display text-xl font-bold">{plan.availableRemainingClasses}</div>
                  </div>
                  <div className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3">
                    <div className="text-slate-500 dark:text-slate-400">Latest Recovery Margin</div>
                    <div className="mt-1 font-display text-xl font-bold text-cyan-400">
                      {plan.latestRecoveryMargin} miss(es)
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3">
                    <div className="text-slate-500 dark:text-slate-400">Predicted Post-Recovery</div>
                    <div className="mt-1 font-display text-xl font-bold text-emerald-400">
                      {plan.predictedFinalIfRecovered}%
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Recovery Trajectory Chart */}
                <div className="rounded-2xl bg-slate-100/60 dark:bg-black/25 border border-slate-200/70 dark:border-white/10 p-4">
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      Step-by-Step Recovery Trajectory (Next {stepsCount} Consecutive Classes)
                    </span>
                    <span className="text-slate-400">Dashed line = {plan.subject.minPercentage}% target</span>
                  </div>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trajectoryData}>
                        <defs>
                          <linearGradient id={`recFill-${plan.subject.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                        <XAxis dataKey="step" stroke="#94a3b8" fontSize={11} />
                        <YAxis domain={['auto', 100]} stroke="#94a3b8" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: 'rgba(16,185,129,0.4)',
                            borderRadius: '10px',
                            color: '#f8fafc',
                            fontSize: '12px',
                          }}
                        />
                        <ReferenceLine y={plan.subject.minPercentage} stroke="#f43f5e" strokeDasharray="4 4" />
                        <Area
                          type="monotone"
                          dataKey="percentage"
                          name="Attendance %"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fill={`url(#recFill-${plan.subject.id})`}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {!plan.isRecoveryPossible && (
                  <div className="rounded-2xl bg-rose-500/20 border border-rose-400/50 p-4 flex items-start gap-3 text-xs text-rose-100">
                    <AlertOctagon className="h-5 w-5 text-rose-300 shrink-0" />
                    <div>
                      <div className="font-bold text-sm">Mathematically Impossible Under Current Remaining Classes</div>
                      <p className="mt-1">
                        You need {plan.requiredConsecutiveClasses} consecutive classes, but only{' '}
                        {plan.availableRemainingClasses} classes remain. Please contact {plan.subject.facultyName} or the
                        college administration immediately to verify pending On-Duty credits or remedial sessions.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    <CalendarCheck className="h-4 w-4 text-emerald-400" />
                    Personalized Recovery Timetable Schedule ({plan.scheduledDates.length} sessions mapped)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {plan.scheduledDates.map((dateIso, idx) => (
                      <span
                        key={`${dateIso}-${idx}`}
                        className="rounded-xl bg-emerald-500/15 border border-emerald-400/30 px-3 py-1.5 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-300"
                      >
                        #{idx + 1} • {dateIso}
                      </span>
                    ))}
                    {plan.scheduledDates.length < plan.requiredConsecutiveClasses && (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-rose-500/15 border border-rose-400/30 px-3 py-1.5 text-xs font-bold text-rose-400">
                        <ShieldAlert className="h-3.5 w-3.5" /> Exceeds remaining semester dates
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
