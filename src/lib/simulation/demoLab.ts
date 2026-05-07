import { projectDemoSession } from "@/lib/simulation/engine";
import { groupTimelineByDay } from "@/lib/simulation/timeline";
import {
  businessProfiles,
  getBusinessProfileBySlug,
  getScenarioPresetBySlug,
  scenarioPresets,
} from "@/lib/simulation/fixtures";
import { generateSimulationRun } from "@/lib/simulation/generator";
import {
  calculateImpactSummary,
  type ImpactSummary,
} from "@/lib/simulation/impact";
import type {
  SimulationIntensity,
  SimulationRequest,
  SimulationRun,
} from "@/lib/simulation/types";

export type DemoLabFormState = {
  profileSlug: string;
  scenarioSlug: string;
  simulatedDays: string;
  appointmentsPerDay: string;
  seed: string;
  intensity: SimulationIntensity;
  startDate: string;
};

export type DemoLabSummaryCard = {
  label: string;
  value: number;
};

export type DemoLabPreview = {
  run: SimulationRun;
  timeline: ReturnType<typeof projectDemoSession>["timeline"];
  timelineGroups: ReturnType<typeof groupTimelineByDay>;
  summaryCards: DemoLabSummaryCard[];
  impactSummary: ImpactSummary;
};

export type DemoLabPreviewResult =
  | { ok: true; preview: DemoLabPreview }
  | { ok: false; error: string };

export function getDefaultDemoLabFormState(): DemoLabFormState {
  return {
    profileSlug: businessProfiles[0]?.slug ?? "",
    scenarioSlug: scenarioPresets[0]?.slug ?? "",
    simulatedDays: "2",
    appointmentsPerDay: "3",
    seed: "local-preview-01",
    intensity: "medium",
    startDate: "2026-05-06",
  };
}

function parsePositiveInteger(value: string, label: string): number | string {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return `${label} must be a positive whole number.`;
  }

  return parsed;
}

export function buildDemoLabSummaryCards(
  run: SimulationRun,
): DemoLabSummaryCard[] {
  const { eventCounts, metrics } = run.summary;

  return [
    { label: "Customers", value: eventCounts.customer_created },
    { label: "Inbound messages", value: metrics.inboundMessages },
    { label: "Assistant replies", value: metrics.assistantReplies },
    { label: "Bookings touched", value: metrics.bookingsTouched },
    { label: "Confirmed", value: metrics.confirmedBookings },
    { label: "Completed", value: metrics.completedBookings },
    { label: "Cancelled", value: metrics.cancelledBookings },
    { label: "No-shows", value: metrics.noShowBookings },
    { label: "Rescheduled", value: metrics.rescheduledBookings },
  ];
}

export function buildSimulationRequestFromDemoLabForm(
  form: DemoLabFormState,
): SimulationRequest | string {
  if (!getBusinessProfileBySlug(form.profileSlug)) {
    return "Choose a valid business profile before generating a preview.";
  }

  if (!getScenarioPresetBySlug(form.scenarioSlug)) {
    return "Choose a valid scenario before generating a preview.";
  }

  if (!form.seed.trim()) {
    return "Seed is required for deterministic local generation.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)) {
    return "Start date must use YYYY-MM-DD format.";
  }

  const simulatedDays = parsePositiveInteger(
    form.simulatedDays,
    "Simulated days",
  );
  if (typeof simulatedDays === "string") {
    return simulatedDays;
  }

  const appointmentsPerDay = parsePositiveInteger(
    form.appointmentsPerDay,
    "Appointments per day",
  );
  if (typeof appointmentsPerDay === "string") {
    return appointmentsPerDay;
  }

  return {
    profileSlug: form.profileSlug,
    scenarioSlug: form.scenarioSlug,
    seed: form.seed.trim(),
    simulatedDays,
    appointmentsPerDay,
    startDate: form.startDate,
    intensity: form.intensity,
    mode: "guided",
  };
}

export function buildDemoLabPreviewFromRun(run: SimulationRun): DemoLabPreview {
  const projection = projectDemoSession(run.session);
  const timelineGroups = groupTimelineByDay(run.events);
  const impactSummary = calculateImpactSummary(run);

  return {
    run,
    timeline: projection.timeline,
    timelineGroups,
    summaryCards: buildDemoLabSummaryCards(run),
    impactSummary,
  };
}

export function generateDemoLabPreview(
  form: DemoLabFormState,
): DemoLabPreviewResult {
  const request = buildSimulationRequestFromDemoLabForm(form);

  if (typeof request === "string") {
    return { ok: false, error: request };
  }

  return {
    ok: true,
    preview: buildDemoLabPreviewFromRun(generateSimulationRun(request)),
  };
}
