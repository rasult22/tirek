import { create } from "zustand";

interface FiltersPayload {
  grade: number | null;
  classLetter: string | null;
}

interface FiltersSheetState {
  payload: FiltersPayload | null;
  onApply: ((next: FiltersPayload) => void) | null;
  open: (
    payload: FiltersPayload,
    onApply: (next: FiltersPayload) => void,
  ) => void;
  close: () => void;
}

export const useFiltersSheetStore = create<FiltersSheetState>((set) => ({
  payload: null,
  onApply: null,
  open: (payload, onApply) => set({ payload, onApply }),
  close: () => set({ payload: null, onApply: null }),
}));
