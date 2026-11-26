import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, MapPin, ShieldAlert, Sun, XCircle } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { evaluateAttendance } from '../utils/attendanceMath';
import { toLocalDateIso } from '../utils/dateUtils';
import { HeroAvatarSVG } from './HeroCharacters';

export const MorningCheckInCard: React.FC = () => {
  const { user } = useAuth();
  const {
    subjects,
    overallSummary,
    morningCheckIns,
    featureControls,
    submitMorningCheckIn,
    updateStudentLocation,
  } = useAppState();

  const [reason, setReason] = useState('');
  const [zone, setZone] = useState('In Transit to Campus');
  const [shareLoc, setShareLoc] = useState(Boolean(user?.privacyLocationOptIn));

  const todayIso = toLocalDateIso();
  const todayResponse = useMemo(
    () => morningCheckIns.find((m) => m.studentId === user?.id && m.date === todayIso),
    [morningCheckIns, user?.id, todayIso]
  );

  if (!user || user.role !== 'STUDENT' || !featureControls.enableMorningAttendancePrompt) {
    return null;
  }

  const atRiskSubjects = subjects
    .map((s) => ({ s, ev: evaluateAttendance(s.attended, s.total, s.minPercentage) }))
    .filter((x) => !x.ev.isEligible);

  const isLowAttendance = atRiskSubjects.length > 0 || overallSummary.overallEval.exactPercentage < 75;

  const handleRespond = (status: 'COMING' | 'NOT_COMING' | 'LATE') => {
    const loc = shareLoc
      ? {
          optedIn: true,
          zoneLabel: status === 'COMING' ? zone : status === 'LATE' ? 'In Transit (Late)' : 'Off Campus / Residence',
          onCampus: status === 'COMING' && !zone.toLowerCase().includes('transit'),
          updatedAt: new Date().toISOString(),
        }
      : undefined;

    submitMorningCheckIn(status, reason, loc);
    if (loc) updateStudentLocation(loc);
  };

  return (
    <section
      className={`glass-card rounded-3xl p-5 sm:p-6 border ${
        isLowAttendance
          ? 'border-[#FF3155]/45 bg-gradient-to-br from-[#FF3155]/10 via-[#17152D]/85 to-[#8138F5]/15'
          : 'border-[#00D9FF]/35 bg-gradient-to-br from-[#00D9FF]/10 via-[#17152D]/85 to-[#1677FF]/15'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <HeroAvatarSVG heroId="dawn-wing" mood={isLowAttendance ? 'warning' : 'happy'} size={68} />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                <Sun className="h-3 w-3" /> Daily Morning College Question
              </span>
              <span className="text-[11px] font-mono text-slate-400">{todayIso}</span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-white">
              Good Morning, {user.fullName.split(' ')[0]}! Are you coming to college today?
            </h2>

            {isLowAttendance ? (
              <div className="rounded-xl bg-[#FF3155]/20 border border-[#FF3155]/45 px-3 py-2 text-xs text-rose-200 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-[#FF3155] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Low Attendance Alert — You MUST come today!</strong> Overall is{' '}
                  <span className="font-mono font-bold">{overallSummary.overallEval.displayPercentage}</span>
                  {atRiskSubjects.length > 0 && (
                    <>
                      {' '}
                      • At risk:{' '}
                      {atRiskSubjects
                        .map((x) => `${x.s.code} (${x.ev.displayPercentage}, need ${x.ev.requiredRecoveryClasses} straight)`)
                        .join(', ')}
                      .
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-300">
                Your attendance is healthy at <strong className="text-emerald-400">{overallSummary.overallEval.displayPercentage}</strong>. Let Faculty &amp; your squad know if you’re attending today.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 min-w-[280px]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleRespond('COMING')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                todayResponse?.status === 'COMING'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.45)]'
                  : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Yes, Coming
            </button>
            <button
              type="button"
              onClick={() => handleRespond('LATE')}
              className={`inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${
                todayResponse?.status === 'LATE'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-amber-400/15 border border-amber-400/40 text-amber-300 hover:bg-amber-400/25'
              }`}
            >
              <Clock className="h-3.5 w-3.5" /> Late
            </button>
            <button
              type="button"
              onClick={() => handleRespond('NOT_COMING')}
              className={`inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${
                todayResponse?.status === 'NOT_COMING'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-500/15 border border-rose-400/40 text-rose-300 hover:bg-rose-500/25'
              }`}
            >
              <XCircle className="h-3.5 w-3.5" /> Not Coming
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 text-[11px]">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional note (e.g. 9 AM lab, bus late)..."
              className="flex-1 rounded-xl bg-white/5 border border-white/15 px-3 py-1.5 text-white placeholder:text-slate-400"
            />
            {featureControls.allowLiveLocationCheckIn && (
              <label className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/15 px-2.5 py-1.5 text-slate-300 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={shareLoc}
                  onChange={(e) => setShareLoc(e.target.checked)}
                  className="accent-[#00D9FF]"
                />
                <MapPin className="h-3 w-3 text-[#00D9FF]" />
                <span>Share Zone</span>
              </label>
            )}
          </div>

          {shareLoc && featureControls.allowLiveLocationCheckIn && (
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="rounded-xl bg-[#101027] border border-white/15 px-3 py-1.5 text-[11px] text-cyan-200"
            >
              <option value="In Transit to Campus">In Transit to Campus</option>
              <option value="Main Academic Block">Main Academic Block</option>
              <option value="CSE / AI Research Lab">CSE / AI Research Lab</option>
              <option value="Central Library">Central Library</option>
              <option value="Hostel Block">Hostel Block</option>
            </select>
          )}

          {todayResponse && (
            <div className="flex items-center justify-between text-[11px] text-cyan-300 px-1">
              <span>
                Recorded today: <strong>{todayResponse.status}</strong>
                {todayResponse.location?.zoneLabel ? ` • ${todayResponse.location.zoneLabel}` : ''}
              </span>
              {todayResponse.lowAttendanceWarned && todayResponse.status === 'NOT_COMING' && (
                <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                  <AlertTriangle className="h-3 w-3" /> Low Attendance Warning Logged
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
