import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

type AuthStore = {
  session: Session | null;
  user: any | null;
  setSession: (session: Session | null) => void;
  setUser: (user: any | null) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  clearAuth: () => set({ session: null, user: null }),
}));