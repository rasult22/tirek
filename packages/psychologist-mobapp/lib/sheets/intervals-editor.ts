import { create } from "zustand";
import type { OfficeHoursInterval } from "@tirek/shared";

interface IntervalsEditorPayload {
  title: string;
  initialIntervals: OfficeHoursInterval[];
  initialNotes: string | null;
  showDayOffToggle?: boolean;
  saving?: boolean;
}

interface IntervalsEditorSheetState {
  payload: IntervalsEditorPayload | null;
  onSave:
    | ((intervals: OfficeHoursInterval[], notes: string | null) => void)
    | null;
  open: (
    payload: IntervalsEditorPayload,
    onSave: (intervals: OfficeHoursInterval[], notes: string | null) => void,
  ) => void;
  setSaving: (saving: boolean) => void;
  close: () => void;
}

export const useIntervalsEditorSheetStore = create<IntervalsEditorSheetState>(
  (set) => ({
    payload: null,
    onSave: null,
    open: (payload, onSave) => set({ payload, onSave }),
    setSaving: (saving) =>
      set((s) =>
        s.payload ? { payload: { ...s.payload, saving } } : { payload: null },
      ),
    close: () => set({ payload: null, onSave: null }),
  }),
);
