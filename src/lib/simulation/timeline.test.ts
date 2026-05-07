import { describe, expect, it } from "vitest";

import { getDemoSessionById } from "@/lib/simulation/fixtures";
import { generateSimulationRun } from "@/lib/simulation/generator";
import {
  formatBusinessTime,
  formatHumanEventLabel,
  getEventCategory,
  groupTimelineByDay,
  mapEventToTimelineItem,
} from "@/lib/simulation/timeline";
import type { DemoEvent, TimelineCategory } from "@/lib/simulation";

const allEventKinds = [
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
    id: "evt-booking-confirmed",
    kind: "booking_updated",
    at: "2026-05-06T08:04:00Z",
    bookingId: "BK-2001",
    customerName: "Sofia Lima",
    serviceName: "Gel manicure",
    scheduledFor: "2026-05-06T14:00:00Z",
    status: "confirmed",
  },
  {
    id: "evt-kpi-marker",
    kind: "kpi_marker",
    at: "2026-05-06T08:05:00Z",
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

describe("simulation timeline", () => {
  it("maps every event kind to a human label", () => {
    for (const event of allEventKinds) {
      const label = formatHumanEventLabel(event);

      expect(label).toBeTruthy();
      expect(label).not.toContain(event.kind);
      expect(label).not.toContain("_");
    }
  });

  it("keeps event categories stable", () => {
    const categoryByEventId = Object.fromEntries(
      allEventKinds.map((event) => [event.id, getEventCategory(event)]),
    ) as Record<string, TimelineCategory>;

    expect(categoryByEventId).toMatchObject({
      "evt-customer-created": "customers",
      "evt-customer-message": "messages",
      "evt-assistant-reply": "messages",
      "evt-booking-created": "bookings",
      "evt-booking-confirmed": "appointments",
      "evt-kpi-marker": "kpi",
      "evt-simulation-started": "system",
      "evt-simulation-finished": "system",
      "evt-day-summary": "summaries",
      "evt-warning-generated": "disruptions",
    });
  });

  it("groups timeline items by simulated day", () => {
    const groups = groupTimelineByDay([
      allEventKinds[1],
      { ...allEventKinds[2], id: "evt-next-day", at: "2026-05-07T08:02:00Z" },
      allEventKinds[0],
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      date: "2026-05-06",
      label: "May 6, 2026",
    });
    expect(groups[0]?.items.map((item) => item.id)).toEqual([
      "evt-customer-created",
      "evt-customer-message",
    ]);
    expect(groups[1]).toMatchObject({
      date: "2026-05-07",
      label: "May 7, 2026",
    });
  });

  it("maps existing fixture events to narrative timeline items", () => {
    const session = getDemoSessionById("session-alpha");
    expect(session).toBeDefined();

    const firstItem = mapEventToTimelineItem(session!.events[0]!);
    const cancelledItem = mapEventToTimelineItem(
      session!.events.find((event) => event.id === "evt-010")!,
    );
    const noShowItem = mapEventToTimelineItem(
      session!.events.find((event) => event.id === "evt-013")!,
    );

    expect(firstItem).toMatchObject({
      time: "09:12",
      label: "Customer asked for availability",
      category: "messages",
    });
    expect(cancelledItem).toMatchObject({
      label: "Appointment was cancelled",
      category: "disruptions",
    });
    expect(noShowItem).toMatchObject({
      label: "Customer did not show up",
      category: "disruptions",
    });
  });

  it("maps generated events to human-readable timeline items", () => {
    const run = generateSimulationRun({
      profileSlug: "barbershop",
      scenarioSlug: "busy_weekend",
      seed: "timeline-demo",
      simulatedDays: 2,
      appointmentsPerDay: 2,
      startDate: "2026-05-06",
      intensity: "high",
    });
    const groups = groupTimelineByDay(run.events);
    const items = groups.flatMap((group) => group.items);

    expect(groups.length).toBeGreaterThanOrEqual(2);
    expect(items).toHaveLength(run.events.length);
    expect(items.some((item) => item.category === "system")).toBe(true);
    expect(items.some((item) => item.category === "messages")).toBe(true);
    expect(items.some((item) => item.category === "bookings")).toBe(true);
    expect(items.every((item) => !item.label.includes("_"))).toBe(true);
    expect(formatBusinessTime(run.events[0]!)).toMatch(/^\d{2}:\d{2}$/);
  });
});
