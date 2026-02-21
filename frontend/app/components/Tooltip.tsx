"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  text: string;
  children: ReactNode;
  maxWidth?: number;
  className?: string;
  preferSide?: "top" | "bottom";
}

export default function Tooltip({
  text,
  children,
  maxWidth = 360,
  className,
  preferSide = "top",
}: TooltipProps) {
  const [coords, setCoords] = useState<{
    x: number;
    y: number;
    arrowX: number;
    side: "top" | "bottom";
  } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const show = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    let side = preferSide;
    if (side === "bottom" && viewH - rect.bottom < 120) side = "top";
    if (side === "top" && rect.top < 120) side = "bottom";

    let x = rect.left;
    if (x + maxWidth > viewW - 16) {
      x = viewW - maxWidth - 16;
    }
    if (x < 16) x = 16;

    const triggerCenter = rect.left + rect.width / 2;
    const arrowX = Math.max(12, Math.min(triggerCenter - x, maxWidth - 12));

    setCoords({
      x,
      y: side === "top" ? rect.top : rect.bottom,
      arrowX,
      side,
    });
  }, [preferSide, maxWidth]);

  const hide = useCallback(() => setCoords(null), []);

  if (!text) return <>{children}</>;

  return (
    <span
      ref={triggerRef}
      className={className ?? "inline-flex"}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {coords &&
        createPortal(
          <span
            className="fixed z-[9999] px-3 py-2.5 rounded-lg bg-gray-900 text-white text-xs leading-relaxed shadow-xl pointer-events-none whitespace-normal"
            style={{
              maxWidth,
              width: "max-content",
              left: coords.x,
              ...(coords.side === "top"
                ? { top: coords.y - 8, transform: "translateY(-100%)" }
                : { top: coords.y + 8 }),
            }}
          >
            {text}
            <span
              className={`absolute w-2 h-2 bg-gray-900 rotate-45 ${
                coords.side === "top"
                  ? "top-full -mt-1"
                  : "bottom-full -mb-1"
              }`}
              style={{ left: coords.arrowX }}
            />
          </span>,
          document.body
        )}
    </span>
  );
}
