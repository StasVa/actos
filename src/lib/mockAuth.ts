// Mock signup/verification backend. Swap these three functions for real
// Supabase calls when the backend is wired up.
//
// TODO: remove dev console.log lines and the `code` field returned to the
// caller when real backend integrates — code generation moves server-side
// and is delivered via email.

const PENDING_SIGNUP_KEY = "actos.auth.pendingSignup";

export const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const STALE_PENDING_MS = 24 * 60 * 60 * 1000; // 24 hours
export const RESEND_COOLDOWN_S = 30;
export const MAX_ATTEMPTS = 5;

export interface PendingSignup {
  name: string;
  email: string;
  password: string; // mock only — never persists in real backend
  code: string;
  codeExpiresAt: string;
  attemptsRemaining: number;
  createdAt: string;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function readPendingSignup(): PendingSignup | null {
  try {
    const raw = localStorage.getItem(PENDING_SIGNUP_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingSignup;
    // Stale cleanup: pendings older than 24h are abandoned.
    if (Date.now() - new Date(p.createdAt).getTime() > STALE_PENDING_MS) {
      clearPendingSignup();
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function clearPendingSignup() {
  localStorage.removeItem(PENDING_SIGNUP_KEY);
}

function writePending(p: PendingSignup) {
  localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(p));
}

export async function startSignup(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ code: string; email: string }> {
  await sleep(400);
  const code = generateCode();
  const now = new Date();
  const pending: PendingSignup = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    code,
    codeExpiresAt: new Date(now.getTime() + CODE_TTL_MS).toISOString(),
    attemptsRemaining: MAX_ATTEMPTS,
    createdAt: now.toISOString(),
  };
  writePending(pending);
  // TODO: remove when real backend integrates
  // eslint-disable-next-line no-console
  console.log("[ActOS mock] Verification code:", code);
  return { code, email: pending.email };
}

export async function resendCode(): Promise<{ code: string } | null> {
  const cur = readPendingSignup();
  if (!cur) return null;
  await sleep(400);
  const code = generateCode();
  const next: PendingSignup = {
    ...cur,
    code,
    codeExpiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    attemptsRemaining: MAX_ATTEMPTS,
  };
  writePending(next);
  // TODO: remove when real backend integrates
  // eslint-disable-next-line no-console
  console.log("[ActOS mock] Verification code:", code);
  return { code };
}

export type VerifyResult =
  | { ok: true; name: string; email: string }
  | { ok: false; reason: "noPending" | "expired" | "incorrect" | "tooMany"; attemptsRemaining: number };

export async function verifyCode(code: string): Promise<VerifyResult> {
  const cur = readPendingSignup();
  if (!cur) return { ok: false, reason: "noPending", attemptsRemaining: 0 };
  await sleep(350);
  if (Date.now() > new Date(cur.codeExpiresAt).getTime()) {
    return { ok: false, reason: "expired", attemptsRemaining: cur.attemptsRemaining };
  }
  if (cur.attemptsRemaining <= 0) {
    return { ok: false, reason: "tooMany", attemptsRemaining: 0 };
  }
  if (code !== cur.code) {
    const next = { ...cur, attemptsRemaining: cur.attemptsRemaining - 1 };
    writePending(next);
    return {
      ok: false,
      reason: next.attemptsRemaining === 0 ? "tooMany" : "incorrect",
      attemptsRemaining: next.attemptsRemaining,
    };
  }
  return { ok: true, name: cur.name, email: cur.email };
}
