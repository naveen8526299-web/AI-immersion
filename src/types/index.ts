export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export type HeroId = 'captain-campus' | 'iron-scholar' | 'doctor-deadline' | 'spider-coder';

export type HeroMood = 'happy' | 'sad' | 'worried' | 'angry' | 'celebration' | 'warning' | 'idle';

export type AttendanceStatus =
  | 'AVENGERS_SHIELD'
  | 'EXCELLENT'
  | 'SAFE_ZONE'
  | 'BORDERLINE'
  | 'THANOS_RISK';

export type SurvivalZone = 'GREEN' | 'YELLOW' | 'RED';

export type ODEventType =
  | 'Hackathon'
  | 'CoE Workshop'
  | 'Symposium'
  | 'Sports Event'
  | 'Technical Competition'
  | 'College Representation'
  | 'Official Academic Event';

export type ODStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type TaskCategory =
  | 'Homework'
  | 'Assignment'
  | 'Lab Record'
  | 'CoE Project'
  | 'Hackathon'
  | 'Seminar Prep'
  | 'Exam Prep';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export type SquadPrivacyTier = 'Safe Zone' | 'Needs Backup' | 'At Risk' | 'Attendance Hero' | 'Protected';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  heroAlias: string;
  role: UserRole;
  department: string;
  semesterNumber: number;
  registerNumber: string;
  selectedHero: HeroId;
  unlockedAuras: string[];
  equippedAura: string;
  coins: number;
  xp: number;
  dailyStreak: number;
  weeklyStreak: number;
  lastAttendanceDate: string | null;
  classesAttendedToday: number;
  squadPrivacyShowExact: boolean; // default false: mask exact percentages
  anonymizeInPublicLists: boolean;
  assignedSubjectCodes?: string[]; // for faculty authorization
  isDemo: boolean;
}

export interface Subject {
  id: string;
  studentId: string;
  code: string;
  name: string;
  facultyName: string;
  attended: number;
  total: number;
  minPercentage: number; // default 75
  remainingClasses: number;
  weeklyPeriods: number;
  color: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  date: string; // ISO date YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'OD_CREDIT';
  periods: number;
  source: 'STUDENT_SELF' | 'FACULTY_VERIFIED' | 'OD_RECONCILIATION' | 'ADMIN_CORRECTION';
  note?: string;
  previousAttended?: number;
  previousTotal?: number;
  newAttended?: number;
  newTotal?: number;
  updatedBy: string;
  createdAt: string;
}

export interface SemesterSettings {
  semesterName: string;
  startDate: string;
  endDate: string;
  examDate: string;
  workingDaysOfWeek: number[]; // 1=Mon ... 6=Sat
  holidays: { id: string; date: string; name: string }[];
  importantEvents: { id: string; date: string; title: string; type: 'EXAM' | 'DEADLINE' | 'EVENT' }[];
  timetable: Record<number, string[]>; // weekday -> subjectCodes
  defaultMinPercentage: number;
  allowODAutoReconcileOnApproval: boolean;
}

export interface ODRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentAlias: string;
  eventName: string;
  eventType: ODEventType;
  startDate: string;
  endDate: string;
  subjectIds: string[];
  periodsPerSubject: number;
  documentNote: string;
  status: ODStatus;
  reviewedBy?: string;
  remarks?: string;
  reconciled: boolean; // prevents duplicate OD credit
  createdAt: string;
  updatedAt: string;
}

export interface SquadMember {
  id: string;
  heroAlias: string;
  selectedHero: HeroId;
  levelTitle: string;
  achievementPoints: number;
  streak: number;
  privacyTier: SquadPrivacyTier;
  showExactPercentage?: boolean;
  exactPercentage?: number;
  lastNudgedAt?: string;
}

export interface Squad {
  id: string;
  name: string;
  code: string; // e.g., COE-75GUARD
  weeklyChallengeTitle: string;
  weeklyChallengeTarget: number;
  weeklyChallengeProgress: number;
  members: SquadMember[];
}

export interface SquadTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  subjectCode: string;
  assignedTo: string;
  deadline: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  rewardClaimed: boolean;
  createdAt: string;
}

export interface RewardTransaction {
  id: string;
  eventKey: string; // unique event ID to prevent duplicate reward claims
  description: string;
  coinsDelta: number;
  xpDelta: number;
  source: 'ATTENDANCE' | 'SHIELD_BONUS' | 'TASK' | 'CHALLENGE' | 'STREAK';
  createdAt: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'COSMIC';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'WARNING' | 'RECOVERY' | 'OD' | 'TASK' | 'SQUAD' | 'EXAM' | 'ACHIEVEMENT' | 'ANNOUNCEMENT';
  imageUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface ThanosAlertRecord {
  id: string;
  subjectCode: string;
  subjectName: string;
  percentage: number;
  requiredPercentage: number;
  recoveryNeeded: number;
  message: string;
  isSimulation: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: 'ATTENDANCE' | 'OD' | 'SETTINGS' | 'SUBJECT' | 'AUTH' | 'REWARD';
  targetId: string;
  previousValue?: string;
  newValue?: string;
  reason: string;
  createdAt: string;
}

export interface FacultyAnnouncement {
  id: string;
  authorName: string;
  subjectCode: string;
  title: string;
  message: string;
  createdAt: string;
}

export interface DemoStudentRecord {
  id: string;
  fullName: string;
  heroAlias: string;
  registerNumber: string;
  department: string;
  semesterNumber: number;
  subjects: Subject[];
}

export interface FeatureControlFlags {
  studentSelfAttendanceLocked: boolean;
  allowStudentSubjectManagement: boolean;
  allowBunkSimulator: boolean;
  allowSquadConnect: boolean;
  allowODRequests: boolean;
  allowHeroGamification: boolean;
}

export interface AppPreferences {
  soundEnabled: boolean;
  soundVolume: number; // 0..1
  voiceEnabled: boolean;
  voiceVolume: number; // 0..1
  notifyWarnings: boolean;
  notifyDeadlines: boolean;
  notifySquad: boolean;
  notifyOD: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // HH:mm
  browserNotificationsEnabled: boolean;
  lastDailyReminderDate: string | null;
  dashboardWidgets: {
    showTrendChart: boolean;
    showSurvivalRadar: boolean;
    showSquadFeed: boolean;
    showUpcomingTasks: boolean;
    showQuickInsights: boolean;
  };
}
