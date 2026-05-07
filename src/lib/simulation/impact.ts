import type {
  DemoBookingStatus,
  DemoEvent,
  SimulationRun,
} from "@/lib/simulation/types";

type BookingEstimate = {
  bookingId: string;
  serviceName: string;
  status: DemoBookingStatus;
};

export type ImpactSummary = {
  estimatedRevenue: number;
  messagesHandled: number;
  assistantReplies: number;
  manualRepliesSaved: number;
  manualWorkSavedMinutes: number;
  bookingsConverted: number;
  disruptionCount: number;
  occupancyEstimate: number;
  newCustomers: number;
  cancelledNoShowPressure: number;
  simulatedLabel: string;
};

const SERVICE_REVENUE_ESTIMATES: Record<string, number> = {
  "Beard Trim": 25,
  Blowout: 45,
  "Color consultation": 90,
  "Facial treatment": 75,
  "Gel manicure": 40,
  Haircut: 35,
  "Haircut + Beard": 55,
  "Nail art": 50,
  Pedicure: 45,
};

const DEFAULT_SERVICE_REVENUE = 50;
const MINUTES_PER_MANUAL_REPLY = 3;

function getEvents(runOrEvents: SimulationRun | DemoEvent[]): DemoEvent[] {
  return Array.isArray(runOrEvents) ? runOrEvents : runOrEvents.events;
}

function getLatestBookingEstimates(events: DemoEvent[]): BookingEstimate[] {
  const bookings = new Map<string, BookingEstimate>();

  for (const event of [...events].sort((left, right) => {
    const byTime = left.at.localeCompare(right.at);
    return byTime !== 0 ? byTime : left.id.localeCompare(right.id);
  })) {
    if (event.kind === "booking_created" || event.kind === "booking_updated") {
      bookings.set(event.bookingId, {
        bookingId: event.bookingId,
        serviceName: event.serviceName,
        status: event.status,
      });
    }
  }

  return Array.from(bookings.values());
}

function isConvertedStatus(status: DemoBookingStatus): boolean {
  return (
    status === "confirmed" || status === "completed" || status === "rescheduled"
  );
}

function isDisruptedStatus(status: DemoBookingStatus): boolean {
  return status === "cancelled" || status === "no_show";
}

function estimateServiceRevenue(serviceName: string): number {
  return SERVICE_REVENUE_ESTIMATES[serviceName] ?? DEFAULT_SERVICE_REVENUE;
}

export function estimateRevenueFromBookings(
  runOrEvents: SimulationRun | DemoEvent[],
): number {
  return getLatestBookingEstimates(getEvents(runOrEvents))
    .filter((booking) => isConvertedStatus(booking.status))
    .reduce(
      (total, booking) => total + estimateServiceRevenue(booking.serviceName),
      0,
    );
}

export function estimateManualWorkSaved(
  runOrEvents: SimulationRun | DemoEvent[],
): number {
  const assistantReplies = getEvents(runOrEvents).filter(
    (event) => event.kind === "assistant_reply",
  ).length;

  return assistantReplies * MINUTES_PER_MANUAL_REPLY;
}

export function estimateOccupancy(
  runOrEvents: SimulationRun | DemoEvent[],
): number {
  const bookings = getLatestBookingEstimates(getEvents(runOrEvents));

  if (bookings.length === 0) {
    return 0;
  }

  const occupiedBookings = bookings.filter((booking) =>
    isConvertedStatus(booking.status),
  ).length;
  return Math.round((occupiedBookings / bookings.length) * 100);
}

export function estimateResponseOpportunity(
  runOrEvents: SimulationRun | DemoEvent[],
) {
  const events = getEvents(runOrEvents);
  const bookings = getLatestBookingEstimates(events);

  return {
    messagesHandled: events.filter((event) => event.kind === "customer_message")
      .length,
    assistantReplies: events.filter((event) => event.kind === "assistant_reply")
      .length,
    manualRepliesSaved: events.filter(
      (event) => event.kind === "assistant_reply",
    ).length,
    manualWorkSavedMinutes: estimateManualWorkSaved(events),
    bookingsConverted: bookings.filter((booking) =>
      isConvertedStatus(booking.status),
    ).length,
  };
}

export function calculateImpactSummary(
  runOrEvents: SimulationRun | DemoEvent[],
): ImpactSummary {
  const events = getEvents(runOrEvents);
  const bookings = getLatestBookingEstimates(events);
  const responseOpportunity = estimateResponseOpportunity(events);
  const disruptionCount = events.filter((event) => {
    if (event.kind === "warning_generated") {
      return true;
    }

    return event.kind === "booking_updated" && isDisruptedStatus(event.status);
  }).length;
  const cancelledNoShowPressure = bookings.filter((booking) =>
    isDisruptedStatus(booking.status),
  ).length;

  return {
    estimatedRevenue: estimateRevenueFromBookings(events),
    messagesHandled: responseOpportunity.messagesHandled,
    assistantReplies: responseOpportunity.assistantReplies,
    manualRepliesSaved: responseOpportunity.manualRepliesSaved,
    manualWorkSavedMinutes: estimateManualWorkSaved(events),
    bookingsConverted: responseOpportunity.bookingsConverted,
    disruptionCount,
    occupancyEstimate: estimateOccupancy(events),
    newCustomers: events.filter((event) => event.kind === "customer_created")
      .length,
    cancelledNoShowPressure,
    simulatedLabel:
      "Simulated estimate only. This is not production activity or real business performance.",
  };
}
