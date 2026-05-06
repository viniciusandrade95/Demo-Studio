import { assertNever } from "@/lib/assertNever";
import type {
  DemoBookingStatus,
  DemoEvent,
  DemoKpiSnapshot,
  DemoSession,
} from "@/lib/simulation/types";

type SessionTimelineItem = {
  id: string;
  at: string;
  label: string;
  detail: string;
  lane: "messages" | "bookings" | "kpi";
};

export type DemoSessionProjection = {
  session: DemoSession;
  timeline: SessionTimelineItem[];
  metrics: DemoKpiSnapshot;
  bookingStatuses: Record<string, DemoBookingStatus>;
};

function sortEvents(events: DemoEvent[]): DemoEvent[] {
  return [...events].sort((left, right) => {
    const byTime = left.at.localeCompare(right.at);
    return byTime !== 0 ? byTime : left.id.localeCompare(right.id);
  });
}

function deriveBookingStatuses(events: DemoEvent[]): Record<string, DemoBookingStatus> {
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
      case "booking_created":
      case "booking_updated":
      case "kpi_marker":
        break;
      default:
        assertNever(event, "deriveMetrics");
    }
  }

  const statusCount = (status: DemoBookingStatus) =>
    Object.values(bookingStatuses).filter((value) => value === status).length;

  return {
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

function toTimelineItem(event: DemoEvent): SessionTimelineItem {
  switch (event.kind) {
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
    default:
      return assertNever(event, "toTimelineItem");
  }
}

export function projectDemoSession(session: DemoSession): DemoSessionProjection {
  const sortedEvents = sortEvents(session.events);

  return {
    session,
    timeline: sortedEvents.map(toTimelineItem),
    metrics: deriveMetrics(sortedEvents),
    bookingStatuses: deriveBookingStatuses(sortedEvents),
  };
}
