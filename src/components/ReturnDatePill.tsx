import React from "react";
import { Tooltip } from "@/components/Tooltip";
import { getReturnInfo } from "@/lib/returnDate";

export const ReturnDatePill: React.FC<{ expectedReturnDate?: string }> = ({ expectedReturnDate }) => {
  const info = getReturnInfo(expectedReturnDate);
  const style: React.CSSProperties = {
    fontSize: 12,
    color: info.color,
    background: info.background,
    fontStyle: info.italic ? "italic" : "normal",
    whiteSpace: "nowrap",
  };
  if (info.pill) {
    style.padding = "3px 8px";
    style.borderRadius = 3;
  }
  return (
    <Tooltip content={info.tooltip}>
      <span className="font-mono tabular-nums" style={style}>
        {info.text}
      </span>
    </Tooltip>
  );
};
