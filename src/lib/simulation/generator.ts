import {
  businessProfiles,
  getBusinessProfileBySlug,
  getScenarioPresetBySlug,
} from "@/lib/simulation/fixtures";
import { createSeededRandom, type SeededRandom } from "@/lib/simulation/random";
import { buildSimulationSummary } from "@/lib/simulation/summary";
import type {
  BusinessProfile,
  DemoBookingStatus,
  DemoChannel,
  DemoEvent,
  DemoMode,
  ScenarioPreset,
  SimulationIntensity,
  SimulationRequest,
  SimulationRun,
} from "@/lib/simulation/types";

type DemoEventWithoutId = DemoEvent extends infer Event
  ? Event extends DemoEvent
    ? Omit<Event, "id">
    : never
  : never;

const CUSTOMER_NAMES = [
  "Sofia Lima",
  "Miguel Costa",
  "Ana Ribeiro",
  "Luis Matos",
  "Carolina Santos",
  "Rita Gomes",
  "Joao Martins",
  "Mariana Lopes",
  "Tiago Ferreira",
  "Ines Almeida",
] as const;

const PROFILE_MESSAGE_TEMPLATES: Record<BusinessProfile["vertical"], string[]> =
  {
    beauty_salon: [
      "Do you have time for {service} this week?",
      "Can I book {service} before an event?",
      "I am comparing options for {service}. What times are open?",
    ],
    barbershop: [
      "Any slot for {service} after work?",
      "Can I get {service} today or tomorrow?",
      "I need a quick {service}. What do you have free?",
    ],
    nail_studio: [
      "Can I book {service} with a calm finish?",
      "Do you have availability for {service} this afternoon?",
      "I want {service} before the weekend. Any openings?",
    ],
  };

const ASSISTANT_REPLY_TEMPLATES = [
  "Yes — I can hold {time} for {service}. Would you like me to confirm it?",
  "I found {time} for {service}. I can reserve it now in this simulated demo.",
  "There is a good opening at {time} for {service}. Shall I place it on the calendar?",
] as const;

const INTENSITY_VOLUME: Record<SimulationIntensity, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

const INTENSITY_PRESSURE: Record<SimulationIntensity, number> = {
  low: 0.75,
  medium: 1,
  high: 1.25,
};

type ScenarioBehavior = {
  cancellationRate: number;
  noShowRate: number;
  rescheduleRate: number;
  extraMessageRate: number;
};

const SCENARIO_BEHAVIOR: Record<string, ScenarioBehavior> = {
  calm_week: {
    cancellationRate: 0.05,
    noShowRate: 0.03,
    rescheduleRate: 0.08,
    extraMessageRate: 0.15,
  },
  busy_weekend: {
    cancellationRate: 0.08,
    noShowRate: 0.06,
    rescheduleRate: 0.18,
    extraMessageRate: 0.3,
  },
  chaotic_day: {
    cancellationRate: 0.18,
    noShowRate: 0.13,
    rescheduleRate: 0.28,
    extraMessageRate: 0.45,
  },
  new_business: {
    cancellationRate: 0.06,
    noShowRate: 0.05,
    rescheduleRate: 0.1,
    extraMessageRate: 0.25,
  },
  mature_business: {
    cancellationRate: 0.1,
    noShowRate: 0.07,
    rescheduleRate: 0.2,
    extraMessageRate: 0.35,
  },
  promo_campaign: {
    cancellationRate: 0.12,
    noShowRate: 0.08,
    rescheduleRate: 0.22,
    extraMessageRate: 0.5,
  },
};

function isoAt(
  startDate: string,
  dayOffset: number,
  hour: number,
  minute: number,
) {
  const [year, month, day] = startDate.split("-").map(Number);
  return new Date(
    Date.UTC(year, month - 1, day + dayOffset, hour, minute),
  ).toISOString();
}

function dateOnly(startDate: string, dayOffset: number) {
  return isoAt(startDate, dayOffset, 0, 0).slice(0, 10);
}

function eventId(sequence: number) {
  return `gen-evt-${String(sequence).padStart(4, "0")}`;
}

function chooseTerminalStatus(
  behavior: ScenarioBehavior,
  pressure: number,
  random: SeededRandom,
): Exclude<DemoBookingStatus, "requested" | "confirmed"> {
  if (random.chance(behavior.cancellationRate * pressure)) {
    return "cancelled";
  }

  if (random.chance(behavior.noShowRate * pressure)) {
    return "no_show";
  }

  if (random.chance(behavior.rescheduleRate * pressure)) {
    return "rescheduled";
  }

  return "completed";
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function messageFromTemplate(
  template: string,
  serviceName: string,
  time: string,
) {
  return template
    .replaceAll("{service}", serviceName)
    .replaceAll("{time}", time);
}

function resolveScenarioBehavior(scenario: ScenarioPreset) {
  return SCENARIO_BEHAVIOR[scenario.slug] ?? SCENARIO_BEHAVIOR.calm_week;
}

function eventCountsForDay(events: DemoEvent[], summaryDate: string) {
  return events.filter((event) => event.at.slice(0, 10) === summaryDate).length;
}

function sortGeneratedEvents(events: DemoEvent[]) {
  return [...events].sort((left, right) => {
    const byTime = left.at.localeCompare(right.at);
    return byTime !== 0 ? byTime : left.id.localeCompare(right.id);
  });
}

export function generateSimulationRun(
  request: SimulationRequest,
): SimulationRun {
  const profile = getBusinessProfileBySlug(request.profileSlug);
  const scenario = getScenarioPresetBySlug(request.scenarioSlug);

  if (!profile) {
    throw new Error(`Unknown business profile: ${request.profileSlug}`);
  }

  if (!scenario) {
    throw new Error(`Unknown scenario preset: ${request.scenarioSlug}`);
  }

  const random = createSeededRandom(
    `${request.seed}:${request.profileSlug}:${request.scenarioSlug}`,
  );
  const mode: DemoMode = request.mode ?? "guided";
  const behavior = resolveScenarioBehavior(scenario);
  const pressure = INTENSITY_PRESSURE[request.intensity];
  const appointmentsPerDay = Math.max(
    0,
    Math.floor(request.appointmentsPerDay),
  );
  const simulatedDays = Math.max(1, Math.floor(request.simulatedDays));
  const createdAt = isoAt(request.startDate, 0, 7, 30);
  const startedAt = isoAt(request.startDate, 0, 8, 0);
  const finishedAt = isoAt(request.startDate, simulatedDays - 1, 18, 15);
  const runId = `run-${request.profileSlug}-${request.scenarioSlug}-${random.integer(
    100000,
    999999,
  )}`;
  const simulatedLabel = `Local deterministic simulation only. Seed: ${request.seed}. No external APIs, storage, or live writes.`;
  const events: DemoEvent[] = [];
  let sequence = 1;
  let customerCursor = random.integer(0, CUSTOMER_NAMES.length - 1);

  const pushEvent = (event: DemoEventWithoutId) => {
    events.push({ ...event, id: eventId(sequence) } as DemoEvent);
    sequence += 1;
  };

  pushEvent({
    kind: "simulation_started",
    at: startedAt,
    profileSlug: profile.slug,
    scenarioSlug: scenario.slug,
    mode,
  });

  for (let dayOffset = 0; dayOffset < simulatedDays; dayOffset += 1) {
    const summaryDate = dateOnly(request.startDate, dayOffset);
    const baseVolume = appointmentsPerDay + INTENSITY_VOLUME[request.intensity];
    const dayVolume = Math.max(
      0,
      baseVolume + random.integer(-1, request.intensity === "high" ? 2 : 1),
    );

    for (
      let appointmentIndex = 0;
      appointmentIndex < dayVolume;
      appointmentIndex += 1
    ) {
      const customerName =
        CUSTOMER_NAMES[customerCursor % CUSTOMER_NAMES.length];
      customerCursor += 1;

      const serviceName = random.pick(profile.services);
      const channel: DemoChannel = random.pick(["whatsapp", "web_chat"]);
      const scheduledHour = 9 + ((appointmentIndex * 2) % 8);
      const scheduledMinute = random.pick([0, 10, 20, 30, 40, 50]);
      const inquiryHour = Math.max(8, scheduledHour - random.integer(1, 3));
      const inquiryMinute = random.integer(0, 50);
      const scheduledFor = isoAt(
        request.startDate,
        dayOffset,
        scheduledHour,
        scheduledMinute,
      );
      const displayTime = formatTime(scheduledHour, scheduledMinute);
      const customerId = `CUS-${String(dayOffset + 1).padStart(2, "0")}-${String(
        appointmentIndex + 1,
      ).padStart(3, "0")}`;
      const bookingId = `BK-${String(dayOffset + 1).padStart(2, "0")}-${String(
        appointmentIndex + 1,
      ).padStart(3, "0")}`;

      pushEvent({
        kind: "customer_created",
        at: isoAt(request.startDate, dayOffset, inquiryHour, inquiryMinute),
        customerId,
        customerName,
        source: channel,
      });
      pushEvent({
        kind: "customer_message",
        at: isoAt(request.startDate, dayOffset, inquiryHour, inquiryMinute + 1),
        customerName,
        channel,
        direction: "inbound",
        message: messageFromTemplate(
          random.pick(PROFILE_MESSAGE_TEMPLATES[profile.vertical]),
          serviceName,
          displayTime,
        ),
      });

      if (random.chance(behavior.extraMessageRate * pressure)) {
        pushEvent({
          kind: "customer_message",
          at: isoAt(
            request.startDate,
            dayOffset,
            inquiryHour,
            inquiryMinute + 2,
          ),
          customerName,
          channel,
          direction: "inbound",
          message: `If ${displayTime} works, can you also note that this is for ${scenario.title.toLowerCase()}?`,
        });
      }

      pushEvent({
        kind: "assistant_reply",
        at: isoAt(request.startDate, dayOffset, inquiryHour, inquiryMinute + 4),
        customerName,
        channel,
        direction: "outbound",
        message: messageFromTemplate(
          random.pick(ASSISTANT_REPLY_TEMPLATES),
          serviceName,
          displayTime,
        ),
      });
      pushEvent({
        kind: "booking_created",
        at: isoAt(request.startDate, dayOffset, inquiryHour, inquiryMinute + 6),
        bookingId,
        customerName,
        serviceName,
        scheduledFor,
        status: "requested",
      });
      pushEvent({
        kind: "booking_updated",
        at: isoAt(request.startDate, dayOffset, inquiryHour, inquiryMinute + 8),
        bookingId,
        customerName,
        serviceName,
        scheduledFor,
        status: "confirmed",
      });

      const terminalStatus = chooseTerminalStatus(behavior, pressure, random);
      const terminalMinute = scheduledMinute + 55;

      pushEvent({
        kind: "booking_updated",
        at: isoAt(request.startDate, dayOffset, scheduledHour, terminalMinute),
        bookingId,
        customerName,
        serviceName,
        scheduledFor:
          terminalStatus === "rescheduled"
            ? isoAt(
                request.startDate,
                dayOffset,
                scheduledHour + 1,
                scheduledMinute,
              )
            : scheduledFor,
        status: terminalStatus,
      });
    }

    pushEvent({
      kind: "kpi_marker",
      at: isoAt(request.startDate, dayOffset, 17, 45),
      label: `${scenario.title} momentum`,
      value: `${eventCountsForDay(events, summaryDate)} simulated events today`,
      tone: behavior.cancellationRate * pressure > 0.15 ? "warning" : "accent",
    });
    pushEvent({
      kind: "day_summary",
      at: isoAt(request.startDate, dayOffset, 17, 55),
      summaryDate,
      headline: `${profile.name} ${scenario.title.toLowerCase()} day ${dayOffset + 1}`,
      highlights: [
        `${dayVolume} appointment conversations generated`,
        `${profile.services.length} services available in profile`,
        `Intensity: ${request.intensity}`,
      ],
    });
  }

  pushEvent({
    kind: "simulation_finished",
    at: finishedAt,
    summary: `${scenario.title} completed for ${profile.name}`,
    safetyStatus: "simulated_only",
  });

  const sortedEvents = sortGeneratedEvents(events);
  const session = {
    id: `session-${runId}`,
    title: `${profile.name} — ${scenario.title}`,
    businessName: profile.name,
    vertical: profile.vertical,
    city: profile.city,
    scenario: scenario.title,
    operatorSummary: scenario.commercialStory,
    simulatedLabel,
    events: sortedEvents,
    profileSlug: profile.slug,
    scenarioSlug: scenario.slug,
    mode,
    safetyStatus: "simulated_only",
  } satisfies SimulationRun["session"];
  const summary = buildSimulationSummary(session, "simulated_only");

  return {
    runId,
    id: runId,
    request,
    createdAt,
    startedAt,
    finishedAt,
    simulatedLabel,
    events: sortedEvents,
    session,
    summary,
  };
}

export const supportedSimulationProfiles = businessProfiles.map(
  (profile) => profile.slug,
);
