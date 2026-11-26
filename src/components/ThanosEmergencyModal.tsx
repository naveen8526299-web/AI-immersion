import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, ShieldAlert, Volume2, VolumeX, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { playThanosWarningSound } from '../utils/soundEngine';
import { ThanosAdminArtwork } from './HeroCharacters';

export const ThanosEmergencyModal: React.FC = () => {
  const { activeThanosModal, dismissThanosModal, preferences, updatePreferences } = useAppState();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {activeThanosModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080817]/90 backdrop-blur-lg"
          style={{ perspective: 1200 }}
        >
          {/* Red-Purple Emergency Cosmic Lighting Backdrop */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="cosmic-glow absolute top-0 inset-x-0 h-56 bg-gradient-to-b from-[#FF3155]/30 to-transparent" />
            <div className="cosmic-glow absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-[#8138F5]/35 blur-[130px]" />
            <div className="cosmic-glow absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-[#FF3155]/30 blur-[130px]" />
          </div>

          <motion.div
            initial={{ scale: 0.84, y: 34, rotateX: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, rotateX: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="relative w-full max-w-xl rounded-3xl border-2 border-[#FF3155]/60 bg-gradient-to-br from-[#17092b] via-[#17152D] to-[#260922] p-6 sm:p-8 text-[#F8FAFF] shadow-[0_0_80px_rgba(129,56,245,0.6),0_0_40px_rgba(255,49,85,0.45)] overflow-hidden"
          >
            {/* Animated Emergency Scan Bar */}
            <div className="pointer-events-none absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#8138F5] via-[#FF3155] to-[#FFC857] animate-pulse" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FF3155]/25 border border-[#FF3155]/60 px-3.5 py-1 text-xs font-extrabold tracking-wider text-rose-200 uppercase shadow-[0_0_16px_rgba(255,49,85,0.4)]">
                <ShieldAlert className="h-3.5 w-3.5 text-[#FF3155]" />
                {activeThanosModal.isSimulation ? 'Simulated Risk Breach' : 'Emergency Threshold Alert'}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => playThanosWarningSound(true, preferences.soundVolume)}
                  className="rounded-xl bg-white/10 px-2.5 py-1.5 text-[11px] font-bold hover:bg-white/20 transition"
                  title="Replay cosmic warning sound"
                >
                  SFX
                </button>
                <button
                  onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
                  className="rounded-xl bg-white/10 p-2 hover:bg-white/20 transition"
                  title={preferences.soundEnabled ? 'Mute alert sounds' : 'Unmute alert sounds'}
                >
                  {preferences.soundEnabled ? <Volume2 className="h-4 w-4 text-[#00D9FF]" /> : <VolumeX className="h-4 w-4 text-[#FF3155]" />}
                </button>
                <button
                  onClick={dismissThanosModal}
                  className="rounded-xl bg-white/10 p-2 hover:bg-white/20 transition"
                  aria-label="Dismiss Thanos Alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative mt-4 flex flex-col items-center text-center">
              <ThanosAdminArtwork size={190} />
              <h2 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFC857] via-purple-200 to-[#FF3155]">
                THANOS – COLLEGE ADMINISTRATION
              </h2>
              <p className="mt-2 rounded-2xl bg-black/45 border border-[#8138F5]/45 px-4 py-3 text-sm font-medium text-purple-100 shadow-inner">
                “{activeThanosModal.quote}”
              </p>
            </div>

            <div className="relative mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-[#080817]/75 border border-[#FF3155]/35 p-4 text-center">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-purple-300">Subject</div>
                <div className="mt-1 font-bold text-white text-sm">{activeThanosModal.subjectCode}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-purple-300">Current vs Min</div>
                <div className="mt-1 font-bold text-[#FF3155] text-sm">
                  {activeThanosModal.percentage.toFixed(2)}% / {activeThanosModal.requiredPercentage}%
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-purple-300">Recovery Needed</div>
                <div className="mt-1 font-bold text-[#FFC857] text-sm">{activeThanosModal.recoveryNeeded} classes</div>
              </div>
            </div>

            <div className="relative mt-3 flex items-center gap-2 text-xs text-purple-200/85 justify-center">
              <AlertTriangle className="h-3.5 w-3.5 text-[#FFC857] shrink-0" />
              <span>
                {activeThanosModal.isSimulation
                  ? 'Simulation only — your real attendance records were NOT changed.'
                  : `Attend your next ${activeThanosModal.recoveryNeeded} consecutive ${activeThanosModal.subjectName} classes to rebuild your shield!`}
              </span>
            </div>

            <div className="relative mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  dismissThanosModal();
                  navigate('/recovery');
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFC857] to-[#FF9F43] px-5 py-3 text-sm font-extrabold text-slate-950 shadow-[0_6px_24px_rgba(255,200,87,0.45)] hover:scale-[1.02] transition"
              >
                Open Smart Recovery Planner
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={dismissThanosModal}
                className="rounded-xl bg-white/10 border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
