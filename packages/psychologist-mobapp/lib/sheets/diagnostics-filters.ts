import { create } from "zustand";
import type { DiagnosticsFilters } from "../api/diagnostics";

interface DiagnosticsFiltersSheetState {
  initial: DiagnosticsFilters | null;
  onApply: ((filters: DiagnosticsFilters) => void) | null;
  open: (
    initial: DiagnosticsFilters,
    onApply: (filters: DiagnosticsFilters) => void,
  ) => void;
  close: () => void;
}

export const useDiagnosticsFiltersSheetStore =
  create<DiagnosticsFiltersSheetState>((set) => ({
    initial: null,
    onApply: null,
    open: (initial, onApply) => set({ initial, onApply }),
    close: () => set({ initial: null, onApply: null }),
  }));
