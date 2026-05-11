// /auth — combined sign in / sign up page. Mock auth for now.
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { EMAIL_RE, useAuth } from "@/lib/useAuth";

type Mode = "signin" | "signup";

const Logo: React.FC = () => (
  <Link to="/" aria-label="ActOS home" style={{ textDecoration: "none" }}>
    <span
      className="auth-logo"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 500,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        fontSize: 32,
      }}
    >
      <span style={{ color: "hsl(var(--text-primary))" }}>Act</span>
      <span style={{ color: "hsl(var(--goal-2))" }}>OS</span>
    </span>
  </Link>
);

export const AuthPageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    data-theme="dark"
    style={{
      minHeight: "100vh",
      background: "hsl(var(--surface-base))",
      fontFamily: "Inter, system-ui, sans-serif",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 48 }}>
      <Logo />
    </div>
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px 96px",
      }}
    >
      {children}
    </div>
    <Link
      to="/"
      className="auth-back-link"
      style={{
        position: "absolute",
        bottom: 32,
        left: 32,
        fontSize: 14,
        color: "hsl(var(--text-tertiary))",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <ArrowLeft size={14} className="auth-back-arrow" />
      Back to homepage
    </Link>
    <style>{`
      .auth-back-link:hover { color: hsl(var(--text-secondary)) !important; }
      .auth-back-link:hover .auth-back-arrow { transform: translateX(-2px); }
      .auth-back-arrow { transition: transform 150ms ease; }
      @media (max-width: 640px) {
        .auth-logo { font-size: 24px !important; }
        .auth-back-link-pos { bottom: 16px !important; left: 16px !important; }
      }
    `}</style>
  </div>
);

const inputStyle: React.CSSProperties = {
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
};

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  error?: string;
  helper?: string;
}> = ({ label, children, error, helper }) => (
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
      {label}
    </label>
    {children}
    {(error || helper) && (
      <div
        style={{
          fontSize: 13,
          color: error ? "hsl(var(--text-warning, 0 70% 60%))" : "hsl(var(--text-tertiary))",
          marginTop: 6,
        }}
      >
        {error || helper}
      </div>
    )}
  </div>
);

const SocialButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ label, icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="auth-social-btn"
    style={{
      width: "100%",
      height: 44,
      borderRadius: 6,
      background: "hsl(var(--surface-raised))",
      border: "1px solid hsl(var(--border-subtle))",
      color: "hsl(var(--text-primary))",
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: 15,
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      cursor: "pointer",
    }}
  >
    {icon}
    {label}
  </button>
);

const GoogleG: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
    <path
      fill="#4285F4"
      d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.614z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
    />
  </svg>
);

const AppleLogo: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M16.365 1.43c0 1.14-.43 2.21-1.2 3.04-.83.92-2.18 1.62-3.32 1.5-.13-1.12.44-2.27 1.2-3.04.83-.92 2.27-1.6 3.32-1.5zM20.5 17.06c-.6 1.4-.9 2.02-1.7 3.25-1.13 1.74-2.73 3.92-4.71 3.93-1.76.02-2.21-1.15-4.6-1.13-2.39.01-2.89 1.15-4.65 1.13-1.99-.01-3.5-1.97-4.63-3.71-3.16-4.85-3.49-10.55-1.54-13.58 1.39-2.16 3.58-3.42 5.64-3.42 2.1 0 3.42 1.15 5.16 1.15 1.69 0 2.72-1.16 5.15-1.16 1.84 0 3.79 1 5.18 2.74-4.55 2.49-3.81 8.99 1.7 10.8z" />
  </svg>
);

const Modal: React.FC<{ open: boolean; onClose: () => void; children: React.ReactNode }> = ({
  open,
  onClose,
  children,
}) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "hsl(var(--surface-raised))",
          border: "1px solid hsl(var(--border-subtle))",
          borderRadius: 8,
          padding: 24,
          maxWidth: 360,
          width: "100%",
          color: "hsl(var(--text-primary))",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Auth: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [oauthOpen, setOauthOpen] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const next = params.get("next") || "/today";

  // Sync mode with URL hash (#signup) — optional deep link support.
  useEffect(() => {
    const applyHash = () => {
      if (window.location.hash === "#signup") setMode("signup");
      else if (window.location.hash === "#signin") setMode("signin");
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const switchMode = (target: Mode) => {
    setMode(target);
    setErrors({});
    setSubmitErr(null);
    setPassword(""); // security hygiene — clear password between modes
  };

  const valid = useMemo(() => {
    if (!EMAIL_RE.test(email)) return false;
    if (mode === "signup") {
      if (!name.trim()) return false;
      if (password.length < 8) return false;
    } else {
      if (password.length < 1) return false;
    }
    return true;
  }, [email, password, name, mode]);

  const validateField = (f: "name" | "email" | "password") => {
    setErrors((prev) => {
      const next = { ...prev };
      if (f === "name" && mode === "signup") {
        next.name = name.trim() ? undefined : "Name is required.";
      }
      if (f === "email") {
        next.email = EMAIL_RE.test(email) ? undefined : "Enter a valid email.";
      }
      if (f === "password") {
        if (mode === "signup") {
          next.password = password.length >= 8 ? undefined : "At least 8 characters.";
        } else {
          next.password = password.length >= 1 ? undefined : "Password is required.";
        }
      }
      return next;
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    if (!valid) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp({ name, email, password });
        navigate("/setup", { replace: true });
      } else {
        await signIn({ email, password });
        navigate(next, { replace: true });
      }
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const heading = mode === "signin" ? "Welcome back." : "Let’s get you set up.";
  const subline = mode === "signin" ? "Open ActOS in a few seconds." : "Set up your account in 30 seconds.";
  const submitLabel = mode === "signin" ? "Sign in" : "Create account";

  return (
    <AuthPageShell>
      <div style={{ width: "100%", maxWidth: 400 }}>
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
        >
          {subline}
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "signup" && (
            <Field label="Name" error={errors.name}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => validateField("name")}
                onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--goal-2))")}
                placeholder="Your first name"
                style={inputStyle}
                required
              />
            </Field>
          )}

          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => validateField("email")}
              onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--goal-2))")}
              placeholder="you@example.com"
              style={inputStyle}
              required
            />
          </Field>

          <Field
            label="Password"
            error={errors.password}
            helper={mode === "signup" ? "At least 8 characters." : undefined}
          >
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => validateField("password")}
                onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--goal-2))")}
                style={{ ...inputStyle, paddingRight: 40 }}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  background: "transparent",
                  border: "none",
                  color: "hsl(var(--text-tertiary))",
                  cursor: "pointer",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          {mode === "signin" && (
            <div style={{ textAlign: "right", marginTop: -8 }}>
              <Link
                to="/auth/reset"
                style={{ fontSize: 13, color: "hsl(var(--text-secondary))", textDecoration: "none" }}
              >
                Forgot password?
              </Link>
            </div>
          )}

          {submitErr && (
            <div style={{ fontSize: 13, color: "hsl(var(--text-warning, 0 70% 60%))" }}>{submitErr}</div>
          )}

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
              transition: "opacity 150ms ease",
            }}
          >
            {loading ? "..." : submitLabel}
          </button>
        </form>

        {/* Social */}
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1, height: 1, background: "hsl(var(--border-subtle))" }} />
            <span style={{ fontSize: 13, color: "hsl(var(--text-tertiary))" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "hsl(var(--border-subtle))" }} />
          </div>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <SocialButton label="Continue with Google" icon={<GoogleG />} onClick={() => setOauthOpen(true)} />
            <SocialButton label="Continue with Apple" icon={<AppleLogo />} onClick={() => setOauthOpen(true)} />
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ marginTop: 32, textAlign: "center", fontSize: 14, color: "hsl(var(--text-secondary))" }}>
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                style={{ background: "none", border: "none", padding: 0, color: "hsl(var(--goal-2))", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                style={{ background: "none", border: "none", padding: 0, color: "hsl(var(--goal-2))", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
              >
                Sign in
              </button>
            </>
          )}
        </div>

        {mode === "signup" && (
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "hsl(var(--text-tertiary))",
              textAlign: "center",
              maxWidth: 320,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.5,
            }}
          >
            By creating an account, you agree to our{" "}
            <Link to="/legal/terms" style={{ color: "hsl(var(--text-secondary))" }}>
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/legal/privacy" style={{ color: "hsl(var(--text-secondary))" }}>
              Privacy Policy
            </Link>
            .
          </div>
        )}
      </div>

      <Modal open={oauthOpen} onClose={() => setOauthOpen(false)}>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Coming soon</div>
        <div style={{ fontSize: 14, color: "hsl(var(--text-secondary))", marginBottom: 24 }}>
          Real OAuth integration in progress.
        </div>
        <button
          type="button"
          onClick={() => setOauthOpen(false)}
          style={{
            width: "100%",
            height: 40,
            borderRadius: 6,
            border: "none",
            background: "hsl(var(--goal-2))",
            color: "hsl(var(--surface-base))",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          OK
        </button>
      </Modal>

      <style>{`
        @media (max-width: 640px) {
          .auth-heading { font-size: 24px !important; }
        }
      `}</style>
    </AuthPageShell>
  );
};

export default Auth;
