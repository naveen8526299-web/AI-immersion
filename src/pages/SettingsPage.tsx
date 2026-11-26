import React, { useRef, useState } from 'react';
import {
  Database,
  Download,
  GraduationCap,
  Lock,
  Moon,
  RotateCcw,
  Settings,
  Sun,
  Upload,
  Volume2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { isSupabaseConfigured } from '../services/supabaseClient';

export const SettingsPage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const {
    semester,
    preferences,
    updatePreferences,
    resetDemoState,
    startCleanSemester,
    exportBackupJson,
    importBackupJson,
  } = useAppState();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [resetDone, setResetDone] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');
  const [showCleanWizard, setShowCleanWizard] = useState(false);
  const [cleanName, setCleanName] = useState('Even Semester 2026–27');
  const [cleanStart, setCleanStart] = useState(semester.startDate);
  const [cleanEnd, setCleanEnd] = useState(semester.endDate);
  const [cleanExam, setCleanExam] = useState(semester.examDate);
  const [cleanMinPct, setCleanMinPct] = useState(semester.defaultMinPercentage);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!user) return null;

  const handleDownloadBackup = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendanceguard-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus('Full JSON backup downloaded!');
    setTimeout(() => setBackupStatus(''), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importBackupJson(String(reader.result || ''));
      setBackupStatus(res.ok ? 'Backup restored successfully!' : res.error || 'Import failed.');
      setTimeout(() => setBackupStatus(''), 3500);
    };
    reader.readAsText(file);
  };

  const handleStartPersonalSemester = (e: React.FormEvent) => {
    e.preventDefault();
    startCleanSemester({
      semesterName: cleanName,
      startDate: cleanStart,
      endDate: cleanEnd,
      examDate: cleanExam,
      defaultMinPercentage: cleanMinPct,
    });
    setShowCleanWizard(false);
    navigate('/attendance');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold flex items-center gap-2.5">
          <Settings className="h-7 w-7 text-cyan-400" /> Privacy Vault, Daily Setup & Backup
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Switch from demo data to your real college semester, export/restore backups, and manage privacy & sound.
        </p>
      </div>

      {/* Start Real College Semester Card */}
      <div className="glass-card rounded-2xl p-5 border-cyan-400/35 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-display text-lg font-bold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-cyan-400" /> Use AttendanceGuard Daily in Your College
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
              Clear sample demo subjects and start a clean personal semester with your own subjects & timetable.
            </p>
          </div>
          <button
            onClick={() => setShowCleanWizard((v) => !v)}
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-xs font-extrabold text-slate-950 shrink-0 self-start"
          >
            {showCleanWizard ? 'Close Setup' : 'Start My Real Semester'}
          </button>
        </div>

        {showCleanWizard && (
          <form onSubmit={handleStartPersonalSemester} className="pt-3 border-t border-slate-200/70 dark:border-white/10 space-y-3 text-xs">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Semester Name</label>
                <input
                  required
                  value={cleanName}
                  onChange={(e) => setCleanName(e.target.value)}
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Minimum Attendance Requirement (%)</label>
                <input
                  type="number"
                  min={50}
                  max={95}
                  value={cleanMinPct}
                  onChange={(e) => setCleanMinPct(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Start Date</label>
                <input
                  type="date"
                  value={cleanStart}
                  onChange={(e) => setCleanStart(e.target.value)}
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Exam Start Date</label>
                <input
                  type="date"
                  value={cleanExam}
                  onChange={(e) => setCleanExam(e.target.value)}
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Last Instruction Day</label>
              <input
                type="date"
                value={cleanEnd}
                onChange={(e) => setCleanEnd(e.target.value)}
                className="w-full sm:w-1/2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/15 px-3 py-2"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 hover:brightness-110 transition"
            >
              Initialize Clean Semester & Add My Subjects →
            </button>
          </form>
        )}
      </div>

      {/* Appearance */}
      <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
        <div>
          <div className="font-display font-bold">Appearance Mode</div>
          <div className="text-xs text-slate-500">Switch between Midnight Hero Dark Mode and Clean Light Mode</div>
        </div>
        <button
          onClick={toggleTheme}
          className="inline-flex items-center gap-2 rounded-xl bg-electric-500/15 border border-electric-400/30 px-4 py-2 text-xs font-bold text-electric-500 dark:text-cyan-300"
        >
          {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {theme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
        </button>
      </div>

      {/* Sound & Voice Controls */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-cyan-400" /> Audio & Companion Voice Controls
        </h2>

        <div className="flex items-center justify-between text-xs">
          <span>Web Audio Sound Effects (Coins, Shield, Thanos Alert)</span>
          <button
            onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
            className={`rounded-lg px-3 py-1.5 font-bold ${
              preferences.soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
            }`}
          >
            {preferences.soundEnabled ? 'Enabled' : 'Muted'}
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 text-xs">
          <span>SFX Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={preferences.soundVolume}
            onChange={(e) => updatePreferences({ soundVolume: Number(e.target.value) })}
            className="w-48 accent-cyan-400"
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/70 dark:border-white/10">
          <span>Browser Speech Synthesis Hero Narration</span>
          <button
            onClick={() => updatePreferences({ voiceEnabled: !preferences.voiceEnabled })}
            className={`rounded-lg px-3 py-1.5 font-bold ${
              preferences.voiceEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
            }`}
          >
            {preferences.voiceEnabled ? 'Enabled' : 'Off'}
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 text-xs">
          <span>Voice Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={preferences.voiceVolume}
            onChange={(e) => updatePreferences({ voiceVolume: Number(e.target.value) })}
            className="w-48 accent-purple-400"
          />
        </div>
      </div>

      {/* Privacy Vault */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Lock className="h-4 w-4 text-purple-400" /> Privacy Vault Controls
        </h2>
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="font-bold">Mask Exact Attendance % in Squads</div>
            <div className="text-slate-500">Shows only Safe Zone / Needs Backup / At Risk to squadmates</div>
          </div>
          <button
            onClick={() => updateUserProfile({ squadPrivacyShowExact: !user.squadPrivacyShowExact })}
            className={`rounded-lg px-3 py-1.5 font-bold ${
              !user.squadPrivacyShowExact ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {!user.squadPrivacyShowExact ? 'Masked (Private)' : 'Exact Shared'}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="font-bold">Anonymize Identity in Public Leaderboards</div>
            <div className="text-slate-500">Uses your Hero Alias instead of legal full name</div>
          </div>
          <button
            onClick={() => updateUserProfile({ anonymizeInPublicLists: !user.anonymizeInPublicLists })}
            className={`rounded-lg px-3 py-1.5 font-bold ${
              user.anonymizeInPublicLists ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
            }`}
          >
            {user.anonymizeInPublicLists ? 'Anonymized' : 'Visible'}
          </button>
        </div>
      </div>

      {/* Backup, Restore & Database Status */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Database className="h-4 w-4 text-emerald-400" /> Backup, Restore & Backend Status
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-300">
          {isSupabaseConfigured
            ? 'Supabase environment variables detected. Authenticated requests sync to PostgreSQL with RLS.'
            : 'Running in Local Persistence Mode (localStorage). Export a JSON backup anytime to move between phone & laptop.'}
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/35 px-4 py-2 text-xs font-bold text-cyan-500 dark:text-cyan-300 hover:bg-cyan-500/25 transition"
          >
            <Download className="h-3.5 w-3.5" /> Download Backup (.json)
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportBackup}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500/15 border border-indigo-400/35 px-4 py-2 text-xs font-bold text-indigo-500 dark:text-indigo-300 hover:bg-indigo-500/25 transition"
          >
            <Upload className="h-3.5 w-3.5" /> Restore Backup
          </button>

          <button
            onClick={() => {
              resetDemoState();
              setResetDone(true);
              setTimeout(() => setResetDone(false), 2500);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-400/35 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/25 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restore Demo Sample Data
          </button>
        </div>

        {backupStatus && <div className="text-xs font-bold text-emerald-400">{backupStatus}</div>}
        {resetDone && <div className="text-xs font-bold text-emerald-400">Sample demo data restored!</div>}
      </div>
    </div>
  );
};
