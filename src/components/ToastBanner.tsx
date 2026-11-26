import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, X } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';

export const ToastBanner: React.FC = () => {
  const { toastMessage, dismissToast } = useAppState();

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.94 }}
          className="fixed bottom-20 left-4 lg:bottom-6 lg:left-72 z-40 max-w-sm rounded-2xl bg-slate-900/95 dark:bg-[#0d1642]/95 border border-cyan-400/40 px-4 py-3 text-white shadow-2xl backdrop-blur-xl flex items-center gap-3 no-print"
        >
          {toastMessage.tone === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <Info className="h-4 w-4 text-cyan-400 shrink-0" />
          )}
          <span className="text-xs font-semibold leading-snug">{toastMessage.text}</span>
          <button onClick={dismissToast} className="rounded-lg p-1 hover:bg-white/10 transition shrink-0">
            <X className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
