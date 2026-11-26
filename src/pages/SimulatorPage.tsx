import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RotateCcw, ShieldCheck, Skull, Sliders, Sparkles } from 'lucide-react';
import { HeroAvatarSVG, ThanosAdminArtwork } from '../components/HeroCharacters';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { evaluateAttendance, simulateFutureClasses } from '../utils/attendanceMath';

export const SimulatorPage: React.FC = () => {
  const { user } = useAuth();
  const { subjects, triggerHeroReaction, triggerThanosAlert, heroMood, heroMessage } = useAppState();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [simAttend, setSimAttend] = useState(0);
  const [simMiss, setSimMiss] = useState(0);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) || subjects[0],
    [subjects, selectedSubjectId]
  );

  const beforeEval = useMemo(
    () =>
      selectedSubject
        ? evaluateAttendance(selectedSubject.attended, selectedSubject.total, selectedSubject.minPercentage)
        : null,
    [selectedSubject]
  );

  const afterEval = useMemo(
    () =>
      selectedSubject
        ? simulateFutureClasses(
            selectedSubject.attended,
            selectedSubject.total,
            selectedSubject.minPercentage,
            simAttend,
            simMiss
          )
        : null,
    [selectedSubject, simAttend, simMiss]
  );

  // Trigger hero & Thanos reactions cleanly when simulation crosses risk boundary
  useEffect(() => {
    if (!selectedSubject || !beforeEval || !afterEval) return;
    if (simAttend === 0 && simMiss === 0) return;

    if (simMiss > 0 && !afterEval.isEligible) {
      triggerHeroReaction('RISKY_BUNK_ATTEMPT', {
        subjectName: selectedSubject.name,
        percentage: afterEval.exactPercentage,
        recoveryClasses: afterEval.requiredRecoveryClasses,
      });
      if (beforeEval.isEligible) {
        triggerThanosAlert({
          subjectCode: selectedSubject.code,
          subjectName: selectedSubject.name,
          percentage: afterEval.exactPercentage,
          requiredPercentage: selectedSubject.minPercentage,
          recoveryNeeded: afterEval.requiredRecoveryClasses,
          isSimulation: true,
        });
      }
    } else if (simMiss > 0 && afterEval.status === 'BORDERLINE') {
      triggerHeroReaction('BORDERLINE_78', {
        subjectName: selectedSubject.name,
        percentage: afterEval.exactPercentage,
        safeAbsences: afterEval.maxSafeAbsences,
      });
    } else if (simAttend > 0 && afterEval.isEligible) {
      triggerHeroReaction('SIMULATION_SAFE', {
        subjectName: selectedSubject.name,
        percentage: afterEval.exactPercentage,
        safeAbsences: afterEval.maxSafeAbsences,
      });
    }
  }, [simAttend, simMiss, selectedSubject?.id]);

  const resetSim = () => {
    setSimAttend(0);
    setSimMiss(0);
  };

  if (!selectedSubject || !beforeEval || !afterEval) {
    return <div className="glass-card rounded-2xl p-6 text-sm">Add a subject first to run simulations.</div>;
  }

  const remainingAfterSim = Math.max(0, selectedSubject.remainingClasses - (simAttend + simMiss));
  const maxPossibleAttended = afterEval.attended + remainingAfterSim;
  const finalTotal = afterEval.total + remainingAfterSim;
  const semesterEligiblePossible = evaluateAttendance(maxPossibleAttended, finalTotal, selectedSubject.minPercentage).isEligible;

  // Funny Bunk Calculator verdict
  const funnyVerdict =
    simMiss === 0
      ? 'Zero bunks simulated. Captain Campus salutes your discipline!'
      : !afterEval.isEligible
      ? `Emergency! Skipping ${simMiss} class(es) summons Thanos and taxes you ${afterEval.requiredRecoveryClasses} recovery classes!`
      : afterEval.maxSafeAbsences === 0
      ? `Living on the edge! You survive at ${afterEval.displayPercentage}, but 1 sneeze could break your shield!`
      : `Chill mode approved! You survive at ${afterEval.displayPercentage} with ${afterEval.maxSafeAbsences} bunk(s) still left in the tank.`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 px-3 py-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-300">
            <Sliders className="h-3.5 w-3.5" /> Non-Destructive Sandbox (Never Alters Real Records)
          </span>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold">What-If Bunk Simulator</h1>
        </div>

        <button
          onClick={resetSim}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-200 dark:bg-white/10 px-4 py-2.5 text-xs font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition self-start"
        >
          <RotateCcw className="h-4 w-4" /> Reset Simulation
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-5 sm:p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Subject to Simulate
            </label>
            <select
              value={selectedSubject.id}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                resetSim();
              }}
              className="w-full rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/15 px-3.5 py-2.5 text-sm font-semibold"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name} ({s.attended}/{s.total})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm font-bold mb-2">
                <span className="text-emerald-600 dark:text-emerald-400">Simulate Attending Future Classes</span>
                <span className="font-mono text-base">+{simAttend}</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(20, selectedSubject.remainingClasses)}
                value={simAttend}
                onChange={(e) => setSimAttend(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
              <div className="mt-2 flex gap-2">
                {[0, 1, 3, 5, 8].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSimAttend(n)}
                    className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300"
                  >
                    +{n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm font-bold mb-2">
                <span className="text-rose-600 dark:text-rose-400">Simulate Missing (Bunking) Classes</span>
                <span className="font-mono text-base">-{simMiss}</span>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                value={simMiss}
                onChange={(e) => setSimMiss(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
              <div className="mt-2 flex gap-2">
                {[0, 1, 2, 3, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSimMiss(n)}
                    className="rounded-lg bg-rose-500/10 border border-rose-500/25 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-300"
                  >
                    Miss {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Before vs After Comparison */}
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
              <div className="text-[11px] font-bold uppercase text-slate-500">Real Current Record</div>
              <div className="mt-1 font-display text-3xl font-extrabold">{beforeEval.displayPercentage}</div>
              <div className="text-xs text-slate-500 mt-1">
                {beforeEval.attended} / {beforeEval.total} classes • {beforeEval.statusLabel}
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 ${
                afterEval.isEligible
                  ? 'bg-emerald-500/10 border-emerald-400/35'
                  : 'bg-rose-500/15 border-rose-500/40'
              }`}
            >
              <div className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-300">
                Simulated Outcome
              </div>
              <div
                className={`mt-1 font-display text-3xl font-extrabold ${
                  afterEval.isEligible ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
                }`}
              >
                {afterEval.displayPercentage}
              </div>
              <div className="text-xs mt-1 font-semibold">
                {afterEval.attended} / {afterEval.total} classes • {afterEval.statusLabel}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-xl bg-slate-100 dark:bg-white/5 p-3">
              <div className="text-slate-500">Safe Bunks After</div>
              <div className="mt-1 font-display text-lg font-bold text-emerald-500">{afterEval.maxSafeAbsences}</div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-white/5 p-3">
              <div className="text-slate-500">Recovery Needed</div>
              <div className="mt-1 font-display text-lg font-bold text-rose-500">{afterEval.requiredRecoveryClasses}</div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-white/5 p-3">
              <div className="text-slate-500">Sem-End Reachable?</div>
              <div
                className={`mt-1 font-display text-lg font-bold ${
                  semesterEligiblePossible ? 'text-cyan-400' : 'text-rose-500'
                }`}
              >
                {semesterEligiblePossible ? 'YES' : 'NO'}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Live Reaction + Funny Bunk Calculator */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-card rounded-2xl p-5 flex flex-col items-center text-center">
            <HeroAvatarSVG
              heroId={user?.selectedHero || 'captain-campus'}
              mood={afterEval.isEligible ? (simMiss > 0 ? heroMood : 'happy') : 'warning'}
              size={128}
              auraId={user?.equippedAura}
            />
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-500">
              <Sparkles className="h-3.5 w-3.5" /> Companion Reaction
            </div>
            <p className="mt-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5 text-sm leading-relaxed">
              “{heroMessage}”
            </p>
          </div>

          <div
            className={`rounded-2xl border p-5 ${
              afterEval.isEligible
                ? 'bg-blue-500/10 border-blue-400/30'
                : 'bg-purple-500/15 border-purple-400/40'
            }`}
          >
            <div className="flex items-center gap-2 font-display text-base font-bold">
              {afterEval.isEligible ? (
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              ) : (
                <Skull className="h-5 w-5 text-purple-400" />
              )}
              Funny Bunk Calculator Verdict
            </div>
            {!afterEval.isEligible && (
              <div className="mt-3 flex justify-center">
                <ThanosAdminArtwork size={135} />
              </div>
            )}
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{funnyVerdict}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Zero coins or XP are awarded for simulated attendance.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
