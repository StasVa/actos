// Placeholder sign-in page. Real auth not wired yet.
import React from "react";
import { LandingTopBar, LandingFooter } from "@/components/LandingChrome";

const Login: React.FC = () => (
  <div
    data-theme="dark"
    className="relative flex min-h-screen flex-col"
    style={{ background: "hsl(var(--surface-base))", fontFamily: "Inter, system-ui, sans-serif" }}
  >
    <LandingTopBar />
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h1
        style={{
          color: "hsl(var(--text-primary))",
          fontWeight: 500,
          fontSize: "clamp(32px, 5vw, 56px)",
          letterSpacing: "-0.02em",
          margin: 0,
        }}
      >
        Sign in
      </h1>
      <p style={{ color: "hsl(var(--text-secondary))", marginTop: 16, fontSize: 18 }}>
        Coming soon.
      </p>
    </main>
    <LandingFooter />
  </div>
);

export default Login;
