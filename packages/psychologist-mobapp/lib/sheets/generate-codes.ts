import { create } from "zustand";

export interface GenerateCodesPrefill {
  name: string;
  grade: number | null;
  classLetter: string | null;
}

interface GenerateCodesSheetState {
  prefill: GenerateCodesPrefill | null;
  isOpen: boolean;
  onSuccess: (() => void) | null;
  open: (prefill: GenerateCodesPrefill | null, onSuccess: () => void) => void;
  close: () => void;
}

export const useGenerateCodesSheetStore = create<GenerateCodesSheetState>(
  (set) => ({
    prefill: null,
    isOpen: false,
    onSuccess: null,
    open: (prefill, onSuccess) => set({ prefill, isOpen: true, onSuccess }),
    close: () => set({ prefill: null, isOpen: false, onSuccess: null }),
  }),
);
