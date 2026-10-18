-- ==============================================================================
-- KHO BÁU TRI THỨC - SQL MIGRATION CHO 4 BẢNG CHÍNH VÀ THỐNG KÊ TRÊN SUPABASE
-- Các bảng: profiles, subjects, lessons, learning_results, link_visits
-- ==============================================================================

-- 1. BẢNG profiles (HỒ SƠ HỌC SINH, GIÁO VIÊN, QUẢN TRỊ VIÊN)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL DEFAULT 'Người dùng',
  school_name TEXT DEFAULT 'Tiểu học',
  class_name TEXT DEFAULT '',
  email TEXT,
  pin TEXT,
  subjects TEXT[],
  approval_status TEXT DEFAULT 'approved',
  last_login_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bổ sung các cột nếu bảng đã được tạo trước đó thiếu cột
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT 'Người dùng';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_name TEXT DEFAULT 'Tiểu học';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_name TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subjects TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all profiles" ON public.profiles;
CREATE POLICY "Allow anon all profiles"
  ON public.profiles
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 2. BẢNG subjects (MÔN HỌC)
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade INT DEFAULT 0,
  description TEXT DEFAULT '',
  icon TEXT,
  color TEXT,
  creator_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS grade INT DEFAULT 0;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS creator_id TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all subjects" ON public.subjects;
CREATE POLICY "Allow anon all subjects"
  ON public.subjects
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. BẢNG lessons (BÀI HỌC VÀ HỌC LIỆU SỐ)
CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  content TEXT,
  subject_id TEXT DEFAULT 'tinhoc',
  url TEXT DEFAULT 'https://quizizz.com',
  grade INT DEFAULT 3,
  lesson TEXT DEFAULT '',
  topic TEXT DEFAULT '',
  resource_type TEXT DEFAULT 'quizizz',
  notes TEXT,
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  play_count INT DEFAULT 0,
  creator_id TEXT,
  creator_name TEXT DEFAULT 'Giáo viên',
  creator_school TEXT DEFAULT 'Tiểu học',
  creator_role TEXT DEFAULT 'teacher',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS subject_id TEXT DEFAULT 'tinhoc';
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS url TEXT DEFAULT 'https://quizizz.com';
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS grade INT DEFAULT 3;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS lesson TEXT DEFAULT '';
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT '';
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS resource_type TEXT DEFAULT 'quizizz';
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS play_count INT DEFAULT 0;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS creator_id TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS creator_name TEXT DEFAULT 'Giáo viên';
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS creator_school TEXT DEFAULT 'Tiểu học';
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS creator_role TEXT DEFAULT 'teacher';
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all lessons" ON public.lessons;
CREATE POLICY "Allow anon all lessons"
  ON public.lessons
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. BẢNG learning_results (KẾT QUẢ HỌC TẬP VÀ ĐIỂM SỐ)
CREATE TABLE IF NOT EXISTS public.learning_results (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL DEFAULT 'student_guest',
  lesson_id TEXT NOT NULL DEFAULT 'lesson_general',
  score INT NOT NULL DEFAULT 100,
  completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  details TEXT,
  student_name TEXT DEFAULT 'Học sinh',
  school TEXT DEFAULT 'Tiểu học',
  class_name TEXT DEFAULT '3A',
  link_title TEXT DEFAULT 'Bài học',
  subject TEXT DEFAULT 'tinhoc',
  grade INT DEFAULT 3,
  lesson TEXT DEFAULT '',
  platform TEXT DEFAULT 'Quizizz',
  correct_answers INT,
  total_questions INT,
  badge_earned TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS student_id TEXT DEFAULT 'student_guest';
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS lesson_id TEXT DEFAULT 'lesson_general';
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS score INT DEFAULT 100;
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS student_name TEXT DEFAULT 'Học sinh';
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS school TEXT DEFAULT 'Tiểu học';
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS class_name TEXT DEFAULT '3A';
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS link_title TEXT DEFAULT 'Bài học';
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'tinhoc';
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS grade INT DEFAULT 3;
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS lesson TEXT DEFAULT '';
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'Quizizz';
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS correct_answers INT;
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS total_questions INT;
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS badge_earned TEXT;
ALTER TABLE public.learning_results ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.learning_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all learning_results" ON public.learning_results;
CREATE POLICY "Allow anon all learning_results"
  ON public.learning_results
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. BẢNG link_visits (THỐNG KÊ LƯỢT TRUY CẬP HỌC LIỆU THỜI GIAN THỰC)
CREATE TABLE IF NOT EXISTS public.link_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id TEXT NOT NULL,
  link_title TEXT NOT NULL,
  user_id TEXT DEFAULT 'guest',
  user_name TEXT DEFAULT 'Khách / Học sinh',
  user_role TEXT DEFAULT 'student',
  school TEXT DEFAULT 'Tiểu học',
  class_name TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  grade INT DEFAULT 0,
  resource_type TEXT DEFAULT 'quizizz',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_link_visits_link_id ON public.link_visits (link_id);
CREATE INDEX IF NOT EXISTS idx_link_visits_created_at ON public.link_visits (created_at DESC);

ALTER TABLE public.link_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all link_visits" ON public.link_visits;
CREATE POLICY "Allow anon all link_visits"
  ON public.link_visits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. BẬT TÍNH NĂNG REALTIME TRÊN CÁC BẢNG QUAN TRỌNG
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.link_visits, public.lessons, public.learning_results, public.profiles;
COMMIT;
