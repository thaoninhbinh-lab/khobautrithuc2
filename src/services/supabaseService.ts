import { getSupabaseClient, getSupabaseConfig } from '../supabase/client';
import { AccessLog, LinkItem } from '../types';

export interface SupabaseLinkVisit {
  id?: string;
  link_id: string;
  link_title: string;
  user_id?: string;
  user_name?: string;
  user_role?: string;
  school?: string;
  class_name?: string;
  subject?: string;
  grade?: number;
  resource_type?: string;
  created_at?: string;
}

// Ghi nhận lượt truy cập vào bảng link_visits trên Supabase
export const recordLinkVisitInSupabase = async (
  visit: Omit<SupabaseLinkVisit, 'id' | 'created_at'>
): Promise<SupabaseLinkVisit | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const payload = {
      link_id: visit.link_id,
      link_title: visit.link_title,
      user_id: visit.user_id || 'guest',
      user_name: visit.user_name || 'Khách / Chưa đăng nhập',
      user_role: visit.user_role || 'student',
      school: visit.school || 'Tiểu học',
      class_name: visit.class_name || '',
      subject: visit.subject || '',
      grade: visit.grade || 0,
      resource_type: visit.resource_type || '',
    };

    const { data, error } = await client
      .from('link_visits')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('Lỗi ghi Supabase link_visits:', error.message);
      return null;
    }

    return data as SupabaseLinkVisit;
  } catch (err) {
    console.warn('Lỗi kết nối Supabase link_visits:', err);
    return null;
  }
};

// Lấy toàn bộ lượt truy cập từ Supabase link_visits
export const fetchLinkVisitsFromSupabase = async (): Promise<SupabaseLinkVisit[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('link_visits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) {
      console.warn('Lỗi đọc link_visits từ Supabase:', error.message);
      return [];
    }

    return (data as SupabaseLinkVisit[]) || [];
  } catch (err) {
    console.warn('Lỗi gọi Supabase link_visits:', err);
    return [];
  }
};

// Đăng ký lắng nghe thời gian thực (Realtime) khi có lượt truy cập mới từ bất kỳ đâu
export const subscribeToSupabaseVisits = (
  onNewVisit: (visit: SupabaseLinkVisit) => void
) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const channel = client
      .channel('realtime_link_visits')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'link_visits' },
        (payload) => {
          if (payload.new) {
            onNewVisit(payload.new as SupabaseLinkVisit);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Lỗi đăng ký Realtime Supabase:', err);
    return () => {};
  }
};

// Chuyển đổi SupabaseLinkVisit sang định dạng AccessLog để tích hợp đồng nhất
export const convertSupabaseVisitToAccessLog = (v: SupabaseLinkVisit): AccessLog => {
  return {
    id: v.id || 'supa_' + Math.random().toString(36).slice(2),
    userId: v.user_id || 'guest',
    userName: v.user_name || 'Khách',
    userRole: (v.user_role as any) || 'student',
    school: v.school || 'Tiểu học',
    className: v.class_name,
    linkId: v.link_id,
    linkTitle: v.link_title,
    subject: (v.subject as any) || 'khac',
    grade: (v.grade as any) || 0,
    resourceType: (v.resource_type as any) || 'quizizz',
    action: 'open_link',
    timestamp: v.created_at || new Date().toISOString(),
  };
};

// =========================================================================
// 1. TÍCH HỢP BẢNG PROFILES (HỒ SƠ HỌC SINH, GIÁO VIÊN, QUẢN TRỊ VIÊN)
// =========================================================================
export const fetchProfilesFromSupabase = async (): Promise<any[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch profiles warning:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map((row: any) => ({
      uid: String(row.id || row.uid || ''),
      displayName: row.full_name || row.display_name || row.name || 'Người dùng',
      school: row.school_name || row.school || 'Tiểu học',
      assignedClass: row.class_name || row.assigned_class || row.className || '',
      email: row.email || undefined,
      pin: row.pin || undefined,
      role: (row.role as any) || 'student',
      subjects: row.subjects || (row.role === 'teacher' ? ['tinhoc', 'congnghe'] : undefined),
      approvalStatus: row.approval_status || row.approvalStatus || 'approved',
      createdAt: row.created_at || new Date().toISOString(),
      lastLoginAt: row.last_login_at || row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Lỗi kết nối Supabase profiles:', err);
    return [];
  }
};

// Hàm chuyển đổi định danh bất kỳ thành UUID hợp lệ theo chuẩn PostgreSQL UUID
export const stringToUuid = (str: string): string => {
  if (!str) return '00000000-0000-4000-a000-000000000001';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) return str;

  let hash = 0;
  const strWithSalt = str + '_kbtt_salt';
  for (let i = 0; i < strWithSalt.length; i++) {
    const char = strWithSalt.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  let hex = '';
  for (let i = 0; i < 32; i++) {
    const val = Math.abs(Math.sin(hash + i) * 16) | 0;
    hex += val.toString(16);
  }
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

export interface SaveProfileResult {
  success: boolean;
  error?: string;
  isSyncedToSupabase: boolean;
}

// Bộ nhớ đệm kiểm tra sự tồn tại của cột tùy chọn (như last_login_at) trên Supabase
let cachedHasLastLoginAtColumn: boolean | null = null;

export const checkProfilesColumns = async (): Promise<{ hasLastLoginAt: boolean }> => {
  if (cachedHasLastLoginAtColumn !== null) {
    return { hasLastLoginAt: cachedHasLastLoginAtColumn };
  }
  const client = getSupabaseClient();
  if (!client) return { hasLastLoginAt: false };
  try {
    const { error } = await client.from('profiles').select('id, last_login_at').limit(1);
    if (error && (error.message.includes('last_login_at') || error.code === '42703' || error.message.includes('schema cache'))) {
      cachedHasLastLoginAtColumn = false;
    } else if (!error) {
      cachedHasLastLoginAtColumn = true;
    } else {
      cachedHasLastLoginAtColumn = false;
    }
  } catch {
    cachedHasLastLoginAtColumn = false;
  }
  return { hasLastLoginAt: cachedHasLastLoginAtColumn };
};

export const saveProfileToSupabase = async (user: any): Promise<SaveProfileResult> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Chưa khởi tạo kết nối Supabase (thiếu URL hoặc anon key)', isSyncedToSupabase: false };
  }

  try {
    const userId = String(user.uid || user.id || '').trim();
    if (!userId) {
      return { success: false, error: 'Thiếu định danh người dùng (User ID)', isSyncedToSupabase: false };
    }

    // Kiểm tra và chuẩn hóa vai trò, chống nâng quyền bất hợp pháp
    const rawRole = (user.role || 'student').trim().toLowerCase();
    const role = (rawRole === 'admin' || rawRole === 'teacher' || rawRole === 'student') ? rawRole : 'student';

    // Tạo payload với các cột đã được xác minh tồn tại trong bảng public.profiles
    const payload: Record<string, any> = {
      id: userId,
      role: role,
      full_name: (user.displayName || user.name || 'Người dùng').trim(),
      school_name: (user.school || 'Tiểu học').trim(),
      class_name: (user.assignedClass || user.className || '').trim(),
      email: user.email ? String(user.email).trim().toLowerCase() : null,
      pin: user.pin ? String(user.pin).trim() : null,
      subjects: Array.isArray(user.subjects) ? user.subjects : null,
      approval_status: user.approvalStatus || 'approved',
      created_at: user.createdAt || new Date().toISOString(),
    };

    // Kiểm tra xem schema có cột last_login_at chưa
    const { hasLastLoginAt } = await checkProfilesColumns();
    if (hasLastLoginAt) {
      payload.last_login_at = user.lastLoginAt || new Date().toISOString();
    }

    let { error } = await client.from('profiles').upsert(payload, { onConflict: 'id' });

    // Cơ chế khôi phục nếu schema cache Supabase chưa có cột last_login_at
    if (error && (error.message.includes('last_login_at') || error.message.includes('schema cache'))) {
      cachedHasLastLoginAtColumn = false;
      delete payload.last_login_at;
      const retryResult = await client.from('profiles').upsert(payload, { onConflict: 'id' });
      error = retryResult.error;
    }

    if (error) {
      console.error('Lỗi lưu hồ sơ Supabase:', error.message, error);
      return { success: false, error: error.message, isSyncedToSupabase: false };
    }

    return { success: true, isSyncedToSupabase: true };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error('Ngoại lệ khi lưu hồ sơ Supabase:', msg);
    return { success: false, error: msg, isSyncedToSupabase: false };
  }
};

export const deleteProfileFromSupabase = async (uid: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('profiles').delete().eq('id', uid);
    if (error) {
      console.warn('Supabase delete profile notice:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

// =========================================================================
// 2. TÍCH HỢP BẢNG SUBJECTS (MÔN HỌC & THẺ MÔN HỌC)
// =========================================================================
import { SubjectCard } from '../types';

export const getSubjectDefaultIcon = (name: string): string => {
  const n = (name || '').toLowerCase().trim();
  if (n === 'toán' || n.includes('toán')) return '📐';
  if (n === 'tiếng việt' || n.includes('tiếng việt')) return '📖';
  if (n === 'tiếng anh' || n.includes('tiếng anh') || n.includes('english')) return '🔤';
  if (n === 'địa lý' || n === 'địa lí' || n.includes('địa')) return '🌍';
  if (n === 'lịch sử' || n.includes('lịch sử')) return '🏛️';
  if (n === 'tin học' || n.includes('tin')) return '💻';
  if (n === 'công nghệ' || n.includes('công')) return '⚙️';
  if (n === 'khoa học' || n.includes('khoa học')) return '🔬';
  if (n === 'đạo đức' || n.includes('đạo đức')) return '❤️';
  if (n === 'hđtn' || n.includes('hdtn') || n.includes('trải nghiệm')) return '🌟';
  if (n.includes('mỹ thuật') || n.includes('vẽ')) return '🎨';
  if (n.includes('âm nhạc') || n.includes('hát')) return '🎵';
  if (n.includes('thể chất') || n.includes('thể dục')) return '⚽';
  return '📚';
};

export const getSubjectDefaultColor = (name: string): string => {
  const n = (name || '').toLowerCase().trim();
  if (n === 'toán' || n.includes('toán')) return 'blue';
  if (n === 'tiếng việt' || n.includes('tiếng việt')) return 'rose';
  if (n === 'tiếng anh' || n.includes('tiếng anh')) return 'indigo';
  if (n === 'địa lý' || n === 'địa lí' || n.includes('địa')) return 'teal';
  if (n === 'lịch sử' || n.includes('lịch sử')) return 'amber';
  if (n === 'tin học' || n.includes('tin')) return 'emerald';
  if (n === 'công nghệ' || n.includes('công')) return 'orange';
  if (n === 'khoa học' || n.includes('khoa học')) return 'purple';
  if (n === 'đạo đức' || n.includes('đạo đức')) return 'red';
  if (n === 'hđtn' || n.includes('hdtn') || n.includes('trải nghiệm')) return 'amber';
  return 'teal';
};

export interface SupabaseSubject {
  id: string;
  name: string;
  grade?: number;
  description?: string;
  created_at?: string;
}

export const fetchSubjectCardsFromSupabase = async (): Promise<SubjectCard[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client.from('subjects').select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn('Supabase fetch subjects notice:', error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return data.map((row: any) => {
      let meta: any = {};
      if (row.description) {
        try {
          meta = JSON.parse(row.description);
        } catch {
          meta = { text: row.description };
        }
      }

      return {
        id: String(row.id),
        name: row.name || 'Môn học',
        grade: Number(row.grade ?? meta.grade ?? 3),
        className: row.class_name || meta.className || `Lớp ${row.grade || 3}`,
        description: meta.text || row.description || '',
        icon: row.icon || meta.icon || getSubjectDefaultIcon(row.name),
        themeColor: row.color || meta.themeColor || getSubjectDefaultColor(row.name),
        creatorId: row.creator_id || meta.creatorId || undefined,
        creatorName: row.creator_name || meta.creatorName || undefined,
        isDefault: Boolean(meta.isDefault || row.id?.startsWith('tinhoc-') || row.id?.startsWith('congnghe-')),
        createdAt: row.created_at || meta.createdAt || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn('Lỗi đọc Supabase subjects:', err);
    return [];
  }
};

export const saveSubjectCardToSupabase = async (card: SubjectCard): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const metaJson = JSON.stringify({
      cardId: card.id,
      text: card.description || `${card.name} - ${card.className}`,
      className: card.className,
      icon: card.icon || getSubjectDefaultIcon(card.name),
      themeColor: card.themeColor || getSubjectDefaultColor(card.name),
      creatorId: card.creatorId,
      creatorName: card.creatorName,
      isDefault: card.isDefault,
      createdAt: card.createdAt || new Date().toISOString(),
    });

    const isNumericId = card.id && !isNaN(Number(card.id));

    // 1. Payload tương thích 100% với bảng subjects hiện tại (id bigint, name, grade, description)
    const safePayload: any = {
      name: card.name,
      grade: Number(card.grade || 0),
      description: metaJson,
    };
    if (isNumericId) safePayload.id = Number(card.id);

    // Kiểm tra xem môn đã tồn tại chưa để tránh nhân bản
    const { data: existing } = await client
      .from('subjects')
      .select('id')
      .eq('name', card.name)
      .limit(1);

    if (existing && existing.length > 0) {
      const { error: updErr } = await client
        .from('subjects')
        .update(safePayload)
        .eq('id', existing[0].id);
      return !updErr;
    }

    const { error: insErr } = await client.from('subjects').insert([safePayload]);
    if (!insErr) return true;

    // Fallback nếu bảng có cột id dạng chuỗi
    const fullPayload = { ...safePayload, id: String(card.id) };
    const { error: fullErr } = await client.from('subjects').insert([fullPayload]);
    return !fullErr;
  } catch (err) {
    console.warn('Lỗi lưu subject card Supabase:', err);
    return false;
  }
};

export const deleteSubjectCardFromSupabase = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('subjects').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete subject card notice:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const fetchSubjectsFromSupabase = async (): Promise<SupabaseSubject[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client.from('subjects').select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn('Supabase fetch subjects notice:', error.message);
      return [];
    }
    return (data as SupabaseSubject[]) || [];
  } catch (err) {
    console.warn('Lỗi gọi Supabase subjects:', err);
    return [];
  }
};

export const saveSubjectToSupabase = async (sub: {
  id?: string;
  name: string;
  grade?: number;
  description?: string;
}): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload: any = {
      name: sub.name,
      description: sub.description || '',
      grade: sub.grade || 0,
    };
    if (sub.id) payload.id = sub.id;

    const { error } = await client.from('subjects').upsert(payload);
    if (error) {
      console.warn('Supabase save subject notice:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

// =========================================================================
// 3. TÍCH HỢP BẢNG LESSONS (BÀI HỌC / HỌC LIỆU)
// =========================================================================
export const fetchLessonsFromSupabase = async (): Promise<LinkItem[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Chưa thể kết nối tới cơ sở dữ liệu Supabase. Vui lòng kiểm tra cấu hình.');
  }

  const { data, error } = await client
    .from('lessons')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) {
    console.warn('Supabase fetch lessons error:', error.message);
    throw new Error(`Lỗi truy vấn học liệu từ Supabase: ${error.message}`);
  }

  if (!data || data.length === 0) return [];

  return data.map((row: any) => {
    let extra: any = {};
    if (row.content) {
      if (typeof row.content === 'object') {
        extra = row.content;
      } else {
        try {
          extra = JSON.parse(row.content);
        } catch {
          extra = { url: row.content };
        }
      }
    }

    const title = extra.title || row.title || 'Học liệu';
    const url = extra.url || row.url || '';
    const description = extra.description !== undefined ? extra.description : (row.description || '');
    const subject = extra.subject || row.subject_id || row.subject || 'tinhoc';
    const grade = Number(extra.grade !== undefined ? extra.grade : (row.grade !== undefined ? row.grade : 0));
    const lesson = extra.lesson || row.lesson || '';
    const topic = extra.topic || row.topic || '';
    const rawType = extra.resourceType || row.resource_type || row.type || 'tro_choi';
    let resourceType: 'tro_choi' | 'video' | 'khac' = 'tro_choi';
    if (rawType === 'video') resourceType = 'video';
    else if (rawType === 'khac' || rawType === 'tailieu' || rawType === 'other') resourceType = 'khac';
    else resourceType = 'tro_choi';

    const isPinned = Boolean(extra.isPinned !== undefined ? extra.isPinned : (row.is_pinned ?? false));
    const isPublic = Boolean(extra.isPublic !== undefined ? extra.isPublic : (row.is_public !== undefined ? row.is_public : true));
    const isFavorite = Boolean(extra.isFavorite !== undefined ? extra.isFavorite : (row.is_favorite ?? false));
    const playCount = (row.play_count !== undefined && row.play_count !== null)
      ? Number(row.play_count)
      : Number(extra.playCount ?? 0);
    const creatorId = extra.creatorId || row.creator_id || '';
    const creatorName = extra.creatorName || row.creator_name || 'Giáo viên';
    const creatorSchool = extra.creatorSchool || row.creator_school || 'Trường Tiểu học B Hải Xuân';
    const creatorRole = extra.creatorRole || row.creator_role || 'teacher';
    const createdAt = extra.createdAt || row.created_at || new Date().toISOString();
    const updatedAt = extra.updatedAt || row.updated_at || new Date().toISOString();

    return {
      id: String(extra.id || row.id),
      title,
      url,
      description,
      subject,
      grade,
      lesson,
      topic,
      resourceType,
      notes: extra.notes || row.notes || '',
      tags: Array.isArray(extra.tags) ? extra.tags : (Array.isArray(row.tags) ? row.tags : []),
      isPinned,
      isPublic,
      isFavorite,
      playCount,
      creatorId,
      creatorName,
      creatorSchool,
      creatorRole,
      createdAt,
      updatedAt,
    };
  });
};

export const createLessonInSupabase = async (
  item: (Omit<LinkItem, 'id'> & { id?: string })
): Promise<string | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const lessonId = item.id || ('les_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7));
    const extraContent = {
      id: lessonId,
      title: item.title,
      description: item.description || '',
      url: item.url || 'https://quizizz.com',
      grade: Number(item.grade || 3),
      subject: item.subject || 'tinhoc',
      resourceType: item.resourceType || 'quizizz',
      lesson: item.lesson || '',
      topic: item.topic || '',
      notes: item.notes || '',
      tags: Array.isArray(item.tags) ? item.tags : [],
      isPinned: Boolean(item.isPinned),
      isPublic: item.isPublic !== undefined ? Boolean(item.isPublic) : true,
      isFavorite: Boolean(item.isFavorite),
      playCount: Number(item.playCount || 0),
      creatorId: item.creatorId,
      creatorName: item.creatorName,
      creatorSchool: item.creatorSchool,
      creatorRole: item.creatorRole,
      createdAt: item.createdAt || new Date().toISOString(),
    };

    // 1. Thử chèn đầy đủ các cột (nếu bảng đã có các cột url, grade, resource_type...)
    const isNumId = item.id && !isNaN(Number(item.id));
    const fullPayload: any = {
      title: item.title,
      description: item.description || '',
      content: extraContent,
      subject_id: (item.subject && !isNaN(Number(item.subject))) ? Number(item.subject) : null,
      url: item.url || 'https://quizizz.com',
      grade: Number(item.grade || 3),
      lesson: item.lesson || '',
      topic: item.topic || '',
      resource_type: item.resourceType || 'quizizz',
      notes: item.notes || '',
      tags: Array.isArray(item.tags) ? item.tags : [],
      is_pinned: Boolean(item.isPinned),
      is_public: item.isPublic !== undefined ? Boolean(item.isPublic) : true,
      is_favorite: Boolean(item.isFavorite),
      play_count: Number(item.playCount || 0),
      creator_id: item.creatorId || 'teacher',
      creator_name: item.creatorName || 'Giáo viên',
      creator_school: item.creatorSchool || 'Tiểu học',
      creator_role: item.creatorRole || 'teacher',
      created_at: item.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (isNumId) fullPayload.id = Number(item.id);

    const { data: fullData, error: fullError } = await client
      .from('lessons')
      .insert([fullPayload])
      .select()
      .single();

    if (!fullError && fullData) {
      return String(fullData.id);
    }

    // 2. Fallback an toàn tuyệt đối (tương thích 100% với bảng lessons nguyên bản trên Supabase)
    const fallbackPayload: any = {
      title: item.title,
      description: item.description || '',
      content: extraContent,
    };

    const { data: fallbackData, error: fallbackError } = await client
      .from('lessons')
      .insert([fallbackPayload])
      .select()
      .single();

    if (fallbackError) {
      console.warn('Supabase create lesson fallback notice:', fallbackError.message);
      return null;
    }
    return fallbackData?.id ? String(fallbackData.id) : lessonId;
  } catch (err) {
    console.warn('Lỗi tạo lesson Supabase:', err);
    return null;
  }
};

export const updateLessonInSupabase = async (id: string, updates: Partial<LinkItem>): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const isNumId = id && !isNaN(Number(id)) && Number(id) > 0;
    
    // 1. Tìm bản ghi hiện tại để lấy content JSONB/TEXT cũ (không ghi đè mất thông tin)
    let existingRow: any = null;
    if (isNumId) {
      const { data } = await client.from('lessons').select('*').eq('id', Number(id)).maybeSingle();
      existingRow = data;
    }
    if (!existingRow) {
      // Tìm theo chuỗi id (nếu id là TEXT / UUID)
      const { data: textIdRow } = await client.from('lessons').select('*').eq('id', String(id)).maybeSingle();
      existingRow = textIdRow;
    }
    if (!existingRow) {
      // Tìm theo content->>id (dạng les_...) an toàn
      try {
        const { data: contentIdRow } = await client.from('lessons').select('*').filter('content->>id', 'eq', String(id)).maybeSingle();
        existingRow = contentIdRow;
      } catch {
        // bỏ qua nếu cột content không phải json
      }
    }
    if (!existingRow && updates.url) {
      // Dự phòng tìm theo URL
      const { data: urlRow } = await client.from('lessons').select('*').eq('url', updates.url).maybeSingle();
      existingRow = urlRow;
    }

    if (!existingRow) {
      console.warn(`Không tìm thấy học liệu với ID: ${id} trên Supabase để update, thực hiện chèn mới bảo toàn dữ liệu`);
      await createLessonInSupabase({
        id: String(id),
        title: updates.title || 'Học liệu',
        description: updates.description || '',
        url: updates.url || 'https://quizizz.com',
        subject: updates.subject || 'tinhoc',
        grade: updates.grade || 1,
        lesson: updates.lesson || '',
        topic: updates.topic || '',
        resourceType: updates.resourceType || 'tro_choi',
        notes: updates.notes || '',
        tags: updates.tags || [],
        isPinned: updates.isPinned || false,
        isPublic: updates.isPublic !== undefined ? updates.isPublic : true,
        isFavorite: updates.isFavorite || false,
        playCount: updates.playCount || 0,
        createdAt: updates.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creatorId: updates.creatorId || 'admin',
        creatorName: updates.creatorName || 'Giáo viên',
        creatorSchool: updates.creatorSchool || 'Tiểu học',
        creatorRole: updates.creatorRole || 'admin',
      });
      return true;
    }

    const realPk = existingRow.id;
    let oldContent: any = {};
    if (typeof existingRow.content === 'object' && existingRow.content !== null) {
      oldContent = existingRow.content;
    } else if (typeof existingRow.content === 'string') {
      try {
        oldContent = JSON.parse(existingRow.content);
      } catch {
        oldContent = {};
      }
    }

    // Hợp nhất an toàn: bảo toàn toàn bộ URL, tags, creatorId, metadata cũ
    const mergedContent = {
      ...oldContent,
      ...updates,
      id: oldContent.id || String(id),
      playCount: updates.playCount !== undefined ? updates.playCount : (oldContent.playCount || existingRow.play_count || 0),
      updatedAt: new Date().toISOString(),
    };

    const isContentString = typeof existingRow.content === 'string';
    const contentPayload = isContentString ? JSON.stringify(mergedContent) : mergedContent;

    const payload: any = {
      updated_at: new Date().toISOString(),
      content: contentPayload,
    };

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.url !== undefined) payload.url = updates.url;
    if (updates.grade !== undefined) payload.grade = Number(updates.grade);
    if (updates.lesson !== undefined) payload.lesson = updates.lesson;
    if (updates.topic !== undefined) payload.topic = updates.topic;
    if (updates.resourceType !== undefined) payload.resource_type = updates.resourceType;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.isPinned !== undefined) payload.is_pinned = updates.isPinned;
    if (updates.isPublic !== undefined) payload.is_public = updates.isPublic;
    if (updates.isFavorite !== undefined) payload.is_favorite = updates.isFavorite;
    if (updates.playCount !== undefined) payload.play_count = updates.playCount;
    if (updates.creatorName !== undefined) payload.creator_name = updates.creatorName;
    if (updates.creatorSchool !== undefined) payload.creator_school = updates.creatorSchool;
    if (updates.subject !== undefined) {
      if (!isNaN(Number(updates.subject))) {
        payload.subject_id = Number(updates.subject);
      } else {
        payload.subject_id = String(updates.subject);
      }
    }

    // 1. Thử cập nhật full payload
    const { error: fullError } = await client.from('lessons').update(payload).eq('id', realPk);
    if (!fullError) {
      return true;
    }

    console.warn(`Thử cập nhật đầy đủ các cột Supabase thất bại (${fullError.message}), kích hoạt cơ chế fallback an toàn...`);

    // 2. Fallback: Bỏ các cột ngoại khóa có thể không tương thích (như subject_id)
    const fallbackPayload: any = {
      title: updates.title !== undefined ? updates.title : existingRow.title,
      description: updates.description !== undefined ? updates.description : (existingRow.description || ''),
      content: contentPayload,
      updated_at: new Date().toISOString(),
    };
    if (updates.url !== undefined) fallbackPayload.url = updates.url;
    if (updates.grade !== undefined) fallbackPayload.grade = Number(updates.grade);
    if (updates.resourceType !== undefined) fallbackPayload.resource_type = updates.resourceType;
    if (updates.isPinned !== undefined) {
      fallbackPayload.is_pinned = updates.isPinned;
    }
    if (updates.isPublic !== undefined) {
      fallbackPayload.is_public = updates.isPublic;
    }

    const { error: fallbackError } = await client.from('lessons').update(fallbackPayload).eq('id', realPk);
    if (!fallbackError) {
      return true;
    }

    // 3. Fallback tối thiểu nhất: chỉ cập nhật title, description, content dạng text/json
    const minPayload = {
      title: updates.title !== undefined ? updates.title : existingRow.title,
      description: updates.description !== undefined ? updates.description : '',
      content: contentPayload,
    };
    const { error: minError } = await client.from('lessons').update(minPayload).eq('id', realPk);
    if (!minError) {
      return true;
    }

    // 4. Fallback cuối cùng: Thử gửi content dưới dạng string thuần
    const stringContentPayload = typeof contentPayload === 'string' ? contentPayload : JSON.stringify(contentPayload);
    const { error: lastError } = await client.from('lessons').update({
      title: updates.title || existingRow.title,
      content: stringContentPayload,
    }).eq('id', realPk);

    if (lastError) {
      console.error(`Cả 4 phương thức cập nhật Supabase đều thất bại:`, lastError.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error(`Ngoại lệ khi cập nhật học liệu ${id} trên Supabase:`, err);
    return false;
  }
};

export const deleteLessonInSupabase = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const isNumId = id && !isNaN(Number(id));
    const query = client.from('lessons').delete();
    const { error } = isNumId ? await query.eq('id', Number(id)) : await query.eq('id', id);
    if (error) {
      console.warn('Supabase delete lesson notice:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Tăng số lượt chơi của bài học một cách nguyên tử trên Supabase
 * Ưu tiên gọi hàm RPC `increment_lesson_play(p_lesson_id)`.
 * Nếu chưa cấu hình RPC trên máy chủ, tự động fallback sang cập nhật nguyên vẹn cả play_count và content->playCount.
 */
export const incrementLessonPlayInSupabase = async (
  lessonId: string | number
): Promise<{ success: boolean; newPlayCount?: number }> => {
  const client = getSupabaseClient();
  if (!client) return { success: false };

  const numId = Number(lessonId);

  // 1. Thử gọi RPC increment_lesson_play (nguyên tử trên PostgreSQL)
  if (!isNaN(numId) && numId > 0) {
    try {
      const { data, error } = await client.rpc('increment_lesson_play', {
        p_lesson_id: numId,
      });
      if (!error && data && data.success) {
        return { success: true, newPlayCount: data.play_count };
      }
    } catch {
      // Bỏ qua lỗi để chuyển sang fallback
    }
  }

  // 2. Fallback an toàn tuyệt đối nếu chưa chạy RPC trên Supabase SQL Editor
  try {
    let existingRow: any = null;
    if (!isNaN(numId) && numId > 0) {
      const { data } = await client.from('lessons').select('*').eq('id', numId).single();
      existingRow = data;
    } else {
      const { data } = await client.from('lessons').select('*').filter('content->>id', 'eq', String(lessonId)).maybeSingle();
      existingRow = data;
    }

    if (!existingRow) return { success: false };

    const oldContent = typeof existingRow.content === 'object' && existingRow.content !== null
      ? existingRow.content
      : JSON.parse(existingRow.content || '{}');

    const currentCount = Number(
      existingRow.play_count !== undefined && existingRow.play_count !== null
        ? existingRow.play_count
        : (oldContent.playCount || 0)
    );
    const newCount = currentCount + 1;

    const mergedContent = {
      ...oldContent,
      playCount: newCount,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await client
      .from('lessons')
      .update({
        play_count: newCount,
        content: mergedContent,
      })
      .eq('id', existingRow.id);

    if (error) {
      console.warn('Lỗi cập nhật play_count fallback:', error.message);
      return { success: false };
    }

    return { success: true, newPlayCount: newCount };
  } catch (err) {
    console.warn('Ngoại lệ khi tăng lượt chơi:', err);
    return { success: false };
  }
};

// =========================================================================
// 4. TÍCH HỢP BẢNG LEARNING_RESULTS (KẾT QUẢ HỌC TẬP)
// =========================================================================
export const fetchLearningResultsFromSupabase = async (): Promise<any[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('learning_results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch learning_results notice:', error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any) => {
      let details: any = {};
      if (row.details) {
        try {
          details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
        } catch {
          details = {};
        }
      }

      return {
        id: String(row.id),
        userId: row.student_id || details.userId || 'student_guest',
        studentName: details.studentName || row.student_name || 'Học sinh',
        school: details.school || row.school || 'Tiểu học',
        className: details.className || row.class_name || '3A',
        linkId: row.lesson_id || details.linkId || '',
        linkTitle: details.linkTitle || details.lessonTitle || 'Bài học',
        subject: (details.subject || row.subject || 'tinhoc') as any,
        grade: Number(details.grade || row.grade || 3) as any,
        lesson: details.lesson || row.lesson || '',
        platform: details.platform || 'Quizizz',
        score: Number(row.score ?? details.score ?? 100),
        correctAnswers: details.correctAnswers,
        totalQuestions: details.totalQuestions,
        badgeEarned: details.badgeEarned,
        completedAt: row.completed_at || row.created_at || details.completedAt || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn('Lỗi đọc learning_results Supabase:', err);
    return [];
  }
};

export const createLearningResultInSupabase = async (record: any): Promise<string | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const resultId = record.id || ('rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7));
    const details = JSON.stringify({
      studentName: record.studentName,
      school: record.school,
      className: record.className,
      linkTitle: record.linkTitle,
      subject: record.subject,
      grade: record.grade,
      lesson: record.lesson,
      platform: record.platform,
      correctAnswers: record.correctAnswers,
      totalQuestions: record.totalQuestions,
      badgeEarned: record.badgeEarned,
      completedAt: record.completedAt,
    });

    const isNumId = record.id && !isNaN(Number(record.id));
    const payload: any = {
      student_id: String(record.userId || record.studentName || 'student_guest'),
      lesson_id: String(record.linkId || 'lesson_general'),
      score: Number(record.score ?? 100),
      student_name: record.studentName || 'Học sinh',
      school: record.school || 'Tiểu học',
      class_name: record.className || '3A',
      link_title: record.linkTitle || 'Bài học',
      subject: String(record.subject || 'tinhoc'),
      grade: Number(record.grade || 3),
      lesson: record.lesson || '',
      platform: record.platform || 'Quizizz',
      correct_answers: record.correctAnswers !== undefined ? Number(record.correctAnswers) : null,
      total_questions: record.totalQuestions !== undefined ? Number(record.totalQuestions) : null,
      badge_earned: record.badgeEarned || null,
      completed_at: record.completedAt || new Date().toISOString(),
      created_at: record.completedAt || new Date().toISOString(),
      details,
    };
    if (isNumId) payload.id = Number(record.id);

    const { data, error } = isNumId
      ? await client.from('learning_results').upsert(payload, { onConflict: 'id' }).select().single()
      : await client.from('learning_results').insert([payload]).select().single();

    if (error) {
      console.warn('Supabase create learning_result notice:', error.message);
      return null;
    }
    return data?.id ? String(data.id) : (isNumId ? String(record.id) : 'ok');
  } catch (err) {
    console.warn('Lỗi ghi Supabase learning_result:', err);
    return null;
  }
};

export const deleteLearningResultInSupabase = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('learning_results').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete learning_result notice:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export interface LinkVisitAggregatedStat {
  stt: number;
  linkId: string;
  title: string;
  url: string;
  subject: string;
  grade: number;
  resourceType: string;
  creatorName: string;
  creatorSchool?: string;
  creatorRole?: string;
  createdAt: string;
  totalVisits: number;
  todayVisits: number;
  last7DaysVisits: number;
  last30DaysVisits: number;
  lastVisitedAt: string | null;
}

// Tính toán thống kê chi tiết từng học liệu theo yêu cầu bài toán
export const computeLinkVisitStats = (
  links: LinkItem[],
  logs: AccessLog[]
): {
  stats: LinkVisitAggregatedStat[];
  totalVisits: number;
  todayTotalVisits: number;
  last7DaysTotalVisits: number;
  last30DaysTotalVisits: number;
} => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  // Gom nhóm logs theo linkId
  const logsByLinkId: Record<string, AccessLog[]> = {};
  logs.forEach((log) => {
    if (!logsByLinkId[log.linkId]) {
      logsByLinkId[log.linkId] = [];
    }
    logsByLinkId[log.linkId].push(log);
  });

  let allTotal = 0;
  let allToday = 0;
  let all7Days = 0;
  let all30Days = 0;

  const stats: LinkVisitAggregatedStat[] = links.map((link, idx) => {
    const itemLogs = logsByLinkId[link.id] || [];

    // Tổng lượt truy cập: kết hợp giữa số đếm trên học liệu và số logs thực tế
    const loggedCount = itemLogs.length;
    const total = Math.max(loggedCount, link.playCount || 0);

    let todayCount = 0;
    let past7DaysCount = 0;
    let past30DaysCount = 0;
    let latestTime: number = 0;

    itemLogs.forEach((log) => {
      const logTime = new Date(log.timestamp).getTime();
      if (!isNaN(logTime)) {
        if (logTime >= startOfToday) todayCount++;
        if (logTime >= sevenDaysAgo) past7DaysCount++;
        if (logTime >= thirtyDaysAgo) past30DaysCount++;
        if (logTime > latestTime) latestTime = logTime;
      }
    });

    allTotal += total;
    allToday += todayCount;
    all7Days += past7DaysCount;
    all30Days += past30DaysCount;

    return {
      stt: idx + 1,
      linkId: link.id,
      title: link.title,
      url: link.url,
      subject: link.subject,
      grade: link.grade,
      resourceType: link.resourceType,
      creatorName: link.creatorName || 'Giáo viên',
      creatorSchool: link.creatorSchool,
      creatorRole: link.creatorRole,
      createdAt: link.createdAt,
      totalVisits: total,
      todayVisits: todayCount,
      last7DaysVisits: past7DaysCount,
      last30DaysVisits: past30DaysCount,
      lastVisitedAt: latestTime > 0 ? new Date(latestTime).toISOString() : null,
    };
  });

  return {
    stats,
    totalVisits: allTotal,
    todayTotalVisits: allToday,
    last7DaysTotalVisits: all7Days,
    last30DaysTotalVisits: all30Days,
  };
};

// Xuất file CSV thống kê chi tiết từng học liệu (UTF-8 BOM hỗ trợ Excel tiếng Việt)
export const exportLinkStatsToCSV = (stats: LinkVisitAggregatedStat[]): void => {
  const headers = [
    'STT',
    'Tên học liệu',
    'Môn học',
    'Khối lớp',
    'Loại học liệu',
    'Giáo viên đăng tải',
    'Trường học',
    'Ngày đăng tải',
    'Tổng lượt truy cập',
    'Lượt truy cập hôm nay',
    'Lượt truy cập 7 ngày',
    'Lượt truy cập 30 ngày',
    'Thời điểm truy cập gần nhất',
    'Đường dẫn liên kết (URL)',
  ];

  const rows = stats.map((s, idx) => [
    `"${idx + 1}"`,
    `"${s.title.replace(/"/g, '""')}"`,
    `"${s.subject === 'tinhoc' ? 'Tin học' : s.subject === 'congnghe' ? 'Công nghệ' : 'Khác'}"`,
    `"${s.grade === 0 ? 'Chung' : `Lớp ${s.grade}`}"`,
    `"${s.resourceType === 'quizizz' ? 'Quizizz' : s.resourceType === 'game_tuongtac' ? 'Game Tương tác' : s.resourceType === 'video' ? 'Video Bài học' : 'Học liệu'}"`,
    `"${(s.creatorName || '').replace(/"/g, '""')}"`,
    `"${(s.creatorSchool || '').replace(/"/g, '""')}"`,
    `"${s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : '-'}"`,
    `"${s.totalVisits}"`,
    `"${s.todayVisits}"`,
    `"${s.last7DaysVisits}"`,
    `"${s.last30DaysVisits}"`,
    `"${s.lastVisitedAt ? new Date(s.lastVisitedAt).toLocaleString('vi-VN') : 'Chưa có'}"`,
    `"${s.url}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Thong_ke_luot_truy_cap_hoc_lieu_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// =========================================================================
// 5. ĐỒNG BỘ TOÀN BỘ DỮ LIỆU HIỆN TẠI VÀO CƠ SỞ DỮ LIỆU SUPABASE
// =========================================================================
export interface SyncDataResult {
  success: boolean;
  syncedProfiles: number;
  syncedSubjects: number;
  syncedLessons: number;
  syncedResults: number;
  message: string;
  errors: string[];
}

export const syncAllDataToSupabase = async (
  links: LinkItem[],
  users: any[],
  records: any[],
  subjectCards?: SubjectCard[]
): Promise<SyncDataResult> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      syncedProfiles: 0,
      syncedSubjects: 0,
      syncedLessons: 0,
      syncedResults: 0,
      message: 'Chưa khởi tạo được Supabase Client. Vui lòng kiểm tra lại URL và Anon Key!',
      errors: ['Client not initialized'],
    };
  }

  const errors: string[] = [];
  let syncedProfiles = 0;
  let syncedSubjects = 0;
  let syncedLessons = 0;
  let syncedResults = 0;

  // 1. Đồng bộ Profiles
  if (users && users.length > 0) {
    for (const u of users) {
      try {
        const res = await saveProfileToSupabase(u);
        if (res.success) syncedProfiles++;
        else errors.push(`Không thể lưu hồ sơ: ${u.displayName || u.name || u.id} (${res.error || ''})`);
      } catch (err: any) {
        errors.push(`Lỗi profile ${u.displayName}: ${err?.message || String(err)}`);
      }
    }
  }

  // 2. Đồng bộ Subjects
  if (subjectCards && subjectCards.length > 0) {
    for (const s of subjectCards) {
      try {
        const ok = await saveSubjectCardToSupabase(s);
        if (ok) syncedSubjects++;
        else errors.push(`Không thể lưu môn học: ${s.name}`);
      } catch (err: any) {
        errors.push(`Lỗi môn học ${s.name}: ${err?.message || String(err)}`);
      }
    }
  }

  // 3. Đồng bộ Lessons
  if (links && links.length > 0) {
    for (const l of links) {
      try {
        const id = await createLessonInSupabase(l);
        if (id) syncedLessons++;
        else errors.push(`Không thể lưu bài học: ${l.title}`);
      } catch (err: any) {
        errors.push(`Lỗi bài học ${l.title}: ${err?.message || String(err)}`);
      }
    }
  }

  // 4. Đồng bộ Learning Results
  if (records && records.length > 0) {
    for (const r of records) {
      try {
        const id = await createLearningResultInSupabase(r);
        if (id) syncedResults++;
        else errors.push(`Không thể lưu kết quả: ${r.studentName || 'Học sinh'} - ${r.linkTitle || 'Bài học'}`);
      } catch (err: any) {
        errors.push(`Lỗi kết quả ${r.linkTitle}: ${err?.message || String(err)}`);
      }
    }
  }

  const totalSynced = syncedProfiles + syncedSubjects + syncedLessons + syncedResults;
  const isSuccess = errors.length === 0 && totalSynced > 0;

  return {
    success: isSuccess,
    syncedProfiles,
    syncedSubjects,
    syncedLessons,
    syncedResults,
    message: isSuccess
      ? `Đã lưu thành công ${totalSynced} bản ghi vào Supabase (${syncedLessons} bài học, ${syncedSubjects} môn học, ${syncedProfiles} hồ sơ, ${syncedResults} kết quả học tập)!`
      : totalSynced > 0
      ? `Đồng bộ một phần (${totalSynced} bản ghi thành công, ${errors.length} lỗi): ${errors.slice(0, 3).join('; ')}`
      : 'Không thể đồng bộ vào Supabase. Lỗi: ' + (errors[0] || 'Vui lòng kiểm tra quyền truy cập.'),
    errors,
  };
};
