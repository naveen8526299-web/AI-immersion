import {
  AttendanceRecord,
  AuditLogEntry,
  DemoStudentRecord,
  FacultyAnnouncement,
  ODRequest,
  Subject,
  UserProfile,
} from '../types';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export async function upsertSupabaseProfile(profile: UserProfile): Promise<void> {
  if (!isSupabaseConfigured || !supabase || profile.isDemo) return;
  try {
    await supabase.from('profiles').upsert({
      id: profile.id,
      email: profile.email,
      full_name: profile.fullName,
      hero_alias: profile.heroAlias,
      role: profile.role,
      department: profile.department,
      semester_number: profile.semesterNumber,
      register_number: profile.registerNumber,
      selected_hero: profile.selectedHero,
      equipped_aura: profile.equippedAura,
      unlocked_auras: profile.unlockedAuras,
      coins: profile.coins,
      xp: profile.xp,
      daily_streak: profile.dailyStreak,
      weekly_streak: profile.weeklyStreak,
      squad_privacy_show_exact: profile.squadPrivacyShowExact,
      anonymize_in_public_lists: profile.anonymizeInPublicLists,
      assigned_subject_codes: profile.assignedSubjectCodes || [],
    });
  } catch {
    // non-fatal network sync error
  }
}

export async function fetchSupabaseProfile(userId: string): Promise<Partial<UserProfile> | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      heroAlias: data.hero_alias,
      role: data.role,
      department: data.department,
      semesterNumber: data.semester_number,
      registerNumber: data.register_number,
      selectedHero: data.selected_hero,
      equippedAura: data.equipped_aura,
      unlockedAuras: data.unlocked_auras,
      coins: data.coins,
      xp: data.xp,
      dailyStreak: data.daily_streak,
      weeklyStreak: data.weekly_streak,
      squadPrivacyShowExact: data.squad_privacy_show_exact,
      anonymizeInPublicLists: data.anonymize_in_public_lists,
      assignedSubjectCodes: data.assigned_subject_codes || [],
      isDemo: false,
    };
  } catch {
    return null;
  }
}

export async function seedSupabaseDefaultSubjects(studentId: string, templateSubjects: Subject[]): Promise<Subject[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const rows = templateSubjects.map((s) => ({
      student_id: studentId,
      code: s.code,
      name: s.name,
      faculty_name: s.facultyName,
      attended: 0,
      total: 0,
      min_percentage: s.minPercentage,
      remaining_classes: s.remainingClasses,
      weekly_periods: s.weeklyPeriods,
      color: s.color,
    }));
    const { data } = await supabase.from('subjects').upsert(rows, { onConflict: 'student_id,code' }).select('*');
    if (!data) return [];
    return data.map((r) => ({
      id: r.id,
      studentId: r.student_id,
      code: r.code,
      name: r.name,
      facultyName: r.faculty_name,
      attended: r.attended,
      total: r.total,
      minPercentage: r.min_percentage,
      remainingClasses: r.remaining_classes,
      weeklyPeriods: r.weekly_periods,
      color: r.color,
    }));
  } catch {
    return [];
  }
}

export async function fetchSupabaseWorkspaceData(user: UserProfile, templateSubjects: Subject[]): Promise<{
  subjects?: Subject[];
  cohort?: DemoStudentRecord[];
  records?: AttendanceRecord[];
  odRequests?: ODRequest[];
  announcements?: FacultyAnnouncement[];
  auditLogs?: AuditLogEntry[];
}> {
  if (!isSupabaseConfigured || !supabase || user.isDemo) return {};

  try {
    if (user.role === 'STUDENT') {
      const { data: subjRows } = await supabase.from('subjects').select('*').eq('student_id', user.id);
      let subjects: Subject[] = (subjRows || []).map((r) => ({
        id: r.id,
        studentId: r.student_id,
        code: r.code,
        name: r.name,
        facultyName: r.faculty_name,
        attended: r.attended,
        total: r.total,
        minPercentage: r.min_percentage,
        remainingClasses: r.remaining_classes,
        weeklyPeriods: r.weekly_periods,
        color: r.color,
      }));
      if (subjects.length === 0) {
        subjects = await seedSupabaseDefaultSubjects(user.id, templateSubjects);
      }

      const { data: recRows } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: odRows } = await supabase
        .from('od_requests')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      const { data: annRows } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      return {
        subjects,
        records: (recRows || []).map((r) => {
          const matchedSubj = subjects.find((s) => s.id === r.subject_id);
          return {
            id: r.id,
            studentId: r.student_id,
            subjectId: r.subject_id,
            subjectCode: matchedSubj?.code || 'SUBJ',
            subjectName: matchedSubj?.name || 'Subject',
            date: r.class_date,
            status: r.status,
            periods: r.periods,
            source: r.source,
            note: r.note || undefined,
            previousAttended: r.previous_attended ?? undefined,
            previousTotal: r.previous_total ?? undefined,
            newAttended: r.new_attended ?? undefined,
            newTotal: r.new_total ?? undefined,
            updatedBy: 'Faculty/System',
            createdAt: r.created_at,
          };
        }),
        odRequests: (odRows || []).map((o) => ({
          id: o.id,
          studentId: o.student_id,
          studentName: user.fullName,
          studentAlias: user.heroAlias,
          eventName: o.event_name,
          eventType: o.event_type,
          startDate: o.start_date,
          endDate: o.end_date,
          subjectIds: o.subject_ids || [],
          periodsPerSubject: o.periods_per_subject,
          documentNote: o.document_note || '',
          status: o.status,
          remarks: o.remarks || undefined,
          reconciled: o.reconciled,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        })),
        announcements: (annRows || []).map((a) => ({
          id: a.id,
          authorName: 'College Faculty/Admin',
          subjectCode: a.subject_code,
          title: a.title,
          message: a.message,
          createdAt: a.created_at,
        })),
      };
    }

    // FACULTY or ADMIN: fetch student profiles and subjects
    const { data: studentProfiles } = await supabase.from('profiles').select('*').eq('role', 'STUDENT');
    const { data: allSubjects } = await supabase.from('subjects').select('*');
    const { data: odRows } = await supabase.from('od_requests').select('*').order('created_at', { ascending: false });
    const { data: annRows } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });

    const profileMap = new Map((studentProfiles || []).map((p) => [p.id, p]));
    const cohort: DemoStudentRecord[] = (studentProfiles || []).map((p) => ({
      id: p.id,
      fullName: p.full_name,
      heroAlias: p.hero_alias,
      registerNumber: p.register_number || `REG-${String(p.id).slice(0, 5).toUpperCase()}`,
      department: p.department || 'CSE',
      semesterNumber: p.semester_number || 5,
      subjects: (allSubjects || [])
        .filter((s) => s.student_id === p.id)
        .map((r) => ({
          id: r.id,
          studentId: r.student_id,
          code: r.code,
          name: r.name,
          facultyName: r.faculty_name,
          attended: r.attended,
          total: r.total,
          minPercentage: r.min_percentage,
          remainingClasses: r.remaining_classes,
          weeklyPeriods: r.weekly_periods,
          color: r.color,
        })),
    }));

    return {
      cohort,
      odRequests: (odRows || []).map((o) => {
        const sp = profileMap.get(o.student_id);
        return {
          id: o.id,
          studentId: o.student_id,
          studentName: sp?.full_name || 'Student',
          studentAlias: sp?.hero_alias || 'Guardian',
          eventName: o.event_name,
          eventType: o.event_type,
          startDate: o.start_date,
          endDate: o.end_date,
          subjectIds: o.subject_ids || [],
          periodsPerSubject: o.periods_per_subject,
          documentNote: o.document_note || '',
          status: o.status,
          remarks: o.remarks || undefined,
          reconciled: o.reconciled,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        };
      }),
      announcements: (annRows || []).map((a) => ({
        id: a.id,
        authorName: 'College Faculty/Admin',
        subjectCode: a.subject_code,
        title: a.title,
        message: a.message,
        createdAt: a.created_at,
      })),
    };
  } catch {
    return {};
  }
}

export async function syncSupabaseSubjectAttendance(payload: {
  studentId: string;
  subjectId: string;
  newAttended: number;
  newTotal: number;
  record: AttendanceRecord;
  audit?: AuditLogEntry;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase || payload.studentId.startsWith('demo-')) return;
  try {
    await supabase
      .from('subjects')
      .update({ attended: payload.newAttended, total: payload.newTotal })
      .eq('id', payload.subjectId);

    await supabase.from('attendance_records').insert({
      student_id: payload.studentId,
      subject_id: payload.subjectId,
      class_date: payload.record.date,
      status: payload.record.status,
      periods: payload.record.periods,
      source: payload.record.source,
      note: payload.record.note || null,
      previous_attended: payload.record.previousAttended ?? null,
      previous_total: payload.record.previousTotal ?? null,
      new_attended: payload.newAttended,
      new_total: payload.newTotal,
    });

    if (payload.audit) {
      await supabase.from('audit_logs').insert({
        actor_id: payload.audit.actorId,
        actor_name: payload.audit.actorName,
        actor_role: payload.audit.actorRole,
        action: payload.audit.action,
        target_type: payload.audit.targetType,
        target_id: payload.audit.targetId,
        previous_value: payload.audit.previousValue || null,
        new_value: payload.audit.newValue || null,
        reason: payload.audit.reason,
      });
    }
  } catch {
    // non-fatal background sync
  }
}

export async function syncSupabaseAnnouncement(ann: FacultyAnnouncement, authorId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || authorId.startsWith('demo-')) return;
  try {
    await supabase.from('announcements').insert({
      author_id: authorId,
      subject_code: ann.subjectCode,
      title: ann.title,
      message: ann.message,
    });
  } catch {
    // non-fatal
  }
}
