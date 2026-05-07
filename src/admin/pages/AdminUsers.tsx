import React from "react";
import { useNavigate } from "react-router-dom";
import { AdminPageHeader, Card, PlanPill, StatusPill, Mono } from "../AdminUI";
import { ADMIN_USERS, fmtAgo, fmtDate, type Plan, type AccountStatus } from "../adminMock";

const PLAN_OPTS: ("All" | Plan)[] = ["All", "Free", "Pro", "Trial", "Cancelled", "Past Due"];
const STATUS_OPTS: ("All" | AccountStatus)[] = ["All", "Active", "Suspended", "Deleted"];
const SIGNUP_OPTS = ["All", "Last 7d", "Last 30d", "Last 90d"] as const;
const ACTIVITY_OPTS = ["All", "Active last 7d", "Inactive 30d+"] as const;
const SORT_OPTS = ["Recent activity", "Sign-up date", "Email A-Z"] as const;

const Select: React.FC<{ value: string; onChange: (v: string) => void; options: readonly string[]; label: string }> = ({ value, onChange, options, label }) => (
  <label className="flex items-center gap-1.5 text-[12px] text-text-tertiary">
    <span className="font-mono uppercase tracking-wide" style={{ fontSize: 10 }}>{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1 text-[12px] text-text-primary"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </label>
);

export default function AdminUsers() {
  const navigate = useNavigate();
  const [plan, setPlan] = React.useState<string>("All");
  const [status, setStatus] = React.useState<string>("All");
  const [signup, setSignup] = React.useState<string>("All");
  const [activity, setActivity] = React.useState<string>("All");
  const [sort, setSort] = React.useState<string>("Recent activity");
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    const now = Date.now();
    return ADMIN_USERS.filter((u) => {
      if (plan !== "All" && u.plan !== plan) return false;
      if (status !== "All" && u.status !== status) return false;
      if (signup !== "All") {
        const days = (now - new Date(u.signupIso).getTime()) / 86400000;
        const max = signup === "Last 7d" ? 7 : signup === "Last 30d" ? 30 : 90;
        if (days > max) return false;
      }
      if (activity === "Active last 7d" && (now - new Date(u.lastActiveIso).getTime()) / 86400000 > 7) return false;
      if (activity === "Inactive 30d+" && (now - new Date(u.lastActiveIso).getTime()) / 86400000 < 30) return false;
      if (q && !u.email.toLowerCase().includes(q.toLowerCase()) && !u.id.includes(q)) return false;
      return true;
    }).sort((a, b) => {
      if (sort === "Email A-Z") return a.email.localeCompare(b.email);
      if (sort === "Sign-up date") return new Date(b.signupIso).getTime() - new Date(a.signupIso).getTime();
      return new Date(b.lastActiveIso).getTime() - new Date(a.lastActiveIso).getTime();
    });
  }, [plan, status, signup, activity, sort, q]);

  const pageSize = 50;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <>
      <AdminPageHeader title="Users" meta={`${ADMIN_USERS.length.toLocaleString()} total`} />

      <div className="flex items-center gap-3 flex-wrap mb-3">
        <Select label="Plan" value={plan} onChange={setPlan} options={PLAN_OPTS as readonly string[]} />
        <Select label="Status" value={status} onChange={setStatus} options={STATUS_OPTS as readonly string[]} />
        <Select label="Signed up" value={signup} onChange={setSignup} options={SIGNUP_OPTS} />
        <Select label="Activity" value={activity} onChange={setActivity} options={ACTIVITY_OPTS} />
        <div className="flex-1" />
        <Select label="Sort" value={sort} onChange={setSort} options={SORT_OPTS} />
      </div>

      <input
        type="text"
        placeholder="Search by email or user ID"
        value={q}
        onChange={(e) => { setQ(e.target.value); setPage(0); }}
        className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-3 py-2 text-[13px] mb-3"
      />

      <Card>
        {visible.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => navigate(`/admin/users/${u.id}`)}
            className="w-full text-left px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[14px] font-medium text-text-primary truncate">{u.email}</span>
                {u.status !== "Active" && <StatusPill tone="muted">{u.status.toUpperCase()}</StatusPill>}
              </div>
              <PlanPill plan={u.plan} />
            </div>
            <Mono className="block mt-1">
              Signed up {fmtDate(u.signupIso)} · Last active {fmtAgo(u.lastActiveIso)} · {u.goals} goals · {u.actionsDone} actions done · {u.sessions} sessions
            </Mono>
          </button>
        ))}
        {visible.length === 0 && <div className="p-6 text-text-tertiary text-[13px] text-center">No users match.</div>}
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
            className="px-2 py-1 text-[12px] text-text-secondary hover:text-text-primary disabled:opacity-40">← Prev</button>
          <span className="font-mono text-[11px] text-text-tertiary">Page {page + 1} of {pages}</span>
          <button disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 text-[12px] text-text-secondary hover:text-text-primary disabled:opacity-40">Next →</button>
        </div>
      )}
    </>
  );
}
