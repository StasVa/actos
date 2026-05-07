import React from "react";
import { useNavigate } from "react-router-dom";
import { AdminPageHeader, StatTile, Card, SectionLabel } from "../AdminUI";
import { DASHBOARD, fmtAgo } from "../adminMock";
import { useAdminStore } from "../adminStore";

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-4 gap-3 mb-3">{children}</div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const audit = useAdminStore((s) => s.audit).slice(0, 5);
  const r = DASHBOARD;

  return (
    <>
      <AdminPageHeader title="Dashboard" meta="Last updated: just now" />

      <SectionLabel>Users</SectionLabel>
      <Row>
        <StatTile label="Total users" value={r.users.total.toLocaleString()} />
        <StatTile label="Active today" value={r.users.today} />
        <StatTile label="Active last 7 days" value={r.users.last7} />
        <StatTile label="Active last 30 days" value={r.users.last30} />
      </Row>

      <SectionLabel>Acquisition</SectionLabel>
      <Row>
        <StatTile label="New signups today" value={r.signups.today} />
        <StatTile label="New signups last 7 days" value={r.signups.last7} />
        <StatTile label="New signups last 30 days" value={r.signups.last30} />
        <StatTile label="Total lifetime signups" value={r.signups.lifetime.toLocaleString()} />
      </Row>

      <SectionLabel>Engagement</SectionLabel>
      <Row>
        <StatTile label="Goals created" value={r.engagement.goals.toLocaleString()} />
        <StatTile label="Projects closed" value={r.engagement.projectsClosed.toLocaleString()} />
        <StatTile label="Actions done" value={r.engagement.actionsDone.toLocaleString()} />
        <StatTile label="Sessions completed" value={r.engagement.sessions.toLocaleString()} />
      </Row>

      <SectionLabel>Revenue</SectionLabel>
      <Row>
        <StatTile label="MRR" value={`$${r.revenue.mrr.toLocaleString()}`} />
        <StatTile label="Active paid" value={r.revenue.activePaid} />
        <StatTile label="Trial users" value={r.revenue.trial} />
        <StatTile label="Churn last 30d" value={`${r.revenue.churn30} cancelled`} />
      </Row>

      <div className="mt-8">
        <SectionLabel meta="Last 5 entries">Recent admin activity</SectionLabel>
        <Card>
          {audit.length === 0 && <div className="p-4 text-text-tertiary text-[13px]">No activity yet.</div>}
          {audit.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate(`/admin/audit?focus=${a.id}`)}
              className="w-full text-left flex items-center gap-3 px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors"
            >
              <span className="font-mono text-[11px] text-text-tertiary w-[80px] shrink-0">{fmtAgo(a.iso)}</span>
              <span className="font-mono text-[12px] text-text-secondary w-[180px] shrink-0 truncate">{a.admin}</span>
              <span className="text-[13px] text-text-primary truncate flex-1">{a.action}{a.reason ? ` — ${a.reason}` : ""}</span>
            </button>
          ))}
        </Card>
      </div>
    </>
  );
}
