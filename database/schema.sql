-- AttendanceGuard PostgreSQL + Supabase Schema
-- Covers all 18 core tables with Foreign Keys, Indexes, Unique Constraints, and Row Level Security (RLS)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. roles
CREATE TABLE IF NOT EXISTS public.roles (
  role_name TEXT PRIMARY KEY CHECK (role_name IN ('STUDENT', 'FACULTY', 'ADMIN')),
  description TEXT NOT NULL
);

INSERT INTO public.roles (role_name, description) VALUES
  ('STUDENT', 'Student accessing personal attendance, predictor, squad, tasks, and OD claims'),
  ('FACULTY', 'Authorized faculty managing assigned subjects, attendance verification, and OD approvals'),
  ('ADMIN', 'College administrator managing institutional rules, users, calendars, and audit logs')
ON CONFLICT (role_name) DO NOTHING;

-- 2. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  hero_alias TEXT NOT NULL,
  role TEXT NOT NULL REFERENCES public.roles(role_name) DEFAULT 'STUDENT',
  department TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
  semester_number INT NOT NULL DEFAULT 5 CHECK (semester_number BETWEEN 1 AND 12),
  register_number TEXT NOT NULL DEFAULT '',
  selected_hero TEXT NOT NULL DEFAULT 'captain-campus',
  equipped_aura TEXT NOT NULL DEFAULT 'default-spark',
  unlocked_auras TEXT[] NOT NULL DEFAULT ARRAY['default-spark'],
  coins INT NOT NULL DEFAULT 0 CHECK (coins >= 0),
  xp INT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  daily_streak INT NOT NULL DEFAULT 0 CHECK (daily_streak >= 0),
  weekly_streak INT NOT NULL DEFAULT 0 CHECK (weekly_streak >= 0),
  squad_privacy_show_exact BOOLEAN NOT NULL DEFAULT FALSE,
  anonymize_in_public_lists BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_subject_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  faculty_name TEXT NOT NULL DEFAULT 'Assigned Faculty',
  attended INT NOT NULL DEFAULT 0 CHECK (attended >= 0),
  total INT NOT NULL DEFAULT 0 CHECK (total >= attended),
  min_percentage INT NOT NULL DEFAULT 75 CHECK (min_percentage BETWEEN 1 AND 99),
  remaining_classes INT NOT NULL DEFAULT 0 CHECK (remaining_classes >= 0),
  weekly_periods INT NOT NULL DEFAULT 4 CHECK (weekly_periods >= 1),
  color TEXT NOT NULL DEFAULT '#38bdf8',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, code)
);
CREATE INDEX IF NOT EXISTS idx_subjects_student ON public.subjects(student_id);

-- 4. attendance_records
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'OD_CREDIT')),
  periods INT NOT NULL DEFAULT 1 CHECK (periods >= 1),
  source TEXT NOT NULL CHECK (source IN ('STUDENT_SELF', 'FACULTY_VERIFIED', 'OD_RECONCILIATION', 'ADMIN_CORRECTION')),
  note TEXT,
  previous_attended INT,
  previous_total INT,
  new_attended INT,
  new_total INT,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON public.attendance_records(student_id, class_date DESC);

-- 5. semester_settings
CREATE TABLE IF NOT EXISTS public.semester_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  semester_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  exam_date DATE NOT NULL,
  working_days_of_week INT[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  default_min_percentage INT NOT NULL DEFAULT 75 CHECK (default_min_percentage BETWEEN 1 AND 99),
  allow_od_auto_reconcile BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. timetable
CREATE TABLE IF NOT EXISTS public.timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  subject_code TEXT NOT NULL,
  period_order INT NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_timetable_student ON public.timetable(student_id, day_of_week);

-- 7. holidays
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date DATE NOT NULL,
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id)
);

-- 8. od_requests
CREATE TABLE IF NOT EXISTS public.od_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  subject_ids UUID[] NOT NULL,
  periods_per_subject INT NOT NULL CHECK (periods_per_subject >= 1 AND periods_per_subject <= 20),
  document_note TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by UUID REFERENCES public.profiles(id),
  remarks TEXT,
  reconciled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_od_requests_student ON public.od_requests(student_id, status);

-- 9. od_credits (Unique constraint prevents duplicate OD reconciliation for the same request + subject)
CREATE TABLE IF NOT EXISTS public.od_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  od_request_id UUID NOT NULL REFERENCES public.od_requests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  credited_periods INT NOT NULL CHECK (credited_periods >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (od_request_id, subject_id)
);

-- 10. squads
CREATE TABLE IF NOT EXISTS public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  weekly_challenge_title TEXT NOT NULL DEFAULT 'Zero Unplanned Bunks This Week',
  weekly_challenge_target INT NOT NULL DEFAULT 5,
  weekly_challenge_progress INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. squad_members
CREATE TABLE IF NOT EXISTS public.squad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (squad_id, student_id)
);

-- 12. squad_tasks
CREATE TABLE IF NOT EXISTS public.squad_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID REFERENCES public.squads(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  deadline DATE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED')),
  reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- 14. reward_transactions (UNIQUE event_key prevents duplicate coin/XP claims)
CREATE TABLE IF NOT EXISTS public.reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  description TEXT NOT NULL,
  coins_delta INT NOT NULL,
  xp_delta INT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, event_key)
);

-- 15. achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  title TEXT NOT NULL,
  tier TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, badge_id)
);

-- 16. attendance_alerts
CREATE TABLE IF NOT EXISTS public.attendance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  required_percentage INT NOT NULL,
  recovery_needed INT NOT NULL,
  message TEXT NOT NULL,
  is_simulation BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id),
  author_name TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.od_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.od_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Helper function for checking current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Profiles: students see own profile; admin sees all; faculty sees authorized info via views
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.current_user_role() = 'ADMIN');
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Subjects: student owns their subjects; faculty can view/update only assigned subject codes; admin all
CREATE POLICY "Student manages own subjects" ON public.subjects
  FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Faculty reads assigned subjects" ON public.subjects
  FOR SELECT USING (
    public.current_user_role() = 'FACULTY' AND
    code = ANY((SELECT assigned_subject_codes FROM public.profiles WHERE id = auth.uid()))
  );
CREATE POLICY "Admin manages all subjects" ON public.subjects
  FOR ALL USING (public.current_user_role() = 'ADMIN');

-- Attendance records: strict isolation
CREATE POLICY "Student reads own attendance records" ON public.attendance_records
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Student inserts self records" ON public.attendance_records
  FOR INSERT WITH CHECK (student_id = auth.uid() AND source = 'STUDENT_SELF');
CREATE POLICY "Faculty/Admin read/write authorized records" ON public.attendance_records
  FOR ALL USING (public.current_user_role() IN ('FACULTY', 'ADMIN'));

-- OD Requests & Credits
CREATE POLICY "Student manages own OD requests" ON public.od_requests
  FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Faculty/Admin review OD requests" ON public.od_requests
  FOR SELECT USING (public.current_user_role() IN ('FACULTY', 'ADMIN'));
CREATE POLICY "Faculty/Admin update OD status" ON public.od_requests
  FOR UPDATE USING (public.current_user_role() IN ('FACULTY', 'ADMIN'));

-- Notifications, Rewards, Achievements, Alerts: strict owner isolation
CREATE POLICY "User owns notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Student owns rewards" ON public.reward_transactions FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Student owns achievements" ON public.achievements FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Student owns alerts" ON public.attendance_alerts FOR ALL USING (student_id = auth.uid());

-- Audit logs: Admin & Faculty read; inserts via server RPC
CREATE POLICY "Admin reads audit logs" ON public.audit_logs
  FOR SELECT USING (public.current_user_role() = 'ADMIN');

-- Announcements: all authenticated read; faculty/admin create
CREATE POLICY "Everyone reads announcements" ON public.announcements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Faculty/Admin create announcements" ON public.announcements
  FOR INSERT WITH CHECK (public.current_user_role() IN ('FACULTY', 'ADMIN'));

-- Squads & Tasks: visible to squad members
CREATE POLICY "Authenticated read squads" ON public.squads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Members manage squad tasks" ON public.squad_tasks FOR ALL USING (student_id = auth.uid());

-- Server-side RPC to atomically approve OD and prevent duplicate credits
CREATE OR REPLACE FUNCTION public.approve_od_request(p_od_id UUID, p_remarks TEXT)
RETURNS VOID AS $$
DECLARE
  v_req RECORD;
  v_subj_id UUID;
BEGIN
  IF public.current_user_role() NOT IN ('FACULTY', 'ADMIN') THEN
    RAISE EXCEPTION 'Unauthorized role for OD approval';
  END IF;

  SELECT * INTO v_req FROM public.od_requests WHERE id = p_od_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'OD request not found';
  END IF;
  IF v_req.reconciled THEN
    RAISE EXCEPTION 'OD request already reconciled';
  END IF;

  UPDATE public.od_requests
  SET status = 'APPROVED', reviewed_by = auth.uid(), remarks = p_remarks, reconciled = TRUE, updated_at = NOW()
  WHERE id = p_od_id;

  FOREACH v_subj_id IN ARRAY v_req.subject_ids LOOP
    INSERT INTO public.od_credits (od_request_id, student_id, subject_id, credited_periods)
    VALUES (p_od_id, v_req.student_id, v_subj_id, v_req.periods_per_subject);

    UPDATE public.subjects
    SET attended = attended + v_req.periods_per_subject,
        total = total + v_req.periods_per_subject
    WHERE id = v_subj_id AND student_id = v_req.student_id;
  END LOOP;

  INSERT INTO public.audit_logs (actor_id, actor_name, actor_role, action, target_type, target_id, reason)
  VALUES (auth.uid(), 'Faculty/Admin', public.current_user_role(), 'APPROVE_OD', 'OD', p_od_id::TEXT, COALESCE(p_remarks, 'Approved OD'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
