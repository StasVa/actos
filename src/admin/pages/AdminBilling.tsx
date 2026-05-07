import React from "react";
import { Link } from "react-router-dom";
import { AdminPageHeader, Card, SectionLabel, StatTile, LinkExt } from "../AdminUI";
import { ADMIN_USERS, DASHBOARD, daysFromNow, fmtDate } from "../adminMock";

export default function AdminBilling() {
  const r = DASHBOARD;
  const pastDue = ADMIN_USERS.filter((u) => u.plan === "Past Due");
  const trialEnding = ADMIN_USERS.filter((u) => u.plan === "Trial" && daysFromNow(u.trialEndsIso) <= 7).slice(0, 8);
  const cancelled = ADMIN_USERS.filter((u) => u.plan === "Cancelled").slice(0, 5);

  return (
    <>
      <AdminPageHeader
        title="Billing"
        meta={<>Full transaction data → <a className="text-accent hover:underline" href="https://dashboard.stripe.com" target="_blank" rel="noreferrer">Stripe Dashboard ↗</a></>}
      />

      <div className="grid grid-cols-4 gap-3 mb-3">
        <StatTile label="MRR" value={`$${r.revenue.mrr.toLocaleString()}`} sub={<span style={{ color: "hsl(var(--state-active))" }}>+{r.billing.mrrDeltaPct}% vs last month</span>} />
        <StatTile label="Active paid" value={r.revenue.activePaid} sub={<span style={{ color: "hsl(var(--state-active))" }}>+{r.billing.activePaidDeltaPct}% vs last month</span>} />
        <StatTile label="Trial → Paid (30d)" value={`${r.billing.trialToPaidPct}%`} />
        <StatTile label="Churn (30d)" value={`${r.revenue.churn30} cancelled`} sub={`${r.billing.churnRatePct}% rate`} />
      </div>

      <Card className="p-4 mb-8 grid grid-cols-4 gap-4 text-[12px] text-text-secondary">
        <div><span className="font-mono uppercase text-[10px] text-text-tertiary block mb-1">New paid · 7d</span><span className="text-text-primary text-[18px] font-medium">{r.billing.newPaid7}</span></div>
        <div><span className="font-mono uppercase text-[10px] text-text-tertiary block mb-1">New paid · 30d</span><span className="text-text-primary text-[18px] font-medium">{r.billing.newPaid30}</span></div>
        <div><span className="font-mono uppercase text-[10px] text-text-tertiary block mb-1">Trials ending · 7d</span><span className="text-text-primary text-[18px] font-medium">{trialEnding.length}</span> <Link to="/admin/users?filter=trial" className="text-accent text-[12px] hover:underline ml-2">View users →</Link></div>
        <div><span className="font-mono uppercase text-[10px] text-text-tertiary block mb-1">Past due</span><span className="text-text-primary text-[18px] font-medium" style={{ color: "hsl(var(--text-warning))" }}>{pastDue.length}</span> <Link to="/admin/users?filter=pastdue" className="text-accent text-[12px] hover:underline ml-2">View users →</Link></div>
      </Card>

      <SectionLabel meta={`${pastDue.length} users`}>Past Due</SectionLabel>
      <Card className="mb-6">
        {pastDue.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b border-border-subtle last:border-b-0 text-[13px]">
            <span className="text-text-primary">{u.email}</span>
            <span className="text-text-secondary">{Math.abs(daysFromNow(u.lastPaymentFailedIso))} days past due</span>
            <Link to={`/admin/users/${u.id}`} className="text-accent hover:underline">View user →</Link>
          </div>
        ))}
        {pastDue.length === 0 && <div className="p-4 text-text-tertiary text-[13px]">None.</div>}
      </Card>
      <div className="mb-8"><LinkExt href="https://dashboard.stripe.com">Resolve in Stripe</LinkExt></div>

      <SectionLabel meta="Next 7 days">Trial ending soon</SectionLabel>
      <Card className="mb-8">
        {trialEnding.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b border-border-subtle last:border-b-0 text-[13px]">
            <span className="text-text-primary">{u.email}</span>
            <span className="text-text-secondary">{fmtDate(u.trialEndsIso)} ({daysFromNow(u.trialEndsIso)}d)</span>
            <Link to={`/admin/users/${u.id}`} className="text-accent hover:underline">View user →</Link>
          </div>
        ))}
        {trialEnding.length === 0 && <div className="p-4 text-text-tertiary text-[13px]">No trials ending soon.</div>}
      </Card>

      <SectionLabel meta="Last 30d, top 5">Recently cancelled</SectionLabel>
      <Card className="mb-3">
        {cancelled.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b border-border-subtle last:border-b-0 text-[13px]">
            <span className="text-text-primary">{u.email}</span>
            <span className="text-text-secondary">Cancelled {fmtDate(u.cancelledIso)}</span>
            <Link to={`/admin/users/${u.id}`} className="text-accent hover:underline">View user →</Link>
          </div>
        ))}
      </Card>
      <Link to="/admin/users" className="text-accent text-[13px] hover:underline">View all cancelled →</Link>

      <p className="mt-10 text-[11px] text-text-tertiary">
        All financial operations (refunds, plan changes, payment methods, invoices) → manage in <a className="text-accent hover:underline" href="https://dashboard.stripe.com" target="_blank" rel="noreferrer">Stripe Dashboard ↗</a>
      </p>
    </>
  );
}
