// Mock auth layer backed by LocalStorage. Single source of truth via useAuth().
// Real Supabase integration lands in a later batch.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AuthProvider = "email" | "google" | "apple";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  provider: AuthProvider;
  isAdmin?: boolean;
}

const USER_KEY = "actos.auth.user";
const PENDING_KEY = "actos.auth.pendingVerification";
const BANNER_DISMISS_KEY = "actos.auth.bannerDismissed";

function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function writeUser(u: AuthUser | null) {
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(USER_KEY);
  // Notify other tabs/listeners.
  window.dispatchEvent(new Event("actos-auth-change"));
}

function genId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "user_";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AuthCtx {
  user: AuthUser | null;
  isAuthenticated: boolean;
  pendingVerification: boolean;
  signUp: (input: { name: string; email: string; password: string }) => Promise<AuthUser>;
  completeSignup: (input: { name: string; email: string }) => AuthUser;
  signIn: (input: { email: string; password: string }) => Promise<AuthUser>;
  signOut: () => void;
  markEmailVerified: () => void;
  setAdmin: (next: boolean) => void;
  resendVerification: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => readUser());
  const [pendingVerification, setPending] = useState<boolean>(
    () => localStorage.getItem(PENDING_KEY) === "true",
  );

  useEffect(() => {
    const sync = () => {
      setUser(readUser());
      setPending(localStorage.getItem(PENDING_KEY) === "true");
    };
    window.addEventListener("storage", sync);
    window.addEventListener("actos-auth-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("actos-auth-change", sync);
    };
  }, []);

  const signUp = useCallback<AuthCtx["signUp"]>(async ({ name, email, password }) => {
    if (!name.trim()) throw new Error("Name required");
    if (!EMAIL_RE.test(email)) throw new Error("Invalid email");
    if (password.length < 8) throw new Error("Password too short");
    await sleep(400);
    const u: AuthUser = {
      id: genId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      emailVerified: false,
      createdAt: new Date().toISOString(),
      provider: "email",
    };
    writeUser(u);
    localStorage.setItem(PENDING_KEY, "true");
    sessionStorage.removeItem(BANNER_DISMISS_KEY);
    setUser(u);
    setPending(true);
    return u;
  }, []);

  // Used by /auth/verify after the user enters the correct 6-digit code.
  // Creates a verified user immediately — no pendingVerification flag.
  const completeSignup = useCallback<AuthCtx["completeSignup"]>(({ name, email }) => {
    const u: AuthUser = {
      id: genId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      emailVerified: true,
      createdAt: new Date().toISOString(),
      provider: "email",
    };
    writeUser(u);
    localStorage.removeItem(PENDING_KEY);
    setUser(u);
    setPending(false);
    return u;
  }, []);
    if (!EMAIL_RE.test(email)) throw new Error("Invalid email");
    if (password.length < 1) throw new Error("Password required");
    await sleep(400);
    const existing = readUser();
    let u: AuthUser;
    if (existing && existing.email === email.trim().toLowerCase()) {
      u = existing;
    } else {
      u = {
        id: genId(),
        name: email.split("@")[0],
        email: email.trim().toLowerCase(),
        emailVerified: true,
        createdAt: new Date().toISOString(),
        provider: "email",
      };
    }
    writeUser(u);
    if (u.emailVerified) {
      localStorage.removeItem(PENDING_KEY);
      setPending(false);
    }
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(() => {
    writeUser(null);
    localStorage.removeItem(PENDING_KEY);
    sessionStorage.removeItem(BANNER_DISMISS_KEY);
    setUser(null);
    setPending(false);
  }, []);

  const markEmailVerified = useCallback(() => {
    const cur = readUser();
    if (!cur) return;
    const next = { ...cur, emailVerified: true };
    writeUser(next);
    localStorage.removeItem(PENDING_KEY);
    setUser(next);
    setPending(false);
  }, []);

  const setAdmin = useCallback((next: boolean) => {
    const cur = readUser();
    if (!cur) return;
    const updated = { ...cur, isAdmin: next };
    writeUser(updated);
    setUser(updated);
  }, []);

  const resendVerification = useCallback(async () => {
    await sleep(400);
  }, []);

  const resetPassword = useCallback(async (_email: string) => {
    await sleep(400);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      isAuthenticated: !!user,
      pendingVerification,
      signUp,
      signIn,
      signOut,
      markEmailVerified,
      setAdmin,
      resendVerification,
      resetPassword,
    }),
    [user, pendingVerification, signUp, signIn, signOut, markEmailVerified, setAdmin, resendVerification, resetPassword],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

export const BANNER_DISMISS_SS_KEY = BANNER_DISMISS_KEY;
