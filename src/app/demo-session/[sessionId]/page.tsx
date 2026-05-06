import { notFound } from "next/navigation";
import { getDemoSessionById } from "@/lib/simulation/fixtures";
import { projectDemoSession } from "@/lib/simulation/engine";

type DemoSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function DemoSessionPage({
  params,
}: DemoSessionPageProps) {
  const { sessionId } = await params;
  const session = getDemoSessionById(sessionId);

  if (!session) {
    notFound();
  }

  const projection = projectDemoSession(session);
  const kpiCards = [
    {
      label: "Inbound messages",
      value: projection.metrics.inboundMessages,
    },
    {
      label: "Assistant replies",
      value: projection.metrics.assistantReplies,
    },
    {
      label: "Bookings touched",
      value: projection.metrics.bookingsTouched,
    },
    {
      label: "Completed bookings",
      value: projection.metrics.completedBookings,
    },
    {
      label: "Cancelled bookings",
      value: projection.metrics.cancelledBookings,
    },
    {
      label: "No-shows",
      value: projection.metrics.noShowBookings,
    },
  ];

  return (
    <main className="page-shell px-5 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="glass-panel rounded-[2rem] px-6 py-6 sm:px-8">
          <p className="section-eyebrow">Demo Session</p>
          <h1 className="editorial-title mt-3 text-4xl">{projection.session.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
            {projection.session.operatorSummary}
          </p>
          <div className="mt-4 rounded-[1.25rem] bg-accent-soft px-4 py-3 text-sm leading-7 text-stone-800">
            {projection.session.simulatedLabel}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kpiCards.map((card) => (
            <article key={card.label} className="glass-panel rounded-[1.5rem] px-5 py-5">
              <div className="section-eyebrow">{card.label}</div>
              <div className="mt-3 text-3xl font-semibold text-stone-900">{card.value}</div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="glass-panel rounded-[1.5rem] px-5 py-5">
            <h2 className="font-semibold text-stone-900">Timeline playback</h2>
            <div className="mt-4 space-y-3">
              {projection.timeline.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.25rem] border border-line bg-white/55 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-stone-900">{item.label}</div>
                    <div className="font-mono text-xs text-muted">{item.at}</div>
                  </div>
                  <div className="mt-2 text-sm leading-7 text-stone-700">{item.detail}</div>
                </div>
              ))}
            </div>
          </article>

          <article className="glass-panel rounded-[1.5rem] px-5 py-5">
            <h2 className="font-semibold text-stone-900">Session frame</h2>
            <dl className="mt-4 space-y-3 text-sm leading-7 text-stone-700">
              <div>
                <dt className="section-eyebrow">Session id</dt>
                <dd>{sessionId}</dd>
              </div>
              <div>
                <dt className="section-eyebrow">Business</dt>
                <dd>{projection.session.businessName}</dd>
              </div>
              <div>
                <dt className="section-eyebrow">Vertical</dt>
                <dd>{projection.session.vertical}</dd>
              </div>
              <div>
                <dt className="section-eyebrow">Scenario</dt>
                <dd>{projection.session.scenario}</dd>
              </div>
              <div>
                <dt className="section-eyebrow">City</dt>
                <dd>{projection.session.city}</dd>
              </div>
            </dl>
          </article>
        </section>
      </div>
    </main>
  );
}
