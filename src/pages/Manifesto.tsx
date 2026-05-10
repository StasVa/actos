// Founder essay — why ActOS replaces tasks with actions.
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { LandingTopBar, LandingFooter } from "@/components/LandingChrome";

const Manifesto: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      data-theme="dark"
      className="relative flex min-h-screen flex-col"
      style={{ background: "hsl(var(--surface-base))" }}
    >
      <LandingTopBar />

      <main className="manifesto-main flex-1 px-6">
        <article className="mx-auto" style={{ maxWidth: 720 }}>
          <h1
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              color: "hsl(var(--text-primary))",
              letterSpacing: "-0.02em",
              textAlign: "center",
              margin: 0,
              lineHeight: 1.1,
            }}
            className="manifesto-h1"
          >
            Why we don't do tasks
          </h1>
          <hr
            style={{
              border: "none",
              borderTop: "1px solid hsl(var(--border-subtle))",
              margin: "32px 0 48px",
            }}
          />

          <div className="manifesto-body" style={{ color: "hsl(var(--text-primary))" }}>
            <p>
              Most productivity tools start with the same assumption: you have a list of things to do, and the goal is to do them. Tasks promise control. They deliver busywork.
            </p>
            <p>
              I've used Todoist, Things, TickTick, Notion, Linear, Asana, Trello, Sunsama, and four custom Notion templates I built myself. The pattern was always the same. The list grew. I checked things off. The goals I actually cared about — the ones I'd written on a sticky note above my desk — kept slipping further away.
            </p>

            <h2>The trap</h2>
            <p>The problem with tasks is that they're optimized for the wrong thing.</p>
            <p>
              A task is anything that takes effort. "Reply to email." "Schedule dentist." "Buy groceries." All tasks. None of them move you toward who you want to become. But because they live in the same list as the things that <em>do</em> matter — your draft, your training plan, your business — the trivial and the meaningful compete for the same attention.
            </p>
            <p>
              In practice, the trivial wins. It's easier. It generates a checkbox dopamine hit faster. By Friday, you've done 47 things and made zero progress on the one thing you said this week was about.
            </p>
            <p>Tasks expand to fill the day. Goals get squeezed out.</p>

            <h2>Action ≠ task</h2>
            <p>
              ActOS replaces tasks with <strong>actions</strong>. The distinction matters:
            </p>
            <p>
              An action belongs to a project. A project belongs to a goal. Every action you take is, by construction, a step toward something you decided was worth pursuing. There is no "miscellaneous" bucket. There is no "inbox." If something doesn't tie to a goal, it doesn't go into ActOS.
            </p>
            <p>This sounds restrictive. It is. That's the point.</p>
            <p>
              Every action also has two pieces of metadata most task apps ignore: <strong>Impact</strong> (how much this moves the goal) and <strong>Time</strong> (how long it'll take). The product makes you think about both before you commit. A 30-minute action with impact 2 is fundamentally different from a 30-minute action with impact 8 — and most days you should be doing the second one.
            </p>
            <p>Tasks treat all work as equal. Actions don't.</p>

            <h2>Hard limits, on purpose</h2>
            <p>
              ActOS caps you at 3 active goals. Not as a guideline. As a hard limit — the "+ New goal" button literally won't work if you have 3.
            </p>
            <p>
              This is the most controversial decision in the product, and it's also the one I'm least willing to negotiate on. Almost everyone who's serious about something has more than 3 things they're "working on." Almost no one is actually making meaningful progress on more than 2.
            </p>
            <p>
              If you can't pick 3 goals, the tool can't help you. It's not the tool's job to give you permission to be unfocused. It's the tool's job to reflect the reality that focus is the entire game.
            </p>

            <h2>The daily ritual</h2>
            <p>
              Every day, ActOS asks one question: <em>What single thing makes today a win?</em>
            </p>
            <p>
              Not "what are your top 5 priorities." Not "rank these by importance." One thing. The Main Task. If you do nothing else, did you do that?
            </p>
            <p>
              Most days, the answer is yes — because picking one thing is easier than picking five. The other actions you complete are bonus. The Main Task is the floor.
            </p>
            <p>
              Over weeks and months, that floor adds up. Tasks gave you 47 checkmarks and no progress. Actions give you 22 Main Tasks completed in a month — 22 deliberate moves toward the goals you set. The math is different. So is the result.
            </p>

            <h2>What this isn't</h2>
            <p>
              ActOS isn't a kanban board. It's not a CRM. It's not a wiki, a calendar, or an AI agent. It's a daily-execution tool for the 1-3 things that actually matter to you, with rituals that keep you honest about doing them.
            </p>
            <p>
              If you have 200 things on your plate and you want a place to track them all — ActOS is the wrong tool. We won't help you manage that load. We'll ask why you took it on in the first place.
            </p>
            <p>
              But if you've got two or three goals that actually matter, and you're tired of watching them dissolve into another week of "busy" — this is built for you.
            </p>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid hsl(var(--border-subtle))",
              marginTop: 64,
              marginBottom: 32,
            }}
          />

          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 24,
                color: "hsl(var(--text-primary))",
                margin: 0,
              }}
            >
              Stop scheduling tasks. Start moving on goals.
            </p>
            <button
              type="button"
              onClick={() => navigate("/today")}
              className="cta-btn"
              style={{
                marginTop: 32,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "hsl(var(--goal-2))",
                color: "#0F0F12",
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 16,
                padding: "14px 32px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                transition: "filter 120ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
            >
              Open ActOS
              <ArrowRight size={16} />
            </button>
          </div>
        </article>
      </main>

      <LandingFooter />

      <style>{`
        .manifesto-main { padding-top: 120px; padding-bottom: 80px; }
        .manifesto-h1 { font-size: 48px; }
        .manifesto-body p { font-size: 18px; line-height: 1.7; margin: 0 0 24px; }
        .manifesto-body h2 {
          font-family: Inter, system-ui, sans-serif;
          font-size: 24px;
          font-weight: 500;
          color: hsl(var(--text-primary));
          margin: 48px 0 16px;
          letter-spacing: -0.01em;
        }
        .manifesto-body strong { font-weight: 600; }
        .manifesto-body em { font-style: italic; }
        .cta-btn:focus-visible { outline: 2px solid hsl(var(--goal-2)); outline-offset: 3px; }
        @media (max-width: 768px) {
          .manifesto-main { padding-top: 88px; padding-bottom: 56px; }
          .manifesto-h1 { font-size: 32px; }
          .manifesto-body p { font-size: 16px; }
        }
      `}</style>
    </div>
  );
};

export default Manifesto;
