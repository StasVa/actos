import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Paperclip,
  Pencil,
  Plus,
  Check,
  RotateCw,
} from "lucide-react";

type SaveState = "idle" | "editing" | "saving" | "saved" | "error";

type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
};

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  attachments?: Attachment[];
  onAttachmentsChange?: (next: Attachment[]) => void;
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileEmojiIcon(mime: string): string {
  if (mime.startsWith("image/")) return "IMG";
  if (mime.startsWith("video/")) return "VID";
  if (mime.startsWith("audio/")) return "AUD";
  if (mime === "application/pdf") return "PDF";
  if (mime.includes("word") || mime.includes("officedocument")) return "DOC";
  return "FILE";
}

function isHtmlEmpty(html: string): boolean {
  if (!html) return true;
  const stripped = html
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, "")
    .trim();
  return stripped.length === 0;
}

const ToolbarBtn: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className={`h-7 w-7 inline-flex items-center justify-center rounded-[4px] transition-colors ${
      active
        ? "text-accent bg-surface-hover"
        : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
    }`}
  >
    {children}
  </button>
);

const Divider = () => (
  <span className="mx-1 h-4 w-px bg-border-subtle shrink-0" />
);

export const RichTextEditor: React.FC<Props> = ({
  value,
  onChange,
  placeholder,
  attachments = [],
  onAttachmentsChange,
}) => {
  const { t } = useTranslation();
  const placeholderText = placeholder ?? t("richTextEditor.placeholder");
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [hovered, setHovered] = useState(false);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const idleTimer = useRef<number | null>(null);
  const savedTimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const empty = isHtmlEmpty(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noreferrer", target: "_blank" },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editable: mode === "edit",
    editorProps: {
      attributes: {
        class:
          "tiptap-editor focus:outline-none min-h-[120px] text-[14px] text-text-primary leading-[1.6]",
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              embedImage(file);
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (imgs.length === 0) return false;
        event.preventDefault();
        imgs.forEach(embedImage);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange(html);
      setSaveState("editing");
      scheduleAutoSave();
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  // Toggle editable based on mode
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(mode === "edit");
  }, [editor, mode]);

  const flushSave = useCallback(() => {
    if (idleTimer.current) {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    setSaveState("saving");
    window.setTimeout(() => {
      try {
        setSaveState("saved");
        if (savedTimer.current) window.clearTimeout(savedTimer.current);
        savedTimer.current = window.setTimeout(() => setSaveState("idle"), 1500);
      } catch {
        setSaveState("error");
      }
    }, 200);
  }, []);

  function scheduleAutoSave() {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      flushSave();
    }, 3000);
  }

  const exitEdit = useCallback(() => {
    flushSave();
    setMode("read");
  }, [flushSave]);

  // Click outside → exit edit mode
  useEffect(() => {
    if (mode !== "edit") return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        exitEdit();
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [mode, exitEdit]);

  // Esc → exit edit
  useEffect(() => {
    if (mode !== "edit") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        exitEdit();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (editor?.state.selection && !editor.state.selection.empty) {
          e.preventDefault();
          openLinkPopover();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, exitEdit, editor]);

  function embedImage(file: File) {
    if (!editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      editor.chain().focus().setImage({ src: url }).run();
    };
    reader.readAsDataURL(file);
  }

  function addAttachment(file: File) {
    if (!onAttachmentsChange) return;
    const meta: Attachment = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
    };
    if (file.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        meta.dataUrl = reader.result as string;
        onAttachmentsChange([...attachments, meta]);
      };
      reader.readAsDataURL(file);
    } else {
      onAttachmentsChange([...attachments, meta]);
    }
  }

  function openLinkPopover() {
    if (!editor) return;
    const prev = (editor.getAttributes("link").href as string | undefined) ?? "";
    setLinkUrl(prev);
    setLinkPopoverOpen(true);
    setTimeout(() => linkInputRef.current?.focus(), 10);
  }

  function commitLink() {
    if (!editor) return;
    const url = linkUrl.trim();
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkPopoverOpen(false);
  }

  function enterEditMode() {
    setMode("edit");
    setTimeout(() => {
      editor?.commands.focus("end");
    }, 0);
  }

  // ============ RENDER ============

  // READ MODE — empty state
  if (mode === "read" && empty) {
    return (
      <div
        ref={containerRef}
        onClick={enterEditMode}
        className="group relative cursor-text rounded-[4px] border border-dashed border-border-default px-6 py-6 transition-colors hover:border-accent"
      >
        <div className="flex items-center justify-center gap-2 text-text-tertiary group-hover:text-text-secondary transition-colors">
          <Plus size={16} />
          <span className="text-[14px]">{placeholder}</span>
        </div>
      </div>
    );
  }

  // READ MODE — with content
  if (mode === "read") {
    return (
      <div
        ref={containerRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={enterEditMode}
        className={`group relative cursor-text rounded-[4px] py-4 transition-[outline] outline outline-1 ${
          hovered ? "outline-border-subtle" : "outline-transparent"
        }`}
        style={{ background: "hsl(var(--surface-base))" }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            enterEditMode();
          }}
          className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-[4px] border border-border-subtle bg-surface-elevated px-2.5 py-1 text-[12px] text-text-secondary opacity-0 transition-opacity hover:text-text-primary hover:border-border-default group-hover:opacity-100 md:group-hover:opacity-100 max-md:opacity-100"
        >
          <Pencil size={12} />
          Edit
        </button>
        <div
          className="tiptap-editor text-[14px] text-text-primary leading-[1.6]"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      </div>
    );
  }

  // EDIT MODE
  if (!editor) return null;

  const renderSaveStatus = () => {
    if (saveState === "editing")
      return (
        <span className="font-mono text-[11px] text-text-tertiary animate-pulse">
          Editing...
        </span>
      );
    if (saveState === "saving")
      return (
        <span className="font-mono text-[11px] text-text-tertiary">Saving...</span>
      );
    if (saveState === "saved")
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-state-active">
          <Check size={12} /> Saved
        </span>
      );
    if (saveState === "error")
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-text-warning">
          Save failed
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              flushSave();
            }}
            className="hover:text-text-primary"
            title="Retry"
          >
            <RotateCw size={12} />
          </button>
        </span>
      );
    return null;
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-[4px] border border-border-subtle bg-surface-raised overflow-visible"
    >
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center gap-1 flex-wrap bg-surface-elevated border-b border-border-subtle px-2 py-1.5 rounded-t-[4px] min-h-[40px]">
        {/* Group 1: text formatting */}
        <ToolbarBtn
          title="Bold (⌘B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic (⌘I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline (⌘U)"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          <UnderlineIcon size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
        >
          <Strikethrough size={16} />
        </ToolbarBtn>

        <Divider />

        {/* Group 2: headings */}
        <ToolbarBtn
          title="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 size={16} />
        </ToolbarBtn>

        <Divider />

        {/* Group 3: lists & quotes */}
        <ToolbarBtn
          title="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <Quote size={16} />
        </ToolbarBtn>

        <Divider />

        {/* Group 4: insertions */}
        <div className="relative">
          <ToolbarBtn
            title="Link (⌘K)"
            onClick={openLinkPopover}
            active={editor.isActive("link")}
          >
            <LinkIcon size={16} />
          </ToolbarBtn>
          {linkPopoverOpen && (
            <div
              className="absolute top-full left-0 mt-1 z-20 w-[280px] rounded-[4px] border border-border-default bg-surface-elevated p-2 shadow-lg"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <input
                  ref={linkInputRef}
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitLink();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setLinkPopoverOpen(false);
                    }
                  }}
                  placeholder="Paste link..."
                  className="flex-1 bg-surface-base border border-border-subtle rounded-[3px] px-2 py-1 text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="mt-2 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setLinkPopoverOpen(false);
                  }}
                  className="px-2 py-1 text-[12px] text-text-secondary hover:text-text-primary rounded-[3px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commitLink();
                  }}
                  className="px-3 py-1 text-[12px] font-medium bg-accent text-white rounded-[3px] hover:bg-accent-hover"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
        <ToolbarBtn
          title="Insert image"
          onClick={() => imageInputRef.current?.click()}
        >
          <ImageIcon size={16} />
        </ToolbarBtn>
        {onAttachmentsChange && (
          <ToolbarBtn
            title="Attach file"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={16} />
          </ToolbarBtn>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Group 5: status & done */}
        <div className="flex items-center gap-2">
          {renderSaveStatus()}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exitEdit();
            }}
            className="inline-flex items-center gap-1 px-3 py-1 text-[12px] font-medium text-text-primary bg-surface-hover hover:bg-surface-base border border-border-subtle hover:border-border-default rounded-[4px] transition-colors"
          >
            <Check size={12} />
            Done
          </button>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) embedImage(f);
            e.target.value = "";
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,image/*,video/mp4,video/quicktime,audio/mpeg,audio/wav"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) addAttachment(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* Editor content */}
      <div className="p-4">
        <EditorContent editor={editor} />

        {attachments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border-subtle flex flex-col gap-1.5">
            {attachments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-[4px] bg-surface-base hover:bg-surface-hover transition-colors"
              >
                <span className="font-mono text-[10px] text-text-tertiary shrink-0 w-8">
                  {fileEmojiIcon(a.type)}
                </span>
                {a.dataUrl ? (
                  <a
                    href={a.dataUrl}
                    download={a.name}
                    className="text-[13px] text-text-primary hover:text-accent truncate"
                  >
                    {a.name}
                  </a>
                ) : (
                  <span className="text-[13px] text-text-primary truncate">
                    {a.name}
                  </span>
                )}
                <span className="font-mono text-[11px] text-text-tertiary shrink-0">
                  {fmtBytes(a.size)}
                </span>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() =>
                    onAttachmentsChange?.(attachments.filter((x) => x.id !== a.id))
                  }
                  className="text-[11px] text-text-tertiary hover:text-text-primary px-1"
                  title="Remove attachment"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
