import { assertNever } from "@/lib/assertNever";
import type { DemoEvent } from "@/lib/simulation/types";

export type TimelineCategory =
  | "messages"
  | "customers"
  | "bookings"
  | "appointments"
  | "disruptions"
  | "summaries"
  | "system"
  | "kpi";

export type TimelineItem = {
  id: string;
  at: string;
  time: string;
  label: string;
  detail: string;
  category: TimelineCategory;
  lane: TimelineCategory;
};

export type TimelineDayGroup = {
  date: string;
  label: string;
  items: TimelineItem[];
};

function sortEvents(events: DemoEvent[]): DemoEvent[] {
  return [...events].sort((left, right) => {
    const byTime = left.at.localeCompare(right.at);
    return byTime !== 0 ? byTime : left.id.localeCompare(right.id);
  });
}

function formatDayLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function humanizeToken(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatAppointmentTime(value: string): string {
  const date = value.slice(0, 10);
  const time = value.slice(11, 16);

  return `${formatDayLabel(date)} at ${time}`;
}

export function formatBusinessTime(event: DemoEvent): string {
  return event.at.slice(11, 16);
}

export function getEventCategory(event: DemoEvent): TimelineCategory {
  switch (event.kind) {
    case "customer_message":
    case "assistant_reply":
      return "messages";
    case "customer_created":
      return "customers";
    case "booking_created":
      return "bookings";
    case "booking_updated": {
      const { status } = event;

      switch (status) {
        case "confirmed":
        case "completed":
        case "rescheduled":
          return "appointments";
        case "cancelled":
        case "no_show":
          return "disruptions";
        default:
          return assertNever(status, "getEventCategory booking status");
      }
    }
    case "warning_generated":
      return "disruptions";
    case "day_summary":
      return "summaries";
    case "simulation_started":
    case "simulation_finished":
      return "system";
    case "kpi_marker":
      return "kpi";
    default:
      return assertNever(event, "getEventCategory");
  }
}

export function formatHumanEventLabel(event: DemoEvent): string {
  switch (event.kind) {
    case "customer_created":
      return "New customer entered the CRM";
    case "customer_message":
      return "Customer asked for availability";
    case "assistant_reply":
      return "Assistant sent a simulated reply";
    case "booking_created":
      return "Booking request created";
    case "booking_updated": {
      const { status } = event;

      switch (status) {
        case "confirmed":
          return "Appointment was confirmed";
        case "completed":
          return "Appointment was completed";
        case "cancelled":
          return "Appointment was cancelled";
        case "no_show":
          return "Customer did not show up";
        case "rescheduled":
          return "Appointment was rescheduled";
        default:
          return assertNever(status, "formatHumanEventLabel booking status");
      }
    }
    case "kpi_marker":
      return "KPI marker recorded";
    case "simulation_started":
      return "Local simulation started";
    case "simulation_finished":
      return "Local simulation finished";
    case "day_summary":
      return "Day summary generated";
    case "warning_generated":
      return "Operational warning generated";
    default:
      return assertNever(event, "formatHumanEventLabel");
  }
}

function formatEventDetail(event: DemoEvent): string {
  switch (event.kind) {
    case "customer_created":
      return `${event.customerName} joined from ${humanizeToken(event.source)}.`;
    case "customer_message":
      return `${event.customerName}: ${event.message}`;
    case "assistant_reply":
      return `${event.customerName}: ${event.message}`;
    case "booking_created":
      return `${event.customerName} requested ${event.serviceName} for ${formatAppointmentTime(event.scheduledFor)}.`;
    case "booking_updated":
      return `${event.customerName} · ${event.serviceName} · ${humanizeToken(event.status)} for ${formatAppointmentTime(event.scheduledFor)}.`;
    case "kpi_marker":
      return `${event.label}: ${event.value}`;
    case "simulation_started":
      return `${humanizeToken(event.scenarioSlug)} began for ${humanizeToken(event.profileSlug)} in ${humanizeToken(event.mode)} mode.`;
    case "simulation_finished":
      return `${event.summary} · ${humanizeToken(event.safetyStatus)}.`;
    case "day_summary":
      return event.highlights.join(" • ");
    case "warning_generated":
      return `${event.title}: ${event.message}`;
    default:
      return assertNever(event, "formatEventDetail");
  }
}

export function mapEventToTimelineItem(event: DemoEvent): TimelineItem {
  const category = getEventCategory(event);

  return {
    id: event.id,
    at: event.at,
    time: formatBusinessTime(event),
    label: formatHumanEventLabel(event),
    detail: formatEventDetail(event),
    category,
    lane: category,
  };
}

export function groupTimelineByDay(events: DemoEvent[]): TimelineDayGroup[] {
  const groups = new Map<string, TimelineItem[]>();

  for (const event of sortEvents(events)) {
    const date = event.at.slice(0, 10);
    const currentItems = groups.get(date) ?? [];
    currentItems.push(mapEventToTimelineItem(event));
    groups.set(date, currentItems);
  }

  return Array.from(groups.entries()).map(([date, items]) => ({
    date,
    label: formatDayLabel(date),
    items,
  }));
}
