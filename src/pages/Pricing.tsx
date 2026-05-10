import React from "react";

const Pricing: React.FC = () => (
  <div
    data-theme="dark"
    className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
    style={{ background: "hsl(var(--surface-base))", fontFamily: "Inter, system-ui, sans-serif" }}
  >
    <h1
      style={{
        color: "hsl(var(--text-primary))",
        fontWeight: 500,
        fontSize: "clamp(32px, 5vw, 56px)",
        letterSpacing: "-0.02em",
        margin: 0,
      }}
    >
      Pricing
    </h1>
    <p style={{ color: "hsl(var(--text-secondary))", marginTop: 16, fontSize: 18 }}>
      Coming soon.
    </p>
  </div>
);

export default Pricing;
