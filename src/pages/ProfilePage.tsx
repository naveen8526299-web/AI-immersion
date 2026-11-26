import React, { useState } from 'react';
import { CheckCircle2, Shield, User } from 'lucide-react';
import { HeroAvatarSVG } from '../components/HeroCharacters';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { getLevelInfo } from '../utils/gamification';

export const ProfilePage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const { overallSummary } = useAppState();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [heroAlias, setHeroAlias] = useState(user?.heroAlias || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [registerNumber, setRegisterNumber] = useState(user?.registerNumber || '');
  const [semesterNumber, setSemesterNumber] = useState(user?.semesterNumber || 5);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const levelInfo = getLevelInfo(user.xp);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      fullName: fullName.trim(),
      heroAlias: heroAlias.trim(),
      department: department.trim(),
      registerNumber: registerNumber.trim(),
      semesterNumber,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold flex items-center gap-2.5">
          <User className="h-7 w-7 text-cyan-400" /> Profile & Hero Identity
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Manage your academic identity, public squad alias, and role credentials.
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-4 glass-card rounded-3xl p-6 flex flex-col items-center text-center gap-3">
          <HeroAvatarSVG heroId={user.selectedHero} mood="happy" size={120} auraId={user.equippedAura} />
          <div className="font-display text-xl font-extrabold">{user.heroAlias}</div>
          <span className="rounded-full bg-electric-500/15 px-3 py-0.5 text-xs font-bold text-electric-500 dark:text-cyan-300">
            {user.role}
          </span>
          {user.role === 'STUDENT' && (
            <div className="w-full pt-3 border-t border-slate-200/70 dark:border-white/10 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Rank:</span>
                <span className="font-bold">Lv.{levelInfo.level} {levelInfo.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Overall Attendance:</span>
                <span className="font-bold">{overallSummary.overallEval.displayPercentage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">100% Shields:</span>
                <span className="font-bold text-emerald-400">{overallSummary.shieldCount}</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="md:col-span-8 glass-card rounded-3xl p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Squad Hero Alias (Public)</label>
              <input
                value={heroAlias}
                onChange={(e) => setHeroAlias(e.target.value)}
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Email</label>
              <input
                disabled
                value={user.email}
                className="w-full rounded-xl bg-slate-200/70 dark:bg-white/5 border border-slate-300 dark:border-white/10 px-3 py-2 text-sm opacity-70"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Register / ID Number</label>
              <input
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Department</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Semester</label>
              <input
                type="number"
                min={1}
                max={10}
                value={semesterNumber}
                onChange={(e) => setSemesterNumber(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              {user.isDemo ? 'Stored locally in Demo Mode' : 'Synced via Supabase Profile'}
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-xs font-extrabold text-slate-950"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Saved!
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
