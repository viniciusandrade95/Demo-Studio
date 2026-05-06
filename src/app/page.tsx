import Link from "next/link";
import { demoSessions } from "@/lib/simulation/fixtures";

const signals = [
  "Inbound messages begin a believable customer story",
  "Assistant replies and bookings move the session forward",
  "KPIs shift visibly as the demo timeline progresses",
];

const storyMoments = [
  { label: "09:12", text: "New WhatsApp lead asks for availability" },
  { label: "09:15", text: "Assistant replies and proposes two slots" },
  { label: "09:19", text: "A booking lands and the dashboard reacts" },
];

export default function Home() {
  const featuredSession = demoSessions[0];

  return (
    <main className="page-shell px-5 py-6 text-stone-900 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="glass-panel rounded-[2rem] px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="section-eyebrow">Marqo Demo Studio</p>
              <h1 className="editorial-title mt-3 text-4xl leading-tight sm:text-5xl">
                A visual control room for believable business demos.
              </h1>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/demo-lab"
                className="rounded-full bg-accent px-5 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Open Demo Lab
              </Link>
              <Link
                href={`/demo-session/${featuredSession.id}`}
                className="rounded-full border border-line bg-white/60 px-5 py-3 font-semibold transition hover:bg-white"
              >
                View Featured Session
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <article className="glass-panel rounded-[2rem] px-6 py-7 sm:px-8">
            <p className="section-eyebrow">Product Direction</p>
            <h2 className="editorial-title mt-4 text-3xl leading-tight">
              This repo starts with honest simulation, not fake production software theater.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
              Marqo Demo Studio is a standalone app for sales storytelling. It simulates
              customer traffic, assistant replies, appointments, churn, and dashboard
              impact with local fixtures and future-safe connector boundaries.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {signals.map((signal) => (
                <div
                  key={signal}
                  className="rounded-[1.5rem] border border-line bg-white/55 p-4 text-sm leading-7 text-stone-700"
                >
                  {signal}
                </div>
              ))}
            </div>
          </article>

          <aside className="glass-panel rounded-[2rem] px-6 py-7 sm:px-8">
            <p className="section-eyebrow">Current Scope</p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-stone-700">
              <p>
                Status: <span className="font-semibold text-stone-950">Bootstrap</span>
              </p>
              <p>
                Data: <span className="font-semibold text-stone-950">Simulated only</span>
              </p>
              <p>
                Backend: <span className="font-semibold text-stone-950">Local mocks and fixtures</span>
              </p>
              <p>
                Integration: <span className="font-semibold text-stone-950">Future connector abstraction</span>
              </p>
            </div>

            <div className="mt-8 rounded-[1.5rem] bg-accent-soft p-4 text-sm leading-7 text-stone-800">
              Every page in this app should make it obvious that the activity is demo
              activity. No fake claims about live customer production traffic.
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-line bg-white/55 p-4 text-sm leading-7 text-stone-800">
              Featured session: <span className="font-semibold">{featuredSession.title}</span>
              <br />
              Scope: {featuredSession.vertical} in {featuredSession.city}
            </div>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="glass-panel rounded-[2rem] px-6 py-7 sm:px-8">
            <p className="section-eyebrow">Playback Preview</p>
            <div className="mt-5 space-y-4">
              {storyMoments.map((moment) => (
                <div
                  key={moment.label}
                  className="flex gap-4 rounded-[1.25rem] border border-line bg-white/60 p-4"
                >
                  <div className="font-mono text-xs tracking-wide text-muted">{moment.label}</div>
                  <div className="text-sm leading-7 text-stone-800">{moment.text}</div>
                </div>
              ))}
            </div>
          </article>

          <article className="glass-panel rounded-[2rem] px-6 py-7 sm:px-8">
            <p className="section-eyebrow">Why This Exists</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-line bg-white/55 p-5">
                <h3 className="font-semibold">Demo Lab</h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Workspace for building sessions, choosing story beats, and controlling
                  playback safely with local fixtures.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-line bg-white/55 p-5">
                <h3 className="font-semibold">Demo Sessions</h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Session-specific playback views where messages, bookings, and KPI motion
                  create a coherent commercial narrative.
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
