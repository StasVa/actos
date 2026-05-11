// Founder essay — Medium-style article with byline, drop cap, pull quote.
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { LandingTopBar, LandingFooter } from "@/components/LandingChrome";

const Manifesto: React.FC = () => {
  return (
    <div
      data-theme="dark"
      className="relative flex min-h-screen flex-col"
      style={{ background: "hsl(var(--surface-base))", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <LandingTopBar />

      <main className="manifesto-main flex-1 px-6">
        <article className="mx-auto" style={{ maxWidth: 720 }}>
          {/* Byline */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              aria-hidden
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "hsl(var(--surface-raised))",
                border: "1px solid hsl(var(--border-subtle))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "hsl(var(--text-primary))",
                fontSize: 18,
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              SV
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 500, color: "hsl(var(--text-primary))" }}>
                Stanislav Vasilevschii
              </span>
              <span style={{ fontSize: 14, color: "hsl(var(--text-tertiary))" }}>
                Founder of ActOS · May 2026
              </span>
            </div>
          </div>

          {/* Title */}
          <h1
            className="manifesto-h1"
            style={{
              marginTop: 48,
              fontWeight: 500,
              color: "hsl(var(--text-primary))",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            Tasks won't get you there.
          </h1>

          <p
            className="manifesto-deck"
            style={{
              marginTop: 24,
              color: "hsl(var(--text-secondary))",
              fontWeight: 400,
              lineHeight: 1.4,
            }}
          >
            Why I built ActOS after eight years of failing at productivity tools.
          </p>

          <div className="manifesto-body" style={{ marginTop: 64 }}>
            <p className="has-dropcap">
              For eight years, I tried every productivity tool that promised to make me focused. Todoist. Things. Notion. TickTick. Trello. Sunsama. Linear. Asana. Four custom Notion templates I built myself between failed jobs.
            </p>
            <p>
              I'd set up the new system on a Sunday evening — clean databases, color-coded tags, perfect filters. By Wednesday I'd be back to the same problem: I was completing 30 things a week and the projects I actually cared about hadn't moved.
            </p>
            <p>The tool wasn't the problem. The category was.</p>

            <h2>Tasks are a trap dressed as a solution</h2>
            <p>
              A task is anything that takes effort. "Reply to Mark." "Schedule dentist." "Buy paper towels." All tasks. None of them move you toward who you want to become. But because they live in the same list as the things that <em>do</em> matter — your training plan, your draft, your business — the trivial and the meaningful compete for the same checkbox.
            </p>
            <p>
              The trivial always wins. It's easier. It generates a dopamine hit faster. By Friday you've done 47 things and made zero progress on the one thing this week was supposed to be about.
            </p>
            <p>Tasks expand to fill the day. Goals get squeezed out.</p>
            <p>
              This isn't a tooling problem. It's a category error. The premise of task management is "if I capture everything, I'll feel in control." But the cost of "everything" is that nothing's important. A list of 200 items isn't a plan. It's a noise floor.
            </p>

            <blockquote>
              Tasks gave me 47 checkmarks a week. Action moves toward 2-3 goals. That's the difference.
            </blockquote>

            <h2>What I started doing instead</h2>
            <p>
              I stopped using task apps for goals. I kept a separate file — just one — with 2-3 things I cared about that quarter. Every morning I asked one question: <em>what single thing today makes this week a win?</em> I'd write it down. Then I'd do that thing, even if the rest of my day was a mess of meetings and "tasks."
            </p>
            <p>
              Within three months I'd shipped more on those 2-3 goals than I had in the previous two years.
            </p>
            <p>
              The system was crude — a text file, a sticky note, no automation, no integrations. But the <em>shape</em> of it was right. It separated "things I'm doing" from "things that move me forward." It made the second category small enough to actually act on.
            </p>
            <p>That's the shape ActOS gives form to.</p>

            <h2>ActOS isn't a todo app</h2>
            <p>
              It looks like one, on the surface. You'll see actions with checkboxes, a Today view, a Main Task for the day. The components are familiar.
            </p>
            <p>But underneath, the structure is different:</p>
            <ul>
              <li>Every action belongs to a project. Every project belongs to a goal. Nothing exists outside that hierarchy. There's no inbox. No "miscellaneous." If something doesn't tie to a goal, it doesn't enter the system.</li>
              <li>You can have <strong>at most 3 active goals</strong>. Not as a guideline — as a hard cap the product enforces. The "+ New goal" button literally stops working if you try to add a fourth.</li>
              <li>Each day, the product asks one question: <em>what single thing makes today a win?</em> That's the Main Task. Everything else is bonus.</li>
              <li>Every action carries an Impact score (1-10) and a time estimate. The product surfaces high-impact work, so you don't spend Tuesday on something that doesn't matter.</li>
            </ul>
            <p>These aren't features. They're refusals.</p>
            <p>
              ActOS refuses to capture your busywork. It refuses to let you "track" 200 things. It refuses to give you the dopamine hit of checking off 47 items when none of them moved a goal.
            </p>

            <h2>The hardest part is the cap</h2>
            <p>
              The 3-goal limit is the most controversial decision in the product, and it's also the one I'm least willing to negotiate on.
            </p>
            <p>
              Almost everyone who's serious about something has more than 3 things they're "working on." Almost no one is actually making meaningful progress on more than 2.
            </p>
            <p>
              If you can't pick 3, the tool can't help you. It's not the tool's job to give you permission to be unfocused. It's the tool's job to reflect the reality that focus is the entire game.
            </p>
            <p>
              I know this filters out a lot of potential customers. That's intentional. ActOS isn't for everyone — it's for people who've already decided that they want to do fewer things, more seriously.
            </p>

            <h2>What I'd ask you to try</h2>
            <p>
              Stop scheduling tasks for a week. Pick 2 goals you actually care about. Each morning, decide the one thing that makes today a win for those goals. Do that thing.
            </p>
            <p>
              You can use ActOS. You can use a sticky note. The tool isn't what matters — the <em>shape</em> matters.
            </p>
            <p>
              If a sticky note works for you, keep using it. I built ActOS because I wanted that shape with a little more structure, a little more memory, a little more ability to look back at where the weeks went. That's all the product is. It's the smallest version of "the system I actually use" that I could ship.
            </p>

            <hr />

            <p>
              If you want to try it, <Link to="/auth#signup" style={{ color: "hsl(var(--goal-2))", textDecoration: "underline" }}>open ActOS</Link>. Free is real and the trial doesn't expire.
            </p>
            <p>
              If you don't, I hope at least the framing was useful. The goal isn't to convert you to a product. The goal is to convert you to a way of working.
            </p>
            <p>Tasks won't get you there. Action will.</p>
          </div>

          {/* Closing CTA */}
          <div style={{ marginTop: 80, textAlign: "center" }}>
            <p
              className="manifesto-cta-line"
              style={{ fontWeight: 500, color: "hsl(var(--text-primary))", margin: 0 }}
            >
              Stop scheduling. Start moving.
            </p>
            <Link
              to="/auth#signup"
              className="manifesto-cta-btn"
              style={{
                marginTop: 32,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "hsl(var(--goal-2))",
                color: "hsl(var(--surface-base))",
                fontWeight: 500,
                fontSize: 16,
                padding: "14px 32px",
                borderRadius: 6,
                textDecoration: "none",
                transition: "filter 120ms ease",
              }}
            >
              Open ActOS
              <ArrowRight size={16} strokeWidth={1.75} />
            </Link>
            <p style={{ marginTop: 16, fontSize: 13, color: "hsl(var(--text-tertiary))" }}>
              No credit card required.
            </p>
          </div>
        </article>
      </main>

      <LandingFooter />

      <style>{`
        .manifesto-main { padding-top: 120px; padding-bottom: 120px; }
        .manifesto-h1 { font-size: 56px; }
        .manifesto-deck { font-size: 24px; }
        .manifesto-cta-line { font-size: 24px; }
        .manifesto-cta-btn:hover { filter: brightness(1.1); }

        .manifesto-body p {
          font-size: 19px;
          line-height: 1.7;
          letter-spacing: 0.005em;
          color: hsl(var(--text-primary));
          margin: 0 0 28px;
          font-weight: 400;
        }
        .manifesto-body ul {
          margin: 0 0 28px;
          padding-left: 24px;
          color: hsl(var(--text-primary));
        }
        .manifesto-body ul li {
          font-size: 19px;
          line-height: 1.7;
          letter-spacing: 0.005em;
          margin-bottom: 12px;
        }
        .manifesto-body h2 {
          font-size: 28px;
          font-weight: 500;
          color: hsl(var(--text-primary));
          margin: 64px 0 24px;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .manifesto-body strong { font-weight: 600; color: hsl(var(--text-primary)); }
        .manifesto-body em { font-style: italic; color: hsl(var(--text-primary)); }
        .manifesto-body blockquote {
          font-size: 26px;
          font-weight: 400;
          color: hsl(var(--text-primary));
          line-height: 1.4;
          border-left: 3px solid hsl(var(--goal-2));
          padding-left: 24px;
          margin: 48px 0;
        }
        .manifesto-body hr {
          width: 80px;
          height: 1px;
          border: none;
          background: hsl(var(--border-subtle));
          margin: 64px auto;
        }
        .manifesto-body p.has-dropcap::first-letter {
          font-size: 64px;
          font-weight: 500;
          float: left;
          line-height: 0.9;
          margin: 4px 6px 0 0;
          color: hsl(var(--text-primary));
        }

        @media (max-width: 768px) {
          .manifesto-main { padding-top: 88px; padding-bottom: 80px; }
          .manifesto-h1 { font-size: 36px; }
          .manifesto-deck { font-size: 18px; }
          .manifesto-cta-line { font-size: 20px; }
          .manifesto-body p, .manifesto-body ul li { font-size: 17px; }
          .manifesto-body h2 { font-size: 22px; margin: 48px 0 20px; }
          .manifesto-body blockquote { font-size: 20px; margin: 36px 0; }
        }
      `}</style>
    </div>
  );
};

export default Manifesto;
