// Shared admin UI primitives.

import React from "react";
import type { Plan } from "./adminMock";

export const AdminPageHeader: React.FC<{ title: string; meta?: React.ReactNode; right?: React.ReactNode }> = ({
  title, meta, right,
}) => (
  <div className="flex items-end justify-between mb-6">
    <div>
      <div
        className="font-mono uppercase mb-1"
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "hsl(var(--text-warning))",
        }}
      >
        ● Admin Panel
      </div>
      <h1 className="text-[24px] font-medium text-text-primary leading-none">{title}</h1>
      {meta && <div className="mt-2 text-[12px] text-text-secondary">{meta}</div>}
    </div>
    {right}
  </div>
);

export const SectionLabel: React.FC<{ children: React.ReactNode; meta?: React.ReactNode }> = ({ children, meta }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">{children}</h2>
    {meta && <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">{meta}</div>}
  </div>
);

export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}> = ({ label, value, sub }) => (
  <div className="bg-surface-raised border border-border-subtle rounded-[6px] p-4">
    <div className="font-mono uppercase text-[10px] tracking-[0.08em] text-text-tertiary">{label}</div>
    <div className="mt-2 text-[26px] font-medium text-text-primary leading-none tabular-nums">{value}</div>
    {sub && <div className="mt-2 text-[11px] text-text-secondary">{sub}</div>}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-surface-raised border border-border-subtle rounded-[6px] ${className ?? ""}`}>{children}</div>
);

export const PlanPill: React.FC<{ plan: Plan }> = ({ plan }) => {
  const styles: Record<Plan, React.CSSProperties> = {
    Pro:        { background: "hsl(var(--accent) / 0.18)", color: "hsl(var(--accent-hover))" },
    Free:       { background: "hsl(var(--surface-hover))", color: "hsl(var(--text-secondary))" },
    Trial:      { background: "hsl(var(--state-active) / 0.18)", color: "hsl(var(--state-active))" },
    Cancelled:  { background: "hsl(var(--text-warning) / 0.15)", color: "hsl(var(--text-warning))" },
    "Past Due": { background: "hsl(var(--text-warning) / 0.30)", color: "hsl(var(--text-warning))" },
  };
  return (
    <span className="font-mono uppercase rounded-[3px] px-1.5 py-0.5"
          style={{ fontSize: 10, letterSpacing: "0.06em", ...styles[plan] }}>
      {plan}
    </span>
  );
};

export const StatusPill: React.FC<{ children: string; tone?: "muted" | "warn" | "ok" | "info" }> = ({ children, tone = "muted" }) => {
  const map: Record<string, React.CSSProperties> = {
    muted: { background: "hsl(var(--surface-hover))", color: "hsl(var(--text-tertiary))" },
    warn:  { background: "hsl(var(--text-warning) / 0.18)", color: "hsl(var(--text-warning))" },
    ok:    { background: "hsl(var(--state-active) / 0.18)", color: "hsl(var(--state-active))" },
    info:  { background: "hsl(var(--accent) / 0.18)", color: "hsl(var(--accent-hover))" },
  };
  return (
    <span className="font-mono uppercase rounded-[3px] px-1.5 py-0.5"
          style={{ fontSize: 10, letterSpacing: "0.06em", ...map[tone] }}>
      {children}
    </span>
  );
};

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = "", ...rest }) => (
  <button
    type="button"
    className={`text-[13px] font-medium px-3 py-1.5 rounded-[4px] transition-colors ${className}`}
    style={{ background: "hsl(var(--accent))", color: "hsl(var(--text-primary))" }}
    {...rest}
  />
);

export const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = "", ...rest }) => (
  <button
    type="button"
    className={`text-[13px] px-3 py-1.5 rounded-[4px] transition-colors text-text-primary bg-surface-hover hover:opacity-90 ${className}`}
    {...rest}
  />
);

export const LinkExt: React.FC<{ href: string; children: React.ReactNode; className?: string }> = ({ href, children, className }) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
     className={`text-[13px] text-accent hover:underline ${className ?? ""}`}>
    {children} ↗
  </a>
);

export const Mono: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={`font-mono text-text-secondary ${className ?? ""}`} style={{ fontSize: 11 }}>
    {children}
  </span>
);
