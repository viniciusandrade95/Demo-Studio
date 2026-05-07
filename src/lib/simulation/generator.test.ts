import { describe, expect, it } from "vitest";

import { projectDemoSession } from "@/lib/simulation/engine";
import { getDemoSessionById } from "@/lib/simulation/fixtures";
import { generateSimulationRun } from "@/lib/simulation/generator";
import { countSimulationEvents } from "@/lib/simulation/summary";
import type { SimulationRequest } from "@/lib/simulation/types";

const baseRequest: SimulationRequest = {
  profileSlug: "barbershop",
  scenarioSlug: "busy_weekend",
  seed: "demo-seed-01",
  simulatedDays: 2,
  appointmentsPerDay: 3,
  startDate: "2026-05-06",
  intensity: "medium",
};

function eventSortKey(event: { at: string; id: string }) {
  return `${event.at}:${event.id}`;
}

describe("generateSimulationRun", () => {
  it("returns identical events for the same request and seed", () => {
    const firstRun = generateSimulationRun(baseRequest);
    const secondRun = generateSimulationRun(baseRequest);

    expect(firstRun.events).toEqual(secondRun.events);
    expect(firstRun.summary).toEqual(secondRun.summary);
    expect(firstRun.runId).toBe(secondRun.runId);
  });

  it("changes the generated event sequence when the seed changes", () => {
    const firstRun = generateSimulationRun(baseRequest);
    const secondRun = generateSimulationRun({
      ...baseRequest,
      seed: "demo-seed-02",
    });

    expect(firstRun.events).not.toEqual(secondRun.events);
  });

  it("sorts generated events by time and id", () => {
    const run = generateSimulationRun(baseRequest);
    const sortedKeys = [...run.events]
      .sort((left, right) => {
        const byTime = left.at.localeCompare(right.at);
        return byTime !== 0 ? byTime : left.id.localeCompare(right.id);
      })
      .map(eventSortKey);

    expect(run.events.map(eventSortKey)).toEqual(sortedKeys);
  });

  it("builds a summary that matches generated event counts", () => {
    const run = generateSimulationRun(baseRequest);
    const countedEvents = countSimulationEvents(run.events);
    const projection = projectDemoSession(run.session);

    expect(run.summary.eventCounts).toEqual(countedEvents);
    expect(run.summary.totalEvents).toBe(run.events.length);
    expect(run.summary.metrics).toEqual(projection.metrics);
    expect(run.summary.eventCounts.customer_message).toBe(
      run.summary.metrics.inboundMessages,
    );
    expect(run.summary.eventCounts.assistant_reply).toBe(
      run.summary.metrics.assistantReplies,
    );
  });

  it("keeps the existing session-alpha fixture projection working", () => {
    const session = getDemoSessionById("session-alpha");
    expect(session).toBeDefined();

    const projection = projectDemoSession(session!);

    expect(projection.session.id).toBe("session-alpha");
    expect(projection.metrics.completedBookings).toBe(1);
    expect(projection.bookingStatuses["BK-1002"]).toBe("no_show");
  });
});
