// /auth/verify — 6-digit code verification screen shown after signup
// (Apple/Slack pattern). Replaces the old "background banner" verification.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AuthPageShell } from "./Auth";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabase";

const CODE_LEN = 6;
const RESEND_COOLDOWN_S = 30;
const PENDING_KEY = "actos.auth.pendingSignup";
const STALE_PENDING_MS = 24 * 60 * 60 * 1000;

interface PendingSignup {
  email: string;
  createdAt: string;
}

function readPendingSignup(): PendingSignup | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PendingSignup>;
    if (!p.email || !p.createdAt) return null;
    if (Date.now() - new Date(p.createdAt).getTime() > STALE_PENDING_MS) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return { email: p.email, createdAt: p.createdAt };
  } catch {
    return null;
  }
}

function clearPendingSignup() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

const AuthVerify: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pending] = useState(() => readPendingSignup());
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LEN).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const errorTimerRef = useRef<number | null>(null);

  // Focus first input on mount.
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Countdown ticker for resend cooldown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  // Auto-clear error after 5s.
  const showError = useCallback((msg: string) => {
    setError(msg);
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    errorTimerRef.current = window.setTimeout(() => setError(null), 5000);
  }, []);

  // Access control: missing pending → /auth#signup; logged in → /today.
  if (user) return <Navigate to="/today" replace />;
  if (!pending) return <Navigate to="/auth#signup" replace />;

  const code = digits.join("");
  const allFilled = code.length === CODE_LEN && digits.every((d) => /\d/.test(d));

  const doVerify = useCallback(
    async (codeStr: string) => {
      if (verifying) return;
      if (!pending) {
        navigate("/auth#signup", { replace: true });
        return;
      }
      setVerifying(true);
      setError(null);
      try {
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          email: pending.email,
          token: codeStr,
          type: "signup",
        });
        if (!verifyErr) {
          // Supabase has established the session; onAuthStateChange will
          // populate useAuth().user. Clear the resume key and route to setup.
          clearPendingSignup();
          navigate("/setup", { replace: true });
          return;
        }
        // Map known Supabase errors to existing i18n keys where they fit.
        // Everything else falls back to the raw English message.
        const msg = verifyErr.message;
        if (msg.toLowerCase().includes("expired")) {
          showError(t("auth.verify.error.expired"));
        } else {
          showError(msg);
        }
        setDigits(Array(CODE_LEN).fill(""));
        inputsRef.current[0]?.focus();
      } finally {
        setVerifying(false);
      }
    },
    [navigate, pending, showError, t, verifying],
  );

  const handleChange = (index: number, value: string) => {
    setError(null);
    // Paste handling: if multiple chars pasted into one slot, distribute.
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 1) {
      const next = Array(CODE_LEN).fill("");
      for (let i = 0; i < CODE_LEN && i < cleaned.length; i++) next[i] = cleaned[i];
      setDigits(next);
      const last = Math.min(cleaned.length, CODE_LEN) - 1;
      inputsRef.current[last]?.focus();
      if (cleaned.length >= CODE_LEN) {
        void doVerify(next.join(""));
      }
      return;
    }
    const ch = cleaned.slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = ch;
      if (ch && index < CODE_LEN - 1) {
        // Defer focus to after state update.
        window.setTimeout(() => inputsRef.current[index + 1]?.focus(), 0);
      }
      if (ch && index === CODE_LEN - 1 && next.every((d) => /\d/.test(d))) {
        void doVerify(next.join(""));
      }
      return next;
    });
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
      } else if (index > 0) {
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < CODE_LEN - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (text.length === 0) return;
    e.preventDefault();
    handleChange(0, text);
  };

  const onResend = async () => {
    if (cooldown > 0) return;
    if (!pending) {
      navigate("/auth#signup", { replace: true });
      return;
    }
    const { error: resendErr } = await supabase.auth.resend({
      email: pending.email,
      type: "signup",
    });
    if (resendErr) {
      showError(resendErr.message);
      return;
    }
    setError(null);
    setDigits(Array(CODE_LEN).fill(""));
    inputsRef.current[0]?.focus();
    setCooldown(RESEND_COOLDOWN_S);
    toast.success(t("auth.verify.resendToast"));
  };

  const onChangeEmail = () => {
    clearPendingSignup();
    navigate("/auth#signup", { replace: true });
  };

  const heading = t("auth.verify.heading");
  const subline = useMemo(
    () => t("auth.verify.subline", { email: pending.email }),
    [pending.email, t],
  );

  return (
    <AuthPageShell>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <h1
          className="auth-heading"
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: "hsl(var(--text-primary))",
            textAlign: "center",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {heading}
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "hsl(var(--text-secondary))",
            textAlign: "center",
            marginTop: 16,
          }}
          // subline contains <strong>{email}</strong>
          dangerouslySetInnerHTML={{ __html: subline }}
        />

        <div
          className="otp-row"
          style={{
            marginTop: 48,
            display: "flex",
            justifyContent: "center",
            gap: 12,
          }}
        >
          {digits.map((d, i) => {
            const filled = d !== "";
            return (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={onPaste}
                disabled={verifying}
                aria-label={`Digit ${i + 1}`}
                className="otp-input"
                style={{
                  width: 56,
                  height: 56,
                  textAlign: "center",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 24,
                  fontWeight: 500,
                  color: "hsl(var(--text-primary))",
                  background: filled ? "hsl(var(--surface-base))" : "hsl(var(--surface-raised))",
                  border: "1px solid hsl(var(--border-subtle))",
                  borderRadius: 8,
                  outline: "none",
                  transition: "border-color 150ms ease, background 150ms ease",
                }}
              />
            );
          })}
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 16,
              fontSize: 13,
              textAlign: "center",
              color: "hsl(var(--text-error, 0 60% 65%))",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => doVerify(code)}
          disabled={!allFilled || verifying}
          style={{
            marginTop: 24,
            width: "100%",
            height: 48,
            borderRadius: 6,
            border: "none",
            background: "hsl(var(--goal-2))",
            color: "hsl(var(--surface-base))",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 16,
            fontWeight: 500,
            cursor: !allFilled || verifying ? "not-allowed" : "pointer",
            opacity: !allFilled || verifying ? 0.5 : 1,
            transition: "opacity 150ms ease",
          }}
        >
          {verifying ? t("auth.verify.verifying") : t("auth.verify.submitButton")}
        </button>

        <div
          style={{
            marginTop: 24,
            textAlign: "center",
            fontSize: 14,
            color: "hsl(var(--text-tertiary))",
          }}
        >
          {t("auth.verify.resendLabel")}{" "}
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0}
            className="auth-verify-link"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 14,
              color:
                cooldown > 0
                  ? "hsl(var(--text-tertiary))"
                  : "hsl(var(--text-secondary))",
              cursor: cooldown > 0 ? "default" : "pointer",
            }}
          >
            {cooldown > 0
              ? t("auth.verify.resendCooldown", { seconds: cooldown })
              : t("auth.verify.resendLink")}
          </button>
        </div>

        <div
          style={{
            marginTop: 12,
            textAlign: "center",
            fontSize: 14,
            color: "hsl(var(--text-tertiary))",
          }}
        >
          {t("auth.verify.changeEmailLabel")}{" "}
          <button
            type="button"
            onClick={onChangeEmail}
            className="auth-verify-link"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 14,
              color: "hsl(var(--text-secondary))",
              cursor: "pointer",
            }}
          >
            {t("auth.verify.changeEmailLink")}
          </button>
        </div>
      </div>

      <style>{`
        .otp-input:focus { border-color: hsl(var(--goal-2)) !important; }
        .auth-verify-link:not(:disabled):hover { color: hsl(var(--text-primary)) !important; }
        @media (max-width: 500px) {
          .otp-row { gap: 8px !important; }
          .otp-input { width: 48px !important; height: 48px !important; font-size: 20px !important; }
        }
      `}</style>
    </AuthPageShell>
  );
};

export default AuthVerify;
