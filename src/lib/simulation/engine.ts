import { assertNever } from "@/lib/assertNever";
import {
  mapEventToTimelineItem,
  type TimelineItem,
} from "@/lib/simulation/timeline";
import type {
  DemoBookingStatus,
  DemoEvent,
  DemoEventKind,
  DemoKpiSnapshot,
  DemoSession,
  SimulationEventCategory,
} from "@/lib/simulation/types";

type SessionTimelineItem = TimelineItem;

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
  return mapEventToTimelineItem(event);
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
