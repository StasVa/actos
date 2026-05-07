import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AdminPageHeader, Card, Mono } from "../AdminUI";
import { ADMIN_EMAILS, fmtDateTime } from "../adminMock";
import { useAdminStore } from "../adminStore";

const TYPES = ["All", "Impersonation", "Account", "Subscription", "Feedback", "Other"] as const;
const DATES = ["Last 7d", "Last 30d", "Last 90d", "All time"] as const;

export default function AdminAudit() {
  const audit = useAdminStore((s) => s.audit);
  const [params] = useSearchParams();
  const focus = params.get("focus");

  const [admin, setAdmin] = React.useState("All");
  const [type, setType] = React.useState<typeof TYPES[number]>("All");
  const [date, setDate] = React.useState<typeof DATES[number]>("Last 30d");
  const [q, setQ] = React.useState("");

  const filtered = audit.filter((a) => {
    if (admin !== "All" && a.admin !== admin) return false;
    if (type !== "All" && a.type !== type) return false;
    if (date !== "All time") {
      const days = (Date.now() - new Date(a.iso).getTime()) / 86400000;
      const cap = date === "Last 7d" ? 7 : date === "Last 30d" ? 30 : 90;
      if (days > cap) return false;
    }
    if (q) {
      const hay = `${a.action} ${a.targetUserEmail ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <>
      <AdminPageHeader title="Audit Log" meta={`${audit.length} entries`} />

      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <Sel label="Admin" value={admin} onChange={setAdmin} options={["All", ...ADMIN_EMAILS]} />
        <Sel label="Type" value={type} onChange={(v) => setType(v as typeof TYPES[number])} options={TYPES as readonly string[]} />
        <Sel label="Date" value={date} onChange={(v) => setDate(v as typeof DATES[number])} options={DATES as readonly string[]} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search action or user email…"
          className="flex-1 min-w-[240px] bg-surface-raised border border-border-subtle rounded-[4px] px-3 py-1.5 text-[12px]" />
      </div>

      <Card>
        {filtered.map((a) => (
          <div key={a.id}
            className={`px-4 py-3 border-b border-border-subtle last:border-b-0 text-[13px] ${focus === a.id ? "bg-surface-hover" : ""}`}
          >
            <div className="flex items-center gap-3">
              <Mono className="w-[160px] shrink-0">{fmtDateTime(a.iso)}</Mono>
              <span className="font-mono text-text-secondary w-[200px] shrink-0 truncate" style={{ fontSize: 11 }}>{a.admin}</span>
              <span className="text-text-primary flex-1 truncate">{a.action}</span>
              {a.targetUserId && <Link to={`/admin/users/${a.targetUserId}`} className="text-accent hover:underline text-[12px]">View →</Link>}
            </div>
            {a.reason && <div className="mt-1 text-[12px] text-text-tertiary pl-[160px]">Reason: {a.reason}</div>}
          </div>
        ))}
        {filtered.length === 0 && <div className="p-6 text-text-tertiary text-[13px] text-center">No matching entries.</div>}
      </Card>
    </>
  );
}

const Sel: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: readonly string[] }> = ({ label, value, onChange, options }) => (
  <label className="flex items-center gap-1.5 text-[12px] text-text-tertiary">
    <span className="font-mono uppercase" style={{ fontSize: 10 }}>{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1 text-[12px] text-text-primary">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </label>
);
