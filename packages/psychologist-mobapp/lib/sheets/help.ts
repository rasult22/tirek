import { create } from "zustand";

interface HelpPayload {
  title: string;
  description?: string;
}

interface HelpSheetState {
  payload: HelpPayload | null;
  open: (payload: HelpPayload) => void;
  close: () => void;
}

export const useHelpSheetStore = create<HelpSheetState>((set) => ({
  payload: null,
  open: (payload) => set({ payload }),
  close: () => set({ payload: null }),
}));
