import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: "#2563EB",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "8px",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <polyline
          points="2,12 6,12 8,6 10,18 13,9 15,14 17,12 22,12"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>,
    { ...size }
  );
}
