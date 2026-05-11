// Mock CMS storage for the manifesto. LocalStorage now; Supabase later.
// Single point of swap — the editor + public manifesto only touch these helpers.
import i18n from "@/i18n";

export interface ManifestoContent {
  title: string;
  deck: string;
  body: string; // serialized HTML (TipTap getHTML())
  savedAt?: string;
}

const KEY = (locale: string) => `actos.cms.manifesto.${locale}`;

export function readManifesto(locale: string): ManifestoContent | null {
  try {
    const raw = localStorage.getItem(KEY(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ManifestoContent;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeManifesto(locale: string, content: Omit<ManifestoContent, "savedAt">): ManifestoContent {
  const next: ManifestoContent = { ...content, savedAt: new Date().toISOString() };
  localStorage.setItem(KEY(locale), JSON.stringify(next));
  window.dispatchEvent(new Event("actos-manifesto-change"));
  return next;
}

// Inline markdown -> HTML, preserving the **bold** / *italic* used in the
// existing translation strings. Escapes HTML special chars first.
function md(s: string): string {
  let out = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out;
}

// Build the initial editable content from i18n keys. Used as the seed when
// the founder opens the editor for the first time in a given locale.
export function getInitialManifestoContent(locale: string): ManifestoContent {
  const T = i18n.getFixedT(locale);
  const p = (k: string) => `<p>${md(T(k) as string)}</p>`;
  const h2 = (k: string) => `<h2>${md(T(k) as string)}</h2>`;

  const parts: string[] = [];
  parts.push(p("manifesto.p1"), p("manifesto.p2"), p("manifesto.p3"));
  parts.push(h2("manifesto.h2_1"));
  parts.push(p("manifesto.p4"), p("manifesto.p5"), p("manifesto.p6"), p("manifesto.p7"));
  parts.push(`<blockquote><p>${md(T("manifesto.pullquote") as string)}</p></blockquote>`);
  parts.push(h2("manifesto.h2_2"));
  parts.push(p("manifesto.p8"), p("manifesto.p9"), p("manifesto.p10"), p("manifesto.p11"));
  parts.push(h2("manifesto.h2_3"));
  parts.push(p("manifesto.p12"), p("manifesto.p13"));
  parts.push(
    `<ul>${["manifesto.li1", "manifesto.li2", "manifesto.li3", "manifesto.li4"]
      .map((k) => `<li>${md(T(k) as string)}</li>`)
      .join("")}</ul>`,
  );
  parts.push(p("manifesto.p14"), p("manifesto.p15"));
  parts.push(h2("manifesto.h2_4"));
  parts.push(p("manifesto.p16"), p("manifesto.p17"), p("manifesto.p18"), p("manifesto.p19"));
  parts.push(h2("manifesto.h2_5"));
  parts.push(p("manifesto.p20"), p("manifesto.p21"), p("manifesto.p22"));

  return {
    title: T("manifesto.title") as string,
    deck: T("manifesto.deck") as string,
    body: parts.join(""),
  };
}
