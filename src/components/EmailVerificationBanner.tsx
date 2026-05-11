// Sticky banner shown while user has not verified their email.
import React, { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth, BANNER_DISMISS_SS_KEY } from "@/lib/useAuth";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const EmailVerificationBanner: React.FC = () => {
  const { t } = useTranslation();
  const { user, pendingVerification, resendVerification } = useAuth();
  const [dismissed, setDismissed] = useState<boolean>(
    () => sessionStorage.getItem(BANNER_DISMISS_SS_KEY) === "true",
  );
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (pendingVerification && user && !user.emailVerified) {
      // Re-check at mount only.
    }
  }, [pendingVerification, user]);

  if (!user || user.emailVerified || !pendingVerification) return null;

  const ageMs = Date.now() - new Date(user.createdAt).getTime();
  const stale = ageMs >= SEVEN_DAYS_MS;
  const canDismiss = !stale;

  if (dismissed && canDismiss) return null;

  const onResend = async () => {
    await resendVerification();
    toast.success(t("auth.banner.resendToast"));
  };

  const onDismiss = () => {
    sessionStorage.setItem(BANNER_DISMISS_SS_KEY, "true");
    setDismissed(true);
  };

  return (
    <>
      <div
        role="status"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "hsl(var(--surface-raised))",
          borderBottom: "1px solid hsl(var(--border-subtle))",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Mail size={16} color="hsl(var(--goal-2))" />
          <span style={{ fontSize: 14, color: "hsl(var(--text-primary))" }}>
            {t("auth.banner.verify")}
          </span>
          <button
            type="button"
            onClick={onResend}
            style={{
              marginLeft: 8,
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 14,
              color: "hsl(var(--goal-2))",
              cursor: "pointer",
            }}
          >
            {t("auth.banner.resend")}
          </button>
        </div>
        <div>
          {canDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="evb-dismiss"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 14,
                color: "hsl(var(--text-tertiary))",
                cursor: "pointer",
              }}
            >
              {t("auth.banner.dismiss")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                background: "hsl(var(--goal-2))",
                color: "hsl(var(--surface-base))",
                border: "none",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t("auth.banner.verifyNow")}
            </button>
          )}
        </div>
        <style>{`.evb-dismiss:hover { color: hsl(var(--text-secondary)) !important; }`}</style>
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal
          onClick={() => setModalOpen(false)}
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
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>{t("auth.banner.verifyNowModalTitle")}</div>
            <div style={{ fontSize: 14, color: "hsl(var(--text-secondary))", marginBottom: 24 }}>
              {t("auth.banner.verifyNowModalBody")}
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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
              {t("auth.banner.verifyNowModalOk")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EmailVerificationBanner;
