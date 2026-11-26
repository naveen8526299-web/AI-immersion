import React, { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Compass,
  Flame,
  Shield,
  Skull,
  Sliders,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RotatingGoldenShield, SpinningGoldCoin } from '../components/CosmicBadges';
import { HeroAvatarSVG, ThanosAdminArtwork } from '../components/HeroCharacters';
import { SubjectCard } from '../components/SubjectCard';
import { TodayScheduleCard } from '../components/TodayScheduleCard';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { evaluateAttendance } from '../utils/attendanceMath';
import { HEROES } from '../utils/dialogueEngine';
import { getLevelInfo } from '../utils/gamification';
import { generateAttendanceInsights } from '../utils/insightsEngine';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const {
    subjects,
    records,
    odRequests,
    tasks,
    squad,
    preferences,
    heroMood,
    heroMessage,
    overallSummary,
    survivalSummary,
    recordStudentAttendance,
    triggerThanosAlert,
    updatePreferences,
  } = useAppState();

  const levelInfo = getLevelInfo(user?.xp || 0);
  const heroMeta = HEROES[user?.selectedHero || 'captain-campus'];
  const pendingODs = odRequests.filter((o) => o.status === 'PENDING');
  const upcomingTasks = tasks.filter((t) => t.status !== 'COMPLETED').slice(0, 4);
  const insights = useMemo(
    () => generateAttendanceInsights(subjects, records, odRequests, tasks, squad),
    [subjects, records, odRequests, tasks, squad]
  );

  // Build subject-wise & cumulative trend data for Recharts
  const chartData = useMemo(
    () =>
      subjects.map((s) => ({
        code: s.code,
        attendance: s.total === 0 ? 100 : Number(((s.attended * 100) / s.total).toFixed(2)),
        required: s.minPercentage,
      })),
    [subjects]
  );

  if (!user) return null;

  // Faculty or Admin quick redirect banner if they visit /dashboard
  if (user.role !== 'STUDENT') {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="rounded-full bg-electric-500/15 px-3 py-1 text-xs font-bold text-electric-500 dark:text-cyan-300">
              {user.role} WORKSPACE
            </span>
            <h1 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold">Welcome, {user.fullName}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Jump directly to your dedicated {user.role === 'FACULTY' ? 'Faculty Verification & OD Portal' : 'College Administration Command Center'}.
            </p>
          </div>
          <Link
            to={user.role === 'FACULTY' ? '/faculty' : '/admin'}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-electric-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg"
          >
            Open {user.role === 'FACULTY' ? 'Faculty Portal' : 'Admin Dashboard'} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-violet-400/30 bg-gradient-to-br from-[#17152D] via-[#1b1240] to-[#101027] p-5 sm:p-7 text-[#F8FAFF] shadow-[0_18px_48px_rgba(129,56,245,0.25)]">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#8138F5]/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-[#00D9FF]/15 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="shrink-0">
              <HeroAvatarSVG heroId={user.selectedHero} mood={heroMood} size={96} auraId={user.equippedAura} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-400/20 border border-cyan-300/30 px-2.5 py-0.5 text-[11px] font-bold text-cyan-200">
                  {heroMeta.name} • {heroMeta.roleTitle}
                </span>
                <span className="rounded-full bg-amber-400/20 border border-amber-300/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-200">
                  Lv.{levelInfo.level} {levelInfo.title}
                </span>
              </div>
              <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user.fullName} <span className="text-cyan-300">({user.heroAlias})</span>
              </h1>
              <p className="mt-1.5 text-sm text-slate-200 max-w-2xl">“{heroMessage}”</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/simulator"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2.5 text-xs font-bold transition"
            >
              <Sliders className="h-4 w-4 text-cyan-300" /> Bunk Simulator
            </Link>
            <Link
              to="/predictor"
              className="neon-button inline-flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold"
            >
              <Compass className="h-4 w-4 text-[#00D9FF]" /> Hall Ticket Predictor
            </Link>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="relative mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#FFC857]">
              <SpinningGoldCoin size={18} /> {user.coins} Coins
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-[#00D9FF]">
              <Zap className="h-4 w-4" /> {user.xp} XP
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-[#FF9F43]">
              <Flame className="h-4 w-4" /> {user.dailyStreak}-Day Streak
            </span>
            {overallSummary.shieldCount > 0 && (
              <span className="inline-flex items-center gap-1.5 font-bold text-[#FFC857]">
                <RotatingGoldenShield size={22} active /> {overallSummary.shieldCount} Shield
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <span className="text-slate-300 whitespace-nowrap">Next Level: {levelInfo.progressPercent}%</span>
            <div className="h-2.5 flex-1 rounded-full bg-[#080817]/80 border border-violet-400/20 overflow-hidden">
              <div
                className="h-full rounded-full progress-glow-sheen bg-gradient-to-r from-[#FFC857] via-[#00D9FF] to-[#8138F5] transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Thanos Below-75% Danger Alert Banner (shown whenever any subject or overall attendance is below threshold) */}
      {(overallSummary.atRiskCount > 0 || !overallSummary.overallEval.isEligible) && (() => {
        const atRiskList = subjects
          .map((s) => ({ s, ev: evaluateAttendance(s.attended, s.total, s.minPercentage) }))
          .filter((x) => !x.ev.isEligible);
        const primaryRisk = atRiskList[0];
        return (
          <section className="relative overflow-hidden rounded-3xl border border-purple-400/50 bg-gradient-to-r from-[#1c073a] via-[#340f5e] to-[#280b3b] p-5 sm:p-6 text-white shadow-[0_0_40px_rgba(168,85,247,0.35)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <ThanosAdminArtwork size={120} />
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/25 border border-rose-400/50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-200">
                    <Skull className="h-3.5 w-3.5" /> Thanos Warning • Attendance Below Threshold
                  </span>
                  <h2 className="mt-2 font-display text-xl sm:text-2xl font-extrabold text-amber-200">
                    “Attendance Below 75%? Your Hall Ticket Is In Danger!”
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-purple-100/90 max-w-2xl">
                    {atRiskList.length > 0
                      ? `At-risk subject(s): ${atRiskList
                          .map((x) => `${x.s.code} (${x.ev.displayPercentage} — ${x.ev.requiredRecoveryClasses} recovery classes)`)
                          .join(', ')}.`
                      : `Overall attendance is ${overallSummary.overallEval.displayPercentage}, below 75%.`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
                <Link
                  to="/recovery"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg hover:brightness-110 transition"
                >
                  Open Recovery Plan <ArrowRight className="h-4 w-4" />
                </Link>
                {primaryRisk && (
                  <button
                    onClick={() =>
                      triggerThanosAlert(
                        {
                          subjectCode: primaryRisk.s.code,
                          subjectName: primaryRisk.s.name,
                          percentage: primaryRisk.ev.exactPercentage,
                          requiredPercentage: primaryRisk.s.minPercentage,
                          recoveryNeeded: primaryRisk.ev.requiredRecoveryClasses,
                          isSimulation: false,
                        },
                        true
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-purple-300/30 px-4 py-2 text-xs font-bold text-purple-100 transition"
                  >
                    Summon Full Thanos Alert
                  </button>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Today's College Timetable & 1-Tap Daily Check-In */}
      <TodayScheduleCard />

      {/* Primary KPI Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Overall Attendance</span>
            <Shield className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-extrabold">
            {overallSummary.overallEval.displayPercentage}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {overallSummary.attended} / {overallSummary.total} classes • {user.classesAttendedToday} today
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Hall Ticket Survival Score</span>
            <Compass className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-extrabold">{survivalSummary.survivalScore}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                survivalSummary.overallZone === 'GREEN'
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : survivalSummary.overallZone === 'YELLOW'
                  ? 'bg-amber-500/15 text-amber-500'
                  : 'bg-rose-500/15 text-rose-500'
              }`}
            >
              {survivalSummary.overallZone} ZONE
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Internal planning indicator</div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Semester Countdown</span>
            <Calendar className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-extrabold">
            {survivalSummary.daysUntilExam} <span className="text-sm font-semibold text-slate-400">days</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {survivalSummary.remainingWorkingDays} working days • {survivalSummary.totalRemainingClasses} classes left
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Subject Breakdown</span>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-center gap-3 text-sm font-bold">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> {overallSummary.safeCount} Safe
            </span>
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" /> {overallSummary.borderlineCount} Edge
            </span>
            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <Skull className="h-4 w-4" /> {overallSummary.atRiskCount} Risk
            </span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {pendingODs.length} pending OD • {overallSummary.shieldCount} 100% Shield(s)
          </div>
        </div>
      </section>

      {/* Customizable Widgets Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-500 dark:text-slate-400">Dashboard Widgets:</span>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['showTrendChart', 'Attendance Chart'],
              ['showQuickInsights', 'AI Insights'],
              ['showUpcomingTasks', 'Tasks'],
              ['showSquadFeed', 'Squad & OD'],
            ] as const
          ).map(([key, label]) => {
            const active = preferences.dashboardWidgets[key];
            return (
              <button
                key={key}
                onClick={() =>
                  updatePreferences({
                    dashboardWidgets: { ...preferences.dashboardWidgets, [key]: !active },
                  })
                }
                className={`rounded-lg px-2.5 py-1 font-semibold border transition ${
                  active
                    ? 'bg-electric-500/15 border-electric-400/40 text-electric-600 dark:text-cyan-300'
                    : 'bg-slate-200/50 dark:bg-white/5 border-transparent text-slate-500'
                }`}
              >
                {active ? '✓ ' : '+ '}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Analytics + AI Insights Row */}
      <div className="grid lg:grid-cols-12 gap-6">
        {preferences.dashboardWidgets.showTrendChart && (
          <div className="lg:col-span-7 glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-bold">Subject Attendance vs 75% Threshold</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Live updates immediately after every class or OD credit</p>
              </div>
              <Link to="/predictor" className="text-xs font-bold text-electric-600 dark:text-cyan-400 hover:underline">
                Full Survival Radar →
              </Link>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="attFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
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
                  <Area type="monotone" dataKey="attendance" stroke="#38bdf8" strokeWidth={2.5} fill="url(#attFill)" name="Attendance %" />
                  <Area type="monotone" dataKey="required" stroke="#f43f5e" strokeDasharray="4 4" fill="none" name="Min Required %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {preferences.dashboardWidgets.showQuickInsights && (
          <div className={`${preferences.dashboardWidgets.showTrendChart ? 'lg:col-span-5' : 'lg:col-span-12'} glass-card rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" /> AI Attendance Insights
              </h2>
              <Link to="/insights" className="text-xs font-bold text-electric-600 dark:text-cyan-400 hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-2.5">
              {insights.slice(0, 4).map((ins) => (
                <div
                  key={ins.id}
                  className="rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{ins.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        ins.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400'
                          : ins.severity === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {ins.metricBadge}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{ins.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Subject Attendance Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold">Active Subjects</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record genuine attendance to earn coins & XP. Absences require confirmation.
            </p>
          </div>
          <Link
            to="/attendance"
            className="rounded-xl bg-electric-500/15 border border-electric-400/30 px-3.5 py-2 text-xs font-bold text-electric-600 dark:text-cyan-300 hover:bg-electric-500/25 transition"
          >
            Manage All Subjects →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {subjects.map((subj) => (
            <SubjectCard
              key={subj.id}
              subject={subj}
              compact
              onAttend={(id) => recordStudentAttendance(id, 'PRESENT')}
              onAbsent={(id) => recordStudentAttendance(id, 'ABSENT')}
            />
          ))}
        </div>
      </section>

      {/* Bottom Row: Upcoming Tasks & Squad / OD Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        {preferences.dashboardWidgets.showUpcomingTasks && (
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold">Upcoming Assignments & Deadlines</h2>
              <Link to="/tasks" className="text-xs font-bold text-electric-600 dark:text-cyan-400 hover:underline">
                Task Board →
              </Link>
            </div>
            <div className="space-y-2.5">
              {upcomingTasks.length === 0 ? (
                <p className="text-xs text-slate-500">All squad tasks completed!</p>
              ) : (
                upcomingTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-100/80 dark:bg-white/5 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <div className="font-bold">{t.title}</div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {t.subjectCode} • {t.category} • Due {t.deadline}
                      </div>
                    </div>
                    <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-500 dark:text-indigo-300">
                      {t.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {preferences.dashboardWidgets.showSquadFeed && (
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                {squad ? `${squad.name} (${squad.code})` : 'Squad Connect'}
              </h2>
              <Link to="/squad" className="text-xs font-bold text-electric-600 dark:text-cyan-400 hover:underline">
                Open Squad →
              </Link>
            </div>
            {squad ? (
              <div className="grid grid-cols-2 gap-2.5">
                {squad.members.slice(0, 4).map((m) => (
                  <div key={m.id} className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-2.5 text-xs">
                    <div className="font-bold truncate">{m.heroAlias}</div>
                    <div className="text-[11px] text-cyan-600 dark:text-cyan-300 font-semibold">{m.privacyTier}</div>
                    <div className="text-[10px] text-slate-500">🔥 {m.streak}d • ⚡ {m.achievementPoints} pts</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Join with code COE-75GUARD to collaborate with friends.</p>
            )}

            <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Briefcase className="h-4 w-4 text-emerald-400" /> Pending OD Claims: {pendingODs.length}
              </span>
              <Link to="/od" className="font-bold text-emerald-500 hover:underline">
                Submit / Track OD →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
