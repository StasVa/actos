import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { StatusDropdown, STATUS_ORDER, STATUS_LABEL } from "./ActionEditor";
import type { ActionStatus } from "@/types";

function Harness({ onPick }: { onPick: (s: ActionStatus) => void }) {
  const [status, setStatus] = useState<ActionStatus>("backlog");
  return (
    <div>
      <div data-testid="current-status">{status}</div>
      <StatusDropdown
        current={status}
        isGoalLevel={false}
        onPick={(s) => {
          setStatus(s);
          onPick(s);
        }}
      />
    </div>
  );
}

describe("StatusDropdown", () => {
  it("updates the current status immediately when each option is picked", () => {
    const onPick = vi.fn();
    render(<Harness onPick={onPick} />);

    for (const target of STATUS_ORDER) {
      // Open the popover (trigger is the only button in the rendered tree
      // before the popover opens — find it by its current-status label).
      const trigger = screen.getAllByRole("button")[0];
      fireEvent.click(trigger);

      // Find the option button inside the popover. Multiple elements show
      // STATUS_LABEL[target] (trigger + option), so scope by role=button and
      // pick the option (not the trigger).
      const optionButtons = screen
        .getAllByRole("button")
        .filter((b) => b.textContent?.trim() === STATUS_LABEL[target]);
      // The trigger also has matching text when current === target — pick the
      // one that is NOT the trigger by preferring the last match.
      const optionBtn = optionButtons[optionButtons.length - 1];
      expect(optionBtn).toBeTruthy();
      fireEvent.click(optionBtn);

      expect(onPick).toHaveBeenLastCalledWith(target);
      expect(screen.getByTestId("current-status").textContent).toBe(target);
    }

    expect(onPick).toHaveBeenCalledTimes(STATUS_ORDER.length);
  });

  it("disables non-backlog options when isGoalLevel is true", () => {
    const onPick = vi.fn();
    render(
      <StatusDropdown current="backlog" isGoalLevel onPick={onPick} />,
    );
    fireEvent.click(screen.getAllByRole("button")[0]);

    for (const s of STATUS_ORDER) {
      if (s === "backlog") continue;
      const btns = screen
        .getAllByRole("button")
        .filter((b) => b.textContent?.trim() === STATUS_LABEL[s]);
      const optionBtn = btns[btns.length - 1] as HTMLButtonElement;
      expect(optionBtn.disabled).toBe(true);
    }
  });
});
