// Lightweight global event bus for one-shot UI commands fired from the
// Command Palette (e.g. "open the Plan today modal"). Pages mount listeners
// via subscribeAppEvent. Events that target a page not currently mounted
// are buffered briefly so the listener can pick them up after navigation.

export type AppEventName =
  | "open-plan-today"
  | "open-close-day"
  | "open-settings"
  | "focus-idea-capture"
  | "open-mobile-sidebar";

type Pending = { name: AppEventName; at: number };
const PENDING_TTL_MS = 1500;
let pending: Pending[] = [];
const listeners = new Map<AppEventName, Set<() => void>>();

export function emitAppEvent(name: AppEventName) {
  const set = listeners.get(name);
  if (set && set.size > 0) {
    set.forEach((fn) => fn());
    return;
  }
  // No listener mounted yet → buffer briefly so a navigating page can catch it.
  pending = pending.filter((p) => Date.now() - p.at < PENDING_TTL_MS);
  pending.push({ name, at: Date.now() });
}

export function subscribeAppEvent(name: AppEventName, fn: () => void) {
  let set = listeners.get(name);
  if (!set) {
    set = new Set();
    listeners.set(name, set);
  }
  set.add(fn);
  // Drain any pending events for this name.
  const now = Date.now();
  pending = pending.filter((p) => {
    if (p.name === name && now - p.at < PENDING_TTL_MS) {
      fn();
      return false;
    }
    return now - p.at < PENDING_TTL_MS;
  });
  return () => {
    set!.delete(fn);
  };
}
