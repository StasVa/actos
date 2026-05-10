import React from "react";

export const LegalPrivacy: React.FC = () => <Placeholder title="Privacy" />;
export const LegalTerms: React.FC = () => <Placeholder title="Terms" />;

const Placeholder: React.FC<{ title: string }> = ({ title }) => (
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
      {title}
    </h1>
    <p style={{ color: "hsl(var(--text-secondary))", marginTop: 16, fontSize: 18 }}>
      Coming soon.
    </p>
  </div>
);
