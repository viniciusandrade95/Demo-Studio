"use client";

import Link from "next/link";
import {
  getConnectorStatusCopy,
  getPublicTheOneConnectorConfig,
} from "@/connectors/theone";
import { salesDemoScripts, type SalesDemoScript } from "@/lib/demoScripts";
import {
  downloadTextFile,
  exportRunAsJson,
  exportRunAsMarkdown,
} from "@/lib/export";
import { useEffect, useMemo, useReducer, useState } from "react";
import {
  businessProfiles,
  demoSessions,
  scenarioPresets,
} from "@/lib/simulation/fixtures";
import {
  buildDemoLabPreviewFromRun,
  generateDemoLabPreview,
  getDefaultDemoLabFormState,
  type DemoLabFormState,
  type DemoLabPreview,
  buildDemoLabSummaryCards,
} from "@/lib/simulation/demoLab";
import { projectDemoSession } from "@/lib/simulation/engine";
import { generateSimulationRun } from "@/lib/simulation/generator";
import {
  buildInjectionPreview,
  getPreviewCapabilitiesForMode,
  type InjectionPreview,
} from "@/lib/simulation/injection";
import { calculateImpactSummary } from "@/lib/simulation/impact";
import {
  createInitialPlaybackState,
  getPlaybackIntervalMs,
  getRevealedEvents,
  playbackSpeeds,
  simulationPlaybackReducer,
  type PlaybackSpeed,
} from "@/lib/simulation/playback";
import {
  deleteSimulationRun,
  listSimulationRuns,
  saveSimulationRun,
} from "@/lib/simulation/storage";
import {
  groupTimelineByDay,
  type TimelineCategory,
} from "@/lib/simulation/timeline";
import type {
  SimulationIntensity,
  SimulationRun,
} from "@/lib/simulation/types";

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

function formatEstimatedCurrency(value: number) {
  return new Intl.NumberFormat("en", {
    currency: "EUR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatEstimatedMinutes(value: number) {
  return `${value} min`;
}

export default function DemoLabPage() {
  const [form, setForm] = useState<DemoLabFormState>(() =>
    getDefaultDemoLabFormState(),
  );
  const [preview, setPreview] = useState<DemoLabPreview | null>(null);
  const [injectionPreview, setInjectionPreview] =
    useState<InjectionPreview | null>(null);
  const [recentRuns, setRecentRuns] = useState<SimulationRun[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedScriptId, setSelectedScriptId] = useState(
    salesDemoScripts[0]?.id ?? "",
  );
  const [activeScript, setActiveScript] = useState<SalesDemoScript | null>(
    null,
  );
  const [activeTimelineFilter, setActiveTimelineFilter] =
    useState<TimelineFilter>("all");
  const [playbackState, dispatchPlayback] = useReducer(
    simulationPlaybackReducer,
    createInitialPlaybackState(),
  );
  const fixtureSession = demoSessions[0];
  const connectorConfig = getPublicTheOneConnectorConfig();
  const connectorStatus = getConnectorStatusCopy(connectorConfig);
  const selectedProfile = useMemo(
    () => businessProfiles.find((profile) => profile.slug === form.profileSlug),
    [form.profileSlug],
  );
  const selectedScenario = useMemo(
    () =>
      scenarioPresets.find((scenario) => scenario.slug === form.scenarioSlug),
    [form.scenarioSlug],
  );

  const selectedScript = useMemo(
    () =>
      salesDemoScripts.find((script) => script.id === selectedScriptId) ?? null,
    [selectedScriptId],
  );

  const loadSelectedScript = () => {
    if (!selectedScript) {
      return;
    }

    setForm((current) => ({
      ...current,
      appointmentsPerDay: String(selectedScript.suggestedAppointmentsPerDay),
      intensity: selectedScript.suggestedIntensity,
      profileSlug: selectedScript.recommendedProfileSlug,
      scenarioSlug: selectedScript.recommendedScenarioSlug,
      seed: selectedScript.suggestedSeed,
      simulatedDays: String(selectedScript.suggestedSimulatedDays),
    }));
    setActiveScript(selectedScript);
  };

  const updateForm = (field: keyof DemoLabFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const refreshRecentRuns = () => {
    setRecentRuns(listSimulationRuns());
  };

  useEffect(() => {
    const timerId = window.setTimeout(refreshRecentRuns, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const openRunPreview = (run: SimulationRun, revealAll = true) => {
    setPreview(buildDemoLabPreviewFromRun(run));
    setInjectionPreview(null);
    dispatchPlayback({ totalEvents: run.events.length, type: "initialize" });
    if (revealAll) {
      dispatchPlayback({ type: "show_full_preview" });
    }
    setActiveTimelineFilter("all");
    setError(null);
  };

  const handleDeleteRun = (runId: string) => {
    deleteSimulationRun(runId);
    refreshRecentRuns();

    if (preview?.run.runId === runId) {
      setPreview(null);
      setInjectionPreview(null);
      dispatchPlayback({ totalEvents: 0, type: "initialize" });
    }
  };

  const handleRerun = (run: SimulationRun) => {
    const nextRun = generateSimulationRun({
      ...run.request,
      seed: `${run.request.seed}-copy`,
    });
    saveSimulationRun(nextRun);
    refreshRecentRuns();
    openRunPreview(nextRun);
  };

  const revealedEvents = useMemo(() => {
    if (!preview) {
      return [];
    }

    return getRevealedEvents(preview.run.events, playbackState);
  }, [playbackState, preview]);

  const visibleTimelineGroups = useMemo(
    () => groupTimelineByDay(revealedEvents),
    [revealedEvents],
  );

  const visibleSummaryCards = useMemo(() => {
    if (!preview) {
      return null;
    }

    const partialSession = {
      ...preview.run.session,
      events: revealedEvents,
    };
    const partialProjection = projectDemoSession(partialSession);

    return buildDemoLabSummaryCards({
      ...preview.run,
      events: revealedEvents,
      session: partialSession,
      summary: {
        ...preview.run.summary,
        eventCounts: {
          ...preview.run.summary.eventCounts,
          customer_created: revealedEvents.filter(
            (event) => event.kind === "customer_created",
          ).length,
        },
        metrics: partialProjection.metrics,
        totalEvents: revealedEvents.length,
      },
    });
  }, [preview, revealedEvents]);

  const visibleImpactSummary = useMemo(() => {
    if (!preview) {
      return null;
    }

    return calculateImpactSummary(revealedEvents);
  }, [preview, revealedEvents]);

  const filteredTimelineGroups = useMemo(() => {
    if (!preview) {
      return [];
    }

    return visibleTimelineGroups
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
  }, [activeTimelineFilter, preview, visibleTimelineGroups]);

  const filteredTimelineCount = filteredTimelineGroups.reduce(
    (total, group) => total + group.items.length,
    0,
  );

  const impactCards = visibleImpactSummary
    ? [
        {
          label: "Estimated revenue",
          value: formatEstimatedCurrency(visibleImpactSummary.estimatedRevenue),
        },
        {
          label: "Messages handled",
          value: visibleImpactSummary.messagesHandled.toString(),
        },
        {
          label: "Assistant replies",
          value: visibleImpactSummary.assistantReplies.toString(),
        },
        {
          label: "Manual replies saved",
          value: visibleImpactSummary.manualRepliesSaved.toString(),
        },
        {
          label: "Manual work saved",
          value: formatEstimatedMinutes(
            visibleImpactSummary.manualWorkSavedMinutes,
          ),
        },
        {
          label: "Bookings converted",
          value: visibleImpactSummary.bookingsConverted.toString(),
        },
        {
          label: "Disruptions",
          value: visibleImpactSummary.disruptionCount.toString(),
        },
        {
          label: "Occupancy estimate",
          value: `${visibleImpactSummary.occupancyEstimate}%`,
        },
        {
          label: "New customers",
          value: visibleImpactSummary.newCustomers.toString(),
        },
        {
          label: "Cancel/no-show pressure",
          value: visibleImpactSummary.cancelledNoShowPressure.toString(),
        },
      ]
    : [];

  useEffect(() => {
    if (playbackState.status !== "playing") {
      return;
    }

    const intervalMs = getPlaybackIntervalMs(playbackState.speed);
    if (intervalMs === null) {
      dispatchPlayback({ type: "show_full_preview" });
      return;
    }

    const timerId = window.setInterval(() => {
      dispatchPlayback({ type: "tick" });
    }, intervalMs);

    return () => window.clearInterval(timerId);
  }, [playbackState.speed, playbackState.status]);

  const handleExport = (format: "json" | "markdown") => {
    if (!preview || !visibleImpactSummary) {
      return;
    }

    const filenameBase = `${preview.run.runId}-demo-pack`;
    if (format === "json") {
      downloadTextFile(`${filenameBase}.json`, exportRunAsJson(preview.run));
      return;
    }

    downloadTextFile(
      `${filenameBase}.md`,
      exportRunAsMarkdown(preview.run, visibleImpactSummary, activeScript),
    );
  };

  const handlePrepareInjectionPreview = () => {
    if (!preview) {
      return;
    }

    setInjectionPreview(
      buildInjectionPreview({
        capabilities: getPreviewCapabilitiesForMode(connectorConfig.mode),
        runId: preview.run.runId,
        targetDemoTenant: "Mock demo tenant placeholder",
      }),
    );
  };

  const handleGenerate = () => {
    const result = generateDemoLabPreview(form);

    if (!result.ok) {
      setPreview(null);
      setError(result.error);
      return;
    }

    setPreview(result.preview);
    setInjectionPreview(null);
    saveSimulationRun(result.preview.run);
    refreshRecentRuns();
    dispatchPlayback({
      totalEvents: result.preview.run.events.length,
      type: "initialize",
    });
    setActiveTimelineFilter("all");
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

            <div className="mt-5 rounded-[1.25rem] border border-line bg-white/55 p-4">
              <div className="section-eyebrow">Sales script</div>
              <select
                value={selectedScriptId}
                onChange={(event) => setSelectedScriptId(event.target.value)}
                className="mt-3 w-full rounded-[1rem] border border-line bg-white/70 px-3 py-3 text-sm text-stone-900 outline-none focus:border-accent"
              >
                {salesDemoScripts.map((script) => (
                  <option key={script.id} value={script.id}>
                    {script.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={loadSelectedScript}
                className="mt-3 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white"
              >
                Load script
              </button>
              {activeScript ? (
                <div className="mt-4 text-sm leading-7 text-stone-700">
                  <div className="font-semibold text-stone-900">
                    {activeScript.title}
                  </div>
                  <p className="mt-2 text-muted">{activeScript.painPoint}</p>
                </div>
              ) : null}
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

            <div className="mt-4 rounded-[1.25rem] border border-line bg-white/55 p-4 text-sm leading-7 text-stone-700">
              <div className="section-eyebrow">{connectorStatus.eyebrow}</div>
              <div className="mt-2 font-semibold text-stone-900">
                {connectorStatus.title}
              </div>
              <p className="mt-2 text-muted">{connectorStatus.description}</p>
              <div className="mt-3 rounded-full bg-accent-soft px-3 py-2 text-xs font-semibold text-stone-800">
                Local mode remains the source of truth for this demo.
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

            {preview ? (
              <div className="mt-4 rounded-[1.5rem] border border-line bg-white/45 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => dispatchPlayback({ type: "play" })}
                    className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                  >
                    Play
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatchPlayback({ type: "pause" })}
                    className="rounded-full border border-line bg-white/70 px-4 py-2 text-xs font-semibold text-stone-800 transition hover:bg-white"
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatchPlayback({ type: "restart" })}
                    className="rounded-full border border-line bg-white/70 px-4 py-2 text-xs font-semibold text-stone-800 transition hover:bg-white"
                  >
                    Restart
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dispatchPlayback({ type: "show_full_preview" })
                    }
                    className="rounded-full border border-line bg-white/70 px-4 py-2 text-xs font-semibold text-stone-800 transition hover:bg-white"
                  >
                    Show full preview
                  </button>
                  <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-muted">
                    Speed
                    <select
                      value={playbackState.speed}
                      onChange={(event) =>
                        dispatchPlayback({
                          speed: event.target.value as PlaybackSpeed,
                          type: "set_speed",
                        })
                      }
                      className="rounded-full border border-line bg-white/70 px-3 py-2 text-xs font-semibold text-stone-800 outline-none focus:border-accent"
                    >
                      {playbackSpeeds.map((speed) => (
                        <option key={speed} value={speed}>
                          {speed}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                  <span>Status: {playbackState.status}</span>
                  <span>
                    Revealed: {playbackState.revealedCount} /{" "}
                    {playbackState.totalEvents}
                  </span>
                </div>
              </div>
            ) : null}

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
                    {revealedEvents.length === 0
                      ? "No moments revealed yet. Press Play or Show full preview."
                      : "No timeline moments match this filter."}
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
                visibleSummaryCards ?? [
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

            {preview ? (
              <div className="mt-5 rounded-[1.5rem] border border-line bg-white/55 p-4">
                <div className="section-eyebrow">Business impact</div>
                <h3 className="mt-2 text-lg font-semibold text-stone-900">
                  Simulated commercial impact
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  This preview estimates how the business would look during a
                  demo scenario. It is simulated data, not production activity.
                </p>
                <div className="mt-4 rounded-[1rem] bg-accent-soft px-3 py-3 text-xs font-semibold leading-6 text-stone-800">
                  {visibleImpactSummary?.simulatedLabel}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {impactCards.map((card) => (
                    <div
                      key={card.label}
                      className="rounded-[1rem] border border-line bg-white/60 px-3 py-3"
                    >
                      <div className="text-xs uppercase tracking-[0.16em] text-muted">
                        {card.label}
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-stone-900">
                        {card.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {preview ? (
              <div className="mt-5 rounded-[1.5rem] border border-line bg-white/55 p-4">
                <div className="section-eyebrow">Export demo pack</div>
                <h3 className="mt-2 text-lg font-semibold text-stone-900">
                  Shareable simulated summary
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Export the generated run as JSON or a readable Markdown
                  summary. No PDF is generated yet.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleExport("json")}
                    className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white"
                  >
                    Export demo pack JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("markdown")}
                    className="rounded-full border border-line bg-white/70 px-4 py-2 text-xs font-semibold text-stone-800"
                  >
                    Export Markdown summary
                  </button>
                </div>
              </div>
            ) : null}

            {preview ? (
              <div className="mt-5 rounded-[1.5rem] border border-line bg-white/55 p-4">
                <div className="section-eyebrow">Injection Preview</div>
                <h3 className="mt-2 text-lg font-semibold text-stone-900">
                  Future demo data injection plan
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  This preview does not write data. It only describes what a
                  future safe injection could prepare for a mock demo tenant.
                </p>
                <button
                  type="button"
                  onClick={handlePrepareInjectionPreview}
                  className="mt-4 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white"
                >
                  Prepare injection preview
                </button>

                {injectionPreview ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-[1rem] bg-accent-soft px-3 py-3 text-xs font-semibold leading-6 text-stone-800">
                      {injectionPreview.copy.noWrite}
                      <br />
                      {injectionPreview.copy.appointmentsBlocked}
                      <br />
                      {injectionPreview.copy.staffBlocked}
                    </div>
                    <div className="text-sm leading-7 text-stone-700">
                      <div>Run id: {injectionPreview.runId ?? "Missing"}</div>
                      <div>Target: {injectionPreview.targetDemoTenant}</div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-[1rem] border border-line bg-white/60 p-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-muted">
                          Supported entity plan
                        </div>
                        <ul className="mt-2 space-y-2 text-sm text-stone-800">
                          {injectionPreview.supportedEntities.map((entity) => (
                            <li key={entity.entity}>
                              {entity.entity}: {entity.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-[1rem] border border-line bg-white/60 p-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-muted">
                          Unsupported entity plan
                        </div>
                        <ul className="mt-2 space-y-2 text-sm text-stone-800">
                          {injectionPreview.unsupportedEntities.map(
                            (entity) => (
                              <li key={entity.entity}>
                                {entity.entity}: {entity.reason}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="rounded-[1rem] border border-line bg-white/60 p-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-muted">
                        Safety checklist
                      </div>
                      <ul className="mt-2 space-y-2 text-sm text-stone-800">
                        {injectionPreview.safetyChecks.map((check) => (
                          <li key={check.id}>
                            {check.passed ? "✓" : "Blocked"} · {check.label}:{" "}
                            {check.detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeScript ? (
              <div className="mt-5 rounded-[1.5rem] border border-line bg-white/55 p-4">
                <div className="section-eyebrow">Talk Track</div>
                <h3 className="mt-2 text-lg font-semibold text-stone-900">
                  {activeScript.title}
                </h3>
                <div className="mt-4 space-y-4 text-sm leading-7 text-stone-700">
                  <div>
                    <div className="font-semibold text-stone-900">
                      Story beats
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {activeScript.storyBeats.map((beat) => (
                        <li key={beat}>{beat}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900">
                      Talking points
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {activeScript.talkingPoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[1rem] bg-accent-soft p-3 text-xs font-semibold text-stone-800">
                    Simulated/demo outputs only. Do not present these highlights
                    as production performance.
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 rounded-[1.5rem] border border-line bg-white/55 p-4">
              <div className="section-eyebrow">Recent local runs</div>
              <p className="mt-3 text-sm leading-7 text-muted">
                Stored only in this browser localStorage. No secrets, external
                API, or production data are used.
              </p>
              <div className="mt-4 space-y-3">
                {recentRuns.length === 0 ? (
                  <div className="rounded-[1rem] border border-dashed border-line bg-white/40 px-3 py-4 text-sm leading-7 text-muted">
                    No local runs saved yet. Generate a preview to keep it in
                    this browser.
                  </div>
                ) : (
                  recentRuns.map((run) => (
                    <div
                      key={run.runId}
                      className="rounded-[1rem] border border-line bg-white/60 px-3 py-3"
                    >
                      <div className="font-mono text-xs text-muted">
                        {run.runId}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-stone-900">
                        {run.session.title}
                      </div>
                      <div className="mt-1 text-xs leading-6 text-muted">
                        {run.request.profileSlug} · {run.request.scenarioSlug} ·
                        seed {run.request.seed}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openRunPreview(run)}
                          className="rounded-full bg-accent px-3 py-2 text-xs font-semibold text-white"
                        >
                          Reopen
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRerun(run)}
                          className="rounded-full border border-line bg-white/70 px-3 py-2 text-xs font-semibold text-stone-800"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRun(run.runId)}
                          className="rounded-full border border-line bg-white/70 px-3 py-2 text-xs font-semibold text-warn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
