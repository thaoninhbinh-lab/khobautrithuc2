import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, DEFAULT_SCHOOL_NAME } from '../types';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/config';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { registerOrLoginUser } from '../services/storageService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isFirebaseConfigured: boolean;
  loginAsTeacher: (name: string, school: string, pin: string, email?: string, subjects?: string[]) => Promise<UserProfile>;
  loginAsStudent: (name: string, className: string, school: string) => Promise<UserProfile>;
  loginAsAdmin: (name: string, pin: string, email?: string) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<void>;
  updateProfile: (name: string, assignedClass: string, school: string) => void;
  logout: () => Promise<void>;
}

const LOCAL_USER_KEY = 'tinhoc_current_user_v2';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(LOCAL_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Mặc định khởi tạo chưa đăng nhập (hoặc khách)
    return null;
  });

  // Theo dõi trạng thái Firebase Auth nếu có config
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const isAdminUser = fbUser.email === 'thaoninhbinh@gmail.com' || fbUser.email?.includes('admin');
        const role = isAdminUser ? 'admin' : 'teacher';
        const profile = await registerOrLoginUser({
          name: fbUser.displayName || (isAdminUser ? 'Cô Thảo' : 'Thầy/Cô Giáo'),
          school: DEFAULT_SCHOOL_NAME,
          className: isAdminUser ? 'Toàn trường' : 'Khối 3, 4, 5',
          role,
          pin: isAdminUser ? '999999' : '123456',
        });
        profile.email = fbUser.email || undefined;
        profile.photoURL = fbUser.photoURL || undefined;
        setUser(profile);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      }
    });

    return () => unsubscribe();
  }, []);

  // 1. Đăng nhập Giáo viên (Họ tên + Trường + Mã PIN)
  const loginAsTeacher = async (name: string, school: string, pin: string, email?: string, subjects?: string[]) => {
    const profile = await registerOrLoginUser({
      name,
      school,
      email: email || undefined,
      pin,
      className: 'Khối 3, 4, 5',
      role: 'teacher',
      subjects: subjects || ['tinhoc', 'congnghe'],
    });
    setUser(profile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    return profile;
  };

  // 2. Đăng nhập Học sinh (Họ tên + Lớp + Trường) - Hệ thống tự duyệt
  const loginAsStudent = async (name: string, className: string, school: string) => {
    const profile = await registerOrLoginUser({
      name,
      school,
      className,
      role: 'student',
    });
    setUser(profile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    return profile;
  };

  // 3. Đăng nhập Quản trị viên (Admin) - Họ tên + Mã PIN
  const loginAsAdmin = async (name = 'Cô Thảo', pin = '999999', email = 'thaoninhbinh@gmail.com') => {
    const profile = await registerOrLoginUser({
      name: name.trim() || 'Cô Thảo (Quản trị viên)',
      school: DEFAULT_SCHOOL_NAME,
      email: email.trim().toLowerCase() || 'thaoninhbinh@gmail.com',
      pin: pin.trim(),
      className: 'Toàn trường',
      role: 'admin',
      subjects: ['tinhoc', 'congnghe'],
    });
    profile.email = email.trim().toLowerCase() || 'thaoninhbinh@gmail.com';
    setUser(profile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    return profile;
  };

  // Đăng nhập Google (Firebase)
  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      await loginAsAdmin('Cô Thảo', '999999');
      return;
    }

    try {
      const res = await signInWithPopup(auth, googleProvider);
      const u = res.user;
      const isAdminUser = u.email === 'thaoninhbinh@gmail.com' || u.email?.includes('admin');
      const profile = await registerOrLoginUser({
        name: u.displayName || 'Thầy/Cô Giáo',
        school: DEFAULT_SCHOOL_NAME,
        className: isAdminUser ? 'Toàn trường' : 'Khối 3, 4, 5',
        role: isAdminUser ? 'admin' : 'teacher',
      });
      profile.email = u.email || undefined;
      profile.photoURL = u.photoURL || undefined;
      setUser(profile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    } catch (err) {
      console.error('Lỗi đăng nhập Google Firebase:', err);
      throw err;
    }
  };

  const updateProfile = (name: string, assignedClass: string, school: string) => {
    if (!user) return;
    const updated = { ...user, displayName: name, assignedClass, school };
    setUser(updated);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch (e) {
        console.warn('Lỗi khi đăng xuất Firebase:', e);
      }
    }
    setUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const isAdmin = user?.role === 'admin' || user?.email === 'thaoninhbinh@gmail.com';
  const isTeacher = user?.role === 'teacher' || isAdmin;
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isTeacher,
        isStudent,
        isFirebaseConfigured,
        loginAsTeacher,
        loginAsStudent,
        loginAsAdmin,
        loginWithGoogle,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
