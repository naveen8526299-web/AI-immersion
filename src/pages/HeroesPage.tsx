import React, { useState } from 'react';
import { Check, Sparkles, Volume2 } from 'lucide-react';
import { HeroAvatarSVG } from '../components/HeroCharacters';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { HeroId, HeroMood } from '../types';
import { HEROES, getHeroDialogue } from '../utils/dialogueEngine';
import { speakHeroLine } from '../utils/soundEngine';

const MOODS: { id: HeroMood; label: string; event: Parameters<typeof getHeroDialogue>[1] }[] = [
  { id: 'happy', label: 'Happy', event: 'ATTENDANCE_INCREASE' },
  { id: 'celebration', label: 'Celebration (100%)', event: 'PERFECT_100' },
  { id: 'worried', label: 'Worried (78%)', event: 'BORDERLINE_78' },
  { id: 'warning', label: 'Bunk Warning', event: 'RISKY_BUNK_ATTEMPT' },
  { id: 'sad', label: 'Sad (<75%)', event: 'BELOW_75' },
  { id: 'angry', label: 'Strict Alert', event: 'BELOW_75' },
];

export const HeroesPage: React.FC = () => {
  const { user } = useAuth();
  const { selectHero, preferences } = useAppState();
  const [previewMood, setPreviewMood] = useState<HeroMood>('happy');
  const [previewEvent, setPreviewEvent] = useState<Parameters<typeof getHeroDialogue>[1]>('ATTENDANCE_INCREASE');

  const activeHeroId = user?.selectedHero || 'captain-campus';
  const sampleDialogue = getHeroDialogue(activeHeroId, previewEvent, {
    subjectName: 'Discrete Mathematics',
    percentage: previewMood === 'celebration' ? 100 : previewMood === 'sad' || previewMood === 'angry' ? 70 : 82,
    recoveryClasses: 8,
    safeAbsences: 2,
    studentName: user?.heroAlias || 'Hero',
  });

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-400/30 px-3 py-1 text-[11px] font-bold text-purple-600 dark:text-purple-300">
          <Sparkles className="h-3.5 w-3.5" /> Original AI Companion Roster
        </span>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold">Choose Your Hero Companion</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Every hero reacts live to your attendance gains, risky simulations, and recovery milestones.
        </p>
      </div>

      {/* Expression & Dialogue Lab */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 grid md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-4 flex flex-col items-center">
          <HeroAvatarSVG
            heroId={activeHeroId}
            mood={previewMood}
            size={150}
            auraId={user?.equippedAura || 'default-spark'}
          />
          <span className="mt-2 font-display text-lg font-bold">{HEROES[activeHeroId].name}</span>
          <span className="text-xs text-cyan-500 font-semibold">{HEROES[activeHeroId].roleTitle}</span>
        </div>

        <div className="md:col-span-8 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Test Emotional Expressions & Voice Narration
          </div>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setPreviewMood(m.id);
                  setPreviewEvent(m.event);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition ${
                  previewMood === m.id
                    ? 'bg-electric-600 text-white border-electric-400'
                    : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-slate-100/80 dark:bg-black/30 border border-slate-200 dark:border-white/10 p-4 flex items-start justify-between gap-3">
            <p className="text-sm leading-relaxed">“{sampleDialogue.text}”</p>
            <button
              onClick={() => speakHeroLine(sampleDialogue.text, true, preferences.voiceVolume)}
              className="shrink-0 rounded-xl bg-cyan-500/15 border border-cyan-400/30 p-2.5 text-cyan-500 hover:bg-cyan-500/25 transition"
              title="Speak line using browser Speech Synthesis"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Selectable Hero Cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {(Object.keys(HEROES) as HeroId[]).map((hId) => {
          const meta = HEROES[hId];
          const isSelected = activeHeroId === hId;
          return (
            <div
              key={hId}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition ${
                isSelected
                  ? 'glass-card border-cyan-400 shadow-[0_0_30px_rgba(56,189,248,0.25)]'
                  : 'glass-card-hover'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <span className="rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-cyan-500 dark:text-cyan-300">
                  {meta.badgeText}
                </span>
                <div className="my-4">
                  <HeroAvatarSVG heroId={hId} mood={isSelected ? 'celebration' : 'idle'} size={120} />
                </div>
                <h2 className="font-display text-xl font-extrabold">{meta.name}</h2>
                <div className="text-xs font-semibold text-purple-500 dark:text-purple-300">{meta.roleTitle}</div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{meta.personality}</p>
              </div>

              <button
                onClick={() => selectHero(hId)}
                className={`mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold transition ${
                  isSelected
                    ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-500'
                    : 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 hover:brightness-110'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="h-4 w-4" /> Active Companion
                  </>
                ) : (
                  `Select ${meta.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
