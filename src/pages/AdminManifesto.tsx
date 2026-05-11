// /admin/manifesto — founder-only WYSIWYG editor for the manifesto essay.
// Mock storage via LocalStorage; Supabase swap later (see manifestoStorage.ts).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Pilcrow,
  Quote,
  List,
  Minus,
  Link as LinkIcon,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getInitialManifestoContent,
  readManifesto,
  writeManifesto,
  type ManifestoContent,
} from "@/lib/manifestoStorage";

const LOCALES = ["en", "ru", "de", "es"] as const;
type Locale = (typeof LOCALES)[number];

// ────────────────────────────────────────────────────────────────────────────
// Toolbar
// ────────────────────────────────────────────────────────────────────────────

const ToolBtn: React.FC<{
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    style={{
      width: 32,
      height: 32,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 4,
      border: "none",
      cursor: "pointer",
      background: active ? "hsl(var(--goal-2) / 0.15)" : "transparent",
      color: active ? "hsl(var(--goal-2))" : "hsl(var(--text-secondary))",
      transition: "background-color 120ms ease, color 120ms ease",
    }}
    onMouseEnter={(e) => {
      if (active) return;
      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
      (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--text-primary))";
    }}
    onMouseLeave={(e) => {
      if (active) return;
      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--text-secondary))";
    }}
  >
    {children}
  </button>
);

const Sep: React.FC = () => (
  <span
    aria-hidden
    style={{
      display: "inline-block",
      width: 1,
      height: 16,
      background: "hsl(var(--border-subtle))",
      margin: "0 8px",
      flexShrink: 0,
    }}
  />
);

const Toolbar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  if (!editor) return null;
  const promptLink = () => {
    const prev = (editor.getAttributes("link").href as string | undefined) ?? "";
    const url = window.prompt("URL (leave empty to remove)", prev);
    if (url === null) return;
    if (url.trim() === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 5,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "8px",
        background: "hsl(var(--surface-raised))",
        borderBottom: "1px solid hsl(var(--border-subtle))",
        flexWrap: "wrap",
      }}
    >
      <ToolBtn title="Bold (⌘B)" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
        <Bold size={16} />
      </ToolBtn>
      <ToolBtn title="Italic (⌘I)" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
        <Italic size={16} />
      </ToolBtn>
      <Sep />
      <ToolBtn
        title="Title (H1)"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
      >
        <Heading1 size={16} />
      </ToolBtn>
      <ToolBtn
        title="Section (H2)"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
      >
        <Heading2 size={16} />
      </ToolBtn>
      <ToolBtn title="Paragraph" onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")}>
        <Pilcrow size={16} />
      </ToolBtn>
      <Sep />
      <ToolBtn title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
        <Quote size={16} />
      </ToolBtn>
      <ToolBtn title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
        <List size={16} />
      </ToolBtn>
      <ToolBtn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={16} />
      </ToolBtn>
      <Sep />
      <ToolBtn title="Link (⌘K)" onClick={promptLink} active={editor.isActive("link")}>
        <LinkIcon size={16} />
      </ToolBtn>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

const Logo: React.FC = () => (
  <Link to="/today" aria-label="ActOS" style={{ textDecoration: "none" }}>
    <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, fontSize: 22, letterSpacing: "-0.02em" }}>
      <span style={{ color: "hsl(var(--text-primary))" }}>Act</span>
      <span style={{ color: "hsl(var(--goal-2))" }}>OS</span>
    </span>
  </Link>
);

function loadForLocale(locale: Locale): { content: ManifestoContent; fromStorage: boolean } {
  const stored = readManifesto(locale);
  if (stored) return { content: stored, fromStorage: true };
  return { content: getInitialManifestoContent(locale), fromStorage: false };
}

function fmtAgo(iso?: string): string {
  if (!iso) return "Never saved";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Saved just now";
  if (m < 60) return `Last saved: ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Last saved: ${h}h ago`;
  const d = Math.floor(h / 24);
  return `Last saved: ${d}d ago`;
}

const AdminManifesto: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const [locale, setLocale] = useState<Locale>("en");
  const [title, setTitle] = useState("");
  const [deck, setDeck] = useState("");
  const [savedAt, setSavedAt] = useState<string | undefined>(undefined);
  const [dirty, setDirty] = useState(false);
  // Used to ignore onUpdate emissions while we programmatically swap content.
  const swapping = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      LinkExt.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noreferrer", target: "_blank" } }),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "manifesto-editor focus:outline-none",
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          const prev = (editor?.getAttributes("link").href as string | undefined) ?? "";
          const url = window.prompt("URL (leave empty to remove)", prev);
          if (url === null) return true;
          if (url.trim() === "") editor?.chain().focus().unsetLink().run();
          else editor?.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
          return true;
        }
        return false;
      },
    },
    onUpdate: () => {
      if (swapping.current) return;
      setDirty(true);
    },
  });

  // Load content for the current locale
  const loadInto = useCallback(
    (loc: Locale) => {
      const { content } = loadForLocale(loc);
      setTitle(content.title);
      setDeck(content.deck);
      setSavedAt(content.savedAt);
      setDirty(false);
      if (editor) {
        swapping.current = true;
        editor.commands.setContent(content.body || "<p></p>", { emitUpdate: false });
        // Next tick — clear flag.
        setTimeout(() => {
          swapping.current = false;
        }, 0);
      }
    },
    [editor],
  );

  // Initial load + reload whenever editor instance arrives
  useEffect(() => {
    if (!editor) return;
    loadInto(locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const onSave = useCallback(() => {
    if (!editor) return;
    const next = writeManifesto(locale, {
      title: title.trim() || "Untitled",
      deck: deck.trim(),
      body: editor.getHTML(),
    });
    setSavedAt(next.savedAt);
    setDirty(false);
  }, [editor, locale, title, deck]);

  const switchLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      if (dirty) {
        const choice = window.confirm(
          `You have unsaved changes in ${locale.toUpperCase()}.\n\nOK = Save and switch, Cancel = Discard and switch.`,
        );
        if (choice) onSave();
      }
      setLocale(next);
      // loadInto runs in effect below
    },
    [locale, dirty, onSave],
  );

  // When locale changes (after dirty handled), reload editor content.
  useEffect(() => {
    if (!editor) return;
    loadInto(locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const onCancel = useCallback(() => {
    if (dirty) {
      const ok = window.confirm("Discard unsaved changes?");
      if (!ok) return;
    }
    navigate("/today");
  }, [dirty, navigate]);

  // Re-render the timestamp every minute so "2m ago" stays fresh.
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Track changes to title/deck as dirty too
  const onTitleChange = (v: string) => {
    setTitle(v);
    if (!swapping.current) setDirty(true);
  };
  const onDeckChange = (v: string) => {
    setDeck(v);
    if (!swapping.current) setDirty(true);
  };

  // Live preview HTML — reflects current unsaved editor state.
  const previewBody = editor?.getHTML() ?? "";

  // Warn before unload with unsaved changes
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  if (isMobile) {
    return (
      <div data-theme="dark" style={{ minHeight: "100vh", background: "hsl(var(--surface-base))", color: "hsl(var(--text-primary))", fontFamily: "Inter, system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Desktop only</h1>
          <p style={{ marginTop: 12, color: "hsl(var(--text-secondary))", fontSize: 15, lineHeight: 1.5 }}>
            Manifesto editor is desktop-only. Open this on a larger screen.
          </p>
          <Link to="/today" style={{ display: "inline-block", marginTop: 24, color: "hsl(var(--goal-2))", textDecoration: "underline" }}>
            Back to ActOS
          </Link>
        </div>
      </div>
    );
  }

  const status = dirty ? "Unsaved changes" : fmtAgo(savedAt);
  const statusColor = dirty ? "hsl(var(--goal-2))" : "hsl(var(--text-tertiary))";

  return (
    <div
      data-theme="dark"
      style={{
        minHeight: "100vh",
        background: "hsl(var(--surface-base))",
        color: "hsl(var(--text-primary))",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: "hsl(var(--surface-base))",
          borderBottom: "1px solid hsl(var(--border-subtle))",
        }}
      >
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              color: "hsl(var(--text-secondary))",
              padding: 0,
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--text-primary))")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--text-secondary))")}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty}
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 6,
              border: "none",
              cursor: dirty ? "pointer" : "not-allowed",
              fontSize: 14,
              fontWeight: 500,
              background: dirty ? "hsl(var(--goal-2))" : "hsl(var(--surface-raised))",
              color: dirty ? "hsl(var(--surface-base))" : "hsl(var(--text-tertiary))",
              opacity: dirty ? 1 : 0.6,
              transition: "filter 120ms ease",
            }}
          >
            Save
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div
        style={{
          height: 48,
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: "1px solid hsl(var(--border-subtle))",
        }}
      >
        <div style={{ display: "flex", alignItems: "stretch" }}>
          {LOCALES.map((l) => {
            const active = l === locale;
            return (
              <button
                key={l}
                type="button"
                onClick={() => switchLocale(l)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: active ? "2px solid hsl(var(--goal-2))" : "2px solid transparent",
                  marginBottom: -1,
                  padding: "0 16px",
                  fontSize: 14,
                  fontWeight: active ? 500 : 400,
                  color: active ? "hsl(var(--text-primary))" : "hsl(var(--text-tertiary))",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {l}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 13, color: statusColor }}>{status}</div>
      </div>

      {/* Split */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1px 1fr", minHeight: 0 }}>
        {/* Left: editor */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" }}>
          <Toolbar editor={editor} />
          <div style={{ flex: 1, padding: "24px 32px" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Title"
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 40,
                  fontWeight: 500,
                  color: "hsl(var(--text-primary))",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                  padding: "8px 0",
                  fontFamily: "inherit",
                }}
              />
              <input
                type="text"
                value={deck}
                onChange={(e) => onDeckChange(e.target.value)}
                placeholder="Subtitle / deck"
                style={{
                  marginTop: 8,
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid transparent",
                  outline: "none",
                  fontSize: 18,
                  color: "hsl(var(--text-secondary))",
                  padding: "8px 0",
                  fontFamily: "inherit",
                  transition: "border-color 120ms ease",
                }}
                onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderBottomColor = "hsl(var(--border-subtle))")}
                onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderBottomColor = "transparent")}
              />
              <div style={{ marginTop: 24 }}>
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>

        <div aria-hidden style={{ background: "hsl(var(--border-subtle))" }} />

        {/* Right: preview */}
        <div style={{ overflow: "auto", padding: "64px 32px" }}>
          <article style={{ maxWidth: 720, margin: "0 auto" }} className="manifesto-preview">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                aria-hidden
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "hsl(var(--surface-raised))",
                  border: "1px solid hsl(var(--border-subtle))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "hsl(var(--text-primary))",
                  fontSize: 18,
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                SV
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 500 }}>Stanislav Vasilevschii</span>
                <span style={{ fontSize: 14, color: "hsl(var(--text-tertiary))" }}>{t("manifesto.byline.role")}</span>
              </div>
            </div>
            <h1 style={{ marginTop: 48, fontSize: 56, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              {title || "Untitled"}
            </h1>
            {deck && (
              <p style={{ marginTop: 24, fontSize: 24, color: "hsl(var(--text-secondary))", lineHeight: 1.4 }}>{deck}</p>
            )}
            <div className="manifesto-body has-dropcap-first" style={{ marginTop: 64 }} dangerouslySetInnerHTML={{ __html: previewBody }} />
          </article>
        </div>
      </div>

      <style>{`
        .manifesto-editor {
          color: hsl(var(--text-primary));
          font-size: 19px;
          line-height: 1.7;
          letter-spacing: 0.005em;
          min-height: 400px;
        }
        .manifesto-editor p { margin: 0 0 28px; }
        .manifesto-editor h1 {
          font-size: 56px; font-weight: 500; letter-spacing: -0.02em;
          line-height: 1.1; margin: 32px 0 24px;
        }
        .manifesto-editor h2 {
          font-size: 28px; font-weight: 500; letter-spacing: -0.01em;
          line-height: 1.2; margin: 64px 0 24px;
        }
        .manifesto-editor strong { font-weight: 600; }
        .manifesto-editor em { font-style: italic; }
        .manifesto-editor blockquote {
          border-left: 3px solid hsl(var(--goal-2));
          padding-left: 24px;
          margin: 48px 0;
          font-size: 26px;
          line-height: 1.4;
        }
        .manifesto-editor ul { padding-left: 24px; margin: 0 0 28px; }
        .manifesto-editor ul li { margin-bottom: 12px; }
        .manifesto-editor hr {
          width: 80px; height: 1px; border: none;
          background: hsl(var(--border-subtle)); margin: 64px auto;
        }
        .manifesto-editor a { color: hsl(var(--goal-2)); text-decoration: underline; }
        .manifesto-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--text-tertiary));
          pointer-events: none;
          height: 0;
        }

        .manifesto-preview .manifesto-body p {
          font-size: 19px; line-height: 1.7; letter-spacing: 0.005em;
          color: hsl(var(--text-primary)); margin: 0 0 28px; font-weight: 400;
        }
        .manifesto-preview .manifesto-body h2 {
          font-size: 28px; font-weight: 500; margin: 64px 0 24px;
          letter-spacing: -0.01em; line-height: 1.2;
        }
        .manifesto-preview .manifesto-body strong { font-weight: 600; }
        .manifesto-preview .manifesto-body em { font-style: italic; }
        .manifesto-preview .manifesto-body blockquote {
          font-size: 26px; line-height: 1.4;
          border-left: 3px solid hsl(var(--goal-2));
          padding-left: 24px; margin: 48px 0;
        }
        .manifesto-preview .manifesto-body ul { padding-left: 24px; margin: 0 0 28px; }
        .manifesto-preview .manifesto-body ul li {
          font-size: 19px; line-height: 1.7; margin-bottom: 12px;
        }
        .manifesto-preview .manifesto-body hr {
          width: 80px; height: 1px; border: none;
          background: hsl(var(--border-subtle)); margin: 64px auto;
        }
        .manifesto-preview .has-dropcap-first > p:first-of-type::first-letter {
          font-size: 64px; font-weight: 500; float: left;
          line-height: 0.9; margin: 4px 6px 0 0;
          color: hsl(var(--text-primary));
        }
      `}</style>
    </div>
  );
};

export default AdminManifesto;
