import React from "react";
import { AdminPageHeader, Card, PrimaryButton, SecondaryButton, StatusPill } from "../AdminUI";
import { ANNOUNCEMENTS, fmtDate, type Announcement, type AnnouncementAudience, type AnnouncementSeverity, type AnnouncementStatus } from "../adminMock";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const STATUS_TONE: Record<AnnouncementStatus, "info" | "ok" | "warn" | "muted"> = {
  draft: "muted", scheduled: "info", active: "ok", ended: "muted",
};

export default function AdminAnnouncements() {
  const [items, setItems] = React.useState<Announcement[]>(ANNOUNCEMENTS);
  const [editing, setEditing] = React.useState<Announcement | null>(null);

  const onSave = (a: Announcement) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === a.id);
      if (i >= 0) { const next = prev.slice(); next[i] = a; return next; }
      return [a, ...prev];
    });
    toast.success("Announcement saved");
    setEditing(null);
  };

  return (
    <>
      <AdminPageHeader
        title="Announcements"
        meta={`${items.length} total`}
        right={<PrimaryButton onClick={() => setEditing({ id: `an_${Date.now()}`, title: "", body: "", audience: "all", startIso: new Date().toISOString(), endIso: new Date(Date.now() + 7 * 86400000).toISOString(), severity: "info", status: "draft", createdBy: "admin@actos.app" })}><Plus size={14} className="inline mr-1" />New</PrimaryButton>}
      />

      <Card>
        <div className="grid grid-cols-[1fr_120px_120px_100px_100px_120px] px-4 py-2 border-b border-border-subtle font-mono uppercase text-[10px] text-text-tertiary tracking-wide">
          <span>Title</span><span>Start</span><span>End</span><span>Audience</span><span>Status</span><span>Created by</span>
        </div>
        {items.map((a) => (
          <button key={a.id} onClick={() => setEditing(a)}
            className="w-full text-left grid grid-cols-[1fr_120px_120px_100px_100px_120px] items-center px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors text-[13px]">
            <span className="truncate text-text-primary">{a.title}</span>
            <span className="text-text-secondary">{fmtDate(a.startIso)}</span>
            <span className="text-text-secondary">{fmtDate(a.endIso)}</span>
            <span className="text-text-secondary capitalize">{a.audience}</span>
            <StatusPill tone={STATUS_TONE[a.status]}>{a.status.toUpperCase()}</StatusPill>
            <span className="font-mono text-text-tertiary truncate" style={{ fontSize: 11 }}>{a.createdBy}</span>
          </button>
        ))}
      </Card>

      {editing && <EditorModal initial={editing} onClose={() => setEditing(null)} onSave={onSave} />}
    </>
  );
}

const EditorModal: React.FC<{ initial: Announcement; onClose: () => void; onSave: (a: Announcement) => void }> = ({ initial, onClose, onSave }) => {
  const [a, setA] = React.useState(initial);
  const [preview, setPreview] = React.useState(false);

  const sevColor: Record<AnnouncementSeverity, string> = {
    info: "hsl(var(--accent) / 0.18)",
    warning: "hsl(var(--text-warning) / 0.20)",
    critical: "hsl(var(--text-warning) / 0.40)",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "var(--backdrop)" }} onClick={onClose}>
      <div className="w-[640px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-surface-elevated border border-border-subtle rounded-[6px] p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[16px] font-medium mb-4">{initial.title ? "Edit announcement" : "New announcement"}</h2>

        <Field label="Title">
          <input value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Body">
          <textarea value={a.body} onChange={(e) => setA({ ...a, body: e.target.value })} rows={4} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Audience">
            <select value={a.audience} onChange={(e) => setA({ ...a, audience: e.target.value as AnnouncementAudience })} className={inputCls}>
              <option value="all">All users</option>
              <option value="paid">Paid only</option>
              <option value="free">Free only</option>
              <option value="trial">Trial only</option>
            </select>
          </Field>
          <Field label="Severity">
            <select value={a.severity} onChange={(e) => setA({ ...a, severity: e.target.value as AnnouncementSeverity })} className={inputCls}>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </Field>
          <Field label="Start">
            <input type="datetime-local" value={a.startIso.slice(0, 16)} onChange={(e) => setA({ ...a, startIso: new Date(e.target.value).toISOString() })} className={inputCls} />
          </Field>
          <Field label="End">
            <input type="datetime-local" value={a.endIso.slice(0, 16)} onChange={(e) => setA({ ...a, endIso: new Date(e.target.value).toISOString() })} className={inputCls} />
          </Field>
        </div>

        <div className="mt-3">
          <button onClick={() => setPreview((p) => !p)} className="text-[12px] text-accent hover:underline">{preview ? "Hide preview" : "Preview banner"}</button>
          {preview && (
            <div className="mt-2 px-4 py-2 rounded-[4px] text-[13px]" style={{ background: sevColor[a.severity] }}>
              <strong>{a.title || "Untitled"}</strong> — <span className="text-text-secondary">{a.body || "(empty body)"}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="text-[13px] text-text-secondary hover:text-text-primary px-3 py-1.5">Cancel</button>
          <SecondaryButton onClick={() => onSave({ ...a, status: "draft" })}>Save draft</SecondaryButton>
          <SecondaryButton onClick={() => onSave({ ...a, status: "scheduled" })}>Schedule</SecondaryButton>
          <PrimaryButton onClick={() => onSave({ ...a, status: "active" })}>Publish</PrimaryButton>
        </div>
      </div>
    </div>
  );
};

const inputCls = "w-full bg-surface-raised border border-border-subtle rounded-[4px] px-3 py-2 text-[13px]";
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block mb-3">
    <span className="font-mono uppercase block mb-1 text-text-tertiary" style={{ fontSize: 10, letterSpacing: "0.06em" }}>{label}</span>
    {children}
  </label>
);
