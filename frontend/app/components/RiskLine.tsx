"use client";

import Tooltip from "./Tooltip";

export default function RiskLine({ text }: { text: string }) {
  return (
    <Tooltip
      text={text}
      maxWidth={400}
      className="block w-full truncate mt-2 cursor-default text-xs text-gray-500"
      preferSide="bottom"
    >
      <span className="text-orange-500 font-medium">⚠ Risk: </span>
      {text}
    </Tooltip>
  );
}
