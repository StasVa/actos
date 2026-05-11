// /auth/reset — mock password reset request page.
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check } from "lucide-react";
import { AuthPageShell } from "./Auth";
import { EMAIL_RE, useAuth } from "@/lib/useAuth";

const AuthReset: React.FC = () => {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const valid = EMAIL_RE.test(email);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    try {
      await resetPassword(email);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: "hsl(var(--text-primary))",
            textAlign: "center",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Reset your password.
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "hsl(var(--text-secondary))",
            textAlign: "center",
            marginTop: 16,
          }}
        >
          Enter your email and we&apos;ll send a reset link.
        </p>

        {done ? (
          <div
            style={{
              marginTop: 48,
              padding: 24,
              background: "hsl(var(--surface-raised))",
              border: "1px solid hsl(var(--border-subtle))",
              borderRadius: 8,
              textAlign: "center",
              color: "hsl(var(--text-primary))",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "hsl(var(--goal-2))",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Check size={20} color="hsl(var(--surface-base))" />
            </div>
            <div style={{ fontSize: 14, color: "hsl(var(--text-secondary))" }}>
              If that email is registered, we&apos;ve sent a reset link.
            </div>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "hsl(var(--text-primary))",
                  marginBottom: 8,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 12px",
                  borderRadius: 6,
                  border: "1px solid hsl(var(--border-subtle))",
                  background: "hsl(var(--surface-raised))",
                  color: "hsl(var(--text-primary))",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 16,
                  outline: "none",
                }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={!valid || loading}
              style={{
                marginTop: 8,
                width: "100%",
                height: 48,
                borderRadius: 6,
                border: "none",
                background: "hsl(var(--goal-2))",
                color: "hsl(var(--surface-base))",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 16,
                fontWeight: 500,
                cursor: !valid || loading ? "not-allowed" : "pointer",
                opacity: !valid || loading ? 0.5 : 1,
              }}
            >
              {loading ? "..." : "Send reset link"}
            </button>
          </form>
        )}

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <Link
            to="/auth"
            style={{
              fontSize: 14,
              color: "hsl(var(--text-tertiary))",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
};

export default AuthReset;
