"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  businessProfiles,
  demoSessions,
  scenarioPresets,
} from "@/lib/simulation/fixtures";
import {
  generateDemoLabPreview,
  getDefaultDemoLabFormState,
  type DemoLabFormState,
  type DemoLabPreview,
} from "@/lib/simulation/demoLab";
import type { TimelineCategory } from "@/lib/simulation/timeline";
import type { SimulationIntensity } from "@/lib/simulation/types";

type TimelineFilter = "all" | TimelineCategory | "kpi-system";

type TimelineFilterOption = {
  label: string;
  value: TimelineFilter;
};

const timelineFilters: TimelineFilterOption[] = [
  { label: "All", value: "all" },
  { label: "Messages", value: "messages" },
  { label: "Customers", value: "customers" },
  { label: "Bookings", value: "bookings" },
  { label: "Appointments", value: "appointments" },
  { label: "Disruptions", value: "disruptions" },
  { label: "Summaries", value: "summaries" },
  { label: "KPI/System", value: "kpi-system" },
];

const categoryLabels: Record<TimelineCategory, string> = {
  messages: "Messages",
  customers: "Customers",
  bookings: "Bookings",
  appointments: "Appointments",
  disruptions: "Disruptions",
  summaries: "Summaries",
  system: "System",
  kpi: "KPI",
};

const intensityOptions: SimulationIntensity[] = ["low", "medium", "high"];

export default function DemoLabPage() {
  const [form, setForm] = useState<DemoLabFormState>(() =>
    getDefaultDemoLabFormState(),
  );
  const [preview, setPreview] = useState<DemoLabPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTimelineFilter, setActiveTimelineFilter] =
    useState<TimelineFilter>("all");
  const fixtureSession = demoSessions[0];
  const selectedProfile = useMemo(
    () => businessProfiles.find((profile) => profile.slug === form.profileSlug),
    [form.profileSlug],
  );
  const selectedScenario = useMemo(
    () =>
      scenarioPresets.find((scenario) => scenario.slug === form.scenarioSlug),
    [form.scenarioSlug],
  );

  const updateForm = (field: keyof DemoLabFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const filteredTimelineGroups = useMemo(() => {
    if (!preview) {
      return [];
    }

    return preview.timelineGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (activeTimelineFilter === "all") {
            return true;
          }

          if (activeTimelineFilter === "kpi-system") {
            return item.category === "kpi" || item.category === "system";
          }

          return item.category === activeTimelineFilter;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [activeTimelineFilter, preview]);

  const filteredTimelineCount = filteredTimelineGroups.reduce(
    (total, group) => total + group.items.length,
    0,
  );

  const handleGenerate = () => {
    const result = generateDemoLabPreview(form);

    if (!result.ok) {
      setPreview(null);
      setError(result.error);
      return;
    }

    setPreview(result.preview);
    setError(null);
  };

  return (
    <main className="page-shell px-5 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="glass-panel rounded-[2rem] px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-eyebrow">Demo Lab</p>
              <h1 className="editorial-title mt-3 text-4xl leading-tight sm:text-5xl">
                Local simulation authoring room
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
                Generate deterministic local previews for sales demos. Every run
                is labeled simulated, stays in the browser session, and never
                writes to storage or calls an external API.
              </p>
            </div>
            <div className="rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-stone-800">
              Local simulated preview
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[0.78fr_1.35fr_0.82fr]">
          <aside className="glass-panel rounded-[2rem] px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-eyebrow">Controls</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">
                  Generate preview
                </h2>
              </div>
              <span className="rounded-full border border-line bg-white/60 px-3 py-1 text-xs font-semibold text-muted">
                No live writes
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Profile
                <select
                  value={form.profileSlug}
                  onChange={(event) =>
                    updateForm("profileSlug", event.target.value)
                  }
                  className="rounded-[1rem] border border-line bg-white/70 px-3 py-3 text-sm font-normal text-stone-900 outline-none focus:border-accent"
                >
                  {businessProfiles.map((profile) => (
                    <option key={profile.slug} value={profile.slug}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Scenario
                <select
                  value={form.scenarioSlug}
                  onChange={(event) =>
                    updateForm("scenarioSlug", event.target.value)
                  }
                  className="rounded-[1rem] border border-line bg-white/70 px-3 py-3 text-sm font-normal text-stone-900 outline-none focus:border-accent"
                >
                  {scenarioPresets.map((scenario) => (
                    <option key={scenario.slug} value={scenario.slug}>
                      {scenario.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Simulated days
                  <input
                    type="number"
                    min="1"
                    value={form.simulatedDays}
                    onChange={(event) =>
                      updateForm("simulatedDays", event.target.value)
                    }
                    className="rounded-[1rem] border border-line bg-white/70 px-3 py-3 text-sm font-normal text-stone-900 outline-none focus:border-accent"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Appointments / day
                  <input
                    type="number"
                    min="1"
                    value={form.appointmentsPerDay}
                    onChange={(event) =>
                      updateForm("appointmentsPerDay", event.target.value)
                    }
                    className="rounded-[1rem] border border-line bg-white/70 px-3 py-3 text-sm font-normal text-stone-900 outline-none focus:border-accent"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Seed
                <input
                  value={form.seed}
                  onChange={(event) => updateForm("seed", event.target.value)}
                  className="rounded-[1rem] border border-line bg-white/70 px-3 py-3 font-mono text-sm font-normal text-stone-900 outline-none focus:border-accent"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Intensity
                  <select
                    value={form.intensity}
                    onChange={(event) =>
                      updateForm(
                        "intensity",
                        event.target.value as SimulationIntensity,
                      )
                    }
                    className="rounded-[1rem] border border-line bg-white/70 px-3 py-3 text-sm font-normal capitalize text-stone-900 outline-none focus:border-accent"
                  >
                    {intensityOptions.map((intensity) => (
                      <option key={intensity} value={intensity}>
                        {intensity}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Start date
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      updateForm("startDate", event.target.value)
                    }
                    className="rounded-[1rem] border border-line bg-white/70 px-3 py-3 text-sm font-normal text-stone-900 outline-none focus:border-accent"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                className="mt-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-stone-900/10 transition hover:opacity-90"
              >
                Generate preview
              </button>

              {error ? (
                <div className="rounded-[1rem] border border-warn/30 bg-white/70 px-4 py-3 text-sm leading-6 text-warn">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-line bg-white/55 p-4 text-sm leading-7 text-stone-700">
              <div className="font-semibold text-stone-900">
                {selectedProfile?.name ?? "No profile selected"}
              </div>
              <div className="mt-1 text-muted">
                {selectedScenario?.title ?? "No scenario selected"}
              </div>
              <div className="mt-3 text-xs leading-6 text-muted">
                Local generation only · no storage · no live injection
              </div>
            </div>
          </aside>

          <section className="glass-panel rounded-[2rem] px-5 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="section-eyebrow">Timeline</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">
                  Generated playback
                </h2>
              </div>
              {preview ? (
                <div className="rounded-full border border-line bg-white/60 px-3 py-2 font-mono text-xs text-muted">
                  {preview.run.runId}
                </div>
              ) : null}
            </div>

            {!preview ? (
              <div className="mt-5 flex min-h-[28rem] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-line bg-white/35 px-6 py-12 text-center">
                <p className="section-eyebrow">Empty preview</p>
                <h3 className="editorial-title mt-3 max-w-md text-3xl text-stone-900">
                  Choose controls and generate a local simulated preview.
                </h3>
                <p className="mt-4 max-w-lg text-sm leading-7 text-muted">
                  The timeline will show customer creation, messages, assistant
                  replies, booking movement, KPI markers, day summaries, and a
                  safe simulation finish event.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-[1.25rem] bg-accent-soft px-4 py-3 text-sm font-semibold text-stone-800">
                  {preview.run.simulatedLabel}
                </div>

                <div className="flex flex-wrap gap-2">
                  {timelineFilters.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setActiveTimelineFilter(filter.value)}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                        activeTimelineFilter === filter.value
                          ? "border-accent bg-accent text-white"
                          : "border-line bg-white/60 text-stone-700 hover:bg-white"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {filteredTimelineCount === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-line bg-white/35 px-5 py-10 text-center text-sm leading-7 text-muted">
                    No timeline moments match this filter.
                  </div>
                ) : (
                  <div className="max-h-[46rem] space-y-5 overflow-auto pr-1">
                    {filteredTimelineGroups.map((group) => (
                      <section key={group.date} className="space-y-3">
                        <div className="flex items-center justify-between gap-3 rounded-full border border-line bg-white/50 px-4 py-2">
                          <h3 className="text-sm font-semibold text-stone-900">
                            {group.label}
                          </h3>
                          <span className="font-mono text-xs text-muted">
                            {group.date}
                          </span>
                        </div>

                        {group.items.map((item) => (
                          <article
                            key={item.id}
                            className="rounded-[1.25rem] border border-line bg-white/60 px-4 py-4"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="text-sm font-semibold text-stone-900">
                                  {item.label}
                                </div>
                                <div className="mt-2 inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-stone-800">
                                  {categoryLabels[item.category]}
                                </div>
                              </div>
                              <time className="font-mono text-xs text-muted">
                                {item.time}
                              </time>
                            </div>
                            <p className="mt-3 text-sm leading-7 text-stone-700">
                              {item.detail}
                            </p>
                          </article>
                        ))}
                      </section>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="glass-panel rounded-[2rem] px-5 py-5">
            <p className="section-eyebrow">Summary</p>
            <h2 className="mt-2 text-xl font-semibold text-stone-900">
              KPI preview
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Local simulated preview metrics. These are generated from the same
              event sequence shown in the timeline.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {(
                preview?.summaryCards ?? [
                  { label: "Customers", value: 0 },
                  { label: "Inbound messages", value: 0 },
                  { label: "Assistant replies", value: 0 },
                  { label: "Bookings touched", value: 0 },
                  { label: "Confirmed", value: 0 },
                  { label: "Completed", value: 0 },
                  { label: "Cancelled", value: 0 },
                  { label: "No-shows", value: 0 },
                  { label: "Rescheduled", value: 0 },
                ]
              ).map((card) => (
                <div
                  key={card.label}
                  className="rounded-[1.25rem] border border-line bg-white/55 px-4 py-4"
                >
                  <div className="section-eyebrow">{card.label}</div>
                  <div className="mt-2 text-3xl font-semibold text-stone-900">
                    {card.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-line bg-white/55 p-4 text-sm leading-7 text-stone-700">
              <div className="font-semibold text-stone-900">Fixture access</div>
              <p className="mt-2 text-muted">
                The existing session-alpha fixture remains available for
                comparison.
              </p>
              <Link
                href={`/demo-session/${fixtureSession?.id ?? "session-alpha"}`}
                className="mt-4 inline-flex rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-white"
              >
                Open session-alpha
              </Link>
            </div>
          </aside>
        </section>

        <footer className="flex justify-between gap-4 text-sm">
          <Link
            href="/"
            className="rounded-full border border-line bg-white/60 px-4 py-2"
          >
            Back home
          </Link>
          <span className="rounded-full border border-line bg-white/40 px-4 py-2 text-muted">
            Local simulated preview · no external API · no storage
          </span>
        </footer>
      </div>
    </main>
  );
}
