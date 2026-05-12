import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { UserRole, hasPermission } from './types';
import { mockUsers } from './mock-data';
import { findByCredentials } from './user-store';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
}

const MOCK_SESSION_KEY = 'coupon_mock_user';

const AuthContext = createContext<AuthContextType | null>(null);

async function resolveSupabaseProfile(sbUser: SupabaseUser): Promise<AuthUser> {
  // Try to get role + name from the users table keyed by email
  const { data } = await supabase
    .from('users')
    .select('name, role, enabled')
    .eq('email', sbUser.email)
    .maybeSingle();

  return {
    id: sbUser.id,
    email: sbUser.email!,
    name: data?.name ?? sbUser.user_metadata?.name ?? sbUser.email!.split('@')[0],
    role: (data?.role as UserRole) ?? (sbUser.user_metadata?.role as UserRole) ?? 'viewer',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try to restore a real Supabase session (Supabase persists this in localStorage automatically)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        const profile = await resolveSupabaseProfile(session.user);
        setUser(profile);
        setLoading(false);
        return;
      }

      // 2. Fall back to persisted mock session (dev/demo mode)
      try {
        const stored = localStorage.getItem(MOCK_SESSION_KEY);
        if (stored) setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(MOCK_SESSION_KEY);
      }
      setLoading(false);
    });

    // Listen for Supabase auth state changes (token refresh, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        const profile = await resolveSupabaseProfile(session.user);
        setUser(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem(MOCK_SESSION_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    // Try Supabase Auth first (handles token + session automatically)
    const { error: sbError } = await supabase.auth.signInWithPassword({ email, password });
    if (!sbError) return { error: null };

    // Check users created via User Management (stored in localStorage)
    const storedUser = findByCredentials(email, password);
    if (storedUser) {
      const authUser: AuthUser = { id: storedUser.id, email: storedUser.email, name: storedUser.name, role: storedUser.role };
      setUser(authUser);
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(authUser));
      return { error: null };
    }

    // Fall back to hardcoded mock credentials (demo mode)
    const mockUser = mockUsers.find(u => u.email === email && u.password === password && u.enabled);
    if (mockUser) {
      const authUser: AuthUser = { id: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role };
      setUser(authUser);
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(authUser));
      return { error: null };
    }

    return { error: 'Invalid email or password' };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    localStorage.removeItem(MOCK_SESSION_KEY);
  };

  const can = (permission: string) => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
