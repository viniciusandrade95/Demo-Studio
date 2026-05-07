import { describe, expect, it } from "vitest";

import {
  businessProfiles,
  getDemoSessionById,
  scenarioPresets,
} from "@/lib/simulation/fixtures";
import {
  demoEventKinds,
  EMPTY_DEMO_KPI_SNAPSHOT,
  getDemoEventCategory,
  projectDemoSession,
} from "@/lib/simulation/engine";
import type { DemoEvent, DemoSession } from "@/lib/simulation/types";

function expectUnique(values: string[]) {
  expect(new Set(values).size).toBe(values.length);
}

describe("simulation fixtures", () => {
  it("keeps profile slugs unique", () => {
    expectUnique(businessProfiles.map((profile) => profile.slug));
  });

  it("keeps scenario slugs unique", () => {
    expectUnique(scenarioPresets.map((scenario) => scenario.slug));
  });
});

describe("projectDemoSession", () => {
  it("sorts the timeline and derives stable KPI totals", () => {
    const session = getDemoSessionById("session-alpha");
    expect(session).toBeDefined();

    const projection = projectDemoSession(session!);

    expect(projection.timeline[0]?.id).toBe("evt-001");
    expect(projection.timeline.at(-1)?.id).toBe("evt-013");
    expect(projection.metrics).toEqual({
      inboundMessages: 3,
      assistantReplies: 2,
      bookingsTouched: 3,
      confirmedBookings: 0,
      completedBookings: 1,
      cancelledBookings: 1,
      noShowBookings: 1,
      rescheduledBookings: 0,
    });
  });

  it("keeps final booking statuses by booking id", () => {
    const session = getDemoSessionById("session-alpha");
    expect(session).toBeDefined();

    const projection = projectDemoSession(session!);

    expect(projection.bookingStatuses).toEqual({
      "BK-0998": "cancelled",
      "BK-1001": "completed",
      "BK-1002": "no_show",
    });
  });

  it("projects the current fixture session successfully", () => {
    const session = getDemoSessionById("session-alpha");
    expect(session).toBeDefined();

    const projection = projectDemoSession(session!);

    expect(projection.session.id).toBe("session-alpha");
    expect(projection.timeline).toHaveLength(session!.events.length);
  });

  it("uses safe KPI defaults for an empty event list", () => {
    const emptySession: DemoSession = {
      id: "session-empty",
      title: "Empty Simulation",
      businessName: "Demo Business",
      vertical: "Barbershop",
      city: "Lisbon",
      scenario: "No events yet",
      operatorSummary: "A safe empty simulation shell.",
      simulatedLabel: "All activity in this session is simulated demo data.",
      events: [],
    };

    const projection = projectDemoSession(emptySession);

    expect(projection.timeline).toEqual([]);
    expect(projection.bookingStatuses).toEqual({});
    expect(projection.metrics).toEqual(EMPTY_DEMO_KPI_SNAPSHOT);
  });

  it("accepts every event kind through type-safe helpers", () => {
    const categoryByKind = Object.fromEntries(
      demoEventKinds.map((kind) => [kind, getDemoEventCategory(kind)]),
    );

    expect(categoryByKind).toEqual({
      customer_created: "customer",
      customer_message: "message",
      assistant_reply: "message",
      booking_created: "booking",
      booking_updated: "booking",
      kpi_marker: "kpi",
      simulation_started: "lifecycle",
      simulation_finished: "lifecycle",
      day_summary: "summary",
      warning_generated: "warning",
    });
  });

  it("projects all supported event kinds without dropping timeline items", () => {
    const events = [
      {
        id: "evt-customer-created",
        kind: "customer_created",
        at: "2026-05-06T08:00:00Z",
        customerId: "CUS-1",
        customerName: "Sofia Lima",
        source: "whatsapp",
      },
      {
        id: "evt-customer-message",
        kind: "customer_message",
        at: "2026-05-06T08:01:00Z",
        customerName: "Sofia Lima",
        channel: "whatsapp",
        direction: "inbound",
        message: "Can I book a manicure today?",
      },
      {
        id: "evt-assistant-reply",
        kind: "assistant_reply",
        at: "2026-05-06T08:02:00Z",
        customerName: "Sofia Lima",
        channel: "whatsapp",
        direction: "outbound",
        message: "Yes — 14:00 is available.",
      },
      {
        id: "evt-booking-created",
        kind: "booking_created",
        at: "2026-05-06T08:03:00Z",
        bookingId: "BK-2001",
        customerName: "Sofia Lima",
        serviceName: "Gel manicure",
        scheduledFor: "2026-05-06T14:00:00Z",
        status: "confirmed",
      },
      {
        id: "evt-booking-updated",
        kind: "booking_updated",
        at: "2026-05-06T14:45:00Z",
        bookingId: "BK-2001",
        customerName: "Sofia Lima",
        serviceName: "Gel manicure",
        scheduledFor: "2026-05-06T14:00:00Z",
        status: "completed",
      },
      {
        id: "evt-kpi-marker",
        kind: "kpi_marker",
        at: "2026-05-06T14:46:00Z",
        label: "Promo conversion",
        value: "+12%",
        tone: "accent",
      },
      {
        id: "evt-simulation-started",
        kind: "simulation_started",
        at: "2026-05-06T07:59:00Z",
        profileSlug: "nail_studio",
        scenarioSlug: "promo_campaign",
        mode: "guided",
      },
      {
        id: "evt-simulation-finished",
        kind: "simulation_finished",
        at: "2026-05-06T18:00:00Z",
        summary: "Promo campaign safely completed in local simulation.",
        safetyStatus: "simulated_only",
      },
      {
        id: "evt-day-summary",
        kind: "day_summary",
        at: "2026-05-06T18:01:00Z",
        summaryDate: "2026-05-06",
        headline: "A polished promo day",
        highlights: ["Demand captured", "No external writes"],
      },
      {
        id: "evt-warning-generated",
        kind: "warning_generated",
        at: "2026-05-06T12:00:00Z",
        severity: "medium",
        title: "Schedule compression",
        message: "Three simulated requests are clustered around lunch.",
      },
    ] satisfies DemoEvent[];

    const projection = projectDemoSession({
      id: "session-all-events",
      title: "All Events",
      businessName: "North Star Nails",
      vertical: "Nail Studio",
      city: "Porto",
      scenario: "Promo Campaign",
      operatorSummary: "A local fixture covering all supported event kinds.",
      simulatedLabel: "All activity in this session is simulated demo data.",
      events,
    });

    expect(projection.timeline).toHaveLength(events.length);
    expect(projection.metrics.inboundMessages).toBe(1);
    expect(projection.metrics.assistantReplies).toBe(1);
    expect(projection.metrics.completedBookings).toBe(1);
  });
});
