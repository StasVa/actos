// Real auth layer backed by Supabase. Single source of truth via useAuth().
// Hook contract is preserved where consumers depend on it. A few intentional changes:
//   - signOut/setAdmin return Promise<void> (Supabase calls are async). Fire-and-forget still works.
//   - pendingVerification / markEmailVerified / resendVerification are gone. Supabase owns
//     verification state and signup does not create a session until OTP succeeds, so there's
//     no logged-in-but-unverified state to track. EmailVerificationBanner is being removed.
//   - On cold load we block render until the first getSession() resolves to avoid a
//     false isAuthenticated=false flash that would trip RequireAuth.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { queryClient, persister } from "@/lib/queryClient";

export type AuthProvider = "email" | "google" | "apple";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  provider: AuthProvider;
  isAdmin: boolean;
  avatarSeed?: string;
  subscriptionTier: "free" | "all-in";
  subscriptionStartedAt?: string;
  billingCycle?: "monthly" | "annual" | "lifetime";
  subscriptionEndsAt?: string;
}

// Resume state for /auth/verify after tab close. Email only — never password.
const PENDING_KEY = "actos.auth.pendingSignup";

// signOut clears all per-user localStorage by default; these survive logout
// because they're device-level preferences (theme/language/timer audio) or
// shared admin content (manifesto CMS, pending Supabase migration).
const SIGNOUT_KEEP_KEYS = new Set([
  "actos.theme",
  "actos.i18n.language",
  "actos-session-sound",
]);
const SIGNOUT_KEEP_PREFIXES = ["actos.cms."];

function clearUserLocalStorage() {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (!key.startsWith("actos")) continue;
      if (SIGNOUT_KEEP_KEYS.has(key)) continue;
      if (SIGNOUT_KEEP_PREFIXES.some((p) => key.startsWith(p))) continue;
      toRemove.push(key);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore quota / unavailable storage
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeProvider(p: string | undefined): AuthProvider {
  if (p === "google" || p === "apple") return p;
  return "email";
}

function normalizeTier(t: string | null | undefined): "free" | "all-in" {
  return t === "all-in" ? "all-in" : "free";
}

function normalizeBillingCycle(c: string | null | undefined): AuthUser["billingCycle"] {
  if (c === "monthly" || c === "annual" || c === "lifetime") return c;
  return undefined;
}

interface ProfileRow {
  display_name: string | null;
  avatar_seed: string | null;
  is_admin: boolean;
  subscription_tier: string;
  subscription_started_at: string | null;
  billing_cycle: string | null;
  subscription_ends_at: string | null;
}

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  let lastError: unknown = null;
  const tryOnce = async (): Promise<ProfileRow | null> => {
    const { data, error } = await supabase
      .from("users")
      .select(
        "display_name, avatar_seed, is_admin, subscription_tier, subscription_started_at, billing_cycle, subscription_ends_at",
      )
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      lastError = error;
      return null;
    }
    if (!data) return null;
    return data as ProfileRow;
  };
  // 3 attempts with exponential backoff (0, 200ms, 500ms, 1000ms total delays
  // before the 1st/2nd/3rd retries). handle_new_user fires AFTER INSERT on
  // auth.users in the same transaction, so a transient null usually clears on
  // retry. The TanStack-backed useCurrentUserQuery hook provides the durable
  // recovery path for failures that survive these retries.
  const backoffs = [0, 200, 500, 1000];
  for (const wait of backoffs) {
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const row = await tryOnce();
    if (row) return row;
  }
  // eslint-disable-next-line no-console
  console.error(
    "[ActOS auth] profile fetch failed after 3 retries for user",
    userId,
    "— falling back to degraded state. Last error:",
    lastError,
  );
  return null;
}

function buildAuthUser(session: Session, profile: ProfileRow | null): AuthUser {
  const u = session.user;
  const metaDisplayName = (u.user_metadata as Record<string, unknown> | undefined)?.display_name;
  const name =
    profile?.display_name ??
    (typeof metaDisplayName === "string" ? metaDisplayName : undefined) ??
    u.email?.split("@")[0] ??
    "";
  // Conservative defaults: if we can't read the user row, assume least-privilege.
  // The next auth event will reconcile.
  return {
    id: u.id,
    name,
    email: u.email ?? "",
    emailVerified: !!u.email_confirmed_at,
    createdAt: u.created_at,
    provider: normalizeProvider(u.app_metadata?.provider as string | undefined),
    isAdmin: profile?.is_admin ?? false,
    avatarSeed: profile?.avatar_seed ?? undefined,
    subscriptionTier: normalizeTier(profile?.subscription_tier),
    subscriptionStartedAt: profile?.subscription_started_at ?? undefined,
    billingCycle: normalizeBillingCycle(profile?.billing_cycle),
    subscriptionEndsAt: profile?.subscription_ends_at ?? undefined,
  };
}

interface AuthCtx {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signUp: (input: { name: string; email: string; password: string }) => Promise<AuthUser>;
  signIn: (input: { email: string; password: string }) => Promise<AuthUser>;
  // Now Promise<void> (was void). Consumers that don't await still work.
  signOut: () => Promise<void>;
  // Now Promise<void> (was void). Writes to public.users.is_admin via Supabase.
  setAdmin: (next: boolean) => Promise<void>;
  // Writes to public.users.subscription_tier via Supabase; optimistically
  // updates local state on success. Mirrors setAdmin's pattern.
  setSubscriptionTier: (tier: "free" | "all-in") => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const syncFromSession = async (session: Session | null) => {
      if (!session) {
        if (!cancelled) setUser(null);
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (!cancelled) setUser(buildAuthUser(session, profile));
    };

    // Initial hydration from persisted Supabase session.
    supabase.auth.getSession().then(({ data }) => {
      void syncFromSession(data.session).finally(() => {
        if (!cancelled) setHydrated(true);
      });
    });

    // Subscribe to auth changes (login, logout, token refresh, multi-tab sync).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncFromSession(session);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback<AuthCtx["signUp"]>(async ({ name, email, password }) => {
    if (!name.trim()) throw new Error("Name required");
    if (!EMAIL_RE.test(email)) throw new Error("Invalid email");
    if (password.length < 8) throw new Error("Password too short");
    const normEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: normEmail,
      password,
      options: { data: { display_name: name.trim() } },
    });
    if (error) throw error;
    // With email-confirmation enabled, Supabase returns user data but no session.
    // DO NOT auto-login — the caller redirects to /auth/verify.
    try {
      localStorage.setItem(
        PENDING_KEY,
        JSON.stringify({ email: normEmail, createdAt: new Date().toISOString() }),
      );
    } catch {
      // ignore quota / unavailable storage
    }
    // Synthesize the returned AuthUser. public.users isn't readable yet (no session → RLS blocks),
    // but the handle_new_user trigger sets subscription_tier='all-in' during beta, so we mirror that.
    return {
      id: data.user?.id ?? "",
      name: name.trim(),
      email: normEmail,
      emailVerified: !!data.user?.email_confirmed_at,
      createdAt: data.user?.created_at ?? new Date().toISOString(),
      provider: "email",
      isAdmin: false,
      subscriptionTier: "all-in",
    };
  }, []);

  const signIn = useCallback<AuthCtx["signIn"]>(async ({ email, password }) => {
    if (!EMAIL_RE.test(email)) throw new Error("Invalid email");
    if (password.length < 1) throw new Error("Password required");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    if (!data.session) throw new Error("Sign in did not establish a session");
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch {
      // ignore
    }
    const profile = await fetchProfile(data.session.user.id);
    const u = buildAuthUser(data.session, profile);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback<AuthCtx["signOut"]>(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    await persister.removeClient();
    clearUserLocalStorage();
    // The persister's persistClient is throttled (default 1000ms in
    // createSyncStoragePersister), so queryClient.clear()'s cache events
    // schedule a trailing write of empty state that lands after the immediate
    // remove above. Re-remove past the throttle window to drop that final write,
    // and re-sweep so anything else written during the window is also gone.
    setTimeout(() => {
      void persister.removeClient();
      clearUserLocalStorage();
    }, 1100);
    setUser(null);
  }, []);

  const setAdmin = useCallback<AuthCtx["setAdmin"]>(
    async (next) => {
      if (!user) return;
      const { error } = await supabase.from("users").update({ is_admin: next }).eq("id", user.id);
      if (error) throw error;
      setUser({ ...user, isAdmin: next });
    },
    [user],
  );

  const setSubscriptionTier = useCallback<AuthCtx["setSubscriptionTier"]>(
    async (tier) => {
      if (!user) return;
      const { error } = await supabase.from("users").update({ subscription_tier: tier }).eq("id", user.id);
      if (error) throw error;
      setUser({ ...user, subscriptionTier: tier });
    },
    [user],
  );

  const resetPassword = useCallback<AuthCtx["resetPassword"]>(async (email) => {
    if (!EMAIL_RE.test(email)) throw new Error("Invalid email");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    if (error) throw error;
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      isAuthenticated: !!user,
      signUp,
      signIn,
      signOut,
      setAdmin,
      setSubscriptionTier,
      resetPassword,
    }),
    [user, signUp, signIn, signOut, setAdmin, setSubscriptionTier, resetPassword],
  );

  // Block render until first getSession() resolves — otherwise RequireAuth would
  // see isAuthenticated=false and redirect to /auth before hydration completes.
  if (!hydrated) return null;

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
