import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { HEROES } from '../utils/dialogueEngine';
import { speakHeroLine, stopHeroSpeech } from '../utils/soundEngine';
import { HeroAvatarSVG } from './HeroCharacters';

export const FloatingCompanion: React.FC = () => {
  const { user } = useAuth();
  const { heroMood, heroMessage, preferences, updatePreferences, overallSummary, survivalSummary, triggerHeroReaction } =
    useAppState();
  const [expanded, setExpanded] = useState(false);

  if (!user) return null;

  const heroMeta = HEROES[user.selectedHero] || HEROES['captain-campus'];

  const handleSpeakNow = () => {
    const nextVoice = !preferences.voiceEnabled;
    updatePreferences({ voiceEnabled: nextVoice });
    if (nextVoice) {
      speakHeroLine(heroMessage, true, preferences.voiceVolume);
    } else {
      stopHeroSpeech();
    }
  };

  const handlePulseCheck = () => {
    if (overallSummary.atRiskCount > 0) {
      triggerHeroReaction('BELOW_75', {
        subjectName: `${overallSummary.atRiskCount} subject(s)`,
        percentage: overallSummary.overallEval.exactPercentage,
        recoveryClasses: survivalSummary.subjectPredictions.find((p) => !p.currentEval.isEligible)?.currentEval
          .requiredRecoveryClasses || 1,
      });
    } else if (overallSummary.shieldCount > 0) {
      triggerHeroReaction('PERFECT_100', { subjectName: 'your shield subjects', percentage: 100 });
    } else {
      triggerHeroReaction('SAFE_85', {
        subjectName: 'Overall Semester',
        percentage: overallSummary.overallEval.exactPercentage,
        safeAbsences: overallSummary.overallEval.maxSafeAbsences,
      });
    }
  };

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex flex-col items-end gap-2 no-print pointer-events-none">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.92 }}
            className="pointer-events-auto w-72 sm:w-80 rounded-2xl bg-white/95 dark:bg-[#0a102e]/95 backdrop-blur-xl border border-cyan-400/40 p-3.5 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold tracking-wide text-slate-900 dark:text-white">{heroMeta.name}</span>
                <span className="rounded-md bg-electric-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-electric-500 dark:text-cyan-300">
                  {heroMeta.badgeText}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleSpeakNow}
                  className="rounded-lg p-1 text-slate-500 hover:text-cyan-400 hover:bg-slate-200/50 dark:hover:bg-white/10 transition"
                  title={preferences.voiceEnabled ? 'Mute voice narration' : 'Enable voice narration'}
                >
                  {preferences.voiceEnabled ? <Volume2 className="h-3.5 w-3.5 text-cyan-400" /> : <VolumeX className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="rounded-lg p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition"
                  aria-label="Minimize companion speech"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">{heroMessage}</p>

            <div className="mt-2.5 flex items-center justify-between text-[11px]">
              <button
                onClick={handlePulseCheck}
                className="inline-flex items-center gap-1 font-semibold text-electric-600 dark:text-cyan-400 hover:underline"
              >
                <Sparkles className="h-3 w-3" /> Ask {heroMeta.name.split(' ')[0]}
              </button>
              <Link to="/heroes" className="font-medium text-purple-600 dark:text-purple-300 hover:underline">
                Switch Hero →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="pointer-events-auto group relative rounded-full p-1.5 bg-white/90 dark:bg-[#0a102e]/90 backdrop-blur-xl border border-cyan-400/40 shadow-xl hover:scale-105 transition"
        title={`Toggle ${heroMeta.name} companion`}
      >
        <HeroAvatarSVG heroId={user.selectedHero} mood={heroMood} size={66} auraId={user.equippedAura} />
        {!expanded && (
          <span className="absolute -top-1 -left-1 rounded-full bg-electric-500 p-1 text-white shadow">
            <MessageSquare className="h-3 w-3" />
          </span>
        )}
      </button>
    </div>
  );
};
