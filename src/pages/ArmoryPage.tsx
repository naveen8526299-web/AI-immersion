import React, { useState } from 'react';
import { Award, CheckCircle2, Crown, Lock, Sparkles, Trophy, Zap } from 'lucide-react';
import { RotatingGoldenShield, SpinningGoldCoin } from '../components/CosmicBadges';
import { CoinMascotArtwork } from '../components/HeroCharacters';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { HERO_AURAS, LEVELS, getLevelInfo } from '../utils/gamification';

export const ArmoryPage: React.FC = () => {
  const { user } = useAuth();
  const { achievements, rewards, squad, overallSummary, purchaseAura, equipAura } = useAppState();
  const [feedback, setFeedback] = useState<string>('');

  if (!user) return null;

  const levelInfo = getLevelInfo(user.xp);

  // Privacy-safe Hero vs Hero Leaderboard based strictly on achievement points (never attendance %)
  const leaderboard = [
    ...(squad?.members || []).map((m) => ({
      id: m.id,
      alias: m.heroAlias,
      points: m.achievementPoints,
      streak: m.streak,
      levelTitle: m.levelTitle,
      isYou: m.id === user.id,
    })),
  ].sort((a, b) => b.points - a.points);

  const handleAuraClick = (auraId: string) => {
    setFeedback('');
    if (user.unlockedAuras.includes(auraId)) {
      equipAura(auraId);
      setFeedback('Hero aura equipped!');
      return;
    }
    const res = purchaseAura(auraId);
    if (!res.ok) {
      setFeedback(res.error || 'Unable to unlock aura.');
    } else {
      setFeedback('New hero aura unlocked & equipped!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 px-3 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-300">
            <Award className="h-3.5 w-3.5" /> Verified Gamification Vault
          </span>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold">Hero Armory, Shield & Achievements</h1>
        </div>
        <div className="flex items-center gap-3 rounded-2xl glass-card px-4 py-2.5 text-sm font-bold">
          <span className="text-[#FFC857] inline-flex items-center gap-1.5">
            <SpinningGoldCoin size={20} /> {user.coins} Coins
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-[#00D9FF] inline-flex items-center gap-1.5">
            <Zap className="h-4 w-4" /> {user.xp} XP
          </span>
        </div>
      </div>

      {/* Avengers Shield & Level Progression */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-3xl border border-[#FFC857]/35 bg-gradient-to-br from-[#17152D] via-[#1c1340] to-[#101027] p-6 text-[#F8FAFF] flex flex-col items-center text-center shadow-[0_18px_50px_rgba(129,56,245,0.28)]">
          <div className="flex items-center gap-4">
            <RotatingGoldenShield size={116} active={overallSummary.shieldCount > 0} />
            <CoinMascotArtwork size={98} />
          </div>
          <h2 className="mt-4 font-display text-xl font-extrabold text-[#FFC857]">100% Avengers Shield & Coin Vault</h2>
          <p className="mt-1 text-xs text-slate-300">
            {overallSummary.shieldCount > 0
              ? `ACTIVE in ${overallSummary.shieldCount} subject(s)! Earning +10 bonus coins per perfect-subject class.`
              : 'Reach 100% attendance in any subject to activate the glowing Avengers Shield bonus.'}
          </p>
          <div className="mt-4 w-full rounded-2xl bg-black/30 p-3 text-xs flex justify-between">
            <span>Daily Streak: 🔥 {user.dailyStreak}d</span>
            <span>Weekly Streak: ⚡ {user.weeklyStreak}w</span>
          </div>
        </div>

        <div className="lg:col-span-7 glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase text-purple-400">Level {levelInfo.level} / 7</div>
              <h2 className="font-display text-2xl font-extrabold">{levelInfo.title}</h2>
            </div>
            <Crown className="h-8 w-8 text-amber-400" />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span>{user.xp} XP Earned</span>
              <span>{levelInfo.nextXp > levelInfo.minXp ? `Next rank at ${levelInfo.nextXp} XP` : 'Max Rank Achieved!'}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-cyan-400 to-purple-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {LEVELS.map((lv) => {
              const reached = user.xp >= lv.minXp;
              return (
                <div
                  key={lv.level}
                  className={`rounded-xl border p-2 text-[11px] ${
                    reached
                      ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-600 dark:text-emerald-300 font-bold'
                      : 'bg-slate-100/60 dark:bg-white/5 border-transparent text-slate-500'
                  }`}
                >
                  <div>Lv.{lv.level}</div>
                  <div className="truncate">{lv.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Unlockable Hero Auras */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" /> Hero Aura Armory
          </h2>
          {feedback && <span className="text-xs font-bold text-cyan-400">{feedback}</span>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HERO_AURAS.map((aura) => {
            const unlocked = user.unlockedAuras.includes(aura.id);
            const equipped = user.equippedAura === aura.id;
            return (
              <div
                key={aura.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between bg-gradient-to-br ${aura.gradient} ${
                  equipped ? 'border-cyan-400' : 'border-slate-200/70 dark:border-white/10'
                }`}
              >
                <div>
                  <div className="font-display font-bold text-base">{aura.name}</div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{aura.description}</p>
                </div>
                <button
                  onClick={() => handleAuraClick(aura.id)}
                  className={`mt-4 w-full rounded-xl py-2 text-xs font-bold transition ${
                    equipped
                      ? 'bg-emerald-500 text-slate-950'
                      : unlocked
                      ? 'bg-white/20 hover:bg-white/30'
                      : 'bg-amber-400 text-slate-950 hover:brightness-110'
                  }`}
                >
                  {equipped ? 'Equipped' : unlocked ? 'Equip Aura' : `Unlock (${aura.costCoins} 🪙)`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" /> Achievement Badges
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {achievements.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_rgba(255,200,87,0.18)] ${
                b.unlocked
                  ? 'bg-[#FFC857]/10 border-[#FFC857]/40'
                  : 'bg-slate-100/60 dark:bg-white/5 border-slate-200/70 dark:border-white/10 opacity-65'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15">
                  {b.tier}
                </span>
                {b.unlocked ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Lock className="h-4 w-4 text-slate-400" />
                )}
              </div>
              <div className="mt-2 font-display font-bold text-sm">{b.title}</div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{b.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard + Anti-Fake Reward History */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display text-lg font-bold mb-1">Friendly Hero Leaderboard</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Ranked strictly by achievement XP — exact attendance percentages stay private.
          </p>
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs ${
                  entry.isYou ? 'bg-cyan-500/15 border border-cyan-400/30' : 'bg-slate-100/80 dark:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display font-extrabold text-sm w-5">#{idx + 1}</span>
                  <div>
                    <div className="font-bold">{entry.alias} {entry.isYou && '(You)'}</div>
                    <div className="text-slate-500">{entry.levelTitle} • 🔥 {entry.streak}d</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-cyan-500">{entry.points} XP</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display text-lg font-bold mb-1">Verified Reward Transaction Ledger</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Unique event keys prevent duplicate claims. Simulated bunks never award coins.
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {rewards.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl bg-slate-100/80 dark:bg-white/5 px-3 py-2 text-xs"
              >
                <div>
                  <div className="font-semibold">{tx.description}</div>
                  <div className="text-[10px] text-slate-500">{tx.source}</div>
                </div>
                <div className="text-right font-mono font-bold">
                  <span className="text-amber-400">+{tx.coinsDelta}🪙</span>{' '}
                  <span className="text-cyan-400">+{tx.xpDelta}⚡</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
