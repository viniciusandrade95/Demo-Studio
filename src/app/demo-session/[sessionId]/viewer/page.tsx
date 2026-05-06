"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  buildViewerViewModel,
  getDemoSession,
  type ViewerViewModel,
} from "@/lib/simulation/session";

export default function DemoSessionViewerPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [viewModel, setViewModel] = useState<ViewerViewModel | null>(null);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const session = getDemoSession(sessionId);
      setViewModel(session ? buildViewerViewModel(session) : null);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [sessionId]);

  if (!viewModel)
    return <main className="page-shell p-8">Session not found.</main>;

  return (
    <main className="page-shell px-5 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="glass-panel rounded-[2rem] p-6">
          <p className="section-eyebrow">Read-only Viewer</p>
          <h1 className="editorial-title mt-3 text-4xl">{viewModel.title}</h1>
          <div className="mt-4 rounded-xl bg-accent-soft p-3 text-sm font-semibold">
            {viewModel.simulatedLabel}
          </div>
          <div className="mt-6 space-y-5">
            {viewModel.timelineGroups.map((group) => (
              <div key={group.date} className="space-y-3">
                <h2 className="text-sm font-semibold text-stone-900">
                  {group.label}
                </h2>
                {group.items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-line bg-white/60 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <strong>{item.label}</strong>
                      <span className="font-mono text-xs text-muted">
                        {item.time}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted">{item.detail}</p>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </section>
        <aside className="glass-panel rounded-[2rem] p-6">
          <p className="section-eyebrow">Impact</p>
          <div className="mt-4 grid gap-3 text-sm">
            <div>
              Estimated revenue: €{viewModel.impactSummary.estimatedRevenue}
            </div>
            <div>
              Messages handled: {viewModel.impactSummary.messagesHandled}
            </div>
            <div>
              Bookings converted: {viewModel.impactSummary.bookingsConverted}
            </div>
            <div>Disruptions: {viewModel.impactSummary.disruptionCount}</div>
          </div>
          <p className="mt-6 text-xs leading-6 text-muted">
            Viewer is read-only and exposes no control actions.
          </p>
        </aside>
      </div>
    </main>
  );
}
