import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "tirek-display-name";
type Listener = () => void;
const listeners = new Set<Listener>();

let cached: string = "";
let loaded = false;

void AsyncStorage.getItem(STORAGE_KEY).then((v) => {
  cached = v ?? "";
  loaded = true;
  listeners.forEach((l) => l());
});

export function getDisplayName(): string {
  return cached;
}

export async function setDisplayName(name: string): Promise<void> {
  const trimmed = name.trim();
  cached = trimmed;
  if (trimmed) {
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
  } else {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((l) => l());
}

export function useDisplayName(fallback: string | null | undefined): string {
  const [, force] = useState(0);
  useEffect(() => {
    const l: Listener = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  if (!loaded) return fallback ?? "";
  return cached || fallback || "";
}
