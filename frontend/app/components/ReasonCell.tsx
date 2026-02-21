"use client";

import Tooltip from "./Tooltip";

export default function ReasonCell({ text }: { text: string }) {
  if (!text) return null;

  return (
    <Tooltip
      text={text}
      maxWidth={400}
      className="block w-full truncate cursor-default text-xs text-gray-400 italic"
    >
      {text}
    </Tooltip>
  );
}
