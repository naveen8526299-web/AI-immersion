import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_FEATURE_CONTROLS,
  DEFAULT_PREFERENCES,
  INITIAL_ACHIEVEMENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CAMPUS_POSTS,
  INITIAL_COLLEGES,
  INITIAL_DEMO_COHORT,
  INITIAL_HACKATHONS,
  INITIAL_MORNING_CHECKINS,
  INITIAL_NOTIFICATIONS,
  INITIAL_OD_REQUESTS,
  INITIAL_RECORDS,
  INITIAL_REWARDS,
  INITIAL_SEMESTER,
  INITIAL_SQUAD,
  INITIAL_SUBJECTS,
  INITIAL_TASKS,
  INITIAL_TEACHERS,
  INITIAL_THANOS_ALERTS,
} from '../services/demoData';
import {
  AchievementBadge,
  AppNotification,
  AppPreferences,
  AttendanceRecord,
  AuditLogEntry,
  CampusMediaPost,
  CollegeInstitution,
  DemoStudentRecord,
  FacultyAnnouncement,
  FeatureControlFlags,
  GenderCategory,
  HackathonPost,
  HeroId,
  HeroMood,
  LocationTrackingInfo,
  MorningCheckInResponse,
  ODEventType,
  ODRequest,
  RewardTransaction,
  SemesterSettings,
  Squad,
  SquadTask,
  Subject,
  TeacherDirectoryRecord,
  ThanosAlertRecord,
  UserProfile,
} from '../types';
import { evaluateAttendance, evaluateOverallSubjects, isAttendanceEligible } from '../utils/attendanceMath';
import { assetUrl } from '../utils/assetUrl';
import { toLocalDateIso } from '../utils/dateUtils';
import { DialogueEvent, getHeroDialogue, pickThanosQuote } from '../utils/dialogueEngine';
import {
  HERO_AURAS,
  REWARD_RULES,
  computeSquadPrivacyTier,
  evaluateAchievements,
  getLevelInfo,
  hasClaimedReward,
} from '../utils/gamification';
import { playCoinSound, playShieldUnlockSound, playThanosWarningSound, speakHeroLine } from '../utils/soundEngine';
import { predictHallTicketSurvival } from '../utils/survivalPredictor';
import { useAuth } from './AuthContext';

const STATE_KEY = 'ag_app_state_v1';
const REGISTERED_DEMO_USERS_KEY = 'ag_demo_registered_users_v1';

function mergeRegisteredStudentsIntoCohort(
  cohort: DemoStudentRecord[],
  templateSubjects: Subject[],
  extraUser?: UserProfile | null
): DemoStudentRecord[] {
  const existingIds = new Set(cohort.map((s) => s.id));
  const existingRegs = new Set(cohort.map((s) => s.registerNumber.trim().toUpperCase()));
  const additions: DemoStudentRecord[] = [];

  const candidates: Array<Partial<UserProfile>> = [];
  try {
    const raw = localStorage.getItem(REGISTERED_DEMO_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Array<Partial<UserProfile>>;
      if (Array.isArray(parsed)) candidates.push(...parsed);
    }
  } catch {
    // ignore storage parse error
  }
  if (extraUser) candidates.push(extraUser);

  for (const cand of candidates) {
    if (cand.role !== 'STUDENT' || !cand.id || cand.id === 'demo-student-1') continue;
    const regClean = (cand.registerNumber || `REG-${cand.id.slice(-4)}`).trim().toUpperCase();
    if (existingIds.has(cand.id) || existingRegs.has(regClean)) continue;
    existingIds.add(cand.id);
    existingRegs.add(regClean);
    additions.push({
      id: cand.id,
      collegeId: cand.collegeId || 'clg-au-coe',
      fullName: cand.fullName?.trim() || 'Registered Student',
      heroAlias: cand.heroAlias?.trim() || `Guard-${regClean.slice(-3)}`,
      registerNumber: regClean,
      department: cand.department?.trim() || 'CSE',
      semesterNumber: cand.semesterNumber || 5,
      yearOfStudy: cand.yearOfStudy || Math.max(1, Math.min(4, Math.ceil((cand.semesterNumber || 5) / 2))),
      gender: cand.gender || 'OTHER',
      email: cand.email || `${regClean.toLowerCase()}@campus.edu`,
      phone: cand.phone || '',
      residenceType: 'Day Scholar',
      skills: cand.skills && cand.skills.length > 0 ? cand.skills : ['React', 'Python'],
      hackathonInterest: 'Open to Hackathon Teams',
      privacyShowProfile: cand.privacyShowDirectory ?? true,
      privacyShowLocation: cand.privacyLocationOptIn ?? false,
      subjects: templateSubjects.map((s, idx) => ({
        ...s,
        id: `${cand.id}-s${idx + 1}`,
        studentId: cand.id as string,
        attended: 0,
        total: 0,
      })),
    });
  }

  return additions.length > 0 ? [...additions, ...cohort] : cohort;
}

interface PersistedState {
  subjects: Subject[];
  records: AttendanceRecord[];
  semester: SemesterSettings;
  odRequests: ODRequest[];
  squad: Squad | null;
  tasks: SquadTask[];
  rewards: RewardTransaction[];
  achievements: AchievementBadge[];
  notifications: AppNotification[];
  announcements: FacultyAnnouncement[];
  auditLogs: AuditLogEntry[];
  thanosAlerts: ThanosAlertRecord[];
  demoCohort: DemoStudentRecord[];
  colleges: CollegeInstitution[];
  activeCollegeId: string;
  teachers: TeacherDirectoryRecord[];
  morningCheckIns: MorningCheckInResponse[];
  hackathons: HackathonPost[];
  campusPosts: CampusMediaPost[];
  preferences: AppPreferences;
  featureControls: FeatureControlFlags;
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      const baseSubjects = parsed.subjects ?? INITIAL_SUBJECTS;
      return {
        subjects: baseSubjects,
        records: parsed.records ?? INITIAL_RECORDS,
        semester: parsed.semester ?? INITIAL_SEMESTER,
        odRequests: parsed.odRequests ?? INITIAL_OD_REQUESTS,
        squad: parsed.squad === undefined ? INITIAL_SQUAD : parsed.squad,
        tasks: parsed.tasks ?? INITIAL_TASKS,
        rewards: parsed.rewards ?? INITIAL_REWARDS,
        achievements: parsed.achievements ?? INITIAL_ACHIEVEMENTS,
        notifications: parsed.notifications ?? INITIAL_NOTIFICATIONS,
        announcements: parsed.announcements ?? INITIAL_ANNOUNCEMENTS,
        auditLogs: parsed.auditLogs ?? INITIAL_AUDIT_LOGS,
        thanosAlerts: parsed.thanosAlerts ?? INITIAL_THANOS_ALERTS,
        demoCohort: mergeRegisteredStudentsIntoCohort(parsed.demoCohort ?? INITIAL_DEMO_COHORT, baseSubjects),
        colleges: parsed.colleges ?? INITIAL_COLLEGES,
        activeCollegeId: parsed.activeCollegeId || INITIAL_COLLEGES[0].id,
        teachers: parsed.teachers ?? INITIAL_TEACHERS,
        morningCheckIns: parsed.morningCheckIns ?? INITIAL_MORNING_CHECKINS,
        hackathons: parsed.hackathons ?? INITIAL_HACKATHONS,
        campusPosts: parsed.campusPosts ?? INITIAL_CAMPUS_POSTS,
        preferences: parsed.preferences ? { ...DEFAULT_PREFERENCES, ...parsed.preferences } : DEFAULT_PREFERENCES,
        featureControls: parsed.featureControls
          ? { ...DEFAULT_FEATURE_CONTROLS, ...parsed.featureControls }
          : DEFAULT_FEATURE_CONTROLS,
      };
    }
  } catch {
    // fallback to defaults
  }

  return {
    subjects: INITIAL_SUBJECTS,
    records: INITIAL_RECORDS,
    semester: INITIAL_SEMESTER,
    odRequests: INITIAL_OD_REQUESTS,
    squad: INITIAL_SQUAD,
    tasks: INITIAL_TASKS,
    rewards: INITIAL_REWARDS,
    achievements: INITIAL_ACHIEVEMENTS,
    notifications: INITIAL_NOTIFICATIONS,
    announcements: INITIAL_ANNOUNCEMENTS,
    auditLogs: INITIAL_AUDIT_LOGS,
    thanosAlerts: INITIAL_THANOS_ALERTS,
    demoCohort: mergeRegisteredStudentsIntoCohort(INITIAL_DEMO_COHORT, INITIAL_SUBJECTS),
    colleges: INITIAL_COLLEGES,
    activeCollegeId: INITIAL_COLLEGES[0].id,
    teachers: INITIAL_TEACHERS,
    morningCheckIns: INITIAL_MORNING_CHECKINS,
    hackathons: INITIAL_HACKATHONS,
    campusPosts: INITIAL_CAMPUS_POSTS,
    preferences: DEFAULT_PREFERENCES,
    featureControls: DEFAULT_FEATURE_CONTROLS,
  };
}

export interface ActiveThanosModal {
  subjectCode: string;
  subjectName: string;
  percentage: number;
  requiredPercentage: number;
  recoveryNeeded: number;
  quote: string;
  isSimulation: boolean;
}

interface AppStateContextValue extends PersistedState {
  heroMood: HeroMood;
  heroMessage: string;
  activeThanosModal: ActiveThanosModal | null;
  levelUpBanner: { level: number; title: string } | null;
  toastMessage: { text: string; tone: 'success' | 'info' } | null;
  survivalSummary: ReturnType<typeof predictHallTicketSurvival>;
  overallSummary: ReturnType<typeof evaluateOverallSubjects>;
  unreadNotificationCount: number;
  dismissThanosModal: () => void;
  dismissLevelUpBanner: () => void;
  showToast: (text: string, tone?: 'success' | 'info') => void;
  dismissToast: () => void;
  triggerHeroReaction: (event: DialogueEvent, ctx?: Parameters<typeof getHeroDialogue>[2], speak?: boolean) => void;
  triggerThanosAlert: (payload: Omit<ActiveThanosModal, 'quote'>, force?: boolean) => void;
  recordStudentAttendance: (subjectId: string, status: 'PRESENT' | 'ABSENT', note?: string) => void;
  undoAttendanceRecord: (recordId: string) => { ok: boolean; error?: string };
  addSubject: (subj: Omit<Subject, 'id' | 'studentId'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  updateSemester: (updates: Partial<SemesterSettings>) => void;
  startCleanSemester: (payload: {
    semesterName: string;
    startDate: string;
    endDate: string;
    examDate: string;
    defaultMinPercentage: number;
  }) => void;
  exportBackupJson: () => string;
  importBackupJson: (rawJson: string) => { ok: boolean; error?: string };
  submitODRequest: (payload: {
    eventName: string;
    eventType: ODEventType;
    startDate: string;
    endDate: string;
    subjectIds: string[];
    periodsPerSubject: number;
    documentNote: string;
  }) => { ok: boolean; error?: string };
  reviewODRequest: (odId: string, decision: 'APPROVED' | 'REJECTED', remarks: string) => { ok: boolean; error?: string };
  facultyUpdateStudentAttendance: (payload: {
    studentId: string;
    subjectId: string;
    newAttended: number;
    newTotal: number;
    reason: string;
  }) => { ok: boolean; error?: string };
  addAnnouncement: (subjectCode: string, title: string, message: string) => void;
  createSquad: (name: string) => void;
  joinSquadByCode: (code: string) => { ok: boolean; error?: string };
  leaveSquad: () => void;
  nudgeSquadMember: (memberId: string) => void;
  addTask: (task: Omit<SquadTask, 'id' | 'rewardClaimed' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<SquadTask>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  purchaseAura: (auraId: string) => { ok: boolean; error?: string };
  equipAura: (auraId: string) => void;
  selectHero: (heroId: HeroId) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  triggerDailyReminder: (force?: boolean) => void;
  requestBrowserNotificationPermission: () => Promise<NotificationPermission | 'unsupported'>;
  updateFeatureControls: (updates: Partial<FeatureControlFlags>) => { ok: boolean; error?: string };
  adminAddStudent: (payload: {
    fullName: string;
    registerNumber: string;
    department: string;
    semesterNumber: number;
    heroAlias?: string;
  }) => { ok: boolean; error?: string };
  adminBroadcastNotification: (payload: {
    target: 'ALL' | 'AT_RISK';
    category: AppNotification['category'];
    title: string;
    message: string;
  }) => { ok: boolean; error?: string };
  setActiveCollegeId: (collegeId: string) => void;
  enrollCollegeInstitution: (payload: {
    code: string;
    name: string;
    city: string;
    adminName: string;
    adminEmail: string;
    departments: string[];
  }) => { ok: boolean; error?: string; college?: CollegeInstitution };
  addTeacherRecord: (payload: {
    fullName: string;
    facultyId: string;
    email: string;
    phone: string;
    gender: GenderCategory;
    department: string;
    designation: string;
    cabinLocation: string;
    assignedSubjectCodes: string[];
    researchAreas: string[];
    officeHours: string;
  }) => { ok: boolean; error?: string };
  submitMorningCheckIn: (
    status: 'COMING' | 'NOT_COMING' | 'LATE',
    reason?: string,
    location?: LocationTrackingInfo
  ) => { ok: boolean; lowAttendanceWarned: boolean };
  updateStudentLocation: (location: LocationTrackingInfo) => void;
  updateMyPrivacyAndDetails: (updates: {
    privacyLocationOptIn?: boolean;
    privacyShowDirectory?: boolean;
    privacyGirlsOnlyConnect?: boolean;
    gender?: GenderCategory;
    phone?: string;
    skills?: string[];
    yearOfStudy?: number;
  }) => void;
  createHackathonPost: (payload: {
    title: string;
    ideaSummary: string;
    domain: string;
    neededRoles: string[];
    techStack: string[];
    teamSizeMax: number;
    deadline: string;
    prizeOrEvent: string;
  }) => { ok: boolean; error?: string };
  applyToHackathon: (hackathonId: string, pitch: string, skills: string) => { ok: boolean; error?: string };
  reviewHackathonApplicant: (hackathonId: string, applicantId: string, decision: 'ACCEPTED' | 'DECLINED') => void;
  createCampusPost: (payload: {
    postType: CampusMediaPost['postType'];
    caption: string;
    tags: string[];
    mediaUrl?: string;
  }) => { ok: boolean; error?: string };
  toggleLikeCampusPost: (postId: string) => void;
  addCommentCampusPost: (postId: string, text: string) => void;
  updatePreferences: (updates: Partial<AppPreferences>) => void;
  resetDemoState: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserProfile } = useAuth();
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [heroMood, setHeroMood] = useState<HeroMood>('happy');
  const [heroMessage, setHeroMessage] = useState<string>(
    'Suit up! Click any subject or open the Bunk Simulator to see live predictions.'
  );
  const [activeThanosModal, setActiveThanosModal] = useState<ActiveThanosModal | null>(null);
  const [levelUpBanner, setLevelUpBanner] = useState<{ level: number; title: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; tone: 'success' | 'info' } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const lastThanosTriggerKeyRef = useRef<string>('');

  const showToast = useCallback((text: string, tone: 'success' | 'info' = 'success') => {
    setToastMessage({ text, tone });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3200);
  }, []);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }, [state]);

  // Automatically include newly registered students (/register) in the college directory
  useEffect(() => {
    setState((prev) => {
      const merged = mergeRegisteredStudentsIntoCohort(prev.demoCohort, prev.subjects, user);
      if (merged === prev.demoCohort) return prev;
      return { ...prev, demoCohort: merged };
    });
  }, [user]);

  const overallSummary = useMemo(() => evaluateOverallSubjects(state.subjects), [state.subjects]);

  const survivalSummary = useMemo(
    () => predictHallTicketSurvival(state.subjects, state.semester, state.odRequests, state.tasks),
    [state.subjects, state.semester, state.odRequests, state.tasks]
  );

  // Sync welcome hero line once user logs in or changes hero
  useEffect(() => {
    if (!user) return;
    const dlg = getHeroDialogue(user.selectedHero, 'WELCOME', {
      percentage: overallSummary.overallEval.exactPercentage,
      daysUntilExam: survivalSummary.daysUntilExam,
      studentName: user.heroAlias || user.fullName,
    });
    setHeroMood(dlg.mood);
    setHeroMessage(dlg.text);
  }, [user?.id, user?.selectedHero]);

  const triggerHeroReaction = useCallback(
    (event: DialogueEvent, ctx?: Parameters<typeof getHeroDialogue>[2], speak = true) => {
      const heroId: HeroId = user?.selectedHero || 'captain-campus';
      const dlg = getHeroDialogue(heroId, event, {
        ...ctx,
        studentName: user?.heroAlias || user?.fullName,
        daysUntilExam: survivalSummary.daysUntilExam,
      });
      setHeroMood(dlg.mood);
      setHeroMessage(dlg.text);
      if (speak && state.preferences.voiceEnabled) {
        speakHeroLine(dlg.text, true, state.preferences.voiceVolume);
      }
    },
    [user?.selectedHero, user?.heroAlias, user?.fullName, survivalSummary.daysUntilExam, state.preferences.voiceEnabled, state.preferences.voiceVolume]
  );

  const triggerThanosAlert = useCallback(
    (payload: Omit<ActiveThanosModal, 'quote'>, force = false) => {
      const key = `${payload.subjectCode}-${payload.percentage.toFixed(2)}-${payload.isSimulation ? 'sim' : 'real'}`;
      if (!force && lastThanosTriggerKeyRef.current === key) return;
      lastThanosTriggerKeyRef.current = key;

      const quote = pickThanosQuote(state.thanosAlerts.length);
      const alertRecord: ThanosAlertRecord = {
        id: `th-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        subjectCode: payload.subjectCode,
        subjectName: payload.subjectName,
        percentage: payload.percentage,
        requiredPercentage: payload.requiredPercentage,
        recoveryNeeded: payload.recoveryNeeded,
        message: quote,
        isSimulation: payload.isSimulation,
        createdAt: new Date().toISOString(),
      };

      setActiveThanosModal({ ...payload, quote });
      setState((prev) => ({
        ...prev,
        thanosAlerts: [alertRecord, ...prev.thanosAlerts].slice(0, 30),
      }));
      playThanosWarningSound(state.preferences.soundEnabled, state.preferences.soundVolume);
    },
    [state.thanosAlerts.length, state.preferences.soundEnabled, state.preferences.soundVolume]
  );

  const dismissThanosModal = () => setActiveThanosModal(null);
  const dismissLevelUpBanner = () => setLevelUpBanner(null);

  const awardCoinsAndXp = (
    eventKey: string,
    coinsDelta: number,
    xpDelta: number,
    description: string,
    source: RewardTransaction['source'],
    currentRewards: RewardTransaction[]
  ): { nextRewards: RewardTransaction[]; awarded: boolean } => {
    if (hasClaimedReward(currentRewards, eventKey)) {
      return { nextRewards: currentRewards, awarded: false };
    }
    const tx: RewardTransaction = {
      id: `rew-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      eventKey,
      description,
      coinsDelta,
      xpDelta,
      source,
      createdAt: new Date().toISOString(),
    };
    if (user) {
      const prevLevel = getLevelInfo(user.xp).level;
      const nextXp = user.xp + xpDelta;
      const nextCoins = user.coins + coinsDelta;
      const nextLevelInfo = getLevelInfo(nextXp);
      updateUserProfile({ coins: nextCoins, xp: nextXp });
      if (nextLevelInfo.level > prevLevel) {
        setLevelUpBanner({ level: nextLevelInfo.level, title: nextLevelInfo.title });
        playShieldUnlockSound(state.preferences.soundEnabled, state.preferences.soundVolume);
      } else {
        playCoinSound(state.preferences.soundEnabled, state.preferences.soundVolume);
      }
    }
    return { nextRewards: [tx, ...currentRewards], awarded: true };
  };

  const syncAchievementsAndNotifications = (
    nextSubjects: Subject[],
    nextTasks: SquadTask[],
    nextODs: ODRequest[],
    nextRewards: RewardTransaction[],
    nextCoins: number,
    nextXp: number,
    nextStreak: number
  ) => {
    const completedTasksCount = nextTasks.filter((t) => t.status === 'COMPLETED').length;
    const approvedODCount = nextODs.filter((o) => o.status === 'APPROVED').length;
    const updatedBadges = evaluateAchievements(
      nextSubjects,
      nextCoins,
      nextXp,
      nextStreak,
      completedTasksCount,
      approvedODCount,
      state.achievements
    );
    return { updatedBadges, nextRewards };
  };

  const recordStudentAttendance = (subjectId: string, status: 'PRESENT' | 'ABSENT', note?: string) => {
    const target = state.subjects.find((s) => s.id === subjectId);
    if (!target || !user) return;
    if (user.role === 'STUDENT' && state.featureControls.studentSelfAttendanceLocked) {
      showToast('Official attendance is locked by College Admin. Contact Faculty or submit an OD.', 'info');
      return;
    }

    const prevEval = evaluateAttendance(target.attended, target.total, target.minPercentage);
    const nextAttended = status === 'PRESENT' ? target.attended + 1 : target.attended;
    const nextTotal = target.total + 1;
    const nextRemaining = Math.max(0, target.remainingClasses - 1);
    const nextEval = evaluateAttendance(nextAttended, nextTotal, target.minPercentage);

    const todayIso = toLocalDateIso();
    const newRecord: AttendanceRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentId: user.id,
      subjectId: target.id,
      subjectCode: target.code,
      subjectName: target.name,
      date: todayIso,
      status,
      periods: 1,
      source: 'STUDENT_SELF',
      note,
      previousAttended: target.attended,
      previousTotal: target.total,
      newAttended: nextAttended,
      newTotal: nextTotal,
      updatedBy: user.fullName,
      createdAt: new Date().toISOString(),
    };

    const nextSubjects = state.subjects.map((s) =>
      s.id === subjectId ? { ...s, attended: nextAttended, total: nextTotal, remainingClasses: nextRemaining } : s
    );

    let nextRewards = state.rewards;
    let earnedCoins = 0;
    let earnedXp = 0;

    if (status === 'PRESENT') {
      const is100After = nextAttended === nextTotal;
      const bonus = is100After ? REWARD_RULES.SHIELD_100_BONUS_COINS : 0;
      earnedCoins = REWARD_RULES.ATTEND_CLASS_COINS + bonus;
      earnedXp = REWARD_RULES.ATTEND_CLASS_XP;
      const eventKey = `att-${newRecord.id}`;
      const res = awardCoinsAndXp(
        eventKey,
        earnedCoins,
        earnedXp,
        `${is100After ? '100% Shield Class' : 'Class Attended'}: ${target.code} ${target.name}`,
        is100After ? 'SHIELD_BONUS' : 'ATTENDANCE',
        state.rewards
      );
      nextRewards = res.nextRewards;

      const isNewDay = user.lastAttendanceDate !== todayIso;
      updateUserProfile({
        classesAttendedToday: user.classesAttendedToday + 1,
        dailyStreak: isNewDay ? user.dailyStreak + 1 : user.dailyStreak,
        lastAttendanceDate: todayIso,
      });
    }

    const addedNotifications: AppNotification[] = [];
    if (!nextEval.isEligible && prevEval.isEligible) {
      addedNotifications.push({
        id: `notif-${Date.now()}`,
        title: `Threshold Crossed: ${target.code}`,
        message: `${target.name} dropped to ${nextEval.displayPercentage}. Attend ${nextEval.requiredRecoveryClasses} straight classes to recover.`,
        category: 'WARNING',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    const updatedBadges = evaluateAchievements(
      nextSubjects,
      user.coins + earnedCoins,
      user.xp + earnedXp,
      user.dailyStreak,
      state.tasks.filter((t) => t.status === 'COMPLETED').length,
      state.odRequests.filter((o) => o.status === 'APPROVED').length,
      state.achievements
    );

    // Update squad member privacy tier automatically without revealing exact %
    const nextPrivacyTier = computeSquadPrivacyTier(nextSubjects);
    const nextSquad = state.squad
      ? {
          ...state.squad,
          members: state.squad.members.map((m) =>
            m.id === user.id
              ? {
                  ...m,
                  privacyTier: nextPrivacyTier,
                  achievementPoints: user.xp + earnedXp,
                  streak: user.dailyStreak,
                }
              : m
          ),
        }
      : null;

    setState((prev) => ({
      ...prev,
      subjects: nextSubjects,
      records: [newRecord, ...prev.records],
      rewards: nextRewards,
      achievements: updatedBadges,
      notifications: [...addedNotifications, ...prev.notifications],
      squad: nextSquad,
    }));

    // Hero reaction + Thanos transition check
    if (status === 'PRESENT') {
      showToast(`${target.code}: Marked Present (+${earnedCoins}🪙, +${earnedXp} XP)`, 'success');
      if (nextEval.isPerfect) {
        triggerHeroReaction('PERFECT_100', { subjectName: target.name, percentage: 100 });
        playShieldUnlockSound(state.preferences.soundEnabled, state.preferences.soundVolume);
      } else if (!prevEval.isEligible && nextEval.isEligible) {
        triggerHeroReaction('RECOVERY_PROGRESS', {
          subjectName: target.name,
          percentage: nextEval.exactPercentage,
          recoveryClasses: 0,
        });
      } else if (!nextEval.isEligible) {
        triggerHeroReaction('RECOVERY_PROGRESS', {
          subjectName: target.name,
          percentage: nextEval.exactPercentage,
          recoveryClasses: nextEval.requiredRecoveryClasses,
        });
      } else {
        triggerHeroReaction('ATTENDANCE_INCREASE', {
          subjectName: target.name,
          percentage: nextEval.exactPercentage,
        });
      }
    } else {
      showToast(`${target.code}: Absence logged (${nextEval.displayPercentage})`, 'info');
      if (!nextEval.isEligible) {
        triggerHeroReaction('BELOW_75', {
          subjectName: target.name,
          percentage: nextEval.exactPercentage,
          recoveryClasses: nextEval.requiredRecoveryClasses,
        });
        triggerThanosAlert({
          subjectCode: target.code,
          subjectName: target.name,
          percentage: nextEval.exactPercentage,
          requiredPercentage: target.minPercentage,
          recoveryNeeded: nextEval.requiredRecoveryClasses,
          isSimulation: false,
        });
      } else if (nextEval.status === 'BORDERLINE') {
        triggerHeroReaction('BORDERLINE_78', {
          subjectName: target.name,
          percentage: nextEval.exactPercentage,
          safeAbsences: nextEval.maxSafeAbsences,
        });
      } else {
        triggerHeroReaction('SAFE_85', {
          subjectName: target.name,
          percentage: nextEval.exactPercentage,
          safeAbsences: nextEval.maxSafeAbsences,
        });
      }
    }
  };

  const addSubject = (subj: Omit<Subject, 'id' | 'studentId'>) => {
    if (user?.role === 'STUDENT' && !state.featureControls.allowStudentSubjectManagement) {
      showToast('Subject editing is managed by College Administration.', 'info');
      return;
    }
    const newSubj: Subject = {
      ...subj,
      id: `subj-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      studentId: user?.id || 'demo-student-1',
    };
    setState((prev) => ({
      ...prev,
      subjects: [...prev.subjects, newSubj],
    }));
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    if (user?.role === 'STUDENT' && !state.featureControls.allowStudentSubjectManagement) {
      showToast('Subject editing is managed by College Administration.', 'info');
      return;
    }
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const deleteSubject = (id: string) => {
    if (user?.role === 'STUDENT' && !state.featureControls.allowStudentSubjectManagement) {
      showToast('Subject deletion is restricted by College Administration.', 'info');
      return;
    }
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== id),
    }));
  };

  const updateSemester = (updates: Partial<SemesterSettings>) => {
    setState((prev) => ({
      ...prev,
      semester: { ...prev.semester, ...updates },
    }));
  };

  const submitODRequest = (payload: {
    eventName: string;
    eventType: ODEventType;
    startDate: string;
    endDate: string;
    subjectIds: string[];
    periodsPerSubject: number;
    documentNote: string;
  }) => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    if (!payload.eventName.trim() || payload.subjectIds.length === 0 || payload.periodsPerSubject < 1) {
      return { ok: false, error: 'Provide an event name, at least one subject, and valid period count.' };
    }

    // Prevent duplicate identical pending OD submission
    const duplicate = state.odRequests.some(
      (od) =>
        od.studentId === user.id &&
        od.eventName.toLowerCase() === payload.eventName.trim().toLowerCase() &&
        od.startDate === payload.startDate &&
        od.status !== 'REJECTED'
    );
    if (duplicate) {
      return { ok: false, error: 'An OD request for this event and start date already exists.' };
    }

    const newOD: ODRequest = {
      id: `od-${Date.now()}`,
      studentId: user.id,
      studentName: user.fullName,
      studentAlias: user.heroAlias,
      eventName: payload.eventName.trim(),
      eventType: payload.eventType,
      startDate: payload.startDate,
      endDate: payload.endDate || payload.startDate,
      subjectIds: payload.subjectIds,
      periodsPerSubject: payload.periodsPerSubject,
      documentNote: payload.documentNote.trim(),
      status: 'PENDING',
      reconciled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const notif: AppNotification = {
      id: `notif-od-${Date.now()}`,
      title: 'OD Request Submitted (Pending Faculty Verification)',
      message: `${newOD.eventName} submitted for ${payload.subjectIds.length} subject(s). Credits apply only after approval.`,
      category: 'OD',
      read: false,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      odRequests: [newOD, ...prev.odRequests],
      notifications: [notif, ...prev.notifications],
    }));
    return { ok: true };
  };

  const reviewODRequest = (odId: string, decision: 'APPROVED' | 'REJECTED', remarks: string) => {
    if (!user || (user.role !== 'FACULTY' && user.role !== 'ADMIN')) {
      return { ok: false, error: 'Unauthorized: Only Faculty or Admin can review OD requests.' };
    }
    const od = state.odRequests.find((o) => o.id === odId);
    if (!od) return { ok: false, error: 'OD request not found.' };
    if (od.reconciled || od.status !== 'PENDING') {
      return { ok: false, error: 'This OD request has already been processed and cannot be duplicated.' };
    }

    const nowIso = new Date().toISOString();
    let nextSubjects = state.subjects;
    const addedRecords: AttendanceRecord[] = [];
    const addedAudits: AuditLogEntry[] = [];

    if (decision === 'APPROVED') {
      nextSubjects = state.subjects.map((subj) => {
        if (!od.subjectIds.includes(subj.id)) return subj;
        const prevAtt = subj.attended;
        const prevTot = subj.total;
        const newAtt = prevAtt + od.periodsPerSubject;
        const newTot = prevTot + od.periodsPerSubject;

        addedRecords.push({
          id: `rec-od-${od.id}-${subj.id}`,
          studentId: od.studentId,
          subjectId: subj.id,
          subjectCode: subj.code,
          subjectName: subj.name,
          date: od.startDate,
          status: 'OD_CREDIT',
          periods: od.periodsPerSubject,
          source: 'OD_RECONCILIATION',
          note: `Approved OD: ${od.eventName} (${remarks || 'Verified'})`,
          previousAttended: prevAtt,
          previousTotal: prevTot,
          newAttended: newAtt,
          newTotal: newTot,
          updatedBy: user.fullName,
          createdAt: nowIso,
        });

        addedAudits.push({
          id: `aud-${Date.now()}-${subj.code}`,
          actorId: user.id,
          actorName: user.fullName,
          actorRole: user.role,
          action: 'APPROVE_OD_RECONCILE',
          targetType: 'OD',
          targetId: od.id,
          previousValue: `${subj.code}: ${prevAtt}/${prevTot}`,
          newValue: `${subj.code}: ${newAtt}/${newTot} (+${od.periodsPerSubject} OD)`,
          reason: remarks || `Approved ${od.eventName}`,
          createdAt: nowIso,
        });

        return {
          ...subj,
          attended: newAtt,
          total: newTot,
        };
      });
    } else {
      addedAudits.push({
        id: `aud-${Date.now()}-rej`,
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.role,
        action: 'REJECT_OD',
        targetType: 'OD',
        targetId: od.id,
        reason: remarks || 'Insufficient documentation',
        createdAt: nowIso,
      });
    }

    const notif: AppNotification = {
      id: `notif-od-rev-${Date.now()}`,
      title: decision === 'APPROVED' ? `OD Approved: ${od.eventName}` : `OD Rejected: ${od.eventName}`,
      message:
        decision === 'APPROVED'
          ? `Reconciled +${od.periodsPerSubject} period(s) per subject into attendance history. Survival score updated!`
          : `Reason: ${remarks || 'Please contact faculty coordinator.'}`,
      category: 'OD',
      read: false,
      createdAt: nowIso,
    };

    setState((prev) => ({
      ...prev,
      subjects: nextSubjects,
      records: [...addedRecords, ...prev.records],
      odRequests: prev.odRequests.map((o) =>
        o.id === odId
          ? {
              ...o,
              status: decision,
              reviewedBy: user.fullName,
              remarks: remarks || (decision === 'APPROVED' ? 'Approved (Demo simulation)' : 'Rejected'),
              reconciled: decision === 'APPROVED',
              updatedAt: nowIso,
            }
          : o
      ),
      auditLogs: [...addedAudits, ...prev.auditLogs],
      notifications: [notif, ...prev.notifications],
    }));

    return { ok: true };
  };

  const facultyUpdateStudentAttendance = (payload: {
    studentId: string;
    subjectId: string;
    newAttended: number;
    newTotal: number;
    reason: string;
  }) => {
    if (!user || (user.role !== 'FACULTY' && user.role !== 'ADMIN')) {
      return { ok: false, error: 'Unauthorized: Faculty or Admin access required.' };
    }
    if (!payload.reason.trim()) {
      return { ok: false, error: 'An audit reason is required for every attendance modification.' };
    }
    if (payload.newTotal < 0 || payload.newAttended < 0 || payload.newAttended > payload.newTotal) {
      return { ok: false, error: 'Attended classes cannot exceed total classes or be negative.' };
    }

    const isDemoMainStudent = payload.studentId === 'demo-student-1';
    const targetSubject = isDemoMainStudent
      ? state.subjects.find((s) => s.id === payload.subjectId)
      : state.demoCohort
          .find((st) => st.id === payload.studentId)
          ?.subjects.find((s) => s.id === payload.subjectId);

    if (!targetSubject) {
      return { ok: false, error: 'Subject record not found.' };
    }

    if (
      user.role === 'FACULTY' &&
      user.assignedSubjectCodes &&
      !user.assignedSubjectCodes.includes(targetSubject.code)
    ) {
      return {
        ok: false,
        error: `Access denied: You are only authorized to modify ${user.assignedSubjectCodes.join(', ')}.`,
      };
    }

    const prevAtt = targetSubject.attended;
    const prevTot = targetSubject.total;
    const nowIso = new Date().toISOString();

    const audit: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: user.role === 'ADMIN' ? 'ADMIN_ATTENDANCE_CORRECTION' : 'FACULTY_ATTENDANCE_UPDATE',
      targetType: 'ATTENDANCE',
      targetId: `${payload.studentId}:${targetSubject.code}`,
      previousValue: `${prevAtt}/${prevTot}`,
      newValue: `${payload.newAttended}/${payload.newTotal}`,
      reason: payload.reason.trim(),
      createdAt: nowIso,
    };

    const nextNotifications = [...state.notifications];
    const eligibleAfter = isAttendanceEligible(payload.newAttended, payload.newTotal, targetSubject.minPercentage);
    if (isDemoMainStudent) {
      nextNotifications.unshift({
        id: `notif-fac-${Date.now()}`,
        title: !eligibleAfter
          ? `Risk Alert (${user.role}): ${targetSubject.code}`
          : `Official Attendance Updated: ${targetSubject.code}`,
        message: !eligibleAfter
          ? `${user.fullName} updated ${targetSubject.code} to ${payload.newAttended}/${payload.newTotal}. Subject is below ${targetSubject.minPercentage}%!`
          : `${user.fullName} updated ${targetSubject.code} to ${payload.newAttended}/${payload.newTotal} (${payload.reason.trim()}).`,
        category: !eligibleAfter ? 'WARNING' : 'ANNOUNCEMENT',
        imageUrl: !eligibleAfter ? 'assets/characters/thanos-admin.jpg' : 'assets/characters/iron-scholar.jpg',
        read: false,
        createdAt: nowIso,
      });
    }

    // Verified Present attendance by Faculty/Admin grants student coins/XP (with deduplication)
    let nextRewards = state.rewards;
    if (isDemoMainStudent && payload.newAttended > prevAtt && payload.newTotal >= prevTot) {
      const gainedClasses = payload.newAttended - prevAtt;
      const is100Now = payload.newTotal > 0 && payload.newAttended === payload.newTotal;
      const coinsEarned =
        gainedClasses * (REWARD_RULES.ATTEND_CLASS_COINS + (is100Now ? REWARD_RULES.SHIELD_100_BONUS_COINS : 0));
      const xpEarned = gainedClasses * REWARD_RULES.ATTEND_CLASS_XP;
      const eventKey = `verified-${audit.id}`;
      if (!hasClaimedReward(nextRewards, eventKey)) {
        nextRewards = [
          {
            id: `rew-${Date.now()}`,
            eventKey,
            description: `Verified ${user.role} Attendance: ${targetSubject.code}`,
            coinsDelta: coinsEarned,
            xpDelta: xpEarned,
            source: is100Now ? 'SHIELD_BONUS' : 'ATTENDANCE',
            createdAt: nowIso,
          },
          ...nextRewards,
        ];
      }
    }

    setState((prev) => ({
      ...prev,
      subjects: isDemoMainStudent
        ? prev.subjects.map((s) =>
            s.id === payload.subjectId ? { ...s, attended: payload.newAttended, total: payload.newTotal } : s
          )
        : prev.subjects,
      demoCohort: !isDemoMainStudent
        ? prev.demoCohort.map((st) =>
            st.id === payload.studentId
              ? {
                  ...st,
                  subjects: st.subjects.map((s) =>
                    s.id === payload.subjectId ? { ...s, attended: payload.newAttended, total: payload.newTotal } : s
                  ),
                }
              : st
          )
        : prev.demoCohort,
      records: isDemoMainStudent
        ? [
            {
              id: `rec-fac-${Date.now()}`,
              studentId: payload.studentId,
              subjectId: targetSubject.id,
              subjectCode: targetSubject.code,
              subjectName: targetSubject.name,
              date: toLocalDateIso(),
              status: payload.newAttended > prevAtt ? 'PRESENT' : 'ABSENT',
              periods: Math.max(1, Math.abs(payload.newTotal - prevTot)),
              source: user.role === 'ADMIN' ? 'ADMIN_CORRECTION' : 'FACULTY_VERIFIED',
              note: payload.reason.trim(),
              previousAttended: prevAtt,
              previousTotal: prevTot,
              newAttended: payload.newAttended,
              newTotal: payload.newTotal,
              updatedBy: user.fullName,
              createdAt: nowIso,
            },
            ...prev.records,
          ]
        : prev.records,
      rewards: nextRewards,
      auditLogs: [audit, ...prev.auditLogs],
      notifications: nextNotifications,
    }));

    return { ok: true };
  };

  const addAnnouncement = (subjectCode: string, title: string, message: string) => {
    if (!user) return;
    const targetCollegeId = user.collegeId || state.activeCollegeId;
    const ann: FacultyAnnouncement = {
      id: `ann-${Date.now()}`,
      collegeId: targetCollegeId,
      authorName: user.fullName,
      subjectCode,
      title,
      message,
      createdAt: new Date().toISOString(),
    };
    const notif: AppNotification = {
      id: `notif-ann-${Date.now()}`,
      collegeId: targetCollegeId,
      title: `Announcement (${subjectCode}): ${title}`,
      message,
      category: 'ANNOUNCEMENT',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      announcements: [ann, ...prev.announcements],
      notifications: [notif, ...prev.notifications],
    }));
  };

  const createSquad = (name: string) => {
    if (!user) return;
    const code = `GUARD-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const newSquad: Squad = {
      id: `squad-${Date.now()}`,
      name: name.trim() || 'Campus Shield Squad',
      code,
      weeklyChallengeTitle: 'Zero Unplanned Bunks This Week',
      weeklyChallengeTarget: 15,
      weeklyChallengeProgress: 3,
      members: [
        {
          id: user.id,
          heroAlias: user.heroAlias,
          selectedHero: user.selectedHero,
          levelTitle: getLevelInfo(user.xp).title,
          achievementPoints: user.xp,
          streak: user.dailyStreak,
          privacyTier: computeSquadPrivacyTier(state.subjects),
        },
      ],
    };
    setState((prev) => ({ ...prev, squad: newSquad }));
  };

  const joinSquadByCode = (code: string) => {
    if (!user) return { ok: false, error: 'Sign in first.' };
    const clean = code.trim().toUpperCase();
    if (!clean) return { ok: false, error: 'Enter a squad code.' };

    if (clean === 'COE-75GUARD') {
      setState((prev) => {
        const exists = INITIAL_SQUAD.members.some((m) => m.id === user.id);
        const members = exists
          ? INITIAL_SQUAD.members
          : [
              ...INITIAL_SQUAD.members,
              {
                id: user.id,
                heroAlias: user.heroAlias,
                selectedHero: user.selectedHero,
                levelTitle: getLevelInfo(user.xp).title,
                achievementPoints: user.xp,
                streak: user.dailyStreak,
                privacyTier: computeSquadPrivacyTier(prev.subjects),
              },
            ];
        return { ...prev, squad: { ...INITIAL_SQUAD, members } };
      });
      return { ok: true };
    }

    if (clean.length < 5) {
      return { ok: false, error: 'Invalid squad code. Try COE-75GUARD or create a new squad.' };
    }

    setState((prev) => ({
      ...prev,
      squad: {
        id: `squad-${clean}`,
        name: `Squad ${clean}`,
        code: clean,
        weeklyChallengeTitle: 'Protect 75% Across All Subjects',
        weeklyChallengeTarget: 10,
        weeklyChallengeProgress: 4,
        members: [
          {
            id: user.id,
            heroAlias: user.heroAlias,
            selectedHero: user.selectedHero,
            levelTitle: getLevelInfo(user.xp).title,
            achievementPoints: user.xp,
            streak: user.dailyStreak,
            privacyTier: computeSquadPrivacyTier(prev.subjects),
          },
          {
            id: 'sq-bot-1',
            heroAlias: 'NovaDefender-12',
            selectedHero: 'doctor-deadline',
            levelTitle: 'Shield Guardian',
            achievementPoints: 580,
            streak: 9,
            privacyTier: 'Safe Zone',
          },
        ],
      },
    }));
    return { ok: true };
  };

  const leaveSquad = () => setState((prev) => ({ ...prev, squad: null }));

  const nudgeSquadMember = (memberId: string) => {
    if (!state.squad) return;
    const target = state.squad.members.find((m) => m.id === memberId);
    if (!target) return;
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      squad: prev.squad
        ? {
            ...prev.squad,
            members: prev.squad.members.map((m) => (m.id === memberId ? { ...m, lastNudgedAt: nowIso } : m)),
          }
        : null,
      notifications: [
        {
          id: `notif-nudge-${Date.now()}`,
          title: `Nudge sent to ${target.heroAlias}`,
          message: `Reminded ${target.heroAlias} to stay locked in for today’s classes!`,
          category: 'SQUAD',
          read: false,
          createdAt: nowIso,
        },
        ...prev.notifications,
      ],
    }));
  };

  const addTask = (task: Omit<SquadTask, 'id' | 'rewardClaimed' | 'createdAt'>) => {
    const newTask: SquadTask = {
      ...task,
      id: `task-${Date.now()}`,
      rewardClaimed: false,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
  };

  const updateTask = (id: string, updates: Partial<SquadTask>) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const deleteTask = (id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  };

  const toggleTaskCompletion = (id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    const nextStatus: SquadTask['status'] = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    let nextRewards = state.rewards;
    let rewardClaimed = task.rewardClaimed;

    if (nextStatus === 'COMPLETED' && !task.rewardClaimed) {
      const rule = REWARD_RULES.TASK_REWARDS[task.category] || { coins: 15, xp: 15 };
      const res = awardCoinsAndXp(
        `task-complete-${task.id}`,
        rule.coins,
        rule.xp,
        `Completed ${task.category}: ${task.title}`,
        'TASK',
        state.rewards
      );
      nextRewards = res.nextRewards;
      rewardClaimed = true;
      triggerHeroReaction('TASK_COMPLETE');
    }

    const nextTasks = state.tasks.map((t) =>
      t.id === id ? { ...t, status: nextStatus, rewardClaimed } : t
    );

    const { updatedBadges } = syncAchievementsAndNotifications(
      state.subjects,
      nextTasks,
      state.odRequests,
      nextRewards,
      user?.coins || 0,
      user?.xp || 0,
      user?.dailyStreak || 0
    );

    setState((prev) => ({
      ...prev,
      tasks: nextTasks,
      rewards: nextRewards,
      achievements: updatedBadges,
    }));
  };

  const purchaseAura = (auraId: string) => {
    if (!user) return { ok: false, error: 'Sign in first.' };
    const item = HERO_AURAS.find((a) => a.id === auraId);
    if (!item) return { ok: false, error: 'Aura not found.' };
    if (user.unlockedAuras.includes(auraId)) {
      updateUserProfile({ equippedAura: auraId });
      return { ok: true };
    }
    if (user.coins < item.costCoins) {
      return { ok: false, error: `Need ${item.costCoins - user.coins} more coins to unlock ${item.name}.` };
    }
    updateUserProfile({
      coins: user.coins - item.costCoins,
      unlockedAuras: [...user.unlockedAuras, auraId],
      equippedAura: auraId,
    });
    playShieldUnlockSound(state.preferences.soundEnabled, state.preferences.soundVolume);
    return { ok: true };
  };

  const equipAura = (auraId: string) => {
    if (!user || !user.unlockedAuras.includes(auraId)) return;
    updateUserProfile({ equippedAura: auraId });
  };

  const selectHero = (heroId: HeroId) => {
    updateUserProfile({ selectedHero: heroId });
    const dlg = getHeroDialogue(heroId, 'WELCOME', {
      percentage: overallSummary.overallEval.exactPercentage,
      daysUntilExam: survivalSummary.daysUntilExam,
      studentName: user?.heroAlias || user?.fullName,
    });
    setHeroMood(dlg.mood);
    setHeroMessage(dlg.text);
  };

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const dismissNotification = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  };

  const updatePreferences = (updates: Partial<AppPreferences>) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates },
    }));
  };

  const undoAttendanceRecord = (recordId: string) => {
    if (user?.role === 'STUDENT' && state.featureControls.studentSelfAttendanceLocked) {
      return { ok: false, error: 'Official attendance records are locked by College Administration.' };
    }
    const rec = state.records.find((r) => r.id === recordId);
    if (!rec) return { ok: false, error: 'Record not found.' };
    if (rec.source !== 'STUDENT_SELF') {
      return { ok: false, error: 'Only self-logged student records can be undone directly.' };
    }

    const subj = state.subjects.find((s) => s.id === rec.subjectId);
    const nextSubjects = subj
      ? state.subjects.map((s) => {
          if (s.id !== rec.subjectId) return s;
          const revertedTotal = Math.max(0, s.total - rec.periods);
          const revertedAttended =
            rec.status === 'PRESENT' ? Math.max(0, Math.min(revertedTotal, s.attended - rec.periods)) : s.attended;
          return {
            ...s,
            attended: revertedAttended,
            total: revertedTotal,
            remainingClasses: s.remainingClasses + rec.periods,
          };
        })
      : state.subjects;

    const rewardEventKey = `att-${rec.id}`;
    const rewardTx = state.rewards.find((tx) => tx.eventKey === rewardEventKey);
    if (rewardTx && user) {
      updateUserProfile({
        coins: Math.max(0, user.coins - rewardTx.coinsDelta),
        xp: Math.max(0, user.xp - rewardTx.xpDelta),
        classesAttendedToday:
          rec.date === toLocalDateIso() && rec.status === 'PRESENT'
            ? Math.max(0, user.classesAttendedToday - 1)
            : user.classesAttendedToday,
      });
    }

    setState((prev) => ({
      ...prev,
      subjects: nextSubjects,
      records: prev.records.filter((r) => r.id !== recordId),
      rewards: prev.rewards.filter((tx) => tx.eventKey !== rewardEventKey),
    }));
    showToast(`Undid ${rec.subjectCode} log cleanly`, 'info');
    return { ok: true };
  };

  const startCleanSemester = (payload: {
    semesterName: string;
    startDate: string;
    endDate: string;
    examDate: string;
    defaultMinPercentage: number;
  }) => {
    lastThanosTriggerKeyRef.current = '';
    if (user) {
      updateUserProfile({
        coins: 50,
        xp: 0,
        dailyStreak: 0,
        weeklyStreak: 0,
        classesAttendedToday: 0,
        lastAttendanceDate: null,
      });
    }
    setState((prev) => ({
      ...prev,
      subjects: [],
      records: [],
      odRequests: [],
      tasks: [],
      rewards: [],
      thanosAlerts: [],
      notifications: [
        {
          id: `notif-clean-${Date.now()}`,
          title: 'Personal Semester Initialized!',
          message: `Started "${payload.semesterName}". Add your subjects in Subjects and configure your timetable in Semester Radar.`,
          category: 'EXAM',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      semester: {
        ...prev.semester,
        semesterName: payload.semesterName.trim() || 'My College Semester',
        startDate: payload.startDate,
        endDate: payload.endDate,
        examDate: payload.examDate,
        defaultMinPercentage: Math.max(50, Math.min(95, payload.defaultMinPercentage)),
        holidays: [],
        importantEvents: [
          {
            id: `ev-exam-${Date.now()}`,
            date: payload.examDate,
            title: 'End-Semester Examinations Begin',
            type: 'EXAM',
          },
        ],
        timetable: { 1: [], 2: [], 3: [], 4: [], 5: [] },
      },
    }));
  };

  const exportBackupJson = () =>
    JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        profile: user,
        state,
      },
      null,
      2
    );

  const importBackupJson = (rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson) as { profile?: Partial<typeof user>; state?: Partial<PersistedState> };
      if (!parsed.state || !Array.isArray(parsed.state.subjects)) {
        return { ok: false, error: 'Invalid AttendanceGuard backup file.' };
      }
      setState((prev) => ({
        ...prev,
        ...parsed.state,
        preferences: parsed.state?.preferences
          ? { ...DEFAULT_PREFERENCES, ...parsed.state.preferences }
          : prev.preferences,
      }));
      if (parsed.profile && user) {
        const { id: _id, role: _role, ...safeProfileFields } = parsed.profile;
        updateUserProfile(safeProfileFields);
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Could not parse JSON backup file.' };
    }
  };

  const triggerDailyReminder = useCallback(
    (force = false) => {
      if (!user || user.role !== 'STUDENT') return;
      const now = new Date();
      const todayIso = toLocalDateIso(now);
      if (!force && state.preferences.lastDailyReminderDate === todayIso) return;

      const weekday = now.getDay();
      const scheduledCodes = state.semester.timetable[weekday] || [];
      const atRiskSubjects = state.subjects.filter(
        (s) => !isAttendanceEligible(s.attended, s.total, s.minPercentage)
      );
      const pendingTasks = state.tasks.filter((t) => t.status !== 'COMPLETED');
      const heroImg =
        atRiskSubjects.length > 0
          ? 'assets/characters/thanos-admin.jpg'
          : `assets/characters/${user.selectedHero}.jpg`;

      const parts: string[] = [];
      parts.push(
        scheduledCodes.length > 0
          ? `Today’s classes: ${scheduledCodes.join(', ')}.`
          : 'No regular timetable periods scheduled today.'
      );
      if (atRiskSubjects.length > 0) {
        parts.push(
          `Alert: ${atRiskSubjects.map((s) => s.code).join(', ')} below ${atRiskSubjects[0].minPercentage}% — don’t skip!`
        );
      } else {
        parts.push(`Overall attendance: ${overallSummary.overallEval.displayPercentage}.`);
      }
      if (pendingTasks.length > 0) {
        parts.push(`${pendingTasks.length} pending task(s) in Squad Board.`);
      }

      const title =
        atRiskSubjects.length > 0
          ? 'Daily College Reminder • Recovery Alert'
          : 'Daily College Reminder • Morning Check-In';
      const message = parts.join(' ');

      const notif: AppNotification = {
        id: `notif-daily-${Date.now()}`,
        title,
        message,
        category: atRiskSubjects.length > 0 ? 'RECOVERY' : 'EXAM',
        imageUrl: heroImg,
        read: false,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        notifications: [notif, ...prev.notifications],
        preferences: { ...prev.preferences, lastDailyReminderDate: todayIso },
      }));

      showToast(force ? 'Daily reminder notification triggered!' : title, 'info');

      if (
        state.preferences.browserNotificationsEnabled &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(title, {
            body: message,
            icon: assetUrl(heroImg),
          });
        } catch {
          // ignore notification constructor errors in restricted environments
        }
      }
    },
    [
      user,
      state.preferences.lastDailyReminderDate,
      state.preferences.browserNotificationsEnabled,
      state.semester.timetable,
      state.subjects,
      state.tasks,
      overallSummary.overallEval.displayPercentage,
      showToast,
    ]
  );

  const requestBrowserNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      updatePreferences({ browserNotificationsEnabled: true });
      showToast('Browser notifications enabled with character icons!', 'success');
    } else {
      updatePreferences({ browserNotificationsEnabled: false });
      showToast('Browser notifications were blocked or dismissed.', 'info');
    }
    return perm;
  };

  // Automatic daily reminder check when app is open at/after configured reminder time
  useEffect(() => {
    if (!user || user.role !== 'STUDENT' || !state.preferences.dailyReminderEnabled) return;
    const now = new Date();
    const todayIso = toLocalDateIso(now);
    if (state.preferences.lastDailyReminderDate === todayIso) return;
    const [hh, mm] = (state.preferences.dailyReminderTime || '08:30').split(':').map(Number);
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const targetMins = (hh || 8) * 60 + (mm || 30);
    if (currentMins >= targetMins) {
      triggerDailyReminder(false);
    }
  }, [
    user?.id,
    user?.role,
    state.preferences.dailyReminderEnabled,
    state.preferences.dailyReminderTime,
    state.preferences.lastDailyReminderDate,
    triggerDailyReminder,
  ]);

  const updateFeatureControls = (updates: Partial<FeatureControlFlags>) => {
    if (!user || user.role !== 'ADMIN') {
      return { ok: false, error: 'Only College Administrators can change platform feature controls.' };
    }
    const nextControls = { ...state.featureControls, ...updates };
    const nowIso = new Date().toISOString();
    const audit: AuditLogEntry = {
      id: `aud-ctrl-${Date.now()}`,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'ADMIN_FEATURE_CONTROL_UPDATE',
      targetType: 'SETTINGS',
      targetId: 'featureControls',
      previousValue: JSON.stringify(state.featureControls),
      newValue: JSON.stringify(nextControls),
      reason: 'Institutional feature control updated',
      createdAt: nowIso,
    };
    setState((prev) => ({
      ...prev,
      featureControls: nextControls,
      auditLogs: [audit, ...prev.auditLogs],
    }));
    showToast('Institutional feature controls updated!', 'success');
    return { ok: true };
  };

  const adminAddStudent = (payload: {
    fullName: string;
    registerNumber: string;
    department: string;
    semesterNumber: number;
    heroAlias?: string;
  }) => {
    if (!user || user.role !== 'ADMIN') {
      return { ok: false, error: 'Only College Administrators can enroll students.' };
    }
    if (!payload.fullName.trim() || !payload.registerNumber.trim()) {
      return { ok: false, error: 'Student full name and register number are required.' };
    }
    const newId = `demo-student-${Date.now()}`;
    const regClean = payload.registerNumber.trim().toUpperCase();
    const enrolledSubjects: Subject[] = state.subjects.map((s, idx) => ({
      ...s,
      id: `${newId}-s${idx + 1}`,
      studentId: newId,
      attended: 0,
      total: 0,
    }));
    const newStudent: DemoStudentRecord = {
      id: newId,
      collegeId: user.collegeId || state.activeCollegeId,
      fullName: payload.fullName.trim(),
      heroAlias: payload.heroAlias?.trim() || `Guard-${regClean.slice(-3)}`,
      registerNumber: regClean,
      department: payload.department.trim() || 'CSE',
      semesterNumber: payload.semesterNumber || 5,
      yearOfStudy: Math.max(1, Math.min(4, Math.ceil((payload.semesterNumber || 5) / 2))),
      gender: 'OTHER',
      email: `${regClean.toLowerCase()}@campus.edu`,
      phone: '',
      residenceType: 'Day Scholar',
      skills: ['React', 'Python'],
      hackathonInterest: 'Open to College Hackathons',
      privacyShowProfile: true,
      privacyShowLocation: false,
      subjects: enrolledSubjects,
    };
    const audit: AuditLogEntry = {
      id: `aud-stu-${Date.now()}`,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'ADMIN_ENROLL_STUDENT',
      targetType: 'AUTH',
      targetId: regClean,
      newValue: `${newStudent.fullName} (${regClean})`,
      reason: 'New student enrolled by College Admin',
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      demoCohort: [newStudent, ...prev.demoCohort],
      auditLogs: [audit, ...prev.auditLogs],
    }));
    showToast(`Enrolled ${newStudent.fullName} (${regClean}) across ${enrolledSubjects.length} subjects!`, 'success');
    return { ok: true };
  };

  const adminBroadcastNotification = (payload: {
    target: 'ALL' | 'AT_RISK';
    category: AppNotification['category'];
    title: string;
    message: string;
  }) => {
    if (!user || user.role !== 'ADMIN') {
      return { ok: false, error: 'Only College Administrators can broadcast official notifications.' };
    }
    if (!payload.title.trim() || !payload.message.trim()) {
      return { ok: false, error: 'Notification title and message are required.' };
    }
    const nowIso = new Date().toISOString();
    const imgPath =
      payload.category === 'WARNING' || payload.category === 'RECOVERY'
        ? 'assets/characters/thanos-admin.jpg'
        : payload.category === 'EXAM'
        ? 'assets/characters/doctor-deadline.jpg'
        : 'assets/characters/captain-campus.jpg';

    const targetCollegeId = user.collegeId || state.activeCollegeId;
    const notif: AppNotification = {
      id: `notif-adm-${Date.now()}`,
      collegeId: targetCollegeId,
      title: `[${payload.target === 'AT_RISK' ? 'AT-RISK ALERT' : 'COLLEGE NOTICE'}] ${payload.title.trim()}`,
      message: payload.message.trim(),
      category: payload.category,
      imageUrl: imgPath,
      read: false,
      createdAt: nowIso,
    };

    const ann: FacultyAnnouncement = {
      id: `ann-adm-${Date.now()}`,
      collegeId: targetCollegeId,
      authorName: `${user.fullName} (Admin)`,
      subjectCode: payload.target === 'AT_RISK' ? 'AT-RISK (<75%)' : 'ALL',
      title: payload.title.trim(),
      message: payload.message.trim(),
      createdAt: nowIso,
    };

    const audit: AuditLogEntry = {
      id: `aud-notif-${Date.now()}`,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'ADMIN_BROADCAST_NOTIFICATION',
      targetType: 'SETTINGS',
      targetId: payload.target,
      newValue: payload.title.trim(),
      reason: `Sent ${payload.category} alert to ${payload.target}`,
      createdAt: nowIso,
    };

    setState((prev) => ({
      ...prev,
      notifications: [notif, ...prev.notifications],
      announcements: [ann, ...prev.announcements],
      auditLogs: [audit, ...prev.auditLogs],
    }));

    if (
      state.preferences.browserNotificationsEnabled &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(notif.title, { body: notif.message, icon: assetUrl(imgPath) });
      } catch {
        // ignore
      }
    }

    showToast(`Official notification dispatched to ${payload.target === 'AT_RISK' ? 'At-Risk Students' : 'All Students'}!`, 'success');
    return { ok: true };
  };

  useEffect(() => {
    if (user?.collegeId && state.colleges.some((c) => c.id === user.collegeId) && state.activeCollegeId !== user.collegeId) {
      setState((prev) => ({ ...prev, activeCollegeId: user.collegeId! }));
    }
  }, [user?.collegeId, state.colleges, state.activeCollegeId]);

  const setActiveCollegeId = (collegeId: string) => {
    setState((prev) => ({ ...prev, activeCollegeId: collegeId }));
  };

  const enrollCollegeInstitution = (payload: {
    code: string;
    name: string;
    city: string;
    adminName: string;
    adminEmail: string;
    departments: string[];
  }) => {
    const cleanCode = payload.code.trim().toUpperCase();
    if (!cleanCode || !payload.name.trim() || !payload.adminEmail.includes('@')) {
      return { ok: false, error: 'College code, name, and valid admin email are required.' };
    }
    if (state.colleges.some((c) => c.code.toUpperCase() === cleanCode)) {
      return { ok: false, error: `College code ${cleanCode} is already enrolled.` };
    }
    const newCollege: CollegeInstitution = {
      id: `clg-${cleanCode.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`,
      code: cleanCode,
      name: payload.name.trim(),
      city: payload.city.trim() || 'India',
      campusLat: 13.0108,
      campusLng: 80.2354,
      campusRadiusMeters: 850,
      adminName: payload.adminName.trim() || 'College Admin',
      adminEmail: payload.adminEmail.trim().toLowerCase(),
      departments:
        payload.departments.length > 0 ? payload.departments : ['CSE', 'AI&DS', 'ECE', 'IT'],
      createdAt: new Date().toISOString(),
    };

    const welcomeNotif: AppNotification = {
      id: `notif-clg-${Date.now()}`,
      collegeId: newCollege.id,
      title: `Welcome ${newCollege.name} (${newCollege.code})`,
      message: `Your institution has been enrolled with isolated announcements, roll call, and campus social hub.`,
      category: 'ANNOUNCEMENT',
      imageUrl: 'assets/characters/captain-campus.jpg',
      read: false,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      colleges: [newCollege, ...prev.colleges],
      activeCollegeId: newCollege.id,
      notifications: [welcomeNotif, ...prev.notifications],
    }));
    showToast(`Enrolled ${newCollege.name} (${newCollege.code})!`, 'success');
    return { ok: true, college: newCollege };
  };

  const addTeacherRecord = (payload: {
    fullName: string;
    facultyId: string;
    email: string;
    phone: string;
    gender: GenderCategory;
    department: string;
    designation: string;
    cabinLocation: string;
    assignedSubjectCodes: string[];
    researchAreas: string[];
    officeHours: string;
  }) => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'FACULTY')) {
      return { ok: false, error: 'Only Admin or Faculty can add teachers to the college directory.' };
    }
    if (!payload.fullName.trim() || !payload.facultyId.trim()) {
      return { ok: false, error: 'Teacher name and Faculty ID are required.' };
    }
    const newTeacher: TeacherDirectoryRecord = {
      id: `tch-${Date.now()}`,
      collegeId: user.collegeId || state.activeCollegeId,
      fullName: payload.fullName.trim(),
      facultyId: payload.facultyId.trim().toUpperCase(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      gender: payload.gender,
      department: payload.department.trim() || 'CSE',
      designation: payload.designation.trim() || 'Assistant Professor',
      cabinLocation: payload.cabinLocation.trim() || 'Academic Block',
      assignedSubjectCodes: payload.assignedSubjectCodes.map((c) => c.trim().toUpperCase()).filter(Boolean),
      researchAreas: payload.researchAreas.filter(Boolean),
      officeHours: payload.officeHours.trim() || 'Mon–Fri • 2:00 PM – 4:00 PM',
      privacyShowLocation: true,
      location: {
        optedIn: true,
        zoneLabel: payload.cabinLocation.trim() || 'Faculty Wing',
        onCampus: true,
        updatedAt: new Date().toISOString(),
      },
    };
    setState((prev) => ({
      ...prev,
      teachers: [newTeacher, ...prev.teachers],
    }));
    showToast(`Added ${newTeacher.fullName} to Teacher Directory!`, 'success');
    return { ok: true };
  };

  const submitMorningCheckIn = (
    status: 'COMING' | 'NOT_COMING' | 'LATE',
    reason?: string,
    location?: LocationTrackingInfo
  ) => {
    if (!user) return { ok: false, lowAttendanceWarned: false };
    const todayIso = toLocalDateIso();
    const overallPct = overallSummary.overallEval.exactPercentage;
    const hasLowSubject = overallSummary.atRiskCount > 0 || overallPct < 75;
    const lowAttendanceWarned = hasLowSubject && status === 'NOT_COMING';

    const entry: MorningCheckInResponse = {
      id: `mci-${Date.now()}`,
      date: todayIso,
      studentId: user.id,
      studentName: user.fullName,
      registerNumber: user.registerNumber,
      collegeId: user.collegeId || state.activeCollegeId,
      department: user.department,
      yearOfStudy: user.yearOfStudy || Math.max(1, Math.min(4, Math.ceil((user.semesterNumber || 5) / 2))),
      gender: user.gender || 'OTHER',
      status,
      reason: reason?.trim(),
      lowAttendanceWarned: hasLowSubject,
      overallPercentage: overallPct,
      location: user.privacyLocationOptIn ? location : undefined,
      createdAt: new Date().toISOString(),
    };

    const extraNotifications: AppNotification[] = [];
    if (lowAttendanceWarned) {
      extraNotifications.push({
        id: `notif-mci-warn-${Date.now()}`,
        collegeId: entry.collegeId,
        title: 'Urgent Morning Advisory: Low Attendance (< 75%)',
        message: `You marked "Not Coming", but your attendance is ${overallPct.toFixed(2)}% with ${overallSummary.atRiskCount} at-risk subject(s). Try attending today to avoid Thanos Detention!`,
        category: 'WARNING',
        imageUrl: 'assets/characters/thanos-admin.jpg',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    setState((prev) => ({
      ...prev,
      morningCheckIns: [entry, ...prev.morningCheckIns.filter((m) => !(m.studentId === user.id && m.date === todayIso))],
      notifications: [...extraNotifications, ...prev.notifications],
    }));

    showToast(
      lowAttendanceWarned
        ? 'Check-in saved — WARNING: Your attendance is low, we strongly advise coming today!'
        : `Morning check-in saved: ${status === 'COMING' ? 'Attending Today' : status === 'LATE' ? 'Arriving Late' : 'Absent Today'}`,
      lowAttendanceWarned ? 'info' : 'success'
    );
    return { ok: true, lowAttendanceWarned };
  };

  const updateStudentLocation = (location: LocationTrackingInfo) => {
    if (!user) return;
    updateUserProfile({ privacyLocationOptIn: location.optedIn });
    setState((prev) => ({
      ...prev,
      demoCohort: prev.demoCohort.map((st) =>
        st.id === user.id
          ? { ...st, privacyShowLocation: location.optedIn, location }
          : st
      ),
      morningCheckIns: prev.morningCheckIns.map((m) =>
        m.studentId === user.id && m.date === toLocalDateIso()
          ? { ...m, location: location.optedIn ? location : undefined }
          : m
      ),
    }));
    showToast(
      location.optedIn ? `Live Campus Zone updated: ${location.zoneLabel}` : 'Location sharing paused for privacy.',
      'success'
    );
  };

  const updateMyPrivacyAndDetails = (updates: {
    privacyLocationOptIn?: boolean;
    privacyShowDirectory?: boolean;
    privacyGirlsOnlyConnect?: boolean;
    gender?: GenderCategory;
    phone?: string;
    skills?: string[];
    yearOfStudy?: number;
  }) => {
    if (!user) return;
    updateUserProfile(updates);
    setState((prev) => ({
      ...prev,
      demoCohort: prev.demoCohort.map((st) =>
        st.id === user.id
          ? {
              ...st,
              privacyShowLocation: updates.privacyLocationOptIn ?? st.privacyShowLocation,
              privacyShowProfile: updates.privacyShowDirectory ?? st.privacyShowProfile,
              gender: updates.gender ?? st.gender,
              phone: updates.phone ?? st.phone,
              skills: updates.skills ?? st.skills,
              yearOfStudy: updates.yearOfStudy ?? st.yearOfStudy,
            }
          : st
      ),
    }));
    showToast('Privacy & profile details saved!', 'success');
  };

  const createHackathonPost = (payload: {
    title: string;
    ideaSummary: string;
    domain: string;
    neededRoles: string[];
    techStack: string[];
    teamSizeMax: number;
    deadline: string;
    prizeOrEvent: string;
  }) => {
    if (!user) return { ok: false, error: 'Sign in required.' };
    if (!payload.title.trim() || !payload.ideaSummary.trim()) {
      return { ok: false, error: 'Project title and idea summary are required.' };
    }
    const post: HackathonPost = {
      id: `hack-${Date.now()}`,
      collegeId: user.collegeId || state.activeCollegeId,
      creatorId: user.id,
      creatorName: user.fullName,
      creatorDept: user.department || 'CSE',
      creatorYear: user.yearOfStudy || 3,
      creatorGender: user.gender || 'OTHER',
      title: payload.title.trim(),
      ideaSummary: payload.ideaSummary.trim(),
      domain: payload.domain.trim() || 'AI & Web',
      neededRoles: payload.neededRoles.filter(Boolean),
      techStack: payload.techStack.filter(Boolean),
      teamSizeMax: Math.max(2, Math.min(8, payload.teamSizeMax || 4)),
      currentMembers: 1,
      deadline: payload.deadline || toLocalDateIso(),
      prizeOrEvent: payload.prizeOrEvent.trim() || 'College / Inter-College Hackathon',
      status: 'OPEN',
      applicants: [],
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      hackathons: [post, ...prev.hackathons],
    }));
    showToast(`Hackathon pitch "${post.title}" published!`, 'success');
    return { ok: true };
  };

  const applyToHackathon = (hackathonId: string, pitch: string, skills: string) => {
    if (!user) return { ok: false, error: 'Sign in required.' };
    const target = state.hackathons.find((h) => h.id === hackathonId);
    if (!target) return { ok: false, error: 'Hackathon project not found.' };
    if (target.applicants.some((a) => a.applicantId === user.id)) {
      return { ok: false, error: 'You have already applied to this team!' };
    }
    const applicant = {
      id: `app-${Date.now()}`,
      applicantId: user.id,
      applicantName: user.fullName,
      department: user.department || 'CSE',
      yearOfStudy: user.yearOfStudy || 3,
      skills: skills.trim() || (user.skills || ['React']).join(', '),
      pitch: pitch.trim() || 'Excited to collaborate on this hackathon idea!',
      status: 'PENDING' as const,
      appliedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      hackathons: prev.hackathons.map((h) =>
        h.id === hackathonId ? { ...h, applicants: [applicant, ...h.applicants] } : h
      ),
    }));
    showToast(`Applied to "${target.title}"!`, 'success');
    return { ok: true };
  };

  const reviewHackathonApplicant = (hackathonId: string, applicantId: string, decision: 'ACCEPTED' | 'DECLINED') => {
    setState((prev) => ({
      ...prev,
      hackathons: prev.hackathons.map((h) => {
        if (h.id !== hackathonId) return h;
        const nextApplicants = h.applicants.map((a) => (a.id === applicantId ? { ...a, status: decision } : a));
        const acceptedCount = nextApplicants.filter((a) => a.status === 'ACCEPTED').length;
        return {
          ...h,
          applicants: nextApplicants,
          currentMembers: Math.min(h.teamSizeMax, 1 + acceptedCount),
        };
      }),
    }));
    showToast(`Applicant ${decision.toLowerCase()}!`, 'success');
  };

  const createCampusPost = (payload: {
    postType: CampusMediaPost['postType'];
    caption: string;
    tags: string[];
    mediaUrl?: string;
  }) => {
    if (!user) return { ok: false, error: 'Sign in required.' };
    if (!payload.caption.trim()) return { ok: false, error: 'Write a caption or update first.' };
    const newPost: CampusMediaPost = {
      id: `post-${Date.now()}`,
      collegeId: user.collegeId || state.activeCollegeId,
      authorId: user.id,
      authorName: user.fullName,
      authorAlias: user.heroAlias,
      authorRole: user.role,
      authorDept: user.department || 'CSE',
      authorYear: user.yearOfStudy || 3,
      authorGender: user.gender || 'OTHER',
      postType: payload.postType,
      caption: payload.caption.trim(),
      tags: payload.tags.filter(Boolean),
      mediaUrl: payload.mediaUrl?.trim() || undefined,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      campusPosts: [newPost, ...prev.campusPosts],
    }));
    showToast(`${payload.postType} shared with your college feed!`, 'success');
    return { ok: true };
  };

  const toggleLikeCampusPost = (postId: string) => {
    if (!user) return;
    setState((prev) => ({
      ...prev,
      campusPosts: prev.campusPosts.map((p) => {
        if (p.id !== postId) return p;
        const liked = p.likes.includes(user.id);
        return {
          ...p,
          likes: liked ? p.likes.filter((id) => id !== user.id) : [...p.likes, user.id],
        };
      }),
    }));
  };

  const addCommentCampusPost = (postId: string, text: string) => {
    if (!user || !text.trim()) return;
    setState((prev) => ({
      ...prev,
      campusPosts: prev.campusPosts.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: `cmt-${Date.now()}`,
                  authorName: user.fullName,
                  text: text.trim(),
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : p
      ),
    }));
  };

  const resetDemoState = () => {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem('ag_demo_student_profile_v1');
    lastThanosTriggerKeyRef.current = '';
    setState({
      subjects: INITIAL_SUBJECTS,
      records: INITIAL_RECORDS,
      semester: INITIAL_SEMESTER,
      odRequests: INITIAL_OD_REQUESTS,
      squad: INITIAL_SQUAD,
      tasks: INITIAL_TASKS,
      rewards: INITIAL_REWARDS,
      achievements: INITIAL_ACHIEVEMENTS,
      notifications: INITIAL_NOTIFICATIONS,
      announcements: INITIAL_ANNOUNCEMENTS,
      auditLogs: INITIAL_AUDIT_LOGS,
      thanosAlerts: INITIAL_THANOS_ALERTS,
      demoCohort: INITIAL_DEMO_COHORT,
      colleges: INITIAL_COLLEGES,
      activeCollegeId: INITIAL_COLLEGES[0].id,
      teachers: INITIAL_TEACHERS,
      morningCheckIns: INITIAL_MORNING_CHECKINS,
      hackathons: INITIAL_HACKATHONS,
      campusPosts: INITIAL_CAMPUS_POSTS,
      preferences: DEFAULT_PREFERENCES,
      featureControls: DEFAULT_FEATURE_CONTROLS,
    });
  };

  const scopedCollegeId = user?.collegeId || state.activeCollegeId;
  const scopedAnnouncements = useMemo(
    () => state.announcements.filter((a) => !a.collegeId || a.collegeId === scopedCollegeId),
    [state.announcements, scopedCollegeId]
  );
  const scopedNotifications = useMemo(
    () => state.notifications.filter((n) => !n.collegeId || n.collegeId === scopedCollegeId),
    [state.notifications, scopedCollegeId]
  );

  const unreadNotificationCount = useMemo(
    () => scopedNotifications.filter((n) => !n.read).length,
    [scopedNotifications]
  );

  return (
    <AppStateContext.Provider
      value={{
        ...state,
        announcements: scopedAnnouncements,
        notifications: scopedNotifications,
        heroMood,
        heroMessage,
        activeThanosModal,
        levelUpBanner,
        toastMessage,
        survivalSummary,
        overallSummary,
        unreadNotificationCount,
        dismissThanosModal,
        dismissLevelUpBanner,
        showToast,
        dismissToast,
        triggerHeroReaction,
        triggerThanosAlert,
        recordStudentAttendance,
        undoAttendanceRecord,
        addSubject,
        updateSubject,
        deleteSubject,
        updateSemester,
        startCleanSemester,
        exportBackupJson,
        importBackupJson,
        submitODRequest,
        reviewODRequest,
        facultyUpdateStudentAttendance,
        addAnnouncement,
        createSquad,
        joinSquadByCode,
        leaveSquad,
        nudgeSquadMember,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompletion,
        purchaseAura,
        equipAura,
        selectHero,
        markNotificationRead,
        markAllNotificationsRead,
        dismissNotification,
        triggerDailyReminder,
        requestBrowserNotificationPermission,
        updateFeatureControls,
        adminAddStudent,
        adminBroadcastNotification,
        setActiveCollegeId,
        enrollCollegeInstitution,
        addTeacherRecord,
        submitMorningCheckIn,
        updateStudentLocation,
        updateMyPrivacyAndDetails,
        createHackathonPost,
        applyToHackathon,
        reviewHackathonApplicant,
        createCampusPost,
        toggleLikeCampusPost,
        addCommentCampusPost,
        updatePreferences,
        resetDemoState,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
