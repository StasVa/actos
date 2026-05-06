import React from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { AppSidebar } from "@/components/AppSidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { TimeInvestmentSection } from "@/components/TimeInvestmentSection";
import {
  Hero,
  ActiveProjects,
  SectionLabel,
} from "./Index";

const TinyHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">{children}</div>
);

function fmtAgo(iso?: string): string {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const RecentlyClosedSection: React.FC = () => {
  const projects = useStore((s) => s.projects);
  const actions = useStore((s) => s.actions);
  const goals = useStore((s) => s.goals);
  const openPanel = useStore((s) => s.openPanel);

  type Row = { id: string; type: "action" | "project"; title: string; parent: string; date: string; iso: string };
  const rows: Row[] = [];
  for (const p of projects) {
    if (p.status === "completed" && p.completedAt) {
      const g = goals.find((gg) => gg.id === p.goalId);
      rows.push({
        id: p.id,
        type: "project",
        title: p.title,
        parent: g?.title ?? "—",
        date: fmtAgo(p.completedAt),
        iso: p.completedAt,
      });
    }
  }
  for (const a of actions) {
    if (a.status === "done" && a.completedAt) {
      const g = goals.find((gg) => gg.id === a.goalId);
      const p = a.projectId ? projects.find((pp) => pp.id === a.projectId) : undefined;
      rows.push({
        id: a.id,
        type: "action",
        title: a.title,
        parent: p ? `${g?.title ?? ""} · ${p.title}` : g?.title ?? "—",
        date: fmtAgo(a.completedAt),
        iso: a.completedAt,
      });
    }
  }
  rows.sort((a, b) => b.iso.localeCompare(a.iso));
  const top = rows.slice(0, 10);

  return (
    <section>
      <SectionLabel>Recently closed</SectionLabel>
      {top.length === 0 ? (
        <div className="font-mono text-[11px] text-text-tertiary px-3 py-2">Nothing closed yet.</div>
      ) : (
        <div className="space-y-1 bg-surface-elevated border border-border-subtle rounded-[6px] p-3">
          {top.map((r) =>
            r.type === "action" ? (
              <button
                key={`a-${r.id}`}
                onClick={() => openPanel({ kind: "action", mode: "edit", id: r.id })}
                className="w-full flex items-center gap-3 px-2 py-1.5 rounded-[3px] hover:bg-surface-hover transition-colors text-left"
              >
                <span className="font-mono text-[12px] text-state-active">✓</span>
                <span className="text-[13px] text-text-primary truncate">{r.title}</span>
                <span className="font-mono text-[11px] text-text-tertiary">·</span>
                <span className="font-mono text-[11px] text-text-secondary truncate">{r.parent}</span>
                <div className="flex-1" />
                <span className="font-mono text-[11px] text-text-secondary tabular-nums whitespace-nowrap">{r.date}</span>
              </button>
            ) : (
              <Link
                key={`p-${r.id}`}
                to={`/projects/${r.id}`}
                className="flex items-center gap-3 px-2 py-1.5 rounded-[3px] hover:bg-surface-hover transition-colors"
              >
                <span className="font-mono text-[12px] text-text-tertiary">⌐</span>
                <span className="text-[13px] text-text-primary truncate">{r.title}</span>
                <span className="font-mono text-[11px] text-text-tertiary">·</span>
                <span className="font-mono text-[11px] text-text-secondary truncate">{r.parent}</span>
                <div className="flex-1" />
                <span className="font-mono text-[11px] text-text-secondary tabular-nums whitespace-nowrap">{r.date}</span>
              </Link>
            ),
          )}
        </div>
      )}
    </section>
  );
};

const DelegatedSection: React.FC = () => {
  const actions = useStore((s) => s.actions);
  const openPanel = useStore((s) => s.openPanel);
  const items = actions.filter((a) => a.status === "delegated");

  return (
    <section>
      <SectionLabel meta={`${items.length} ACTIVE`}>Delegated · {items.length}</SectionLabel>
      {items.length === 0 ? (
        <div className="font-mono text-[11px] text-text-tertiary px-3 py-2">No active delegations.</div>
      ) : (
        <div className="space-y-1 bg-surface-elevated border border-border-subtle rounded-[6px] p-3">
          {items.map((a) => (
            <button
              key={a.id}
              onClick={() => openPanel({ kind: "action", mode: "edit", id: a.id })}
              className="w-full flex items-center gap-3 px-2 py-1.5 rounded-[3px] hover:bg-surface-hover transition-colors text-left"
            >
              <span className="text-[13px] text-text-primary truncate">{a.title}</span>
              {a.delegateName && (
                <span className="font-mono text-[11px] text-text-tertiary truncate">· → {a.delegateName}</span>
              )}
              <div className="flex-1" />
              {a.expectedReturnDate && (
                <span className="font-mono text-[11px] text-text-tertiary tabular-nums whitespace-nowrap">
                  return {a.expectedReturnDate}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      <Link to="/delegated" className="inline-block mt-3 text-[12px] text-accent hover:text-accent-hover">
        View all delegated →
      </Link>
    </section>
  );
};

const Progress: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const actions = useStore((s) => s.actions);

  const activeGoals = goals.filter((g) => g.status === "active").length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const actionsDone = actions.filter((a) => a.status === "done").length;

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="ml-[var(--sidebar-w,220px)] px-8 py-6 max-w-[1400px]">
        <header className="mb-8 flex items-end justify-between gap-4">
          <h1 className="text-[24px] font-medium text-text-primary leading-tight">Progress</h1>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums pb-1">
            {activeGoals} goals · {activeProjects} active projects · {actionsDone} actions done all-time
          </div>
        </header>

        <Hero />
        <div className="h-10" />
        <ActiveProjects />
        <div className="h-10" />
        <RecentlyClosedSection />
        <div className="h-10" />
        <DelegatedSection />
        <div className="h-10" />
        <TimeInvestmentSection />
        <div className="h-12" />
      </main>
    </div>
  );
};

export default Progress;
