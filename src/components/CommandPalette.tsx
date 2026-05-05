// Global ⌘K command palette — quick-add an action and jump between pages.
// Listens for Cmd/Ctrl+K and Esc. Self-managed open state.

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

const NAV_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Ideas", path: "/ideas" },
  { label: "Rituals", path: "/rituals" },
  { label: "All actions", path: "/all-actions" },
  { label: "All projects", path: "/all-projects" },
  { label: "All delegated", path: "/all-delegated" },
];

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const navigate = useNavigate();
  const createAction = useStore((s) => s.createAction);
  const captureIdea = useStore((s) => s.captureIdea);
  const openPanel = useStore((s) => s.openPanel);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const reset = () => {
    setOpen(false);
    setQuery("");
  };

  const handleAddToday = () => {
    const t = query.trim();
    if (!t) return;
    const id = createAction({ title: t, scheduledDate: TODAY_ISO });
    toast.success("Action added to today");
    reset();
    openPanel({ kind: "action", mode: "edit", id });
  };

  const handleAddBacklog = () => {
    const t = query.trim();
    if (!t) return;
    const id = createAction({ title: t });
    toast.success("Action added to backlog");
    reset();
    openPanel({ kind: "action", mode: "edit", id });
  };

  const handleCaptureIdea = () => {
    const t = query.trim();
    if (!t) return;
    captureIdea({ title: t });
    toast.success("Idea captured");
    reset();
    navigate("/ideas");
  };

  const handleNewGoal = () => {
    reset();
    openPanel({ kind: "goal", mode: "new" });
  };
  const handleNewProject = () => {
    reset();
    openPanel({ kind: "project", mode: "new" });
  };
  const handleNewRitual = () => {
    reset();
    openPanel({ kind: "ritual", mode: "new" });
  };

  const hasQuery = query.trim().length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Quick add or type a command…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Type to capture, then choose where it lands.</CommandEmpty>

        {hasQuery && (
          <CommandGroup heading="Capture">
            <CommandItem onSelect={handleAddToday}>
              ➕ Add as action for today — “{query.trim()}”
            </CommandItem>
            <CommandItem onSelect={handleAddBacklog}>
              ☰ Add to backlog — “{query.trim()}”
            </CommandItem>
            <CommandItem onSelect={handleCaptureIdea}>
              💡 Capture as idea — “{query.trim()}”
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />
        <CommandGroup heading="Create">
          <CommandItem onSelect={handleNewGoal}>New goal</CommandItem>
          <CommandItem onSelect={handleNewProject}>New project</CommandItem>
          <CommandItem onSelect={handleNewRitual}>New ritual</CommandItem>
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Go to">
          {NAV_ITEMS.map((n) => (
            <CommandItem
              key={n.path}
              onSelect={() => {
                reset();
                navigate(n.path);
              }}
            >
              {n.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
