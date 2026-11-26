import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  Compass,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Moon,
  Search,
  Settings,
  Sliders,
  Sparkles,
  Sun,
  User,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface CommandItem {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string;
}

export const CommandPalette: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { subjects } = useAppState();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const commands = useMemo<CommandItem[]>(() => {
    const go = (path: string) => {
      onClose();
      navigate(path);
    };

    const routeCommands: CommandItem[] = [
      { id: 'dash', label: 'Dashboard', subtitle: 'Overview & Today’s Check-In', icon: <LayoutDashboard className="h-4 w-4" />, action: () => go('/dashboard'), keywords: 'home dashboard today' },
      ...(user?.role === 'STUDENT'
        ? [
            { id: 'att', label: 'Subjects & Attendance', subtitle: 'Add, edit, mark present/absent, undo', icon: <BookOpen className="h-4 w-4" />, action: () => go('/attendance'), keywords: 'subjects attendance classes history' },
            { id: 'sim', label: 'What-If Bunk Simulator', subtitle: 'Test bunks without changing records', icon: <Sliders className="h-4 w-4" />, action: () => go('/simulator'), keywords: 'simulator bunk skip what if' },
            { id: 'pred', label: 'Hall Ticket Survival Predictor', subtitle: 'GREEN / YELLOW / RED exam radar', icon: <Compass className="h-4 w-4" />, action: () => go('/predictor'), keywords: 'predictor hall ticket radar exam' },
            { id: 'rec', label: 'Smart Recovery Planner', subtitle: 'Consecutive class schedule to beat Thanos', icon: <Activity className="h-4 w-4" />, action: () => go('/recovery'), keywords: 'recovery thanos below 75' },
            { id: 'od', label: 'Smart OD Credits', subtitle: 'Hackathon, CoE & symposium OD claims', icon: <Briefcase className="h-4 w-4" />, action: () => go('/od'), keywords: 'od on duty hackathon workshop' },
            { id: 'hero', label: 'Hero Companions', subtitle: 'Captain Campus, Iron Scholar, Doctor Deadline, Spider-Coder', icon: <Sparkles className="h-4 w-4" />, action: () => go('/heroes'), keywords: 'heroes companion voice' },
            { id: 'arm', label: 'Hero Armory & Shield', subtitle: 'Coins, XP, levels, auras & leaderboard', icon: <Award className="h-4 w-4" />, action: () => go('/armory'), keywords: 'armory coins xp shield badges' },
            { id: 'sqd', label: 'Squad Connect', subtitle: 'Privacy-masked friend collaboration', icon: <Users className="h-4 w-4" />, action: () => go('/squad'), keywords: 'squad friends coe-75guard' },
            { id: 'tsk', label: 'Shared Tasks & Projects', subtitle: 'Homework, lab records & CoE deadlines', icon: <CheckSquare className="h-4 w-4" />, action: () => go('/tasks'), keywords: 'tasks homework assignment lab' },
            { id: 'ins', label: 'AI Attendance Insights', subtitle: 'Explainable insights & warnings', icon: <Flame className="h-4 w-4" />, action: () => go('/insights'), keywords: 'ai insights analysis' },
          ]
        : []),
      { id: 'sem', label: 'Semester Radar & Timetable', subtitle: 'Weekly timetable builder & holidays', icon: <Calendar className="h-4 w-4" />, action: () => go('/semester'), keywords: 'semester timetable calendar holidays' },
      ...(user?.role === 'FACULTY' || user?.role === 'ADMIN'
        ? [{ id: 'fac', label: 'Faculty Portal', subtitle: 'Verify attendance & approve OD requests', icon: <GraduationCap className="h-4 w-4" />, action: () => go('/faculty'), keywords: 'faculty verify od' }]
        : []),
      ...(user?.role === 'ADMIN'
        ? [{ id: 'adm', label: 'Admin Command Center', subtitle: 'Eligibility reports, rules & audit logs', icon: <Building2 className="h-4 w-4" />, action: () => go('/admin'), keywords: 'admin audit rules' }]
        : []),
      { id: 'not', label: 'Notification Centre', subtitle: 'Warnings, OD updates & Thanos history', icon: <Bell className="h-4 w-4" />, action: () => go('/notifications'), keywords: 'notifications alerts announcements' },
      { id: 'pro', label: 'Student Profile', subtitle: 'Hero alias, department & stats', icon: <User className="h-4 w-4" />, action: () => go('/profile'), keywords: 'profile account' },
      { id: 'set', label: 'Privacy, Backup & Real Semester Setup', subtitle: 'Start real semester, backup JSON & audio settings', icon: <Settings className="h-4 w-4" />, action: () => go('/settings'), keywords: 'settings privacy backup restore clean' },
      {
        id: 'theme',
        label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
        subtitle: 'Toggle application color theme',
        icon: theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />,
        action: () => {
          toggleTheme();
          onClose();
        },
        keywords: 'theme dark light mode',
      },
    ];

    const subjectCommands: CommandItem[] =
      user?.role === 'STUDENT'
        ? subjects.map((s) => ({
            id: `subj-${s.id}`,
            label: `${s.code} — ${s.name}`,
            subtitle: `${s.attended}/${s.total} classes • Jump to Subjects`,
            icon: <BookOpen className="h-4 w-4 text-cyan-400" />,
            action: () => go('/attendance'),
            keywords: `${s.code} ${s.name} ${s.facultyName}`,
          }))
        : [];

    return [...routeCommands, ...subjectCommands];
  }, [user?.role, subjects, theme, navigate, onClose, toggleTheme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.slice(0, 10);
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.keywords.toLowerCase().includes(q)
    );
  }, [commands, query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0b1233] border border-slate-200 dark:border-indigo-400/30 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-white/10">
              <Search className="h-4 w-4 text-cyan-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose();
                  if (e.key === 'Enter' && filtered[0]) filtered[0].action();
                }}
                placeholder="Jump to page, subject code, or action..."
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">No matching pages or subjects.</div>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-white/10 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 text-electric-500 dark:text-cyan-300 shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{item.label}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.subtitle}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                  </button>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-400">
              <span>Enter to open • Esc to close</span>
              <span>⌘K / Ctrl+K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
