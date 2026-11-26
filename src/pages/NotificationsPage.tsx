import React from 'react';
import {
  Bell,
  BellRing,
  BookOpen,
  CalendarCheck,
  CheckCheck,
  Clock,
  ShieldAlert,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { AppNotification } from '../types';
import { assetUrl } from '../utils/assetUrl';

function resolveNotificationImage(n: AppNotification): string {
  if (n.imageUrl) return n.imageUrl.startsWith('http') ? n.imageUrl : assetUrl(n.imageUrl);
  switch (n.category) {
    case 'WARNING':
    case 'RECOVERY':
      return assetUrl('assets/characters/thanos-admin.jpg');
    case 'ACHIEVEMENT':
      return assetUrl('assets/characters/coin-mascot.jpg');
    case 'TASK':
    case 'EXAM':
      return assetUrl('assets/characters/doctor-deadline.jpg');
    case 'SQUAD':
      return assetUrl('assets/characters/spider-coder.jpg');
    case 'OD':
    case 'ANNOUNCEMENT':
      return assetUrl('assets/characters/iron-scholar.jpg');
    default:
      return assetUrl('assets/characters/captain-campus.jpg');
  }
}

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    thanosAlerts,
    announcements,
    preferences,
    updatePreferences,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    triggerDailyReminder,
    requestBrowserNotificationPermission,
  } = useAppState();

  const browserSupported = typeof window !== 'undefined' && 'Notification' in window;
  const browserPerm = browserSupported ? Notification.permission : 'denied';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold flex items-center gap-2.5">
            <Bell className="h-7 w-7 text-[#00D9FF]" /> Notification Centre & Daily Reminder
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Visual character alerts, daily morning class reminders, OD updates, squad nudges, and announcements.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
            className="inline-flex items-center gap-1.5 rounded-xl glass-card px-3.5 py-2 text-xs font-bold"
          >
            {preferences.soundEnabled ? (
              <Volume2 className="h-4 w-4 text-[#00D9FF]" />
            ) : (
              <VolumeX className="h-4 w-4 text-[#FF3155]" />
            )}
            {preferences.soundEnabled ? 'SFX On' : 'SFX Muted'}
          </button>
          <button
            onClick={markAllNotificationsRead}
            className="neon-button inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
          >
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </button>
        </div>
      </div>

      {/* Daily College Reminder & Browser Notification Panel */}
      <div className="glass-card rounded-2xl p-5 border-[#00D9FF]/30 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00D9FF]">
              <Clock className="h-3.5 w-3.5" /> Daily Morning College Reminder
            </div>
            <h2 className="mt-1 font-display text-lg font-bold">
              Never Miss a Recovery Class or Morning Period
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              Automatically generates a daily briefing with today’s timetable periods, below-75% alerts, and pending tasks.
            </p>
          </div>

          <button
            onClick={() => triggerDailyReminder(true)}
            className="neon-button inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-extrabold shrink-0 self-start"
          >
            <BellRing className="h-4 w-4 text-[#FFC857]" /> Send Daily Reminder Now
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/70 dark:border-white/10 text-xs">
          <div className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3 flex items-center justify-between">
            <span className="font-semibold">Daily Reminder</span>
            <button
              onClick={() => updatePreferences({ dailyReminderEnabled: !preferences.dailyReminderEnabled })}
              className={`rounded-lg px-3 py-1 font-bold ${
                preferences.dailyReminderEnabled
                  ? 'bg-[#22C55E]/20 text-[#22C55E]'
                  : 'bg-slate-500/20 text-slate-400'
              }`}
            >
              {preferences.dailyReminderEnabled ? 'Enabled' : 'Paused'}
            </button>
          </div>

          <div className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3 flex items-center justify-between gap-2">
            <span className="font-semibold">Reminder Time</span>
            <input
              type="time"
              value={preferences.dailyReminderTime}
              onChange={(e) => updatePreferences({ dailyReminderTime: e.target.value })}
              className="rounded-lg bg-white dark:bg-[#080817] border border-slate-300 dark:border-violet-400/30 px-2.5 py-1 font-mono font-bold"
            />
          </div>

          <div className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3 flex items-center justify-between gap-2">
            <span className="font-semibold">Device Push Alerts</span>
            {browserPerm === 'granted' ? (
              <button
                onClick={() =>
                  updatePreferences({ browserNotificationsEnabled: !preferences.browserNotificationsEnabled })
                }
                className={`rounded-lg px-3 py-1 font-bold ${
                  preferences.browserNotificationsEnabled
                    ? 'bg-[#00D9FF]/20 text-[#00D9FF]'
                    : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {preferences.browserNotificationsEnabled ? 'Active' : 'Muted'}
              </button>
            ) : (
              <button
                onClick={requestBrowserNotificationPermission}
                className="rounded-lg bg-[#8138F5]/25 border border-[#8138F5]/50 px-3 py-1 font-bold text-purple-300 hover:bg-[#8138F5]/40 transition"
              >
                Enable Browser Alerts
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Image Notifications Feed */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-display text-lg font-bold mb-1">Alerts & Character Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500">No notifications right now.</p>
        ) : (
          notifications.map((n) => {
            const imgSrc = resolveNotificationImage(n);
            const isDanger = n.category === 'WARNING' || n.category === 'RECOVERY';
            return (
              <div
                key={n.id}
                className={`rounded-2xl border p-4 flex items-center justify-between gap-4 transition ${
                  n.read
                    ? 'bg-slate-100/50 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 opacity-80'
                    : isDanger
                    ? 'bg-[#FF3155]/10 border-[#FF3155]/40 shadow-[0_0_20px_rgba(255,49,85,0.15)]'
                    : 'bg-[#00D9FF]/10 border-[#00D9FF]/35'
                }`}
              >
                <div onClick={() => markNotificationRead(n.id)} className="cursor-pointer flex items-center gap-3.5 flex-1 min-w-0">
                  <img
                    src={imgSrc}
                    alt={n.category}
                    className={`h-14 w-14 rounded-xl object-cover shrink-0 border-2 ${
                      isDanger
                        ? 'border-[#FF3155]/70 shadow-[0_0_12px_rgba(255,49,85,0.45)]'
                        : 'border-[#00D9FF]/60 shadow-[0_0_12px_rgba(0,217,255,0.3)]'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          isDanger ? 'bg-[#FF3155]/25 text-[#FF3155]' : 'bg-white/15 text-[#00D9FF]'
                        }`}
                      >
                        {n.category}
                      </span>
                      <span className="font-bold text-sm truncate">{n.title}</span>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-[#00D9FF]" />}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</p>
                    <div className="mt-1 text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => dismissNotification(n.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-[#FF3155] shrink-0"
                  title="Dismiss"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* How Students Use AttendanceGuard Daily */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#FFC857]" /> How Students Use AttendanceGuard Daily
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3.5 space-y-1">
            <div className="font-bold text-[#00D9FF] flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> 1. One-Time Setup
            </div>
            <p className="text-slate-500 dark:text-slate-300">
              Open <strong>Settings → Start My Real Semester</strong>, add your subjects in <strong>Subjects</strong>, and set your Mon–Sat timetable in <strong>Semester Radar</strong>.
            </p>
          </div>
          <div className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3.5 space-y-1">
            <div className="font-bold text-[#22C55E] flex items-center gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5" /> 2. Daily Check-In
            </div>
            <p className="text-slate-500 dark:text-slate-300">
              Every morning, open <strong>Dashboard</strong> and tap <strong>Present</strong> or <strong>Absent</strong> on Today’s College Check-In to earn +10🪙 & +20 XP (or Undo mistakes).
            </p>
          </div>
          <div className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3.5 space-y-1">
            <div className="font-bold text-[#FFC857] flex items-center gap-1.5">
              <BellRing className="h-3.5 w-3.5" /> 3. Bunk Safely & Recover
            </div>
            <p className="text-slate-500 dark:text-slate-300">
              Test skips in <strong>Bunk Simulator</strong> before missing class. If below 75%, Thanos alerts you and <strong>Recovery Planner</strong> maps exact recovery dates.
            </p>
          </div>
          <div className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3.5 space-y-1">
            <div className="font-bold text-purple-400 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> 4. ODs & Squad Sync
            </div>
            <p className="text-slate-500 dark:text-slate-300">
              Submit Hackathon/CoE ODs in <strong>Smart OD</strong>, share privacy-masked status in <strong>Squad Connect</strong>, and back up anytime in <strong>Settings</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Faculty Announcements & Thanos Emergency Alert History */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="font-display text-lg font-bold">Faculty & Admin Announcements</h2>
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl bg-slate-100/80 dark:bg-white/5 p-3.5 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{a.title}</span>
                <span className="font-mono text-[#00D9FF]">{a.subjectCode}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{a.message}</p>
              <div className="text-[11px] text-slate-400">Posted by {a.authorName}</div>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 text-[#FF3155]">
            <ShieldAlert className="h-4 w-4" /> Thanos Emergency Alert History
          </h2>
          {thanosAlerts.map((t) => (
            <div key={t.id} className="rounded-xl bg-[#8138F5]/15 border border-[#FF3155]/35 p-3.5 text-xs space-y-1 flex items-center gap-3">
              <img
                src={assetUrl('assets/characters/thanos-admin.jpg')}
                alt="Thanos Alert"
                className="h-12 w-16 rounded-lg object-cover border border-[#FF3155]/50 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between font-bold">
                  <span>
                    {t.subjectCode} ({t.percentage.toFixed(2)}% / {t.requiredPercentage}%)
                  </span>
                  <span className="text-[10px] uppercase text-[#FFC857]">
                    {t.isSimulation ? 'Simulation' : 'Real Trigger'}
                  </span>
                </div>
                <p className="text-purple-200/90 mt-0.5">“{t.message}”</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
