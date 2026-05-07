// Mock data + types for the admin panel. Realistic but synthetic.
// All values are deterministic per page-load (seeded).

export const ADMIN_EMAILS = ["admin@actos.app", "colleague@actos.app"];

// Mock current authenticated user for the app. In real backend this comes from
// the auth provider. For now, we hardcode an admin so /admin is reachable.
export const CURRENT_USER_EMAIL = "admin@actos.app";

export type Plan = "Free" | "Pro" | "Trial" | "Cancelled" | "Past Due";
export type AccountStatus = "Active" | "Suspended" | "Deleted";

export interface AdminUser {
  id: string;
  email: string;
  plan: Plan;
  status: AccountStatus;
  signupIso: string;
  lastActiveIso: string;
  goals: number;
  projects: number;
  actionsDone: number;
  sessions: number;
  daysActive: number;
  rituals: number;
  // Subscription snapshot (mirrors what we'd store from Stripe)
  stripeCustomerId?: string;
  proStartedIso?: string;
  renewsIso?: string;
  trialEndsIso?: string;
  cancelledIso?: string;
  cancelReason?: string;
  accessUntilIso?: string;
  lastPaymentFailedIso?: string;
  // Engagement
  daysPlanned?: number;
  daysTotal?: number;
  avgActionsPerDay?: number;
  avgSessionMin?: number;
  ritualConsistencyPct?: number;
  // Active goals (for read-only display)
  activeGoals?: { name: string; color: string }[];
  // Recent activity (last 30)
  recent?: { iso: string; text: string }[];
}

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function isoDaysAgo(d: number) {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return t.toISOString();
}
function dateDaysAgo(d: number) { return isoDaysAgo(d).slice(0, 10); }
function dateInDays(d: number) {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t.toISOString().slice(0, 10);
}

const FIRST = ["john","jane","alex","sara","mike","olivia","liam","emma","noah","ava","ethan","sophia","mason","mia","james","amelia","ben","ella","lucas","zoe","ryan","grace","leo","nora","kai","ivy","finn","luna","owen","ruby","cole","hazel","jack","eva","seth","june","wes","june","tom","kate","sam","lily","max","anna","ian","beth","ross","tess","nate","mara"];
const LAST = ["doe","smith","kim","park","wong","patel","singh","lopez","garcia","brown","clark","reed","james","walker","hall","young","king","wright","scott","green","baker","nelson","carter","perez","mitchell","gomez","murphy","cooper","rivera","cox","ward"];
const DOMAINS = ["example.com","mail.com","fastmail.io","proton.me","example.org","outlook.com"];

function pickActiveGoals() {
  const pool = [
    { name: "Ship product v1", color: "hsl(var(--goal-1))" },
    { name: "Run 10k under 50min", color: "hsl(var(--goal-2))" },
    { name: "Read 24 books", color: "hsl(var(--goal-3))" },
    { name: "Learn Spanish (B1)", color: "hsl(var(--goal-1))" },
    { name: "Side project MRR", color: "hsl(var(--goal-2))" },
  ];
  const n = (Math.random() * 3 + 1) | 0;
  return pool.slice(0, n);
}

function recentEvents(): { iso: string; text: string }[] {
  const events = [
    "Completed action 'Draft email'",
    "Started session (Pomodoro 25/5/4)",
    "Closed day",
    "Created goal 'Ship v1'",
    "Closed project 'Landing page'",
    "Planned today (5 actions)",
    "Logged ritual 'Morning run'",
    "Marked action 'Review PR' as done",
    "Updated goal 'Read 24 books'",
    "Added idea 'Newsletter section'",
    "Delegated action 'Translate copy'",
    "Dropped action 'Old idea'",
  ];
  const out: { iso: string; text: string }[] = [];
  let cursor = 0;
  for (let i = 0; i < 30; i++) {
    cursor += Math.random() * 1.6;
    const d = new Date();
    d.setHours(d.getHours() - Math.round(cursor * 8));
    out.push({ iso: d.toISOString(), text: events[(Math.random() * events.length) | 0] });
  }
  return out;
}

function gen(): AdminUser[] {
  // Seed RNG-ish via sin
  let s = 1;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const arr: AdminUser[] = [];
  const distribution: { plan: Plan; n: number }[] = [
    { plan: "Free", n: 35 },
    { plan: "Pro", n: 10 },
    { plan: "Trial", n: 3 },
    { plan: "Cancelled", n: 2 },
    { plan: "Past Due", n: 2 },
  ];
  let id = 1000;
  for (const { plan, n } of distribution) {
    for (let i = 0; i < n; i++) {
      const fn = FIRST[(rand() * FIRST.length) | 0];
      const ln = LAST[(rand() * LAST.length) | 0];
      const dom = DOMAINS[(rand() * DOMAINS.length) | 0];
      const email = `${fn}${ln}${(rand() * 99) | 0}@${dom}`.toLowerCase();
      const signupDays = (rand() * 90) | 0;
      const lastDays = (rand() * Math.min(signupDays, 30)) | 0;
      const power = rand();
      const goals = power > 0.7 ? 4 + ((rand() * 3) | 0) : 1 + ((rand() * 3) | 0);
      const projects = goals * (1 + ((rand() * 3) | 0));
      const actionsDone = power > 0.7 ? 80 + ((rand() * 250) | 0) : (rand() * 50) | 0;
      const sessions = (actionsDone / 8) | 0;
      const daysActive = Math.min(signupDays, ((power * (signupDays + 1)) | 0) + 1);
      const u: AdminUser = {
        id: `usr_${id++}`,
        email,
        plan,
        status: rand() > 0.96 ? "Suspended" : "Active",
        signupIso: isoDaysAgo(signupDays),
        lastActiveIso: isoDaysAgo(lastDays),
        goals, projects, actionsDone, sessions, daysActive,
        rituals: 1 + ((rand() * 4) | 0),
        daysPlanned: (daysActive * (0.3 + rand() * 0.6)) | 0,
        daysTotal: daysActive,
        avgActionsPerDay: Math.round((actionsDone / Math.max(daysActive, 1)) * 10) / 10,
        avgSessionMin: 18 + ((rand() * 35) | 0),
        ritualConsistencyPct: 40 + ((rand() * 55) | 0),
        activeGoals: pickActiveGoals(),
        recent: recentEvents(),
      };
      if (plan === "Pro") {
        const start = (rand() * 200 + 14) | 0;
        u.proStartedIso = isoDaysAgo(start);
        u.renewsIso = dateInDays(((rand() * 28) | 0) + 1);
        u.stripeCustomerId = `cus_${Math.random().toString(36).slice(2, 16)}`;
      } else if (plan === "Trial") {
        u.trialEndsIso = dateInDays(((rand() * 13) | 0) + 1);
        u.stripeCustomerId = `cus_${Math.random().toString(36).slice(2, 16)}`;
      } else if (plan === "Cancelled") {
        const c = (rand() * 25) | 0;
        u.cancelledIso = isoDaysAgo(c);
        u.cancelReason = ["too expensive", "missing feature", "no longer needed", null][(rand() * 4) | 0] || undefined;
        u.accessUntilIso = dateInDays(((rand() * 20) | 0));
        u.stripeCustomerId = `cus_${Math.random().toString(36).slice(2, 16)}`;
      } else if (plan === "Past Due") {
        u.lastPaymentFailedIso = isoDaysAgo(((rand() * 8) | 0) + 1);
        u.accessUntilIso = dateInDays(((rand() * 6) | 0) + 1);
        u.stripeCustomerId = `cus_${Math.random().toString(36).slice(2, 16)}`;
      }
      arr.push(u);
    }
  }
  // Insert the admins themselves at the front
  arr.unshift({
    id: "usr_admin_1",
    email: "admin@actos.app",
    plan: "Pro",
    status: "Active",
    signupIso: isoDaysAgo(180),
    lastActiveIso: isoDaysAgo(0),
    goals: 5, projects: 12, actionsDone: 412, sessions: 88, daysActive: 120, rituals: 3,
    proStartedIso: isoDaysAgo(170),
    renewsIso: dateInDays(15),
    stripeCustomerId: "cus_admin_founder",
    daysPlanned: 100, daysTotal: 120, avgActionsPerDay: 3.4, avgSessionMin: 35, ritualConsistencyPct: 82,
    activeGoals: pickActiveGoals(), recent: recentEvents(),
  });
  return arr;
}

export const ADMIN_USERS: AdminUser[] = gen();

// ===== Feedback =====
export type FeedbackStatus = "New" | "Triaged" | "Resolved" | "Closed";
export interface Feedback {
  id: string;
  userEmail: string;
  userId: string;
  plan: Plan;
  status: FeedbackStatus;
  submittedIso: string;
  page: string;
  browser: string;
  os: string;
  message: string;
  attachments?: string[];
  internalNotes?: { iso: string; admin: string; text: string }[];
}

const FEEDBACK_BODIES = [
  "When I close a project the time investment chart doesn't update until I refresh. Browser: Chrome 124, macOS 14.4. Steps: 1) close project from /projects, 2) navigate to /progress, 3) chart still shows old totals.",
  "Love the rituals feature. Suggestion: add a way to mark a ritual day as 'skipped' rather than 'missed' — sometimes I genuinely don't need to do it (rest day).",
  "Plan today modal pops up every visit if I dismiss without planning. Should remember dismissal for the day.",
  "The Pomodoro session timer drifts about 2-3 seconds per cycle on my machine. Not a huge deal but cumulative over a long day.",
  "I'd pay more for a way to share a goal with an accountability partner. Would unlock big use case for me.",
  "Action editor crashes when I paste a very long markdown block. Console error: 'Maximum update depth exceeded'.",
  "Suggestion: allow exporting reviews as Markdown — I journal in Obsidian and copy them over manually now.",
  "On Safari, the sidebar collapse animation flickers. Chrome is fine.",
  "Quick win: keyboard shortcut to mark current action as done in active session. Mouse-only is slow.",
  "Trial ended last night and the 'view in Stripe' link goes to a 404 — wanted to upgrade and couldn't find the page.",
  "Just wanted to say thanks. Have been using ActOS daily for 3 weeks and finally finishing things again.",
  "Mobile (iPhone 14, iOS 17.4) — bottom sheet for new action covers the time field at the bottom; can't tap it.",
];

export const FEEDBACK: Feedback[] = (() => {
  const statuses: FeedbackStatus[] = ["New","New","New","New","Triaged","Triaged","Triaged","Resolved","Resolved","Resolved","Closed","Closed"];
  return FEEDBACK_BODIES.map((m, i) => {
    const u = ADMIN_USERS[(i * 3 + 5) % ADMIN_USERS.length];
    const ages = [0,0,1,2,3,4,5,7,9,12,15,22];
    const browsers = ["Chrome 124","Safari 17.4","Firefox 125","Edge 124","Chrome 123"];
    const oss = ["macOS 14.4","Windows 11","iOS 17.4","Ubuntu 22.04","macOS 14.3"];
    const pages = ["/today","/progress","/sessions/active","/actions","/goals/g_1","/projects/p_3","/reviews/days/2026-05-04"];
    return {
      id: `fb_${100 + i}`,
      userEmail: u.email,
      userId: u.id,
      plan: u.plan,
      status: statuses[i % statuses.length],
      submittedIso: isoDaysAgo(ages[i % ages.length]),
      page: pages[i % pages.length],
      browser: browsers[i % browsers.length],
      os: oss[i % oss.length],
      message: m,
      internalNotes: i % 4 === 0 ? [{ iso: isoDaysAgo(ages[i % ages.length] - 0.1), admin: "colleague@actos.app", text: "Reproduced. Filing as P2." }] : undefined,
    };
  });
})();

// ===== Audit Log =====
export interface AuditEntry {
  id: string;
  iso: string;
  admin: string;
  type: "Impersonation" | "Account" | "Subscription" | "Feedback" | "Other";
  action: string;
  targetUserEmail?: string;
  targetUserId?: string;
  reason?: string;
}

export const AUDIT_LOG: AuditEntry[] = (() => {
  const out: AuditEntry[] = [];
  const admins = ADMIN_EMAILS;
  const samples: { type: AuditEntry["type"]; build: (u: AdminUser) => string; reason?: boolean }[] = [
    { type: "Impersonation", build: u => `Viewed account of ${u.email}`, reason: true },
    { type: "Subscription", build: u => `Comped Pro for 30 days for ${u.email}` },
    { type: "Subscription", build: u => `Extended trial by 7 days for ${u.email}` },
    { type: "Account", build: u => `Suspended user ${u.email}` },
    { type: "Account", build: u => `Restored user ${u.email}` },
    { type: "Feedback", build: u => `Marked feedback from ${u.email} as Resolved` },
    { type: "Account", build: u => `Sent password reset to ${u.email}` },
    { type: "Other", build: u => `Exported account data for ${u.email}` },
  ];
  for (let i = 0; i < 42; i++) {
    const u = ADMIN_USERS[(i * 7 + 3) % ADMIN_USERS.length];
    const s = samples[i % samples.length];
    const admin = admins[i % 2];
    const d = new Date();
    d.setHours(d.getHours() - i * 4 - ((i * 13) % 7));
    out.push({
      id: `aud_${i}`,
      iso: d.toISOString(),
      admin,
      type: s.type,
      action: s.build(u),
      targetUserEmail: u.email,
      targetUserId: u.id,
      reason: s.reason ? ["missing actions report","support ticket #482","user reported data loss","billing inquiry"][(i*3) % 4] : undefined,
    });
  }
  return out;
})();

// ===== Announcements =====
export type AnnouncementSeverity = "info" | "warning" | "critical";
export type AnnouncementStatus = "draft" | "scheduled" | "active" | "ended";
export type AnnouncementAudience = "all" | "paid" | "free" | "trial";
export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  startIso: string;
  endIso: string;
  severity: AnnouncementSeverity;
  status: AnnouncementStatus;
  createdBy: string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  { id: "an_1", title: "New: Time Investment per project", body: "We just shipped per-project breakdowns under each goal on /progress.", audience: "all", startIso: isoDaysAgo(2), endIso: dateInDays(5), severity: "info", status: "active", createdBy: "admin@actos.app" },
  { id: "an_2", title: "Scheduled maintenance May 12", body: "Brief downtime ~5min around 02:00 UTC.", audience: "all", startIso: dateInDays(3), endIso: dateInDays(4), severity: "warning", status: "scheduled", createdBy: "colleague@actos.app" },
  { id: "an_3", title: "Pro pricing change", body: "Pro moves to $12/mo for new signups starting June 1. Existing Pro users grandfathered.", audience: "free", startIso: dateInDays(10), endIso: dateInDays(40), severity: "info", status: "scheduled", createdBy: "admin@actos.app" },
  { id: "an_4", title: "Trial extended to 14 days", body: "Heads up: trials are now 14 days (was 7).", audience: "trial", startIso: isoDaysAgo(40), endIso: isoDaysAgo(15), severity: "info", status: "ended", createdBy: "admin@actos.app" },
  { id: "an_5", title: "Resolved: chart sync issue", body: "Time Investment now updates immediately on close.", audience: "all", startIso: isoDaysAgo(20), endIso: isoDaysAgo(10), severity: "info", status: "ended", createdBy: "admin@actos.app" },
  { id: "an_6", title: "Past-due flow improvements", body: "Better in-app prompts before card declines lock access.", audience: "paid", startIso: isoDaysAgo(35), endIso: isoDaysAgo(25), severity: "warning", status: "ended", createdBy: "colleague@actos.app" },
  { id: "an_7", title: "Welcome to ActOS Beta", body: "We're glad you're here. Your feedback shapes the next release.", audience: "all", startIso: isoDaysAgo(60), endIso: isoDaysAgo(50), severity: "info", status: "ended", createdBy: "admin@actos.app" },
  { id: "an_8", title: "Critical: data sync hotfix", body: "Hotfix deployed; please refresh.", audience: "all", startIso: isoDaysAgo(70), endIso: isoDaysAgo(69), severity: "critical", status: "ended", createdBy: "admin@actos.app" },
];

// ===== Dashboard metrics =====
export const DASHBOARD = {
  users: { total: 1247, today: 89, last7: 384, last30: 712 },
  signups: { today: 12, last7: 67, last30: 245, lifetime: 1247 },
  engagement: { goals: 3421, projectsClosed: 892, actionsDone: 18403, sessions: 2156 },
  revenue: { mrr: 1053, activePaid: 117, trial: 23, churn30: 8 },
  billing: {
    mrrDeltaPct: 8,
    activePaidDeltaPct: 4,
    trialToPaidPct: 34,
    churnRatePct: 6.4,
    newPaid7: 5,
    newPaid30: 18,
  },
};

// ===== Helpers =====
export function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
export function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${d.toTimeString().slice(0,5)}`;
}
export function fmtAgo(iso?: string) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  return `${mo}mo ago`;
}
export function daysBetween(aIso?: string, bIso?: string) {
  if (!aIso || !bIso) return 0;
  return Math.round((new Date(aIso).getTime() - new Date(bIso).getTime()) / 86400000);
}
export function daysFromNow(iso?: string) {
  if (!iso) return 0;
  return Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
}
