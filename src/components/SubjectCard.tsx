import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Edit3, MinusCircle, PlusCircle, Shield, Skull, Trash2 } from 'lucide-react';
import { Subject } from '../types';
import { evaluateAttendance } from '../utils/attendanceMath';
import { assetUrl } from '../utils/assetUrl';

interface SubjectCardProps {
  subject: Subject;
  onAttend: (id: string) => void;
  onAbsent: (id: string) => void;
  onEdit?: (subject: Subject) => void;
  onDelete?: (subject: Subject) => void;
  compact?: boolean;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  onAttend,
  onAbsent,
  onEdit,
  onDelete,
  compact = false,
}) => {
  const [confirmAbsence, setConfirmAbsence] = useState(false);
  const evalRes = evaluateAttendance(subject.attended, subject.total, subject.minPercentage);
  const nextIfMiss = evaluateAttendance(subject.attended, subject.total + 1, subject.minPercentage);

  const badgeConfig = {
    AVENGERS_SHIELD: {
      bg: 'bg-[#FFC857]/20 border-[#FFC857]/55 text-amber-700 dark:text-[#FFC857] shadow-[0_0_12px_rgba(255,200,87,0.3)]',
      bar: 'from-[#FFC857] via-amber-300 to-[#00D9FF] shadow-[0_0_14px_rgba(255,200,87,0.7)]',
      icon: <Shield className="h-3.5 w-3.5" />,
    },
    EXCELLENT: {
      bg: 'bg-[#00D9FF]/15 border-[#00D9FF]/45 text-cyan-700 dark:text-[#00D9FF]',
      bar: 'from-[#00D9FF] to-[#1677FF] shadow-[0_0_12px_rgba(0,217,255,0.55)]',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    SAFE_ZONE: {
      bg: 'bg-[#22C55E]/15 border-[#22C55E]/40 text-emerald-700 dark:text-[#22C55E]',
      bar: 'from-[#22C55E] to-[#00D9FF] shadow-[0_0_10px_rgba(34,197,94,0.45)]',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    BORDERLINE: {
      bg: 'bg-[#FF9F43]/15 border-[#FF9F43]/45 text-amber-700 dark:text-[#FF9F43]',
      bar: 'from-[#FF9F43] to-amber-500 shadow-[0_0_10px_rgba(255,159,67,0.45)]',
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
    THANOS_RISK: {
      bg: 'bg-[#FF3155]/20 border-[#FF3155]/50 text-rose-700 dark:text-[#FF3155]',
      bar: 'from-[#FF3155] to-[#8138F5] shadow-[0_0_14px_rgba(255,49,85,0.6)]',
      icon: <Skull className="h-3.5 w-3.5" />,
    },
  }[evalRes.status];

  const progressWidth = Math.min(100, Math.max(0, evalRes.exactPercentage));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-cyan-300">
                {subject.code}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeConfig.bg}`}>
                {badgeConfig.icon}
                {evalRes.statusLabel}
              </span>
            </div>
            <h3 className="mt-2 font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {subject.name}
            </h3>
            {!compact && <p className="text-xs text-slate-500 dark:text-slate-400">{subject.facultyName}</p>}
          </div>

          <div className="text-right">
            <div
              className={`font-display text-2xl font-extrabold ${
                evalRes.isEligible ? 'text-slate-900 dark:text-white' : 'text-rose-500 dark:text-rose-400'
              }`}
            >
              {evalRes.displayPercentage}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {evalRes.attended} / {evalRes.total} classes
            </div>
          </div>
        </div>

        {/* Threshold Progress Bar */}
        <div className="mt-4">
          <div className="relative h-3 w-full rounded-full bg-slate-200 dark:bg-[#080817] overflow-hidden border border-slate-300/60 dark:border-violet-400/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressWidth}%` }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className={`h-full rounded-full bg-gradient-to-r progress-glow-sheen ${badgeConfig.bar}`}
            />
            {/* Target threshold marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white dark:bg-amber-300 shadow"
              style={{ left: `${subject.minPercentage}%` }}
              title={`Minimum required: ${subject.minPercentage}%`}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Min: {subject.minPercentage}%</span>
            <span>Remaining sem classes: {subject.remainingClasses}</span>
          </div>
        </div>

        {/* Exact mathematical insight box */}
        <div className="mt-3 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 px-3 py-2 text-xs">
          {evalRes.isEligible ? (
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-200">
              <span>Safe consecutive absences:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{evalRes.maxSafeAbsences} class(es)</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-300">
                <span>Required consecutive recovery:</span>
                <span className="font-bold">{evalRes.requiredRecoveryClasses} class(es)</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-purple-950/90 to-rose-950/80 border border-purple-400/40 p-2 text-[11px] text-purple-100">
                <img
                  src={assetUrl('assets/characters/thanos-admin.jpg')}
                  alt="Thanos Attendance Risk Warning"
                  className="h-10 w-14 rounded-md object-cover border border-purple-400/50 shrink-0"
                />
                <div className="leading-tight">
                  <div className="font-bold text-amber-300">THANOS RISK • BELOW {subject.minPercentage}%</div>
                  <div className="text-purple-200/90">Hall ticket in danger! Attend {evalRes.requiredRecoveryClasses} straight.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Banner before recording real absence */}
      {confirmAbsence ? (
        <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 p-3 text-xs">
          <div className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            Confirm real absence in {subject.code}?
          </div>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Attendance will drop to <strong>{nextIfMiss.displayPercentage}</strong>
            {!nextIfMiss.isEligible ? ` (Below ${subject.minPercentage}% — triggers Thanos Alert!)` : '.'}
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              onClick={() => {
                setConfirmAbsence(false);
                onAbsent(subject.id);
              }}
              className="flex-1 rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-500 transition"
            >
              Confirm Absent
            </button>
            <button
              onClick={() => setConfirmAbsence(false)}
              className="rounded-lg bg-slate-200 dark:bg-white/10 px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-white/20 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex flex-1 gap-2">
            <button
              onClick={() => onAttend(subject.id)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Present (+10🪙)
            </button>
            <button
              onClick={() => setConfirmAbsence(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 transition"
            >
              <MinusCircle className="h-3.5 w-3.5" />
              Absent
            </button>
          </div>

          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(subject)}
                  className="rounded-lg p-2 text-slate-500 hover:text-cyan-400 hover:bg-slate-200/60 dark:hover:bg-white/10 transition"
                  title="Edit subject"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(subject)}
                  className="rounded-lg p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-white/10 transition"
                  title="Delete subject"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
