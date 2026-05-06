// Numeric input with clamp-on-blur, keystroke filtering, and brief visual
// feedback when an out-of-range value is corrected. Native spinner arrows are
// hidden globally via index.css.

import { useEffect, useRef, useState } from "react";

type Value = number | "";

interface Props {
  value: Value;
  onChange: (next: Value) => void;
  onCommit?: (next: Value) => void; // fired on blur with the clamped value
  min: number;
  max: number;
  step?: number;
  placeholder?: string;
  required?: boolean;
  requiredMessage?: string;
  className?: string;
  ariaLabel?: string;
}

export function ClampedNumberInput({
  value,
  onChange,
  onCommit,
  min,
  max,
  step = 1,
  placeholder,
  required,
  requiredMessage,
  className,
  ariaLabel,
}: Props) {
  const [flash, setFlash] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [requiredErr, setRequiredErr] = useState<string | null>(null);
  const flashTimer = useRef<number | null>(null);
  const hintTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
    },
    [],
  );

  const triggerFlash = (message: string) => {
    setFlash(true);
    setHint(message);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    if (hintTimer.current) window.clearTimeout(hintTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 600);
    hintTimer.current = window.setTimeout(() => setHint(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = [
      "Backspace",
      "Delete",
      "Tab",
      "Enter",
      "Escape",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];
    if (allowed.includes(e.key)) return;
    if (e.metaKey || e.ctrlKey) return; // copy/paste/select-all
    if (/^[0-9]$/.test(e.key)) return;
    e.preventDefault();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setRequiredErr(null);
    setHint(null);
    if (raw === "") {
      onChange("");
      return;
    }
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    onChange(n);
  };

  const handleBlur = () => {
    if (value === "") {
      if (required) setRequiredErr(requiredMessage ?? "Required");
      onCommit?.("");
      return;
    }
    let n = Number(value);
    if (!Number.isFinite(n)) {
      onChange("");
      onCommit?.("");
      return;
    }
    n = Math.round(n);
    if (n > max) {
      n = max;
      triggerFlash(`Maximum is ${max}`);
    } else if (n < min) {
      n = min;
      triggerFlash(`Minimum is ${min}`);
    }
    onChange(n);
    onCommit?.(n);
  };

  const borderColor =
    flash || requiredErr ? "hsl(var(--text-warning))" : "hsl(var(--border-subtle))";

  return (
    <div>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onBlur={handleBlur}
        className={
          className ??
          "w-full bg-surface-raised border rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none transition-colors"
        }
        style={{ borderColor }}
      />
      {hint && (
        <div
          className="mt-1 text-[11px]"
          style={{ color: "hsl(var(--text-tertiary))" }}
        >
          {hint}
        </div>
      )}
      {requiredErr && (
        <div
          className="mt-1 text-[11px]"
          style={{ color: "hsl(var(--text-warning))" }}
        >
          {requiredErr}
        </div>
      )}
    </div>
  );
}
