import React, { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

type SaveState = "idle" | "saving" | "saved";

type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
};

interface Props {
  /** TipTap-compatible HTML string */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  attachments?: Attachment[];
  onAttachmentsChange?: (next: Attachment[]) => void;
}

const ToolbarBtn: React.FC<{
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
    className={`px-2 py-1 text-[12px] rounded-[2px] transition-colors ${
      active
        ? "bg-accent text-white"
        : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
    }`}
  >
    {children}
  </button>
);

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mime: string): string {
  if (mime.startsWith("image/")) return "🖼";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("audio/")) return "🎵";
  if (mime === "application/pdf") return "📄";
  if (mime.includes("word") || mime.includes("officedocument")) return "📝";
  return "📎";
}

export const RichTextEditor: React.FC<Props> = ({
  value,
  onChange,
  placeholder = "Describe the project, add references, materials...",
  attachments = [],
  onAttachmentsChange,
}) => {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const idleTimer = useRef<number | null>(null);
  const savedTimer = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
      scheduleAutoSave();
    },
    onBlur: () => {
      flushSave();
    },
  });

  // Sync external value changes (e.g., switching projects)
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  function scheduleAutoSave() {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      flushSave();
    }, 3000);
  }

  function flushSave() {
    if (idleTimer.current) {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    setSaveState("saving");
    // The actual save is already happening in onChange; this is just a UX flag.
    window.setTimeout(() => {
      setSaveState("saved");
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
      savedTimer.current = window.setTimeout(() => setSaveState("idle"), 1500);
    }, 200);
  }

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

  function removeAttachment(id: string) {
    if (!onAttachmentsChange) return;
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
  }

  function promptLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  if (!editor) return null;

  return (
    <div className="relative bg-surface-base border border-border-subtle rounded-[6px] p-4 focus-within:border-border-default transition-colors">
      {/* Save indicator */}
      <div className="absolute top-2 right-3 font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary pointer-events-none">
        {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : ""}
      </div>

      {/* Top toolbar (always visible, compact) */}
      <div className="flex flex-wrap items-center gap-1 mb-3 pb-2 border-b border-border-subtle">
        <ToolbarBtn
          title="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          H3
        </ToolbarBtn>
        <span className="w-px h-4 bg-border-subtle mx-1" />
        <ToolbarBtn
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <span className="font-bold">B</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <span className="italic">I</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          <span className="underline">U</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Inline code"
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
        >
          <span className="font-mono">{"<>"}</span>
        </ToolbarBtn>
        <ToolbarBtn title="Link" onClick={promptLink} active={editor.isActive("link")}>
          ↗
        </ToolbarBtn>
        <span className="w-px h-4 bg-border-subtle mx-1" />
        <ToolbarBtn
          title="Bulleted list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          •
        </ToolbarBtn>
        <ToolbarBtn
          title="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          1.
        </ToolbarBtn>
        <ToolbarBtn
          title="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          ❝
        </ToolbarBtn>
        <span className="w-px h-4 bg-border-subtle mx-1" />
        <ToolbarBtn
          title="Insert image"
          onClick={() => imageInputRef.current?.click()}
        >
          🖼
        </ToolbarBtn>
        {onAttachmentsChange && (
          <ToolbarBtn
            title="Attach file"
            onClick={() => fileInputRef.current?.click()}
          >
            📎
          </ToolbarBtn>
        )}
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

      {/* Bubble menu on selection */}
      <BubbleMenu
        editor={editor}
        options={{ placement: "top" }}
        className="flex items-center gap-1 bg-surface-elevated border border-border-subtle rounded-[4px] p-1 shadow-lg"
      >
        <ToolbarBtn
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <span className="font-bold">B</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <span className="italic">I</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          <span className="underline">U</span>
        </ToolbarBtn>
        <ToolbarBtn title="Link" onClick={promptLink} active={editor.isActive("link")}>
          ↗
        </ToolbarBtn>
        <span className="w-px h-4 bg-border-subtle mx-0.5" />
        <ToolbarBtn
          title="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          H3
        </ToolbarBtn>
        <ToolbarBtn
          title="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          •
        </ToolbarBtn>
        <ToolbarBtn
          title="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          1.
        </ToolbarBtn>
        <ToolbarBtn
          title="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          ❝
        </ToolbarBtn>
      </BubbleMenu>

      <EditorContent editor={editor} />

      {attachments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border-subtle flex flex-col gap-1.5">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-[4px] bg-surface-raised hover:bg-surface-hover transition-colors"
            >
              <span className="text-[14px] leading-none">{fileIcon(a.type)}</span>
              {a.dataUrl ? (
                <a
                  href={a.dataUrl}
                  download={a.name}
                  className="text-[13px] text-text-primary hover:text-accent truncate"
                >
                  {a.name}
                </a>
              ) : (
                <span className="text-[13px] text-text-primary truncate">{a.name}</span>
              )}
              <span className="font-mono text-[11px] text-text-tertiary shrink-0">
                {fmtBytes(a.size)}
              </span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
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
  );
};
