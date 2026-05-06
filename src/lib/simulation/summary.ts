import { demoEventKinds, projectDemoSession } from "@/lib/simulation/engine";
import type {
  DemoEvent,
  DemoEventKind,
  DemoSafetyStatus,
  DemoSession,
  SimulationEventCounts,
  SimulationSummary,
} from "@/lib/simulation/types";

export function countSimulationEvents(
  events: DemoEvent[],
): SimulationEventCounts {
  const counts = Object.fromEntries(
    demoEventKinds.map((kind) => [kind, 0]),
  ) as SimulationEventCounts;

  for (const event of events) {
    counts[event.kind] += 1;
  }

  return counts;
}

export function buildSimulationSummary(
  session: DemoSession,
  safetyStatus: DemoSafetyStatus = "simulated_only",
): SimulationSummary {
  const projection = projectDemoSession(session);
  const eventCounts = countSimulationEvents(session.events);
  const totalEvents = Object.values(eventCounts).reduce(
    (total, count) => total + count,
    0,
  );

  return {
    headline: `${session.businessName} simulation completed`,
    highlights: [
      `${projection.metrics.inboundMessages} inbound messages handled`,
      `${projection.metrics.bookingsTouched} bookings touched`,
      `${projection.metrics.completedBookings} bookings completed`,
    ],
    metrics: projection.metrics,
    eventCounts,
    totalEvents,
    safetyStatus,
    simulatedLabel: session.simulatedLabel,
  };
}

export function getEventCount(
  summary: SimulationSummary,
  kind: DemoEventKind,
): number {
  return summary.eventCounts[kind];
}
