import React, { useEffect, useState } from 'react';
import {
  Activity,
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
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Shield,
  Sliders,
  Sparkles,
  Sun,
  User,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FeatureControlFlags } from '../types';
import { getLevelInfo } from '../utils/gamification';
import { CommandPalette } from '../components/CommandPalette';
import { CosmicBackdrop } from '../components/CosmicBackdrop';
import { SpinningGoldCoin } from '../components/CosmicBadges';
import { FloatingCompanion } from '../components/FloatingCompanion';
import { LevelUpModal } from '../components/LevelUpModal';
import { ThanosEmergencyModal } from '../components/ThanosEmergencyModal';
import { ToastBanner } from '../components/ToastBanner';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: Array<'STUDENT' | 'FACULTY' | 'ADMIN'>;
  featureKey?: keyof FeatureControlFlags;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, roles: ['STUDENT', 'FACULTY', 'ADMIN'] },
  { to: '/attendance', label: 'Subjects', icon: <BookOpen className="h-4 w-4" />, roles: ['STUDENT'] },
  { to: '/simulator', label: 'Bunk Simulator', icon: <Sliders className="h-4 w-4" />, roles: ['STUDENT'], featureKey: 'allowBunkSimulator' },
  { to: '/predictor', label: 'Hall Ticket Radar', icon: <Compass className="h-4 w-4" />, roles: ['STUDENT'] },
  { to: '/recovery', label: 'Recovery Planner', icon: <Activity className="h-4 w-4" />, roles: ['STUDENT'] },
  { to: '/od', label: 'Smart OD Credits', icon: <Briefcase className="h-4 w-4" />, roles: ['STUDENT'], featureKey: 'allowODRequests' },
  { to: '/heroes', label: 'Hero Companions', icon: <Sparkles className="h-4 w-4" />, roles: ['STUDENT'], featureKey: 'allowHeroGamification' },
  { to: '/armory', label: 'Hero Armory', icon: <Award className="h-4 w-4" />, roles: ['STUDENT'], featureKey: 'allowHeroGamification' },
  { to: '/squad', label: 'Squad Connect', icon: <Users className="h-4 w-4" />, roles: ['STUDENT'], featureKey: 'allowSquadConnect' },
  { to: '/tasks', label: 'Tasks & Projects', icon: <CheckSquare className="h-4 w-4" />, roles: ['STUDENT'] },
  { to: '/semester', label: 'Semester Radar', icon: <Calendar className="h-4 w-4" />, roles: ['STUDENT', 'FACULTY', 'ADMIN'] },
  { to: '/insights', label: 'AI Insights', icon: <Flame className="h-4 w-4" />, roles: ['STUDENT'] },
  { to: '/faculty', label: 'Faculty Portal', icon: <GraduationCap className="h-4 w-4" />, roles: ['FACULTY', 'ADMIN'] },
  { to: '/admin', label: 'Admin Command', icon: <Building2 className="h-4 w-4" />, roles: ['ADMIN'] },
  { to: '/notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { to: '/profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
  { to: '/settings', label: 'Privacy & Settings', icon: <Settings className="h-4 w-4" /> },
];

export const AppShell: React.FC = () => {
  const { user, isDemoMode, logout } = useAuth();
  const { unreadNotificationCount, featureControls } = useAppState();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.roles && (!user || !item.roles.includes(user.role))) return false;
    if (user?.role === 'STUDENT' && item.featureKey && !featureControls[item.featureKey]) return false;
    return true;
  });
  const levelInfo = getLevelInfo(user?.xp || 0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen flex cosmic-shell text-slate-900 dark:text-[#F8FAFF]">
      <CosmicBackdrop />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200/80 dark:border-violet-400/20 bg-white/90 dark:bg-[#101027]/88 backdrop-blur-xl z-30 no-print">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-200/70 dark:border-violet-400/15">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#8138F5] to-[#1677FF] text-white shadow-[0_0_18px_rgba(129,56,245,0.5)]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-base font-bold tracking-tight">AttendanceGuard</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-electric-600 dark:text-[#00D9FF]">
                {user?.role || 'STUDENT'} SHIELD
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-gradient-to-r from-[#8138F5] to-[#1677FF] text-white shadow-[0_6px_18px_rgba(129,56,245,0.4)]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#17152D]'
                }`
              }
            >
              <span className="flex items-center gap-2.5">
                {item.icon}
                {item.label}
              </span>
              {item.to === '/notifications' && unreadNotificationCount > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadNotificationCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="p-3 border-t border-slate-200/70 dark:border-white/10">
            <div className="rounded-xl bg-slate-100 dark:bg-white/5 p-3 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="truncate">{user.heroAlias}</span>
                <span className="text-amber-500 dark:text-amber-300">Lv.{levelInfo.level}</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">{levelInfo.title}</div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span>🪙 {user.coins}</span>
                <span>⚡ {user.xp} XP</span>
                <span>🔥 {user.dailyStreak}d</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-500/10 transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200/75 dark:border-violet-400/20 bg-white/80 dark:bg-[#080817]/80 backdrop-blur-xl px-4 sm:px-6 py-3 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden rounded-xl p-2 bg-slate-200/70 dark:bg-white/10"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  isDemoMode
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/30'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                {isDemoMode ? 'Simulated Local Demo Mode' : 'Supabase Live Sync'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden md:inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-300 hover:border-cyan-400/50 transition"
              title="Open Quick Command Palette (⌘K)"
            >
              <Search className="h-3.5 w-3.5 text-cyan-400" />
              <span>Quick Jump...</span>
              <kbd className="rounded bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
            </button>

            {user?.role === 'STUDENT' && featureControls.allowHeroGamification && (
              <div className="hidden sm:flex items-center gap-3 rounded-xl bg-slate-100 dark:bg-[#17152D]/90 border border-slate-200/80 dark:border-violet-400/25 px-3 py-1.5 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-[#FFC857]">
                  <SpinningGoldCoin size={16} /> {user.coins} Coins
                </span>
                <span className="text-cyan-600 dark:text-[#00D9FF]">⚡ {user.xp} XP</span>
                <span className="text-orange-600 dark:text-[#FF9F43]">🔥 {user.dailyStreak}d Streak</span>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="rounded-xl p-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition"
              title="Toggle light/dark mode"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>

            <Link
              to="/notifications"
              className="relative rounded-xl p-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition"
              title="Notification Centre"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadNotificationCount}
                </span>
              )}
            </Link>

            <Link
              to="/profile"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-white/20 transition"
            >
              <User className="h-3.5 w-3.5 text-cyan-500" />
              <span>{user?.fullName.split(' ')[0]}</span>
            </Link>
          </div>
        </header>

        {/* Page Body with Cinematic Route Transitions */}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-10 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12, scale: 0.992 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#0d1424] h-full flex flex-col p-4 z-10 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2 font-display font-bold">
                <Shield className="h-5 w-5 text-electric-500" />
                AttendanceGuard
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-3 space-y-1 flex-1">
              {visibleNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-electric-600 text-white' : 'text-slate-700 dark:text-slate-300'
                    }`
                  }
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-rose-500/15 py-2.5 text-sm font-semibold text-rose-500"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-30 lg:hidden flex items-center justify-around border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0d1424]/95 backdrop-blur-xl py-2 px-1 no-print">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-semibold ${isActive ? 'text-electric-500' : 'text-slate-500'}`
          }
        >
          <LayoutDashboard className="h-4 w-4" />
          Home
        </NavLink>
        {user?.role === 'STUDENT' && (
          <>
            <NavLink
              to="/attendance"
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-[10px] font-semibold ${isActive ? 'text-electric-500' : 'text-slate-500'}`
              }
            >
              <BookOpen className="h-4 w-4" />
              Subjects
            </NavLink>
            {featureControls.allowBunkSimulator && (
              <NavLink
                to="/simulator"
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 text-[10px] font-semibold ${isActive ? 'text-electric-500' : 'text-slate-500'}`
                }
              >
                <Sliders className="h-4 w-4" />
                Simulator
              </NavLink>
            )}
            <NavLink
              to="/predictor"
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-[10px] font-semibold ${isActive ? 'text-electric-500' : 'text-slate-500'}`
              }
            >
              <Compass className="h-4 w-4" />
              Predictor
            </NavLink>
            {featureControls.allowSquadConnect && (
              <NavLink
                to="/squad"
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 text-[10px] font-semibold ${isActive ? 'text-electric-500' : 'text-slate-500'}`
                }
              >
                <Users className="h-4 w-4" />
                Squad
              </NavLink>
            )}
          </>
        )}
        {user?.role === 'FACULTY' && (
          <NavLink
            to="/faculty"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[10px] font-semibold ${isActive ? 'text-electric-500' : 'text-slate-500'}`
            }
          >
            <GraduationCap className="h-4 w-4" />
            Faculty
          </NavLink>
        )}
        {user?.role === 'ADMIN' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[10px] font-semibold ${isActive ? 'text-electric-500' : 'text-slate-500'}`
            }
          >
            <Building2 className="h-4 w-4" />
            Admin
          </NavLink>
        )}
      </nav>

      {/* Global Interactive Overlays */}
      {user?.role === 'STUDENT' && <FloatingCompanion />}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <ToastBanner />
      <LevelUpModal />
      <ThanosEmergencyModal />
    </div>
  );
};
