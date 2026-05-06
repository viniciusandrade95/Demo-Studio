import { assertNever } from "@/lib/assertNever";
import type {
  DemoBookingStatus,
  DemoEvent,
  DemoEventKind,
  DemoKpiSnapshot,
  DemoSession,
  SimulationEventCategory,
} from "@/lib/simulation/types";

type SessionTimelineItem = {
  id: string;
  at: string;
  label: string;
  detail: string;
  lane: "messages" | "bookings" | "kpi" | "operations" | "summary" | "warning";
};

export type DemoSessionProjection = {
  session: DemoSession;
  timeline: SessionTimelineItem[];
  metrics: DemoKpiSnapshot;
  bookingStatuses: Record<string, DemoBookingStatus>;
};

export const EMPTY_DEMO_KPI_SNAPSHOT: DemoKpiSnapshot = {
  inboundMessages: 0,
  assistantReplies: 0,
  bookingsTouched: 0,
  confirmedBookings: 0,
  completedBookings: 0,
  cancelledBookings: 0,
  noShowBookings: 0,
  rescheduledBookings: 0,
};

export const demoEventKinds = [
  "customer_created",
  "customer_message",
  "assistant_reply",
  "booking_created",
  "booking_updated",
  "kpi_marker",
  "simulation_started",
  "simulation_finished",
  "day_summary",
  "warning_generated",
] as const satisfies readonly DemoEventKind[];

function sortEvents(events: DemoEvent[]): DemoEvent[] {
  return [...events].sort((left, right) => {
    const byTime = left.at.localeCompare(right.at);
    return byTime !== 0 ? byTime : left.id.localeCompare(right.id);
  });
}

function deriveBookingStatuses(
  events: DemoEvent[],
): Record<string, DemoBookingStatus> {
  const statuses: Record<string, DemoBookingStatus> = {};

  for (const event of sortEvents(events)) {
    if (event.kind === "booking_created" || event.kind === "booking_updated") {
      statuses[event.bookingId] = event.status;
    }
  }

  return statuses;
}

function deriveMetrics(events: DemoEvent[]): DemoKpiSnapshot {
  const bookingStatuses = deriveBookingStatuses(events);
  const bookingsTouched = Object.keys(bookingStatuses).length;

  let inboundMessages = 0;
  let assistantReplies = 0;

  for (const event of events) {
    switch (event.kind) {
      case "customer_message":
        inboundMessages += 1;
        break;
      case "assistant_reply":
        assistantReplies += 1;
        break;
      case "customer_created":
      case "booking_created":
      case "booking_updated":
      case "kpi_marker":
      case "simulation_started":
      case "simulation_finished":
      case "day_summary":
      case "warning_generated":
        break;
      default:
        assertNever(event, "deriveMetrics");
    }
  }

  const statusCount = (status: DemoBookingStatus) =>
    Object.values(bookingStatuses).filter((value) => value === status).length;

  return {
    ...EMPTY_DEMO_KPI_SNAPSHOT,
    inboundMessages,
    assistantReplies,
    bookingsTouched,
    confirmedBookings: statusCount("confirmed"),
    completedBookings: statusCount("completed"),
    cancelledBookings: statusCount("cancelled"),
    noShowBookings: statusCount("no_show"),
    rescheduledBookings: statusCount("rescheduled"),
  };
}

export function getDemoEventCategory(
  kind: DemoEventKind,
): SimulationEventCategory {
  switch (kind) {
    case "customer_created":
      return "customer";
    case "customer_message":
    case "assistant_reply":
      return "message";
    case "booking_created":
    case "booking_updated":
      return "booking";
    case "kpi_marker":
      return "kpi";
    case "simulation_started":
    case "simulation_finished":
      return "lifecycle";
    case "day_summary":
      return "summary";
    case "warning_generated":
      return "warning";
    default:
      return assertNever(kind, "getDemoEventCategory");
  }
}

function toTimelineItem(event: DemoEvent): SessionTimelineItem {
  switch (event.kind) {
    case "customer_created":
      return {
        id: event.id,
        at: event.at,
        label: `${event.customerName} added`,
        detail: `New simulated customer from ${event.source}`,
        lane: "operations",
      };
    case "customer_message":
      return {
        id: event.id,
        at: event.at,
        label: `${event.customerName} wrote in`,
        detail: event.message,
        lane: "messages",
      };
    case "assistant_reply":
      return {
        id: event.id,
        at: event.at,
        label: `Assistant replied to ${event.customerName}`,
        detail: event.message,
        lane: "messages",
      };
    case "booking_created":
      return {
        id: event.id,
        at: event.at,
        label: `${event.customerName} booking ${event.status}`,
        detail: `${event.serviceName} at ${event.scheduledFor}`,
        lane: "bookings",
      };
    case "booking_updated":
      return {
        id: event.id,
        at: event.at,
        label: `${event.customerName} booking ${event.status}`,
        detail: `${event.serviceName} at ${event.scheduledFor}`,
        lane: "bookings",
      };
    case "kpi_marker":
      return {
        id: event.id,
        at: event.at,
        label: event.label,
        detail: event.value,
        lane: "kpi",
      };
    case "simulation_started":
      return {
        id: event.id,
        at: event.at,
        label: "Simulation started",
        detail: `${event.scenarioSlug} for ${event.profileSlug} in ${event.mode} mode`,
        lane: "operations",
      };
    case "simulation_finished":
      return {
        id: event.id,
        at: event.at,
        label: "Simulation finished",
        detail: `${event.summary} (${event.safetyStatus})`,
        lane: "operations",
      };
    case "day_summary":
      return {
        id: event.id,
        at: event.at,
        label: event.headline,
        detail: event.highlights.join(" • "),
        lane: "summary",
      };
    case "warning_generated":
      return {
        id: event.id,
        at: event.at,
        label: event.title,
        detail: event.message,
        lane: "warning",
      };
    default:
      return assertNever(event, "toTimelineItem");
  }
}

export function projectDemoSession(
  session: DemoSession,
): DemoSessionProjection {
  const sortedEvents = sortEvents(session.events);

  return {
    session,
    timeline: sortedEvents.map(toTimelineItem),
    metrics: deriveMetrics(sortedEvents),
    bookingStatuses: deriveBookingStatuses(sortedEvents),
  };
}
