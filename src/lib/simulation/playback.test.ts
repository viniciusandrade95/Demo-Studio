import { describe, expect, it } from "vitest";

import { buildSimulationSummary } from "@/lib/simulation/summary";
import {
  createInitialPlaybackState,
  getRevealedEvents,
  simulationPlaybackReducer,
} from "@/lib/simulation/playback";
import type { DemoEvent, DemoSession } from "@/lib/simulation/types";

const events = [
  {
    id: "evt-001",
    kind: "customer_message",
    at: "2026-05-06T08:01:00Z",
    customerName: "Sofia Lima",
    channel: "whatsapp",
    direction: "inbound",
    message: "Can I book today?",
  },
  {
    id: "evt-002",
    kind: "assistant_reply",
    at: "2026-05-06T08:02:00Z",
    customerName: "Sofia Lima",
    channel: "whatsapp",
    direction: "outbound",
    message: "Yes — 14:00 is available.",
  },
  {
    id: "evt-003",
    kind: "booking_created",
    at: "2026-05-06T08:03:00Z",
    bookingId: "BK-1",
    customerName: "Sofia Lima",
    serviceName: "Gel manicure",
    scheduledFor: "2026-05-06T14:00:00Z",
    status: "confirmed",
  },
] satisfies DemoEvent[];

function buildSession(revealedEvents: DemoEvent[]): DemoSession {
  return {
    id: "session-partial",
    title: "Partial Playback",
    businessName: "Demo Business",
    vertical: "Nail Studio",
    city: "Porto",
    scenario: "Playback",
    operatorSummary: "Partial playback summary.",
    simulatedLabel: "Local simulated preview.",
    events: revealedEvents,
  };
}

describe("simulation playback reducer", () => {
  it("creates an initial state", () => {
    expect(createInitialPlaybackState(3)).toEqual({
      revealedCount: 0,
      speed: "1x",
      status: "idle",
      totalEvents: 3,
    });
  });

  it("handles play, pause, and restart transitions", () => {
    const initial = createInitialPlaybackState(3);
    const playing = simulationPlaybackReducer(initial, { type: "play" });
    const ticked = simulationPlaybackReducer(playing, { type: "tick" });
    const paused = simulationPlaybackReducer(ticked, { type: "pause" });
    const restarted = simulationPlaybackReducer(paused, { type: "restart" });

    expect(playing.status).toBe("playing");
    expect(ticked.revealedCount).toBe(1);
    expect(paused.status).toBe("paused");
    expect(restarted).toEqual(initial);
  });

  it("calculates revealed events from state", () => {
    const state = {
      ...createInitialPlaybackState(events.length),
      revealedCount: 2,
    };

    expect(getRevealedEvents(events, state).map((event) => event.id)).toEqual([
      "evt-001",
      "evt-002",
    ]);
  });

  it("reveals all events in instant mode", () => {
    const state = simulationPlaybackReducer(createInitialPlaybackState(3), {
      type: "set_speed",
      speed: "instant",
    });

    expect(state).toMatchObject({
      revealedCount: 3,
      speed: "instant",
      status: "complete",
    });
    expect(getRevealedEvents(events, state)).toEqual(events);
  });

  it("produces partial summaries from partial playback", () => {
    const state = {
      ...createInitialPlaybackState(events.length),
      revealedCount: 2,
    };
    const summary = buildSimulationSummary(
      buildSession(getRevealedEvents(events, state)),
    );

    expect(summary.metrics.inboundMessages).toBe(1);
    expect(summary.metrics.assistantReplies).toBe(1);
    expect(summary.metrics.bookingsTouched).toBe(0);
  });
});
