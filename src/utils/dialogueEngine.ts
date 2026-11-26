import { HeroId, HeroMood } from '../types';

export interface HeroMetadata {
  id: HeroId;
  name: string;
  roleTitle: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentClass: string;
  badgeText: string;
  personality: string;
}

export type DialogueEvent =
  | 'WELCOME'
  | 'ATTENDANCE_INCREASE'
  | 'PERFECT_100'
  | 'SAFE_85'
  | 'BORDERLINE_78'
  | 'RISKY_BUNK_ATTEMPT'
  | 'BELOW_75'
  | 'RECOVERY_PROGRESS'
  | 'OD_APPROVED'
  | 'TASK_COMPLETE'
  | 'SIMULATION_SAFE';

export const HEROES: Record<HeroId, HeroMetadata> = {
  'captain-campus': {
    id: 'captain-campus',
    name: 'Captain Campus',
    roleTitle: 'Attendance Guardian',
    tagline: 'Protector of the 75% Semester Shield',
    primaryColor: '#2563eb',
    secondaryColor: '#38bdf8',
    accentClass: 'from-blue-600 via-cyan-500 to-indigo-600',
    badgeText: 'SHIELD DEFENSE',
    personality: 'Loyal, encouraging, and fiercely protective of your hall ticket.',
  },
  'iron-scholar': {
    id: 'iron-scholar',
    name: 'Iron Scholar',
    roleTitle: 'Tactical Mathematics Genius',
    tagline: 'Exact integer precision. Zero guesswork.',
    primaryColor: '#d97706',
    secondaryColor: '#38bdf8',
    accentClass: 'from-amber-500 via-rose-500 to-purple-600',
    badgeText: 'QUANTUM MATH',
    personality: 'Witty, analytical, speaks in exact formulas and probabilities.',
  },
  'doctor-deadline': {
    id: 'doctor-deadline',
    name: 'Doctor Deadline',
    roleTitle: 'Examination Predictor',
    tagline: 'Master of the Semester Timeline & Survival Radar',
    primaryColor: '#10b981',
    secondaryColor: '#a855f7',
    accentClass: 'from-emerald-500 via-teal-500 to-violet-600',
    badgeText: 'TIME PREDICTOR',
    personality: 'Calm strategist who sees 14,000,605 semester timelines.',
  },
  'spider-coder': {
    id: 'spider-coder',
    name: 'Spider-Coder',
    roleTitle: 'Bunk Risk Detector',
    tagline: 'Campus-sense tingling before every risky skip',
    primaryColor: '#ef4444',
    secondaryColor: '#3b82f6',
    accentClass: 'from-rose-500 via-blue-500 to-cyan-500',
    badgeText: 'BUNK-SENSE',
    personality: 'Energetic, humorous, hyper-alert to sudden attendance drops.',
  },
  'nova-forge': {
    id: 'nova-forge',
    name: 'NovaForge',
    roleTitle: 'Hackathon & Build Architect',
    tagline: 'Connecting builders across departments for winning prototypes',
    primaryColor: '#10b981',
    secondaryColor: '#ffc857',
    accentClass: 'from-amber-400 via-emerald-500 to-cyan-500',
    badgeText: 'HACKATHON FORGE',
    personality: 'Creative, collaborative, obsessed with pairing ideas with the right teammates.',
  },
  'dawn-wing': {
    id: 'dawn-wing',
    name: 'DawnWing',
    roleTitle: 'Morning Scout & Campus Safety',
    tagline: 'First morning check-in guardian & safe transit beacon',
    primaryColor: '#00d9ff',
    secondaryColor: '#ff4d8d',
    accentClass: 'from-cyan-400 via-pink-500 to-violet-600',
    badgeText: 'MORNING SCOUT',
    personality: 'Supportive, punctual, alerts low-attendance students every morning.',
  },
};

interface DialogueContext {
  subjectName?: string;
  percentage?: number;
  recoveryClasses?: number;
  safeAbsences?: number;
  daysUntilExam?: number;
  studentName?: string;
}

export function getHeroDialogue(
  heroId: HeroId,
  event: DialogueEvent,
  ctx: DialogueContext = {}
): { text: string; mood: HeroMood } {
  const subj = ctx.subjectName || 'your subject';
  const pct = ctx.percentage !== undefined ? `${ctx.percentage.toFixed(1)}%` : 'your target';
  const rec = ctx.recoveryClasses ?? 1;
  const safe = ctx.safeAbsences ?? 0;
  const examDays = ctx.daysUntilExam ?? 30;
  const name = ctx.studentName || 'Hero';

  const libraries: Record<HeroId, Record<DialogueEvent, { text: string; mood: HeroMood }>> = {
    'captain-campus': {
      WELCOME: {
        text: `Suit up, ${name}! Your overall shield stands at ${pct}. Let's guard every lecture today!`,
        mood: 'happy',
      },
      ATTENDANCE_INCREASE: {
        text: `Another class completed in ${subj}! Your future self is thanking you—shield strength is now ${pct}!`,
        mood: 'happy',
      },
      PERFECT_100: {
        text: `LEGENDARY! Perfect 100% attendance unlocked in ${subj}! Your Avengers Shield is now activated!`,
        mood: 'celebration',
      },
      SAFE_85: {
        text: `You're doing great at ${pct}! You have ${safe} safe absence(s) buffered—keep protecting your semester!`,
        mood: 'happy',
      },
      BORDERLINE_78: {
        text: `Careful, buddy. At ${pct} in ${subj}, your safety margin is getting smaller (${safe} bunk left).`,
        mood: 'worried',
      },
      RISKY_BUNK_ATTEMPT: {
        text: `WAIT! Are you seriously planning to skip ${subj}? Let me calculate your semester survival first!`,
        mood: 'warning',
      },
      BELOW_75: {
        text: `Buddy, we're in danger in ${subj} (${pct}). Let's stop unnecessary absences and attend ${rec} recovery class(es)!`,
        mood: 'sad',
      },
      RECOVERY_PROGRESS: {
        text: `THAT'S MY HERO! Your ${subj} attendance climbed to ${pct}. Only ${rec} more to restore full protection!`,
        mood: 'celebration',
      },
      OD_APPROVED: {
        text: `Official On-Duty mission recognized! Your ${subj} attendance shield just got reinforced to ${pct}!`,
        mood: 'celebration',
      },
      TASK_COMPLETE: {
        text: `Mission accomplished! Squad discipline boosts our whole semester defense!`,
        mood: 'happy',
      },
      SIMULATION_SAFE: {
        text: `Simulation looks clean! Even after that hypothetical break, ${subj} stays eligible at ${pct}.`,
        mood: 'idle',
      },
    },
    'iron-scholar': {
      WELCOME: {
        text: `JARVIS diagnostics online, ${name}. Overall attendance matrix: ${pct}. ${examDays} days until exam horizon.`,
        mood: 'idle',
      },
      ATTENDANCE_INCREASE: {
        text: `Integer check passed: ${subj} elevated to ${pct}. Probability of hall-ticket clearance rising fast.`,
        mood: 'happy',
      },
      PERFECT_100: {
        text: `100.00% precision in ${subj}! Even my arc-reactor math can't improve on perfection—Shield engaged!`,
        mood: 'celebration',
      },
      SAFE_85: {
        text: `${subj} is operating at ${pct} efficiency. Buffer capacity: ${safe} consecutive absence(s). Nice engineering.`,
        mood: 'happy',
      },
      BORDERLINE_78: {
        text: `Telemetry alert: ${subj} is at ${pct}. Margin of error is down to ${safe} class(es). Recommend zero skips.`,
        mood: 'worried',
      },
      RISKY_BUNK_ATTEMPT: {
        text: `Hold on, genius! My simulator says skipping ${subj} drops you to ${pct} and triggers a ${rec}-class recovery tax!`,
        mood: 'warning',
      },
      BELOW_75: {
        text: `Structural breach in ${subj} at ${pct}. Exact recovery equation: ceil((75T - 100A)/25) = ${rec} straight classes.`,
        mood: 'angry',
      },
      RECOVERY_PROGRESS: {
        text: `Optimal trajectory! ${subj} is rebounding at ${pct}—${rec} class(es) left until 100A >= 75T holds true.`,
        mood: 'celebration',
      },
      OD_APPROVED: {
        text: `OD credit patched into ${subj} ledger! Recalculated standing: ${pct}. That's smart resource allocation.`,
        mood: 'happy',
      },
      TASK_COMPLETE: {
        text: `Task compiled with zero errors! Coins and XP credited to your Iron Vault.`,
        mood: 'happy',
      },
      SIMULATION_SAFE: {
        text: `Simulated model green: ${subj} remains at ${pct} with ${safe} buffer slot(s) intact.`,
        mood: 'happy',
      },
    },
    'doctor-deadline': {
      WELCOME: {
        text: `I peered into ${examDays} days of your future, ${name}. Guard your ${pct} timeline wisely.`,
        mood: 'idle',
      },
      ATTENDANCE_INCREASE: {
        text: `A stronger timeline forged! ${subj} shifts to ${pct}, expanding your exam survival corridor.`,
        mood: 'happy',
      },
      PERFECT_100: {
        text: `In every possible universe, 100% in ${subj} wins! The Avengers Shield shines across time!`,
        mood: 'celebration',
      },
      SAFE_85: {
        text: `Your ${subj} timeline is serene at ${pct} with ${safe} spare portal(s) remaining.`,
        mood: 'happy',
      },
      BORDERLINE_78: {
        text: `The temporal threads around ${subj} (${pct}) are narrowing—only ${safe} skip remains before danger.`,
        mood: 'worried',
      },
      RISKY_BUNK_ATTEMPT: {
        text: `I've seen 14,000,605 outcomes of skipping ${subj}—and in this one, Thanos shows up! Check the math first!`,
        mood: 'warning',
      },
      BELOW_75: {
        text: `A dark timeline looms for ${subj} (${pct}). Attend the next ${rec} classes in sequence to rewrite your fate!`,
        mood: 'sad',
      },
      RECOVERY_PROGRESS: {
        text: `The timeline heals! ${subj} rises to ${pct}. Keep your ${rec}-class streak unbroken!`,
        mood: 'celebration',
      },
      OD_APPROVED: {
        text: `The Eye of Attendance approves! OD periods restored ${subj} to ${pct}.`,
        mood: 'celebration',
      },
      TASK_COMPLETE: {
        text: `Another deadline conquered ahead of schedule. Time-stone approved!`,
        mood: 'happy',
      },
      SIMULATION_SAFE: {
        text: `This alternate branch keeps ${subj} safe at ${pct}. Proceed responsibly!`,
        mood: 'idle',
      },
    },
    'spider-coder': {
      WELCOME: {
        text: `Hey ${name}! My Bunk-Sense is tuned and ready. Overall score: ${pct}. Let's dodge every attendance bug!`,
        mood: 'happy',
      },
      ATTENDANCE_INCREASE: {
        text: `Thwip! Another ${subj} class locked in! Attendance leveled up to ${pct}!`,
        mood: 'happy',
      },
      PERFECT_100: {
        text: `WHOA! 100% in ${subj}?! No bugs, no skips, pure Avengers Shield glory!`,
        mood: 'celebration',
      },
      SAFE_85: {
        text: `Smooth swinging! ${subj} is chilling at ${pct} with ${safe} safe bunk(s) in your web.`,
        mood: 'happy',
      },
      BORDERLINE_78: {
        text: `Uh-oh, my Bunk-Sense is tingling! ${subj} is at ${pct}—only ${safe} skip left before the red zone!`,
        mood: 'worried',
      },
      RISKY_BUNK_ATTEMPT: {
        text: `ABORT! ABORT! My Bunk-Sense is going crazy—skipping ${subj} drops you to ${pct}!`,
        mood: 'warning',
      },
      BELOW_75: {
        text: `Yikes! ${subj} slipped to ${pct}! Let's web-sling back to safety with ${rec} straight classes!`,
        mood: 'sad',
      },
      RECOVERY_PROGRESS: {
        text: `AWESOME! ${subj} jumped to ${pct}! Only ${rec} more classes and we're totally out of Thanos's trap!`,
        mood: 'celebration',
      },
      OD_APPROVED: {
        text: `Hackathon/Event OD approved! ${subj} just got a huge power-up to ${pct}!`,
        mood: 'celebration',
      },
      TASK_COMPLETE: {
        text: `Boom! Task shipped and squad points secured!`,
        mood: 'happy',
      },
      SIMULATION_SAFE: {
        text: `Phew! My Bunk-Sense stayed chill—simulated ${subj} stays safe at ${pct}!`,
        mood: 'happy',
      },
    },
    'nova-forge': {
      WELCOME: {
        text: `Hackathon Forge online, ${name}! Attendance at ${pct}—keep your classes green while we build championship projects!`,
        mood: 'happy',
      },
      ATTENDANCE_INCREASE: {
        text: `Build streak upgraded! ${subj} hits ${pct}—more time to focus on your SIH prototype!`,
        mood: 'happy',
      },
      PERFECT_100: {
        text: `100% reliability in ${subj}! Pure Gold Shield engineering!`,
        mood: 'celebration',
      },
      SAFE_85: {
        text: `${subj} is solid at ${pct} (${safe} safe skip buffer) for your upcoming hackathon sprint.`,
        mood: 'happy',
      },
      BORDERLINE_78: {
        text: `${subj} is tightening at ${pct}—grab an OD request if you're attending a tech symposium!`,
        mood: 'worried',
      },
      RISKY_BUNK_ATTEMPT: {
        text: `Prototype alert! Skipping ${subj} drops you to ${pct}. Protect your hall ticket first!`,
        mood: 'warning',
      },
      BELOW_75: {
        text: `${subj} is at ${pct}. Complete ${rec} straight lectures to unlock full innovation focus!`,
        mood: 'sad',
      },
      RECOVERY_PROGRESS: {
        text: `Recovering fast! ${subj} climbed to ${pct} (${rec} remaining).`,
        mood: 'celebration',
      },
      OD_APPROVED: {
        text: `Official On-Duty Hackathon credit merged! ${subj} jumps to ${pct}!`,
        mood: 'celebration',
      },
      TASK_COMPLETE: {
        text: `Milestone shipped! Vault coins & XP upgraded!`,
        mood: 'happy',
      },
      SIMULATION_SAFE: {
        text: `Simulated hackathon schedule keeps ${subj} green at ${pct}!`,
        mood: 'happy',
      },
    },
    'dawn-wing': {
      WELCOME: {
        text: `Good morning ${name}! Overall attendance is ${pct}. Let's confirm today's check-in and stay on track!`,
        mood: 'happy',
      },
      ATTENDANCE_INCREASE: {
        text: `Present & accounted for! ${subj} is now ${pct}!`,
        mood: 'happy',
      },
      PERFECT_100: {
        text: `100% Morning Shield in ${subj}! Radiant campus consistency!`,
        mood: 'celebration',
      },
      SAFE_85: {
        text: `All clear for ${subj} at ${pct}—${safe} safe skip(s) available if needed.`,
        mood: 'happy',
      },
      BORDERLINE_78: {
        text: `Heads up! ${subj} is at ${pct}. Coming to college today keeps your margin safe!`,
        mood: 'worried',
      },
      RISKY_BUNK_ATTEMPT: {
        text: `Morning Scout Warning: skipping ${subj} drops you to ${pct}! Better attend today!`,
        mood: 'warning',
      },
      BELOW_75: {
        text: `Low attendance alert on ${subj} (${pct})! You should attend today—${rec} straight classes needed!`,
        mood: 'sad',
      },
      RECOVERY_PROGRESS: {
        text: `Great morning effort! ${subj} improved to ${pct} (${rec} more to 75%).`,
        mood: 'celebration',
      },
      OD_APPROVED: {
        text: `OD verified and credited! ${subj} stands at ${pct}.`,
        mood: 'celebration',
      },
      TASK_COMPLETE: {
        text: `Morning checklist completed! Bonus XP awarded!`,
        mood: 'happy',
      },
      SIMULATION_SAFE: {
        text: `Plan checks out—${subj} holds steady at ${pct}!`,
        mood: 'happy',
      },
    },
  };

  return (libraries[heroId] || libraries['captain-campus'])[event];
}

export const THANOS_QUOTES = [
  'I AM INEVITABLE! Your attendance has fallen below 75%! Your semester shield has been damaged!',
  'THE INFINITY STONES CANNOT SAVE YOUR HALL TICKET. ATTEND YOUR RECOVERY CLASSES!',
  'ONE MORE CARELESS BUNK? EVEN THE MULTIVERSE CANNOT FIX YOUR ATTENDANCE!',
  'Dread it. Run from it. 75% minimum attendance arrives all the same—start your recovery streak today!',
];

export function pickThanosQuote(seedIndex = 0): string {
  return THANOS_QUOTES[Math.abs(seedIndex) % THANOS_QUOTES.length];
}
