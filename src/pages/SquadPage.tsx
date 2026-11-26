import React, { useState } from 'react';
import { BellRing, Copy, EyeOff, LogOut, Plus, Shield, Trophy, UserPlus, Users } from 'lucide-react';
import { HeroAvatarSVG } from '../components/HeroCharacters';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';

export const SquadPage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const { squad, createSquad, joinSquadByCode, leaveSquad, nudgeSquadMember, tasks } = useAppState();

  const [joinCode, setJoinCode] = useState('COE-75GUARD');
  const [newSquadName, setNewSquadName] = useState('');
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const totalTasks = tasks.length;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = joinSquadByCode(joinCode);
    setMsg(res.ok ? 'Joined squad!' : res.error || 'Could not join squad.');
  };

  const handleCopy = () => {
    if (!squad) return;
    navigator.clipboard?.writeText(squad.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 px-3 py-1 text-[11px] font-bold text-indigo-500 dark:text-indigo-300">
            <Users className="h-3.5 w-3.5" /> Privacy-Masked Collaboration
          </span>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold">Squad Connect & Friend Support</h1>
        </div>

        {/* Privacy Toggle */}
        <button
          onClick={() => updateUserProfile({ squadPrivacyShowExact: !user.squadPrivacyShowExact })}
          className="inline-flex items-center gap-2 rounded-xl glass-card px-4 py-2 text-xs font-bold self-start"
        >
          <EyeOff className="h-4 w-4 text-cyan-400" />
          Exact % Hidden by Default: {user.squadPrivacyShowExact ? 'OFF (Sharing)' : 'ON (Masked)'}
        </button>
      </div>

      {/* Privacy Explainer */}
      <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-4 flex items-center gap-3 text-xs">
        <Shield className="h-4 w-4 text-cyan-400 shrink-0" />
        <span>
          Squad Privacy Vault: Friends only see your Hero Alias and status tier (<strong>Safe Zone</strong>,{' '}
          <strong>Needs Backup</strong>, <strong>At Risk</strong>, <strong>Attendance Hero</strong>, or{' '}
          <strong>Protected</strong>) — exact individual percentages are never exposed by default.
        </span>
      </div>

      {!squad ? (
        <div className="grid md:grid-cols-2 gap-6">
          <form onSubmit={handleJoin} className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan-400" /> Join Existing Squad
            </h2>
            <p className="text-xs text-slate-500">Try sample squad code: <code className="font-mono font-bold">COE-75GUARD</code></p>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter Squad Code (e.g., COE-75GUARD)"
              className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3.5 py-2.5 text-sm font-mono uppercase"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 py-2.5 text-xs font-extrabold text-slate-950"
            >
              Join Squad
            </button>
            {msg && <div className="text-xs text-amber-400 font-semibold">{msg}</div>}
          </form>

          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-400" /> Create New Squad
            </h2>
            <input
              value={newSquadName}
              onChange={(e) => setNewSquadName(e.target.value)}
              placeholder="e.g., Semester 5 Defenders"
              className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3.5 py-2.5 text-sm"
            />
            <button
              onClick={() => createSquad(newSquadName)}
              className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-extrabold text-white hover:bg-purple-500 transition"
            >
              Generate Squad & Invite Code
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Squad Banner */}
          <div className="glass-card rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">Active Squad</div>
              <h2 className="font-display text-2xl font-extrabold">{squad.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-lg bg-white/10 border border-white/15 px-3 py-1 font-mono font-bold">
                  Code: {squad.code}
                </span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/15 px-3 py-1 font-bold text-cyan-400"
                >
                  <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Invite Friends'}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <div className="rounded-xl bg-amber-500/15 border border-amber-400/30 px-4 py-2 text-xs">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" /> Weekly Squad Challenge
                </div>
                <div className="mt-0.5">
                  {squad.weeklyChallengeTitle}: {squad.weeklyChallengeProgress}/{squad.weeklyChallengeTarget}
                </div>
              </div>
              <button
                onClick={leaveSquad}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 hover:underline"
              >
                <LogOut className="h-3.5 w-3.5" /> Leave Squad
              </button>
            </div>
          </div>

          {/* Squad Task Progress Bar */}
          <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <span className="font-bold">Shared Squad Task Completion:</span>{' '}
              <span>
                {completedTasks} / {totalTasks} tasks completed
              </span>
            </div>
            <div className="h-2.5 flex-1 max-w-md rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                style={{ width: `${totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)}%` }}
              />
            </div>
          </div>

          {/* Squad Members Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {squad.members.map((m) => {
              const tierColor =
                m.privacyTier === 'At Risk'
                  ? 'bg-rose-500/15 text-rose-400 border-rose-400/30'
                  : m.privacyTier === 'Needs Backup'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-400/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30';

              return (
                <div key={m.id} className="glass-card rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                  <HeroAvatarSVG heroId={m.selectedHero} mood={m.privacyTier === 'At Risk' ? 'worried' : 'happy'} size={76} />
                  <div className="font-display font-bold text-base">
                    {m.heroAlias} {m.id === user.id && <span className="text-xs text-cyan-400">(You)</span>}
                  </div>
                  <div className="text-[11px] text-slate-500">{m.levelTitle}</div>
                  <span className={`rounded-full border px-3 py-0.5 text-[11px] font-bold ${tierColor}`}>
                    {m.privacyTier}
                  </span>
                  <div className="text-xs text-slate-500">
                    🔥 {m.streak}d streak • ⚡ {m.achievementPoints} XP
                  </div>
                  {m.id !== user.id && (
                    <button
                      onClick={() => nudgeSquadMember(m.id)}
                      className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-electric-500/15 hover:bg-electric-500/25 border border-electric-400/30 py-2 text-xs font-bold text-electric-500 dark:text-cyan-300 transition"
                    >
                      <BellRing className="h-3.5 w-3.5" />
                      {m.lastNudgedAt ? 'Nudged!' : 'Send Attendance Nudge'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
