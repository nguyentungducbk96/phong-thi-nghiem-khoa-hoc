// Ngữ cảnh đăng nhập: phiên Supabase + hồ sơ (vai trò, trạng thái).
// Không có cấu hình máy chủ → luôn là khách, mọi hàm đăng nhập báo lỗi thân thiện.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, usernameToEmail, friendlyError } from '../lib/supabase';
import type { AuthProfile, UserRole } from '../types';

interface AuthState {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  profile: AuthProfile | null;
  // Vai trò có hiệu lực: chỉ khi tài khoản đang hoạt động
  role: UserRole | 'guest';
  isActive: boolean;
  profileError: string | null;
  signInTeacher(email: string, password: string): Promise<void>;
  signUpTeacher(email: string, password: string, displayName: string): Promise<void>;
  signInStudent(username: string, pin: string): Promise<void>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const notConfigured = () => {
  throw new Error('Ứng dụng chưa kết nối máy chủ nên chưa đăng nhập được.');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!supabase || !s) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase.rpc('my_profile');
    if (error) {
      setProfileError(friendlyError(error));
      setProfile(null);
      return;
    }
    setProfileError(null);
    const row = (data as AuthProfile[] | null)?.[0] ?? null;
    setProfile(row);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await loadProfile(data.session);
      if (alive) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // Gọi lại hồ sơ ngoài callback để tránh khóa phiên của supabase-js
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setTimeout(() => {
          loadProfile(s);
        }, 0);
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signInTeacher = useCallback(async (email: string, password: string) => {
    if (!supabase) return notConfigured();
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(friendlyError(error));
    setSession(data.session);
    await loadProfile(data.session);
  }, [loadProfile]);

  const signUpTeacher = useCallback(async (email: string, password: string, displayName: string) => {
    if (!supabase) return notConfigured();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: displayName.trim().slice(0, 80) } }
    });
    if (error) throw new Error(friendlyError(error));
    if (data.session) {
      setSession(data.session);
      await loadProfile(data.session);
    }
  }, [loadProfile]);

  const signInStudent = useCallback(async (username: string, pin: string) => {
    if (!supabase) return notConfigured();
    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9]{3,32}$/.test(u)) throw new Error('Tên đăng nhập chỉ gồm chữ thường và số, ví dụ hsabc1201.');
    if (!/^\d{6}$/.test(pin.trim())) throw new Error('Mã PIN gồm đúng 6 chữ số.');
    const { data, error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(u), password: pin.trim() });
    if (error) throw new Error(friendlyError(error));
    setSession(data.session);
    await loadProfile(data.session);
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(() => loadProfile(session), [loadProfile, session]);

  const value = useMemo<AuthState>(() => {
    const isActive = !!profile && profile.status === 'active';
    return {
      configured: isSupabaseConfigured,
      loading,
      session,
      profile,
      role: session && profile && isActive ? profile.role : 'guest',
      isActive,
      profileError,
      signInTeacher,
      signUpTeacher,
      signInStudent,
      signOut,
      refreshProfile
    };
  }, [loading, session, profile, profileError, signInTeacher, signUpTeacher, signInStudent, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải nằm trong AuthProvider');
  return ctx;
};

export const roleLabel = (r: UserRole | 'guest'): string =>
  r === 'student' ? 'Học sinh' : r === 'teacher' ? 'Giáo viên' : r === 'admin' ? 'Quản trị viên' : 'Khách';
