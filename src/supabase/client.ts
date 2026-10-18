import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TableDiagnostic {
  name: string;
  exists: boolean;
  count: number;
  canRead: boolean;
  canInsert: boolean;
  rlsStatus?: 'full_access' | 'needs_policy' | 'not_found';
  errorMessage?: string;
}

export interface SupabaseConnectionStatus {
  isConfigured: boolean;
  success: boolean;
  connectionState: 'connecting' | 'connected' | 'error' | 'not_configured';
  url: string;
  maskedKey: string;
  hasAnonKey: boolean;
  message: string;
  tables: Record<string, TableDiagnostic>;
  allCoreTablesExist: boolean;
  allCoreTablesWritable: boolean;
}

// Cấu hình Supabase: lấy từ biến môi trường Vite / Google AI Studio Secrets hoặc cấu hình tùy chỉnh
export const getSupabaseConfig = () => {
  let url = '';
  let anonKey = '';

  // Thu thập tất cả các ứng viên biến môi trường
  const urlCandidates = [
    typeof window !== 'undefined' ? localStorage.getItem('kbtt_supabase_url') : '',
    typeof import.meta !== 'undefined' ? (import.meta as any).env?.SUPABASE_URL : '',
    typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : '',
    typeof process !== 'undefined' ? process.env?.SUPABASE_URL : '',
    typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '',
    'https://qkxqcnfctkzsfuutipnl.supabase.co',
  ].filter(Boolean);

  const keyCandidates = [
    typeof window !== 'undefined' ? localStorage.getItem('kbtt_supabase_anon_key') : '',
    typeof import.meta !== 'undefined' ? (import.meta as any).env?.SUPABASE_PUBLISHABLE_KEY : '',
    typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : '',
    typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY : '',
    typeof process !== 'undefined' ? process.env?.SUPABASE_PUBLISHABLE_KEY : '',
    typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '',
    typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_PUBLISHABLE_KEY : '',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFreHFjbmZjdGt6c2Z1dXRpcG5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MTUwODQsImV4cCI6MjEwNzQ5MTA4NH0.41tcwRblrTpmj5TwnEvbWibr5f8cWVVGml6KXhcAOCE',
  ].filter(Boolean);

  // Chọn đúng URL (bắt đầu bằng http:// hoặc https://)
  for (const c of [...urlCandidates, ...keyCandidates]) {
    const val = (c || '').trim();
    if (val.startsWith('http://') || val.startsWith('https://')) {
      url = val;
      break;
    }
  }

  // Chọn đúng Key (không bắt đầu bằng http:// và có độ dài hợp lệ)
  for (const k of [...keyCandidates, ...urlCandidates]) {
    const val = (k || '').trim();
    if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
      anonKey = val;
      break;
    }
  }

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && (url.startsWith('http://') || url.startsWith('https://'))),
  };
};

export const setCustomSupabaseConfig = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    let cleanUrl = url.trim();
    let cleanKey = anonKey.trim();

    // Tự động đảo nếu người dùng dán ngược
    if (cleanUrl && !cleanUrl.startsWith('http') && cleanKey && cleanKey.startsWith('http')) {
      const temp = cleanUrl;
      cleanUrl = cleanKey;
      cleanKey = temp;
    }

    if (cleanUrl) {
      localStorage.setItem('kbtt_supabase_url', cleanUrl);
    } else {
      localStorage.removeItem('kbtt_supabase_url');
    }

    if (cleanKey) {
      localStorage.setItem('kbtt_supabase_anon_key', cleanKey);
    } else {
      localStorage.removeItem('kbtt_supabase_anon_key');
    }

    // Khởi tạo lại phiên bản client
    supabaseClientInstance = initSupabaseClient();
  }
};

const initSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  try {
    return createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Lỗi khởi tạo Supabase Client:', err);
    return null;
  }
};

let supabaseClientInstance: SupabaseClient | null = initSupabaseClient();

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseClientInstance) {
    supabaseClientInstance = initSupabaseClient();
  }
  return supabaseClientInstance;
};

// Tạo chuỗi che giấu an toàn cho key (không bao giờ hiển thị toàn bộ key trong UI hoặc lỗi)
export const maskKey = (key: string): string => {
  if (!key) return '(Chưa có)';
  if (key.length <= 12) return '••••••••';
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
};

// Kiểm tra chi tiết kết nối và 4 bảng Supabase: profiles, subjects, lessons, learning_results
export const testDetailedSupabaseConnection = async (): Promise<SupabaseConnectionStatus> => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return {
      isConfigured: false,
      success: false,
      connectionState: 'not_configured',
      url: url || '',
      maskedKey: maskKey(anonKey),
      hasAnonKey: Boolean(anonKey),
      message: 'Chưa cấu hình đầy đủ SUPABASE_URL (bắt đầu bằng https://) và SUPABASE_PUBLISHABLE_KEY.',
      tables: {},
      allCoreTablesExist: false,
      allCoreTablesWritable: false,
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      isConfigured: true,
      success: false,
      connectionState: 'error',
      url,
      maskedKey: maskKey(anonKey),
      hasAnonKey: Boolean(anonKey),
      message: 'Không thể khởi tạo kết nối Supabase Client. Vui lòng kiểm tra lại định dạng URL.',
      tables: {},
      allCoreTablesExist: false,
      allCoreTablesWritable: false,
    };
  }

  const targetTables = ['profiles', 'subjects', 'lessons', 'learning_results', 'link_visits'];
  const tablesResult: Record<string, TableDiagnostic> = {};

  for (const t of targetTables) {
    try {
      // 1. Kiểm tra đọc (SELECT count)
      const { data, error, count } = await client
        .from(t)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        if (error.code === '42P01' || error.message.includes('schema cache') || error.code === 'PGRST205') {
          tablesResult[t] = {
            name: t,
            exists: false,
            count: 0,
            canRead: false,
            canInsert: false,
            rlsStatus: 'not_found',
            errorMessage: 'Chưa tìm thấy bảng trong cơ sở dữ liệu Supabase',
          };
        } else {
          tablesResult[t] = {
            name: t,
            exists: true,
            count: 0,
            canRead: false,
            canInsert: false,
            rlsStatus: 'needs_policy',
            errorMessage: 'Bảng đã tạo nhưng quyền truy cập đọc bị chặn bởi RLS',
          };
        }
      } else {
        // 2. Bảng tồn tại và đọc được, kiểm tra xem RLS có cho phép ghi không
        let canInsert = true;
        let rlsStatus: 'full_access' | 'needs_policy' = 'full_access';
        let writeError: string | undefined = undefined;

        try {
          // Thử một truy vấn an toàn để thăm dò quyền ghi RLS
          if (t === 'subjects') {
            const { data: probeData, error: insErr } = await client.from('subjects').insert({
              name: '__probe__',
              grade: 0,
            }).select();

            if (insErr) {
              if (insErr.code === '42501' || insErr.message.includes('row-level security')) {
                canInsert = false;
                rlsStatus = 'needs_policy';
                writeError = 'Cần thêm RLS Policy cho phép ghi vào bảng subjects';
              }
            } else if (probeData && probeData[0]?.id) {
              // Dọn dẹp dòng probe ngay lập tức
              await client.from('subjects').delete().eq('id', probeData[0].id);
            }
          }
        } catch {
          // Probe không ảnh hưởng luồng chính
        }

        tablesResult[t] = {
          name: t,
          exists: true,
          count: count ?? (data ? data.length : 0),
          canRead: true,
          canInsert,
          rlsStatus,
          errorMessage: writeError,
        };
      }
    } catch (e: any) {
      tablesResult[t] = {
        name: t,
        exists: false,
        count: 0,
        canRead: false,
        canInsert: false,
        rlsStatus: 'not_found',
        errorMessage: 'Lỗi truy vấn bảng: ' + (e.message || String(e)),
      };
    }
  }

  // Đánh giá 4 bảng chính: profiles, subjects, lessons, learning_results
  const mainTables = ['profiles', 'subjects', 'lessons', 'learning_results'];
  const missingMainTables = mainTables.filter((m) => !tablesResult[m]?.exists);
  const foundMainTables = mainTables.filter((m) => tablesResult[m]?.exists);
  const unwritableTables = mainTables.filter((m) => tablesResult[m]?.exists && !tablesResult[m]?.canInsert);

  const allCoreTablesExist = missingMainTables.length === 0;
  const allCoreTablesWritable = unwritableTables.length === 0;

  let message = '';
  if (allCoreTablesExist) {
    if (allCoreTablesWritable) {
      message = 'Kết nối Supabase hoàn tất! Đầy đủ 4 bảng chính và quyền đọc/ghi sẵn sàng.';
    } else {
      message = `Kết nối thành công! Đã tìm thấy cả 4 bảng chính (${foundMainTables.join(', ')}). Cần chạy lệnh SQL cấp quyền Policy (RLS) để ghi dữ liệu.`;
    }
  } else if (foundMainTables.length > 0) {
    message = `Đã kết nối Supabase (${foundMainTables.length}/4 bảng chính). Thiếu bảng: ${missingMainTables.join(', ')}.`;
  } else {
    message = 'Kết nối tới máy chủ Supabase thành công nhưng chưa có bảng dữ liệu nào.';
  }

  return {
    isConfigured: true,
    success: foundMainTables.length > 0,
    connectionState: 'connected',
    url,
    maskedKey: maskKey(anonKey),
    hasAnonKey: Boolean(anonKey),
    message,
    tables: tablesResult,
    allCoreTablesExist,
    allCoreTablesWritable,
  };
};

// Hàm kiểm tra tương thích ngược
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> => {
  const detailed = await testDetailedSupabaseConnection();
  return {
    success: detailed.success,
    message: detailed.message,
    count: Object.values(detailed.tables).reduce((acc, t) => acc + t.count, 0),
  };
};
