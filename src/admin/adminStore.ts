// Tiny admin runtime store: impersonation state + audit log (in-memory).
// Persists to localStorage so the impersonation banner survives reloads.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ADMIN_EMAILS,
  AUDIT_LOG,
  CURRENT_USER_EMAIL,
  type AuditEntry,
} from "./adminMock";

export type ImpersonationMode = "read" | "write";
export interface ImpersonationState {
  userId: string;
  email: string;
  mode: ImpersonationMode;
  startedIso: string;
  reason: string;
}

interface AdminState {
  audit: AuditEntry[];
  impersonation: ImpersonationState | null;
  log: (entry: Omit<AuditEntry, "id" | "iso" | "admin"> & { admin?: string }) => void;
  startImpersonation: (args: { userId: string; email: string; reason: string }) => void;
  setImpersonationMode: (mode: ImpersonationMode) => void;
  exitImpersonation: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      audit: AUDIT_LOG,
      impersonation: null,
      log: (entry) => {
        const newEntry: AuditEntry = {
          id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          iso: new Date().toISOString(),
          admin: entry.admin ?? CURRENT_USER_EMAIL,
          type: entry.type,
          action: entry.action,
          targetUserEmail: entry.targetUserEmail,
          targetUserId: entry.targetUserId,
          reason: entry.reason,
        };
        set({ audit: [newEntry, ...get().audit] });
      },
      startImpersonation: ({ userId, email, reason }) => {
        set({
          impersonation: {
            userId, email, mode: "read", reason,
            startedIso: new Date().toISOString(),
          },
        });
        get().log({
          type: "Impersonation",
          action: `Viewed account of ${email}`,
          targetUserEmail: email,
          targetUserId: userId,
          reason,
        });
      },
      setImpersonationMode: (mode) => {
        const cur = get().impersonation;
        if (!cur) return;
        set({ impersonation: { ...cur, mode } });
        if (mode === "write") {
          get().log({
            type: "Impersonation",
            action: `Enabled WRITE mode while impersonating ${cur.email}`,
            targetUserEmail: cur.email,
            targetUserId: cur.userId,
            reason: cur.reason,
          });
        }
      },
      exitImpersonation: () => {
        const cur = get().impersonation;
        if (cur) {
          get().log({
            type: "Impersonation",
            action: `Exited impersonation of ${cur.email}`,
            targetUserEmail: cur.email,
            targetUserId: cur.userId,
          });
        }
        set({ impersonation: null });
      },
    }),
    { name: "actos-admin-v1" },
  ),
);

export function isAdmin(email: string = CURRENT_USER_EMAIL): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
