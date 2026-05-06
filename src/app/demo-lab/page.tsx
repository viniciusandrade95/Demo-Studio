import Link from "next/link";
import { demoSessions } from "@/lib/simulation/fixtures";

const modules = [
  "Scenario composition",
  "Fixture-backed tenants",
  "Timeline pacing",
  "Commercial script overlays",
];

export default function DemoLabPage() {
  return (
    <main className="page-shell px-5 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="glass-panel rounded-[2rem] px-6 py-6 sm:px-8">
          <p className="section-eyebrow">Demo Lab</p>
          <h1 className="editorial-title mt-3 text-4xl">Session design workspace</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
            This placeholder route will evolve into the authoring workspace for sales
            demos. For now it documents the intended shape: local-safe session setup,
            believable playback controls, and explicit simulation labels.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {modules.map((module) => (
            <div
              key={module}
              className="glass-panel rounded-[1.5rem] px-5 py-5 text-sm leading-7 text-stone-800"
            >
              {module}
            </div>
          ))}
        </section>

        <section className="grid gap-4">
          <div className="section-eyebrow">Fixture Sessions</div>
          {demoSessions.map((session) => (
            <article
              key={session.id}
              className="glass-panel rounded-[1.5rem] px-5 py-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">{session.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted">{session.operatorSummary}</p>
                </div>
                <div className="text-sm leading-7 text-stone-700">
                  <div>{session.businessName}</div>
                  <div>
                    {session.vertical} · {session.city}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/demo-session/${session.id}`}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
                >
                  Open session
                </Link>
              </div>
            </article>
          ))}
        </section>

        <footer className="flex justify-between gap-4 text-sm">
          <Link href="/" className="rounded-full border border-line bg-white/60 px-4 py-2">
            Back home
          </Link>
          <Link
            href={`/demo-session/${demoSessions[0]?.id ?? "session-alpha"}`}
            className="rounded-full bg-accent px-4 py-2 font-semibold text-white"
          >
            Open placeholder session
          </Link>
        </footer>
      </div>
    </main>
  );
}
