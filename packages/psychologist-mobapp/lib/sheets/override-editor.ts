import { create } from "zustand";
import type { OfficeHoursInterval } from "@tirek/shared";

interface OverrideEditorPayload {
  fixedDate?: string;
  initialIntervals: OfficeHoursInterval[];
  initialNotes: string | null;
  saving?: boolean;
}

interface OverrideEditorSheetState {
  payload: OverrideEditorPayload | null;
  onSave:
    | ((
        date: string,
        intervals: OfficeHoursInterval[],
        notes: string | null,
      ) => void)
    | null;
  open: (
    payload: OverrideEditorPayload,
    onSave: (
      date: string,
      intervals: OfficeHoursInterval[],
      notes: string | null,
    ) => void,
  ) => void;
  setSaving: (saving: boolean) => void;
  close: () => void;
}

export const useOverrideEditorSheetStore = create<OverrideEditorSheetState>(
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
