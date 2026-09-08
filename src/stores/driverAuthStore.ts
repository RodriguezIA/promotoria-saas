import { persist } from "zustand/middleware";
import { create } from "zustand";

export interface DriverProfile {
  id_driver: number;
  name: string;
  phone: string;
  email: string | null;
  vc_photo: string | null;
}

interface DriverAuthState {
  driver: DriverProfile | null;
  token: string | null;

  login: (token: string, driver: DriverProfile) => void;
  logout: () => void;
  updateProfile: (driver: Partial<DriverProfile>) => void;
  isAuthenticated: () => boolean;
}

export const useDriverAuthStore = create<DriverAuthState>()(
  persist(
    (set, get) => ({
      driver: null,
      token: null,

      login: (token, driver) => set({ token, driver }),
      logout: () => set({ token: null, driver: null }),
      updateProfile: (partial) =>
        set((state) => ({ driver: state.driver ? { ...state.driver, ...partial } : state.driver })),

      isAuthenticated: () => !!get().token,
    }),
    {
      name: "driver-auth-storage",
    }
  )
);
