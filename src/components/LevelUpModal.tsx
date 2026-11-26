import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Trophy, X } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';

export const LevelUpModal: React.FC = () => {
  const { levelUpBanner, dismissLevelUpBanner } = useAppState();

  return (
    <AnimatePresence>
      {levelUpBanner && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.9 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md rounded-2xl border border-amber-400/50 bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900 p-4 text-white shadow-[0_0_40px_rgba(251,191,36,0.45)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-300">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" /> Level Up Unlocked!
                </div>
                <div className="font-display text-lg font-bold">
                  Level {levelUpBanner.level}: {levelUpBanner.title}
                </div>
              </div>
            </div>
            <button onClick={dismissLevelUpBanner} className="rounded-lg p-1.5 hover:bg-white/10 transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
