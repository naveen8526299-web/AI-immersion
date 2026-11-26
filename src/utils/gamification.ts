import { AchievementBadge, RewardTransaction, SquadPrivacyTier, Subject, TaskCategory } from '../types';
import { evaluateOverallSubjects, isAttendanceEligible } from './attendanceMath';

export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  nextXp: number;
  progressPercent: number;
}

export const LEVELS = [
  { level: 1, title: 'Freshman Sidekick', minXp: 0 },
  { level: 2, title: 'Campus Rookie', minXp: 120 },
  { level: 3, title: 'Attendance Warrior', minXp: 300 },
  { level: 4, title: 'Shield Guardian', minXp: 550 },
  { level: 5, title: 'Campus Champion', minXp: 900 },
  { level: 6, title: 'Campus Legend', minXp: 1400 },
  { level: 7, title: 'Campus Mythic', minXp: 2100 },
] as const;

export function getLevelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp));
  let currentIndex = 0;
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (safeXp >= LEVELS[i].minXp) {
      currentIndex = i;
    }
  }
  const current = LEVELS[currentIndex];
  const next = LEVELS[currentIndex + 1];
  if (!next) {
    return {
      level: current.level,
      title: current.title,
      minXp: current.minXp,
      nextXp: current.minXp,
      progressPercent: 100,
    };
  }
  const span = next.minXp - current.minXp;
  const gained = safeXp - current.minXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((gained / span) * 100)));
  return {
    level: current.level,
    title: current.title,
    minXp: current.minXp,
    nextXp: next.minXp,
    progressPercent,
  };
}

export const REWARD_RULES = {
  ATTEND_CLASS_COINS: 10,
  ATTEND_CLASS_XP: 20,
  SHIELD_100_BONUS_COINS: 10,
  TASK_REWARDS: {
    Homework: { coins: 15, xp: 15 },
    Assignment: { coins: 25, xp: 25 },
    'Lab Record': { coins: 25, xp: 25 },
    'CoE Project': { coins: 40, xp: 50 },
    Hackathon: { coins: 40, xp: 50 },
    'Seminar Prep': { coins: 25, xp: 25 },
    'Exam Prep': { coins: 25, xp: 25 },
  } as Record<TaskCategory, { coins: number; xp: number }>,
};

export interface HeroAuraItem {
  id: string;
  name: string;
  description: string;
  costCoins: number;
  gradient: string;
}

export const HERO_AURAS: HeroAuraItem[] = [
  {
    id: 'default-spark',
    name: 'Cadet Glow',
    description: 'Standard academy aura around your floating hero.',
    costCoins: 0,
    gradient: 'from-blue-500/30 to-cyan-400/20',
  },
  {
    id: 'vibranium-shield',
    name: 'Vibranium Shield Pulse',
    description: 'Rotating electric-cyan shield ring for 100% defenders.',
    costCoins: 120,
    gradient: 'from-cyan-400/40 via-blue-500/30 to-indigo-500/40',
  },
  {
    id: 'arc-reactor',
    name: 'Quantum Arc Halo',
    description: 'High-precision gold & plasma halo from Iron Scholar lab.',
    costCoins: 200,
    gradient: 'from-amber-400/40 via-cyan-400/30 to-purple-500/40',
  },
  {
    id: 'chrono-nexus',
    name: 'Chrono-Portal Ring',
    description: 'Emerald time-stone orbit worn by exam survival masters.',
    costCoins: 320,
    gradient: 'from-emerald-400/40 via-teal-400/30 to-cyan-500/40',
  },
];

/**
 * Prevents duplicate reward claims by checking unique eventKey in transaction ledger.
 */
export function hasClaimedReward(transactions: RewardTransaction[], eventKey: string): boolean {
  return transactions.some((tx) => tx.eventKey === eventKey);
}

/**
 * Computes privacy-masked status tier for Squad Connect (never exposes exact percentage).
 */
export function computeSquadPrivacyTier(subjects: Subject[]): SquadPrivacyTier {
  if (subjects.length === 0) return 'Protected';
  const summary = evaluateOverallSubjects(subjects);
  if (summary.shieldCount === subjects.length) return 'Attendance Hero';
  if (summary.atRiskCount > 0) return 'At Risk';
  if (summary.borderlineCount > 0) return 'Needs Backup';
  if (summary.overallEval.exactPercentage >= 85) return 'Protected';
  return 'Safe Zone';
}

export function evaluateAchievements(
  subjects: Subject[],
  coins: number,
  xp: number,
  streak: number,
  completedTasksCount: number,
  approvedODCount: number,
  existing: AchievementBadge[]
): AchievementBadge[] {
  const anyPerfect = subjects.some((s) => s.total > 0 && s.attended === s.total);
  const allEligible = subjects.length > 0 && subjects.every((s) => isAttendanceEligible(s.attended, s.total, s.minPercentage));
  const levelInfo = getLevelInfo(xp);

  const checks: Record<string, boolean> = {
    'avengers-shield': anyPerfect,
    'all-safe': allEligible,
    'streak-5': streak >= 5,
    'streak-14': streak >= 14,
    'task-master': completedTasksCount >= 3,
    'od-warrior': approvedODCount >= 1,
    'coin-collector': coins >= 250,
    'shield-guardian': levelInfo.level >= 4,
  };

  return existing.map((badge) => {
    const unlockedNow = badge.unlocked || Boolean(checks[badge.id]);
    return {
      ...badge,
      unlocked: unlockedNow,
      unlockedAt: unlockedNow ? badge.unlockedAt || new Date().toISOString() : undefined,
    };
  });
}
