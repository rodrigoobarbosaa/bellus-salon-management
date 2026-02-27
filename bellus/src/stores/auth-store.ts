import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

export type RoleProfissional = "proprietario" | "profissional";

export interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  role: RoleProfissional;
  cor_agenda: string;
  ativo: boolean;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: RoleProfissional | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  role: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),

  setProfile: (profile) =>
    set({ profile, role: profile?.role ?? null }),

  clearUser: () =>
    set({ user: null, profile: null, role: null, isLoading: false }),
}));
