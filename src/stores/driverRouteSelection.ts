import { create } from "zustand";

interface DriverRouteSelectionState {
  selectedRouteId: number | null;
  setSelectedRouteId: (id: number | null) => void;
}

export const useDriverRouteSelection = create<DriverRouteSelectionState>((set) => ({
  selectedRouteId: null,
  setSelectedRouteId: (id) => set({ selectedRouteId: id }),
}));
