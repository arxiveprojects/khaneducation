import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MeProfile } from "@/types/api";

interface AuthState {
  profile: MeProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (profile: MeProfile, token: string) => void;
  setProfile: (profile: MeProfile) => void;
  updateProfile: (updates: Partial<MeProfile>) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      profile: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (profile, token) => {
        localStorage.setItem("accessToken", token);
        set({ profile, token, isAuthenticated: true, isLoading: false });
      },
      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) => {
        const current = get().profile;
        if (current) {
          set({ profile: { ...current, ...updates } });
        }
      },
      clearAuth: () => {
        localStorage.removeItem("accessToken");
        set({ profile: null, token: null, isAuthenticated: false, isLoading: false });
      },
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        profile: state.profile,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export function isSchoolStaff(profile: MeProfile | null): boolean {
  return Boolean(
    profile?.memberships?.some((item) => ["owner", "admin", "teacher"].includes(item.role))
  );
}
