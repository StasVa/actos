// Impersonation banner shown on every main-app page when an admin is impersonating.
// Mock: the underlying user data is not actually swapped — banner reflects state.

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAdminStore } from "@/admin/adminStore";
import { ConfirmModal } from "@/components/ConfirmModal";

export const ImpersonationBanner: React.FC = () => {
  const imp = useAdminStore((s) => s.impersonation);
  const setMode = useAdminStore((s) => s.setImpersonationMode);
  const exit = useAdminStore((s) => s.exitImpersonation);
  const navigate = useNavigate();
  const [confirmWrite, setConfirmWrite] = React.useState(false);

  if (!imp) return null;

  const writeMode = imp.mode === "write";
  const bg = writeMode ? "hsl(0 70% 35%)" : "hsl(0 60% 28%)";

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-[120] flex items-center justify-between px-4 py-1.5 text-[12px] text-white font-mono"
        style={{ background: bg }}
      >
        <span>
          ● VIEWING AS <strong>{imp.email}</strong> · {writeMode ? "WRITE MODE" : "READ-ONLY"}
        </span>
        <div className="flex items-center gap-3">
          {!writeMode ? (
            <button onClick={() => setConfirmWrite(true)} className="underline hover:opacity-90">Enable write mode</button>
          ) : (
            <button onClick={() => setMode("read")} className="underline hover:opacity-90">Switch to read-only</button>
          )}
          <button
            onClick={() => {
              const id = imp.userId;
              exit();
              navigate(`/admin/users/${id}`);
            }}
            className="underline hover:opacity-90"
          >
            Exit impersonation →
          </button>
        </div>
      </div>
      {/* Spacer so app content is not occluded */}
      <div style={{ height: 30 }} />

      <ConfirmModal
        open={confirmWrite}
        title="Make changes as this user?"
        body={<>Write mode lets you modify <strong>{imp.email}</strong>'s data. Every change is audit-logged. Continue?</>}
        destructive
        confirmLabel="Enable write mode"
        onCancel={() => setConfirmWrite(false)}
        onConfirm={() => { setMode("write"); setConfirmWrite(false); }}
      />
    </>
  );
};
