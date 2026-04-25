import { useSyncExternalStore } from "react";

const STORAGE_KEY = "tirek-display-name";
const EVENT = "tirek-display-name-change";

export function getDisplayName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

export function setDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  if (trimmed) {
    window.localStorage.setItem(STORAGE_KEY, trimmed);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useDisplayName(fallback: string | null | undefined): string {
  const value = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(STORAGE_KEY) ?? "",
    () => "",
  );
  return value || fallback || "";
}
