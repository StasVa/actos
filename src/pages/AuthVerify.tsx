// /auth/verify — 6-digit code verification screen shown after signup
// (Apple/Slack pattern). Replaces the old "background banner" verification.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AuthPageShell } from "./Auth";
import { useAuth } from "@/lib/useAuth";
import {
  RESEND_COOLDOWN_S,
  clearPendingSignup,
  readPendingSignup,
  resendCode,
  verifyCode,
} from "@/lib/mockAuth";

const CODE_LEN = 6;

const AuthVerify: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, completeSignup } = useAuth();
  const [pending] = useState(() => readPendingSignup());
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LEN).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [locked, setLocked] = useState(false); // too-many-attempts
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
      setVerifying(true);
      setError(null);
      try {
        const result = await verifyCode(codeStr);
        if (result.ok) {
          completeSignup({ name: result.name, email: result.email });
          clearPendingSignup();
          navigate("/setup", { replace: true });
          return;
        }
        if (result.reason === "noPending") {
          navigate("/auth#signup", { replace: true });
          return;
        }
        if (result.reason === "expired") {
          showError(t("auth.verify.error.expired"));
          setDigits(Array(CODE_LEN).fill(""));
          inputsRef.current[0]?.focus();
        } else if (result.reason === "tooMany") {
          showError(t("auth.verify.error.tooManyAttempts"));
          setLocked(true);
        } else {
          showError(t("auth.verify.error.incorrect", { attempts: result.attemptsRemaining, count: result.attemptsRemaining }));
          setDigits(Array(CODE_LEN).fill(""));
          inputsRef.current[0]?.focus();
        }
      } finally {
        setVerifying(false);
      }
    },
    [completeSignup, navigate, showError, t, verifying],
  );

  const handleChange = (index: number, value: string) => {
    if (locked) return;
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
    const result = await resendCode();
    if (!result) {
      navigate("/auth#signup", { replace: true });
      return;
    }
    setLocked(false);
    setError(null);
    setDigits(Array(CODE_LEN).fill(""));
    inputsRef.current[0]?.focus();
    setCooldown(RESEND_COOLDOWN_S);
    toast.success(t("auth.verify.resendToast"));
    toast(t("auth.verify.devCodeToast", { code: result.code }), { duration: 8000 });
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
                disabled={locked || verifying}
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
          disabled={!allFilled || verifying || locked}
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
            cursor: !allFilled || verifying || locked ? "not-allowed" : "pointer",
            opacity: !allFilled || verifying || locked ? 0.5 : 1,
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
