import { ImageResponse } from "next/og";

export const alt = "AegisDesk | Grounded AI Customer Support Built on Your Company Knowledge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          color: "#EDF2EE",
          backgroundColor: "#070908",
          backgroundImage:
            "radial-gradient(ellipse at 80% 20%, rgba(10, 67, 58, 0.45) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(34, 197, 94, 0.08) 0%, transparent 50%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="44" height="44" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="#0E1210" stroke="#1D2420" strokeWidth="1" />
              <path
                d="M14 6 L21 9.5 V15 C21 19.5 17.5 22.5 14 24 C10.5 22.5 7 19.5 7 15 V9.5 L14 6 Z"
                fill="none"
                stroke="#22C55E"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="14" cy="14" r="2.2" fill="#22C55E" />
            </svg>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.5, color: "#EDF2EE" }}>
              AegisDesk
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              backgroundColor: "#141916",
              border: "1px solid #1D2420",
              fontSize: 14,
              color: "#22C55E",
              fontFamily: "monospace",
              letterSpacing: 1,
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" }} />
            VERIFIED CITATIONS ONLY
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 68,
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: "#EDF2EE",
            }}
          >
            <span>Verified AI Support.</span>
            <span style={{ color: "#9AA79E" }}>Answers backed by your documents.</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #1D2420",
            paddingTop: 24,
            fontSize: 20,
            color: "#9AA79E",
          }}
        >
          <div>14-Day Shadow Validation • Quoted Citations • Human-in-the-Loop</div>
          <div style={{ fontFamily: "monospace", color: "#546258" }}>aegisdesk.com</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
