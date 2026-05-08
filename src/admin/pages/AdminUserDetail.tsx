import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AdminPageHeader, Card, PlanPill, StatusPill, StatTile, SectionLabel,
  PrimaryButton, SecondaryButton, LinkExt, Mono,
} from "../AdminUI";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ADMIN_USERS, daysFromNow, fmtAgo, fmtDate, fmtDateTime } from "../adminMock";
import { useAdminStore } from "../adminStore";
import { Copy, MoreHorizontal } from "lucide-react";

const stripeUrl = (cus?: string) => `https://dashboard.stripe.com/customers/${cus ?? "cus_xxx"}`;

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const user = ADMIN_USERS.find((u) => u.id === userId);
  const navigate = useNavigate();
  const log = useAdminStore((s) => s.log);
  const startImpersonation = useAdminStore((s) => s.startImpersonation);

  const [confirmComp, setConfirmComp] = React.useState(false);
  const [confirmExtend, setConfirmExtend] = React.useState(false);
  const [confirmSuspend, setConfirmSuspend] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [imperOpen, setImperOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  if (!user) {
    return (
      <>
        <AdminPageHeader title="User not found" />
        <Link to="/admin/users" className="text-accent hover:underline text-[13px]">← Back to Users</Link>
      </>
    );
  }

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied"); };

  const startImper = () => {
    if (reason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters");
      return;
    }
    startImpersonation({ userId: user.id, email: user.email, reason: reason.trim() });
    setImperOpen(false);
    navigate("/today");
  };

  const planTone = (): "muted" | "warn" | "ok" | "info" =>
    user.plan === "Past Due" ? "warn" : user.status === "Suspended" ? "muted" : "ok";

  return (
    <>
      <Link to="/admin/users" className="text-[12px] text-text-tertiary hover:text-text-primary inline-flex items-center gap-1 mb-3">← Users</Link>

      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="font-mono uppercase mb-1" style={{ fontSize: 11, letterSpacing: "0.08em", color: "hsl(var(--text-warning))" }}>● Admin Panel</div>
          <h1 className="text-[24px] font-medium text-text-primary leading-none">{user.email}</h1>
          <div className="mt-2 flex items-center gap-3 text-[12px] text-text-secondary">
            <Mono>{user.id}</Mono>
            <span>·</span>
            <span>Signed up {fmtDate(user.signupIso)}</span>
            <span>·</span>
            <span>Last active {fmtAgo(user.lastActiveIso)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
          <StatusPill tone={planTone()}>{user.status.toUpperCase()}</StatusPill>
          <PrimaryButton onClick={() => { setReason(""); setImperOpen(true); }}>View as user</PrimaryButton>
          <button type="button" onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 rounded-[4px] text-text-tertiary hover:text-text-primary hover:bg-surface-hover">
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-[220px] bg-surface-elevated border border-border-subtle rounded-[6px] shadow-lg z-10 py-1">
              {[
                { label: "Send password reset", run: () => { log({ type: "Account", action: `Sent password reset to ${user.email}`, targetUserEmail: user.email, targetUserId: user.id }); toast.success("Password reset email sent"); } },
                { label: user.status === "Suspended" ? "Restore account" : "Suspend account", run: () => setConfirmSuspend(true) },
                { label: "Delete account", run: () => setConfirmDelete(true), destructive: true },
                { label: "Export data as JSON", run: () => { log({ type: "Other", action: `Exported account data for ${user.email}`, targetUserEmail: user.email, targetUserId: user.id }); toast.success("Export started"); } },
              ].map((it) => (
                <button key={it.label} type="button"
                  onClick={() => { setMenuOpen(false); it.run(); }}
                  className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-surface-hover"
                  style={it.destructive ? { color: "hsl(var(--text-warning))" } : undefined}
                >{it.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* LEFT 60% */}
        <div className="col-span-3">
          <SectionLabel>Activity</SectionLabel>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatTile label="Goals" value={user.goals} />
            <StatTile label="Projects" value={user.projects} />
            <StatTile label="Actions done" value={user.actionsDone} />
            <StatTile label="Sessions" value={user.sessions} />
            <StatTile label="Days active" value={user.daysActive} />
            <StatTile label="Rituals" value={user.rituals} />
          </div>

          <SectionLabel>Active goals</SectionLabel>
          <Card className="p-3 mb-6">
            {(user.activeGoals ?? []).length === 0 && <div className="text-text-tertiary text-[13px]">None.</div>}
            {(user.activeGoals ?? []).map((g, i) => (
              <div key={i} className="flex items-center gap-2 py-1 text-[13px]">
                <span className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                <span>{g.name}</span>
              </div>
            ))}
          </Card>

          <SectionLabel>Engagement</SectionLabel>
          <Card className="p-4 mb-6 text-[13px] text-text-secondary leading-[1.8]">
            <div>Days planned vs unplanned: <span className="text-text-primary">{user.daysPlanned}/{user.daysTotal}</span> {user.daysTotal ? `(${Math.round((user.daysPlanned! / user.daysTotal) * 100)}%)` : ""}</div>
            <div>Avg actions per day: <span className="text-text-primary">{user.avgActionsPerDay}</span></div>
            <div>Avg session length: <span className="text-text-primary">{user.avgSessionMin} min</span></div>
            <div>Ritual consistency: <span className="text-text-primary">{user.ritualConsistencyPct}%</span> across {user.rituals} active rituals</div>
          </Card>

          <SectionLabel meta="Last 30 events">Recent activity</SectionLabel>
          <Card>
            {(user.recent ?? []).map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2 border-b border-border-subtle last:border-b-0 text-[13px]">
                <Mono className="w-[120px] shrink-0">{fmtDateTime(e.iso)}</Mono>
                <span className="text-text-primary truncate">{e.text}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* RIGHT 40% */}
        <div className="col-span-2">
          <SectionLabel>Subscription</SectionLabel>
          <Card className="p-4 mb-6">
            <SubscriptionBlock user={user} onComp={() => setConfirmComp(true)} onExtend={() => setConfirmExtend(true)} />
          </Card>

          <SectionLabel>Contact</SectionLabel>
          <Card className="p-4 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Email</span>
              <div className="flex items-center gap-2">
                <span className="text-text-primary">{user.email}</span>
                <button onClick={() => copy(user.email)} className="text-text-tertiary hover:text-text-primary"><Copy size={12} /></button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-text-secondary">Account created</span>
              <span className="text-text-primary">{fmtDate(user.signupIso)}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-text-secondary">Last login</span>
              <span className="text-text-primary">{fmtAgo(user.lastActiveIso)}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        open={confirmComp} title="Comp Pro for 30 days?"
        body={<>This will grant <strong>{user.email}</strong> 30 days of free Pro access. Logged to audit.</>}
        confirmLabel="Comp 30 days"
        onCancel={() => setConfirmComp(false)}
        onConfirm={() => {
          log({ type: "Subscription", action: `Comped Pro for 30 days for ${user.email}`, targetUserEmail: user.email, targetUserId: user.id });
          toast.success("Comped 30 days of Pro");
          setConfirmComp(false);
        }}
      />
      <ConfirmModal
        open={confirmExtend} title="Extend trial by 7 days?"
        body={<>Trial for <strong>{user.email}</strong> will be extended.</>}
        confirmLabel="Extend trial"
        onCancel={() => setConfirmExtend(false)}
        onConfirm={() => {
          log({ type: "Subscription", action: `Extended trial by 7 days for ${user.email}`, targetUserEmail: user.email, targetUserId: user.id });
          toast.success("Trial extended 7 days");
          setConfirmExtend(false);
        }}
      />
      <ConfirmModal
        open={confirmSuspend} title={user.status === "Suspended" ? "Restore account?" : "Suspend account?"}
        body={user.status === "Suspended" ? "Account will regain access." : "User will be locked out until restored."}
        destructive={user.status !== "Suspended"}
        confirmLabel={user.status === "Suspended" ? "Restore" : "Suspend"}
        onCancel={() => setConfirmSuspend(false)}
        onConfirm={() => {
          const verb = user.status === "Suspended" ? "Restored" : "Suspended";
          log({ type: "Account", action: `${verb} user ${user.email}`, targetUserEmail: user.email, targetUserId: user.id });
          toast.success(`${verb} ${user.email}`);
          setConfirmSuspend(false);
        }}
      />
      <ConfirmModal
        open={confirmDelete} title="Delete account?" destructive
        body="This permanently deletes the account. Cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          log({ type: "Account", action: `Deleted user ${user.email}`, targetUserEmail: user.email, targetUserId: user.id });
          toast.success("Account deleted");
          setConfirmDelete(false);
        }}
      />

      {/* Impersonation modal */}
      {imperOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "var(--backdrop)" }} onClick={() => setImperOpen(false)}>
          <div className="w-[480px] max-w-[90vw] bg-surface-elevated border border-border-subtle rounded-[6px] p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[16px] font-medium">View user account</h2>
            <p className="mt-3 text-[13px] text-text-secondary leading-[1.5]">
              You're about to access <strong className="text-text-primary">{user.email}</strong>'s account in read-only mode. This action will be logged. Continue?
            </p>
            <label className="block mt-4 text-[12px] font-mono uppercase tracking-wide text-text-tertiary">Reason (min 10 chars)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder="e.g. troubleshooting missing actions report"
              className="mt-1 w-full bg-surface-raised border border-border-subtle rounded-[4px] px-3 py-2 text-[13px]"
            />
            <div className="mt-5 flex items-center justify-end gap-3">
              <button onClick={() => setImperOpen(false)} className="text-[13px] text-text-secondary hover:text-text-primary px-3 py-1.5">Cancel</button>
              <PrimaryButton onClick={startImper}>View account</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const SubscriptionBlock: React.FC<{
  user: ReturnType<typeof currentUserType>;
  onComp: () => void;
  onExtend: () => void;
}> = ({ user, onComp, onExtend }) => {
  const url = stripeUrl(user.stripeCustomerId);
  const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
    <div className="flex items-center justify-between text-[13px] py-1">
      <span className="text-text-secondary">{k}</span>
      <span className="text-text-primary">{v}</span>
    </div>
  );

  if (user.plan === "Free") {
    return (
      <>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] font-medium">Free</span>
          <PlanPill plan="Free" />
        </div>
        <p className="text-[12px] text-text-secondary">Signed up {fmtDate(user.signupIso)}, never upgraded.</p>
      </>
    );
  }

  if (user.plan === "Pro") {
    return (
      <>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] font-medium">Pro · Active</span>
          <PlanPill plan="Pro" />
        </div>
        <Row k="Started" v={fmtDate(user.proStartedIso)} />
        <Row k="Renews" v={`${fmtDate(user.renewsIso)} ($9/month)`} />
        <Row k="Stripe customer" v={<Mono>{user.stripeCustomerId}</Mono>} />
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <SecondaryButton onClick={onComp}>Comp Pro for 30 days</SecondaryButton>
          <LinkExt href={url}>View in Stripe</LinkExt>
        </div>
        <p className="mt-3 text-[11px] text-text-tertiary">Refunds, plan changes, payment methods → manage in Stripe Dashboard.</p>
      </>
    );
  }

  if (user.plan === "Trial") {
    const left = daysFromNow(user.trialEndsIso);
    return (
      <>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] font-medium">Trial · Pro features</span>
          <PlanPill plan="Trial" />
        </div>
        <Row k="Trial ends" v={`${fmtDate(user.trialEndsIso)} (${left}d remaining)`} />
        <Row k="Stripe customer" v={<Mono>{user.stripeCustomerId}</Mono>} />
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <SecondaryButton onClick={onExtend}>Extend trial by 7 days</SecondaryButton>
          <SecondaryButton onClick={onComp}>Comp Pro for 30 days</SecondaryButton>
          <LinkExt href={url}>View in Stripe</LinkExt>
        </div>
      </>
    );
  }

  if (user.plan === "Cancelled") {
    return (
      <>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] font-medium">Cancelled (was Pro)</span>
          <PlanPill plan="Cancelled" />
        </div>
        <Row k="Cancelled" v={fmtDate(user.cancelledIso)} />
        {user.cancelReason && <Row k="Reason" v={user.cancelReason} />}
        <Row k="Access until" v={fmtDate(user.accessUntilIso)} />
        <div className="mt-4"><LinkExt href={url}>View in Stripe</LinkExt></div>
      </>
    );
  }

  // Past Due
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[14px] font-medium" style={{ color: "hsl(var(--text-warning))" }}>Past Due (Pro)</span>
        <PlanPill plan="Past Due" />
      </div>
      <Row k="Last payment failed" v={fmtDate(user.lastPaymentFailedIso)} />
      <Row k="Access expires" v={`${fmtDate(user.accessUntilIso)} unless resolved`} />
      <div className="mt-4"><LinkExt href={url}>View in Stripe</LinkExt></div>
    </>
  );
};

// helper purely for type inference
function currentUserType() { return ADMIN_USERS[0]; }
