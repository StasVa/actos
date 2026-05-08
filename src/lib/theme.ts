// Lightweight theme controller — light | dark | system.
// Persists to localStorage under "actos.theme". Sets `data-theme` on <html>.

import * as React from "react";

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "actos.theme";

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  return "system";
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  if (choice === "system") return systemPrefersDark() ? "dark" : "light";
  return choice;
}

function apply(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
}

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

export const themeStore = {
  get choice(): ThemeChoice { return readChoice(); },
  get resolved(): ResolvedTheme { return resolveTheme(this.choice); },
  set(choice: ThemeChoice) {
    try { localStorage.setItem(STORAGE_KEY, choice); } catch {}
    apply(resolveTheme(choice));
    emit();
  },
  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  },
};

let mql: MediaQueryList | null = null;
let mqlHandler: (() => void) | null = null;

export function initTheme() {
  const choice = readChoice();
  apply(resolveTheme(choice));

  if (typeof window === "undefined" || !window.matchMedia) return;
  mql = window.matchMedia("(prefers-color-scheme: dark)");
  mqlHandler = () => {
    if (themeStore.choice === "system") {
      apply(resolveTheme("system"));
      emit();
    }
  };
  mql.addEventListener?.("change", mqlHandler);
}

export function useThemeChoice(): [ThemeChoice, ResolvedTheme, (c: ThemeChoice) => void] {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    const unsub = themeStore.subscribe(() => force());
    return () => { unsub; };
  }, []);
  return [themeStore.choice, themeStore.resolved, (c) => themeStore.set(c)];
}
