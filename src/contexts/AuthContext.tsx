import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_ACCOUNTS } from '../services/demoData';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';
import { fetchSupabaseProfile, upsertSupabaseProfile } from '../services/supabaseStorage';
import { HeroId, UserProfile, UserRole } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  loginDemo: (role: UserRole) => void;
  loginWithEmail: (email: string, password: string, role?: UserRole) => Promise<{ ok: boolean; error?: string }>;
  registerStudent: (payload: {
    fullName: string;
    email: string;
    password: string;
    heroAlias: string;
    department: string;
    registerNumber: string;
    semesterNumber: number;
    selectedHero: HeroId;
  }) => Promise<{ ok: boolean; error?: string }>;
  registerFaculty: (payload: {
    fullName: string;
    email: string;
    password: string;
    department: string;
    facultyId: string;
    assignedSubjectCodes: string[];
  }) => Promise<{ ok: boolean; error?: string }>;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_STORAGE_KEY = 'ag_current_user_v1';
const REGISTERED_DEMO_USERS_KEY = 'ag_demo_registered_users_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user && !user) {
        const meta = data.session.user.user_metadata || {};
        const dbProfile = await fetchSupabaseProfile(data.session.user.id);
        setUser({
          ...DEMO_ACCOUNTS.STUDENT,
          id: data.session.user.id,
          email: data.session.user.email || '',
          fullName: (meta.fullName as string) || 'Student Hero',
          heroAlias: (meta.heroAlias as string) || 'Guardian',
          role: (meta.role as UserRole) || 'STUDENT',
          ...dbProfile,
          isDemo: false,
        });
      }
    });
  }, []);

  const loginDemo = (role: UserRole) => {
    const preset = DEMO_ACCOUNTS[role];
    // Preserve customized coins/xp/hero if user already modified their student demo profile
    if (role === 'STUDENT') {
      try {
        const savedStudent = localStorage.getItem('ag_demo_student_profile_v1');
        if (savedStudent) {
          setUser(JSON.parse(savedStudent) as UserProfile);
          return;
        }
      } catch {
        // ignore parse issues
      }
    }
    setUser(preset);
  };

  const loginWithEmail = async (
    email: string,
    password: string,
    role: UserRole = 'STUDENT'
  ): Promise<{ ok: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return { ok: false, error: 'Please enter both email and password.' };
    }

    if (isSupabaseConfigured && supabase) {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (error || !data.user) {
        setLoading(false);
        return { ok: false, error: error?.message || 'Supabase sign-in failed.' };
      }
      const meta = data.user.user_metadata || {};
      const dbProfile = await fetchSupabaseProfile(data.user.id);
      setLoading(false);
      const resolvedProfile: UserProfile = {
        ...DEMO_ACCOUNTS.STUDENT,
        id: data.user.id,
        email: data.user.email || trimmedEmail,
        fullName: (meta.fullName as string) || trimmedEmail.split('@')[0],
        heroAlias: (meta.heroAlias as string) || 'CampusHero',
        role: (meta.role as UserRole) || role,
        ...dbProfile,
        isDemo: false,
      };
      if (!dbProfile) {
        void upsertSupabaseProfile(resolvedProfile);
      }
      setUser(resolvedProfile);
      return { ok: true };
    }

    // Local Demo Mode: match registered demo users or demo presets by email (never store plaintext admin secrets!)
    try {
      const storedRaw = localStorage.getItem(REGISTERED_DEMO_USERS_KEY);
      const storedUsers: Array<UserProfile & { passwordHash: string }> = storedRaw ? JSON.parse(storedRaw) : [];
      const found = storedUsers.find((u) => u.email.toLowerCase() === trimmedEmail);
      if (found) {
        if (found.passwordHash !== btoa(password)) {
          return { ok: false, error: 'Invalid demo account password.' };
        }
        const { passwordHash: _ignored, ...profile } = found;
        setUser(profile);
        return { ok: true };
      }
    } catch {
      // fall through
    }

    if (role === 'STUDENT' && trimmedEmail === DEMO_ACCOUNTS.STUDENT.email) {
      loginDemo('STUDENT');
      return { ok: true };
    }

    return {
      ok: false,
      error:
        'Account not found in local demo mode. Register a new student account or use one of the clearly labeled Demo Sign-In buttons.',
    };
  };

  const registerStudent = async (payload: {
    fullName: string;
    email: string;
    password: string;
    heroAlias: string;
    department: string;
    registerNumber: string;
    semesterNumber: number;
    selectedHero: HeroId;
  }): Promise<{ ok: boolean; error?: string }> => {
    const email = payload.email.trim().toLowerCase();
    if (!payload.fullName.trim() || !email.includes('@') || payload.password.length < 6) {
      return { ok: false, error: 'Enter a valid name, email, and a password of at least 6 characters.' };
    }

    if (isSupabaseConfigured && supabase) {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password: payload.password,
        options: {
          data: {
            fullName: payload.fullName.trim(),
            heroAlias: payload.heroAlias.trim() || 'CampusGuardian',
            department: payload.department,
            registerNumber: payload.registerNumber,
            semesterNumber: payload.semesterNumber,
            selectedHero: payload.selectedHero,
            role: 'STUDENT',
          },
        },
      });
      setLoading(false);
      if (error || !data.user) {
        return { ok: false, error: error?.message || 'Registration failed.' };
      }
      const createdProfile: UserProfile = {
        ...DEMO_ACCOUNTS.STUDENT,
        id: data.user.id,
        email,
        fullName: payload.fullName.trim(),
        heroAlias: payload.heroAlias.trim() || 'CampusGuardian',
        department: payload.department,
        registerNumber: payload.registerNumber,
        semesterNumber: payload.semesterNumber,
        selectedHero: payload.selectedHero,
        coins: 50,
        xp: 0,
        dailyStreak: 0,
        weeklyStreak: 0,
        classesAttendedToday: 0,
        isDemo: false,
      };
      void upsertSupabaseProfile(createdProfile);
      setUser(createdProfile);
      return { ok: true };
    }

    // Local Demo Mode registration
    const newProfile: UserProfile = {
      id: `demo-user-${Date.now()}`,
      email,
      fullName: payload.fullName.trim(),
      heroAlias: payload.heroAlias.trim() || 'CampusGuardian',
      role: 'STUDENT',
      department: payload.department || 'Computer Science & Engineering',
      semesterNumber: payload.semesterNumber || 5,
      registerNumber: payload.registerNumber || `22CSE${Math.floor(100 + Math.random() * 899)}`,
      selectedHero: payload.selectedHero,
      unlockedAuras: ['default-spark'],
      equippedAura: 'default-spark',
      coins: 50,
      xp: 20,
      dailyStreak: 1,
      weeklyStreak: 1,
      lastAttendanceDate: null,
      classesAttendedToday: 0,
      squadPrivacyShowExact: false,
      anonymizeInPublicLists: true,
      isDemo: true,
    };

    try {
      const storedRaw = localStorage.getItem(REGISTERED_DEMO_USERS_KEY);
      const storedUsers: Array<UserProfile & { passwordHash: string }> = storedRaw ? JSON.parse(storedRaw) : [];
      if (storedUsers.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, error: 'An account with this email already exists in demo storage.' };
      }
      storedUsers.push({ ...newProfile, passwordHash: btoa(payload.password) });
      localStorage.setItem(REGISTERED_DEMO_USERS_KEY, JSON.stringify(storedUsers));
    } catch {
      // ignore
    }

    setUser(newProfile);
    return { ok: true };
  };

  const registerFaculty = async (payload: {
    fullName: string;
    email: string;
    password: string;
    department: string;
    facultyId: string;
    assignedSubjectCodes: string[];
  }): Promise<{ ok: boolean; error?: string }> => {
    const email = payload.email.trim().toLowerCase();
    const cleanedCodes = Array.from(
      new Set(payload.assignedSubjectCodes.map((c) => c.trim().toUpperCase()).filter(Boolean))
    );
    if (!payload.fullName.trim() || !email.includes('@') || payload.password.length < 6) {
      return { ok: false, error: 'Enter a valid faculty name, email, and password (min 6 characters).' };
    }
    if (cleanedCodes.length === 0) {
      return { ok: false, error: 'Select or enter at least one assigned subject code (e.g. MA501, CS502).' };
    }

    if (isSupabaseConfigured && supabase) {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password: payload.password,
        options: {
          data: {
            fullName: payload.fullName.trim(),
            role: 'FACULTY',
            assignedSubjectCodes: cleanedCodes,
          },
        },
      });
      setLoading(false);
      if (error || !data.user) {
        return { ok: false, error: error?.message || 'Faculty registration failed.' };
      }
      setUser({
        ...DEMO_ACCOUNTS.FACULTY,
        id: data.user.id,
        email,
        fullName: payload.fullName.trim(),
        heroAlias: payload.fullName.trim(),
        department: payload.department || 'Computer Science & Engineering',
        registerNumber: payload.facultyId.trim() || 'FAC-NEW',
        assignedSubjectCodes: cleanedCodes,
        isDemo: false,
      });
      return { ok: true };
    }

    const newFaculty: UserProfile = {
      ...DEMO_ACCOUNTS.FACULTY,
      id: `demo-faculty-${Date.now()}`,
      email,
      fullName: payload.fullName.trim(),
      heroAlias: payload.fullName.trim(),
      role: 'FACULTY',
      department: payload.department || 'Computer Science & Engineering',
      registerNumber: payload.facultyId.trim() || `FAC-${Math.floor(100 + Math.random() * 899)}`,
      assignedSubjectCodes: cleanedCodes,
      isDemo: true,
    };

    try {
      const storedRaw = localStorage.getItem(REGISTERED_DEMO_USERS_KEY);
      const storedUsers: Array<UserProfile & { passwordHash: string }> = storedRaw ? JSON.parse(storedRaw) : [];
      if (storedUsers.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, error: 'An account with this email already exists in demo storage.' };
      }
      storedUsers.push({ ...newFaculty, passwordHash: btoa(payload.password) });
      localStorage.setItem(REGISTERED_DEMO_USERS_KEY, JSON.stringify(storedUsers));
    } catch {
      // ignore
    }

    setUser(newFaculty);
    return { ok: true };
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      if (next.role === 'STUDENT' && next.id === DEMO_ACCOUNTS.STUDENT.id) {
        localStorage.setItem('ag_demo_student_profile_v1', JSON.stringify(next));
      } else if (!next.isDemo) {
        void upsertSupabaseProfile(next);
      } else {
        try {
          const storedRaw = localStorage.getItem(REGISTERED_DEMO_USERS_KEY);
          const storedUsers: Array<UserProfile & { passwordHash: string }> = storedRaw ? JSON.parse(storedRaw) : [];
          const updatedList = storedUsers.map((u) => (u.id === next.id ? { ...u, ...next } : u));
          localStorage.setItem(REGISTERED_DEMO_USERS_KEY, JSON.stringify(updatedList));
        } catch {
          // ignore storage error
        }
      }
      return next;
    });
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoMode: !isSupabaseConfigured,
        loginDemo,
        loginWithEmail,
        registerStudent,
        registerFaculty,
        updateUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
