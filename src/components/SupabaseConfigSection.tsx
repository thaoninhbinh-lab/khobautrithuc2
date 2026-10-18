import React, { useState, useEffect } from 'react';
import {
  getSupabaseConfig,
  setCustomSupabaseConfig,
  testDetailedSupabaseConnection,
  SupabaseConnectionStatus,
} from '../supabase/client';
import {
  Database,
  CheckCircle,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Code2,
  Table,
  Users,
  BookOpen,
  GraduationCap,
  Award,
  Sparkles,
  UploadCloud,
  CheckCheck,
} from 'lucide-react';
import { syncAllDataToSupabase } from '../services/supabaseService';
import {
  fetchLinks,
  fetchUsers,
  fetchStudyRecords,
  fetchSubjectCards,
} from '../services/storageService';

interface SupabaseConfigSectionProps {
  onSuccessNotice?: (msg: string) => void;
}

export const SupabaseConfigSection: React.FC<SupabaseConfigSectionProps> = ({
  onSuccessNotice,
}) => {
  const currentConfig = getSupabaseConfig();
  const [urlInput, setUrlInput] = useState(currentConfig.url);
  const [anonKeyInput, setAnonKeyInput] = useState(currentConfig.anonKey);

  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);

  // Script SQL thiết lập RLS Policies và quyền truy cập bảo mật cho 4 bảng
  const sqlScript = `-- ==============================================================================
-- NGUỒN SÁNG TRI THỨC - SQL GỠ KHÓA VÀ CẤP QUYỀN TRUY CẬP ĐẦY ĐỦ TRÊN SUPABASE
-- ==============================================================================

-- 1. GỠ KHÓA RÀNG BUỘC (Để lưu học sinh & giáo viên dùng PIN tự do)
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.learning_results DROP CONSTRAINT IF EXISTS learning_results_student_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.learning_results DROP CONSTRAINT IF EXISTS learning_results_lesson_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.lessons DROP CONSTRAINT IF EXISTS lessons_subject_id_fkey CASCADE;

-- 2. CHUYỂN ĐỔI KIỂU DỮ LIỆU ĐỊNH DANH SANG TEXT (Hỗ trợ mọi định dạng tài khoản)
ALTER TABLE IF EXISTS public.profiles ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE IF EXISTS public.learning_results ALTER COLUMN student_id TYPE TEXT USING student_id::text;
ALTER TABLE IF EXISTS public.learning_results ALTER COLUMN lesson_id TYPE TEXT USING lesson_id::text;

-- 3. BỔ SUNG CỘT CHO BẢNG PROFILES
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT 'Người dùng';
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS school_name TEXT DEFAULT 'Tiểu học';
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS class_name TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS pin TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS subjects TEXT[];
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';

-- 4. BỔ SUNG CỘT CHO BẢNG LESSONS
ALTER TABLE IF EXISTS public.lessons ADD COLUMN IF NOT EXISTS url TEXT DEFAULT 'https://quizizz.com';
ALTER TABLE IF EXISTS public.lessons ADD COLUMN IF NOT EXISTS grade INT DEFAULT 3;
ALTER TABLE IF EXISTS public.lessons ADD COLUMN IF NOT EXISTS lesson TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.lessons ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.lessons ADD COLUMN IF NOT EXISTS resource_type TEXT DEFAULT 'quizizz';
ALTER TABLE IF EXISTS public.lessons ADD COLUMN IF NOT EXISTS play_count INT DEFAULT 0;

-- 5. CẤP QUYỀN ĐỌC & GHI (RLS POLICIES) CHO TẤT CẢ CÁC BẢNG
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all profiles" ON public.profiles;
CREATE POLICY "Allow anon all profiles" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all subjects" ON public.subjects;
CREATE POLICY "Allow anon all subjects" ON public.subjects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all lessons" ON public.lessons;
CREATE POLICY "Allow anon all lessons" ON public.lessons FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.learning_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all learning_results" ON public.learning_results;
CREATE POLICY "Allow anon all learning_results" ON public.learning_results FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.link_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all link_visits" ON public.link_visits;
CREATE POLICY "Allow anon all link_visits" ON public.link_visits FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSQL(true);
    if (onSuccessNotice) onSuccessNotice('Đã sao chép toàn bộ SQL RLS Policy vào bộ nhớ tạm! 📋');
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const handleRunDiagnostic = async () => {
    setCustomSupabaseConfig(urlInput.trim(), anonKeyInput.trim());
    setTesting(true);
    const res = await testDetailedSupabaseConnection();
    setStatus(res);
    setTesting(false);
    if (res.success && onSuccessNotice) {
      onSuccessNotice('Kết nối Supabase và kiểm tra 4 bảng thành công! 🚀');
    }
  };

  const handleSyncToSupabase = async () => {
    setCustomSupabaseConfig(urlInput.trim(), anonKeyInput.trim());
    setSyncing(true);
    setSyncMessage(null);
    setSyncSuccess(null);

    try {
      const [lList, uList, rList, sCards] = await Promise.all([
        fetchLinks(),
        fetchUsers(),
        fetchStudyRecords(),
        fetchSubjectCards(),
      ]);

      const res = await syncAllDataToSupabase(lList, uList, rList, sCards);
      setSyncSuccess(res.success);
      setSyncMessage(res.message);

      if (res.success) {
        if (onSuccessNotice) onSuccessNotice(res.message);
        // Làm mới chẩn đoán bảng để cập nhật ngay số lượng bản ghi hiển thị
        const refreshedStatus = await testDetailedSupabaseConnection();
        setStatus(refreshedStatus);
      }
    } catch (e: any) {
      setSyncSuccess(false);
      setSyncMessage('Có lỗi xảy ra khi đồng bộ: ' + (e?.message || String(e)));
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (currentConfig.isConfigured) {
      testDetailedSupabaseConnection().then(setStatus);
    }
  }, []);

  const tablesList = [
    {
      key: 'profiles',
      label: 'Hồ sơ người dùng (profiles)',
      desc: 'Lưu tài khoản Học sinh, Giáo viên, Quản trị viên và mã PIN',
      icon: Users,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
    },
    {
      key: 'subjects',
      label: 'Môn học (subjects)',
      desc: 'Quản lý danh sách các môn: Tin học, Công nghệ, Toán, v.v.',
      icon: BookOpen,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      key: 'lessons',
      label: 'Bài học & Học liệu (lessons)',
      desc: 'Lưu trữ các liên kết bài tập Quizizz, Game tương tác, Video',
      icon: GraduationCap,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      key: 'learning_results',
      label: 'Kết quả học tập (learning_results)',
      desc: 'Lưu điểm số, số câu đúng và huy hiệu hoàn thành của học sinh',
      icon: Award,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      key: 'link_visits',
      label: 'Lượt truy cập học liệu (link_visits)',
      desc: 'Ghi nhận chi tiết từng lần click bài học thời gian thực (Realtime)',
      icon: Sparkles,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-2xl shrink-0">
              <Database className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <h3 className="text-title-section text-slate-900 flex items-center gap-2">
                Kết Nối Supabase Database & Kiểm Tra 4 Bảng Dữ Liệu
              </h3>
              <p className="text-desc text-slate-600 font-semibold mt-1">
                Đồng bộ tự động giữa Supabase, LocalStorage và hệ thống giáo dục tiểu học Nguồn sáng tri thức
              </p>
            </div>
          </div>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-input-button flex items-center gap-2 shadow-xs transition-colors shrink-0"
          >
            <span>Mở Supabase Console</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Trạng thái kết nối tổng thể */}
        <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-main-body font-black text-slate-800">Trạng thái kết nối Supabase:</span>
              {testing ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-caption-safe font-bold bg-sky-100 text-sky-800 border border-sky-300">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                  Đang kiểm tra kết nối tới Supabase...
                </span>
              ) : status?.success ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-caption-safe font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Đã kết nối thành công ({status.allCoreTablesExist ? '4/4 bảng chính đã sẵn sàng' : 'Đã kết nối'})
                </span>
              ) : currentConfig.isConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-caption-safe font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  {status?.message || 'Đang kết nối...'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-caption-safe font-bold bg-slate-200 text-slate-700">
                  Chưa cấu hình Secrets (Đang hoạt động qua bộ nhớ đệm an toàn)
                </span>
              )}
            </div>

            <button
              onClick={handleRunDiagnostic}
              disabled={testing}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-input-button flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối thực tế'}</span>
            </button>
          </div>

          {/* Chi tiết thông báo an toàn, không lộ secret key */}
          {status?.message && !testing && (
            <div className="mt-3.5 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-desc">
              <p
                className={`font-semibold ${
                  status.success ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {status.message}
              </p>
              {status.maskedKey && (
                <span className="text-caption-safe text-slate-600 font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200 shrink-0">
                  Khóa: {status.maskedKey}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bảng chẩn đoán chi tiết 4 bảng dữ liệu */}
        <div className="mt-6">
          <h4 className="text-main-body font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Table className="w-5 h-5 text-teal-600" />
            Chi tiết trạng thái 4 bảng chính &amp; bảng thống kê:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {tablesList.map((t) => {
              const diag = status?.tables[t.key];
              const Icon = t.icon;
              return (
                <div
                  key={t.key}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${t.color}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-main-body font-bold text-slate-800">{t.key}</span>
                    </div>
                    {diag?.exists ? (
                      diag.canInsert ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-caption-safe font-black bg-emerald-100 text-emerald-800">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Đọc &amp; Ghi OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-caption-safe font-bold bg-sky-100 text-sky-800 border border-sky-300" title="Bảng đã tạo thành công, cần thêm Policy RLS để ghi">
                          <Check className="w-3.5 h-3.5 text-sky-600" />
                          Đã có bảng (RLS)
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-caption-safe font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Chưa có bảng
                      </span>
                    )}
                  </div>
                  <p className="text-caption-safe text-slate-500 line-clamp-2 mb-2.5 leading-relaxed">{t.desc}</p>
                  <div className="flex items-center justify-between text-caption-safe pt-2 border-t border-slate-100 text-slate-600">
                    <span>Số bản ghi hiện tại:</span>
                    <strong className="text-slate-900 font-bold">{diag?.count ?? 0} bản ghi</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form cấu hình URL và Key */}
        <div className="mt-7 pt-5 border-t border-slate-100 space-y-4">
          <h4 className="text-main-body font-black text-slate-800 uppercase tracking-wider">
            Thông số kết nối (Được tự động đọc từ Secrets dự án):
          </h4>
          <div>
            <label className="block text-main-body font-bold text-slate-800 mb-1.5">
              Project URL (SUPABASE_URL hoặc VITE_SUPABASE_URL):
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-semibold outline-hidden focus:border-teal-500 focus:bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block text-main-body font-bold text-slate-800 mb-1.5">
              Publishable / Anon Key (SUPABASE_PUBLISHABLE_KEY hoặc VITE_SUPABASE_ANON_KEY):
            </label>
            <input
              type="password"
              value={anonKeyInput}
              onChange={(e) => setAnonKeyInput(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-semibold outline-hidden focus:border-teal-500 focus:bg-white text-slate-800"
            />
            <p className="text-caption-safe text-slate-500 mt-1.5">
              Hệ thống tự động phát hiện và xử lý chuẩn hóa nếu URL và Key bị dán ngược nhau trong Secrets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              onClick={handleRunDiagnostic}
              disabled={testing || syncing}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-input-button shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Đang kiểm tra kết nối...' : 'Lưu & Kiểm Tra Kết Nối'}</span>
            </button>

            <button
              onClick={handleSyncToSupabase}
              disabled={testing || syncing}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-black text-input-button shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              title="Đẩy toàn bộ bài học, môn học, tài khoản và điểm số hiện có vào bảng dữ liệu Supabase"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4.5 h-4.5" />
              )}
              <span>{syncing ? 'Đang đẩy dữ liệu lên Supabase...' : '🚀 Đẩy & Lưu Toàn Bộ Database Vào Supabase'}</span>
            </button>
          </div>

          {/* Banner thông báo kết quả đồng bộ */}
          {syncMessage && (
            <div
              className={`p-4 rounded-2xl text-desc flex items-start gap-3 mt-3 border ${
                syncSuccess
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              {syncSuccess ? (
                <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold">{syncMessage}</p>
                {syncSuccess && (
                  <p className="text-caption-safe text-emerald-800 mt-1">
                    Bạn có thể mở Supabase Console &gt; Table Editor để xem trực tiếp các dòng dữ liệu vừa được lưu vào các bảng <strong>lessons</strong>, <strong>subjects</strong>, <strong>profiles</strong>, <strong>learning_results</strong>.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Ghi chú về cơ chế tự động lưu */}
          <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-200/70 text-desc text-teal-950 flex items-start gap-2.5">
            <CheckCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Cơ chế tự động lưu dữ liệu: </span>
              Khi đã điền URL và Anon Key, mọi thao tác người dùng (giáo viên thêm/sửa/xóa bài Quizizz, học sinh hoàn thành bài và nộp điểm, tạo môn học mới) sẽ <strong>tự động lưu trực tiếp vào Supabase Database</strong> mà không cần thêm thao tác thủ công nào.
            </div>
          </div>
        </div>
      </div>

      {/* SQL Migration Script */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-title-section text-slate-900 flex items-center gap-2.5">
              <Code2 className="w-6 h-6 text-emerald-600" />
              Mã SQL Thiết Lập Đầy Đủ Quyền Cho 4 Bảng (Chạy tại Supabase SQL Editor)
            </h4>
            <p className="text-desc text-slate-600 mt-1 font-semibold">
              Tạo/bổ sung các cột an toàn và mở quyền bảo mật RLS để website đọc/ghi dữ liệu mượt mà
            </p>
          </div>

          <button
            onClick={handleCopySQL}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-input-button flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
          >
            {copiedSQL ? <Check className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
            <span>{copiedSQL ? 'Đã sao chép!' : 'Sao Chép SQL (1 Chạm)'}</span>
          </button>
        </div>

        {/* 3 Bước Hướng Dẫn */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/60 text-desc">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs mb-2.5">
              1
            </div>
            <p className="font-black text-slate-900 mb-1 text-main-body">Mở Supabase SQL Editor</p>
            <p className="text-slate-600 leading-relaxed text-caption-safe">
              Vào Supabase Dashboard &gt; chọn dự án &gt; chọn <strong>SQL Editor</strong> ở thanh menu bên trái &gt; bấm <strong>New query</strong>.
            </p>
          </div>

          <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-200/60 text-desc">
            <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-black flex items-center justify-center text-xs mb-2.5">
              2
            </div>
            <p className="font-black text-slate-900 mb-1 text-main-body">Dán SQL và Bấm Run</p>
            <p className="text-slate-600 leading-relaxed text-caption-safe">
              Bấm nút <strong>Sao Chép SQL</strong> ở trên, dán toàn bộ vào ô soạn thảo rồi bấm nút <strong>Run</strong> (xanh lá).
            </p>
          </div>

          <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-200/60 text-desc">
            <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-black flex items-center justify-center text-xs mb-2.5">
              3
            </div>
            <p className="font-black text-slate-900 mb-1 text-main-body">Kiểm Tra Lại</p>
            <p className="text-slate-600 leading-relaxed text-caption-safe">
              Quay lại website, bấm nút <strong>Kiểm tra kết nối thực tế</strong>. Tất cả 4 bảng sẽ chuyển trạng thái xanh và sẵn sàng lưu trữ vĩnh viễn!
            </p>
          </div>
        </div>

        {/* Code Box */}
        <div className="relative rounded-2xl bg-slate-950 text-slate-100 p-4 font-mono text-caption-safe leading-relaxed overflow-x-auto max-h-80 border border-slate-800">
          <pre>{sqlScript}</pre>
        </div>
      </div>
    </div>
  );
};

