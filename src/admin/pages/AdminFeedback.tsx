import React from "react";
import { Link } from "react-router-dom";
import { AdminPageHeader, Card, SectionLabel, StatusPill, Mono, SecondaryButton, PlanPill } from "../AdminUI";
import { FEEDBACK, fmtAgo, fmtDateTime, type Feedback, type FeedbackStatus } from "../adminMock";
import { useAdminStore } from "../adminStore";
import { toast } from "sonner";

const STATUS_TONE: Record<FeedbackStatus, "info" | "ok" | "warn" | "muted"> = {
  New: "info", Triaged: "warn", Resolved: "ok", Closed: "muted",
};

export default function AdminFeedback() {
  const log = useAdminStore((s) => s.log);
  const [items, setItems] = React.useState<Feedback[]>(FEEDBACK);
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [dateFilter, setDateFilter] = React.useState("All");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const filtered = items.filter((f) => {
    if (statusFilter !== "All" && f.status !== statusFilter) return false;
    if (dateFilter !== "All") {
      const d = (Date.now() - new Date(f.submittedIso).getTime()) / 86400000;
      if ((dateFilter === "Last 7d" && d > 7) || (dateFilter === "Last 30d" && d > 30)) return false;
    }
    return true;
  });

  const newCount = items.filter((f) => f.status === "New").length;
  const open = openId ? items.find((f) => f.id === openId) : null;

  const setStatus = (id: string, status: FeedbackStatus) => {
    setItems((prev) => prev.map((f) => f.id === id ? { ...f, status } : f));
    const f = items.find((x) => x.id === id);
    if (f) {
      log({ type: "Feedback", action: `Marked feedback from ${f.userEmail} as ${status}`, targetUserEmail: f.userEmail, targetUserId: f.userId });
      toast.success(`Marked as ${status}`);
    }
  };

  return (
    <>
      <AdminPageHeader title="Feedback" meta={`${items.length} total · ${newCount} new`} />

      <div className="flex items-center gap-3 mb-3">
        <SelectChip label="Status" value={statusFilter} onChange={setStatusFilter} options={["All", "New", "Triaged", "Resolved", "Closed"]} />
        <SelectChip label="Date" value={dateFilter} onChange={setDateFilter} options={["All", "Last 7d", "Last 30d"]} />
      </div>

      <Card>
        {filtered.map((f) => (
          <button key={f.id} type="button" onClick={() => setOpenId(f.id)}
            className="w-full text-left px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[14px] font-medium truncate">{f.userEmail}</span>
                <StatusPill tone={STATUS_TONE[f.status]}>{f.status.toUpperCase()}</StatusPill>
              </div>
              <span className="text-[12px] text-text-tertiary">{fmtAgo(f.submittedIso)}</span>
            </div>
            <div className="mt-1 text-[13px] text-text-secondary truncate">{f.message}</div>
            <Mono className="block mt-1">{f.page} · {f.browser} · {f.os}</Mono>
          </button>
        ))}
        {filtered.length === 0 && <div className="p-6 text-text-tertiary text-[13px] text-center">No feedback matches.</div>}
      </Card>

      {open && (
        <FeedbackPanel f={open} onClose={() => setOpenId(null)} onStatus={(s) => setStatus(open.id, s)} onNote={(text) => {
          setItems((prev) => prev.map((x) => x.id === open.id ? { ...x, internalNotes: [...(x.internalNotes ?? []), { iso: new Date().toISOString(), admin: "admin@actos.app", text }] } : x));
          log({ type: "Feedback", action: `Added internal note on feedback from ${open.userEmail}`, targetUserEmail: open.userEmail, targetUserId: open.userId });
          toast.success("Note added");
        }} />
      )}
    </>
  );
}

const SelectChip: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: string[] }> = ({ label, value, onChange, options }) => (
  <label className="flex items-center gap-1.5 text-[12px] text-text-tertiary">
    <span className="font-mono uppercase" style={{ fontSize: 10 }}>{label}</span>
    <select className="bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1 text-[12px] text-text-primary"
      value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </label>
);

const FeedbackPanel: React.FC<{ f: Feedback; onClose: () => void; onStatus: (s: FeedbackStatus) => void; onNote: (text: string) => void }> = ({ f, onClose, onStatus, onNote }) => {
  const [note, setNote] = React.useState("");
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[90]" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 w-[480px] max-w-[95vw] bg-surface-base border-l border-border-subtle z-[91] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-medium">Feedback</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary text-[13px]">Close</button>
        </div>

        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between">
            <Link to={`/admin/users/${f.userId}`} className="text-[13px] text-text-primary hover:underline">{f.userEmail}</Link>
            <PlanPill plan={f.plan} />
          </div>
          <Mono className="block mt-1">{f.userId}</Mono>
        </Card>

        <SectionLabel>Submitted</SectionLabel>
        <div className="text-[12px] text-text-secondary mb-4">
          <div>{fmtDateTime(f.submittedIso)} from <span className="text-text-primary">{f.page}</span></div>
          <Mono className="block mt-1">{f.browser} · {f.os}</Mono>
        </div>

        <SectionLabel>Message</SectionLabel>
        <Card className="p-4 mb-4 text-[13px] leading-[1.55] whitespace-pre-wrap">{f.message}</Card>

        {f.attachments && f.attachments.length > 0 && (
          <>
            <SectionLabel>Attachments</SectionLabel>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {f.attachments.map((src, i) => <div key={i} className="aspect-video bg-surface-hover rounded-[4px] flex items-center justify-center text-text-tertiary text-[11px]">screenshot</div>)}
            </div>
          </>
        )}

        <SectionLabel>Status</SectionLabel>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {(["New","Triaged","Resolved","Closed"] as FeedbackStatus[]).map((s) => (
            <button key={s} onClick={() => onStatus(s)}
              className={`text-[12px] px-2 py-1 rounded-[3px] transition-colors ${f.status === s ? "bg-surface-hover text-text-primary" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"}`}>
              {s}
            </button>
          ))}
        </div>

        <SectionLabel>Reply</SectionLabel>
        <a href={`mailto:${f.userEmail}?subject=${encodeURIComponent("Re: your feedback to ActOS")}`} className="text-[13px] text-accent hover:underline mb-5 inline-block">Open email client →</a>

        <SectionLabel>Internal notes</SectionLabel>
        <Card className="p-3 mb-3">
          {(f.internalNotes ?? []).length === 0 && <div className="text-text-tertiary text-[12px]">No internal notes.</div>}
          {(f.internalNotes ?? []).map((n, i) => (
            <div key={i} className="text-[12px] mb-2 last:mb-0">
              <Mono>{fmtDateTime(n.iso)} · {n.admin}</Mono>
              <div className="text-text-primary mt-0.5">{n.text}</div>
            </div>
          ))}
        </Card>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
          placeholder="Add internal note (audit-logged)…"
          className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-3 py-2 text-[13px]" />
        <div className="mt-2 text-right">
          <SecondaryButton onClick={() => { if (note.trim()) { onNote(note.trim()); setNote(""); } }}>Add note</SecondaryButton>
        </div>
      </aside>
    </>
  );
};
