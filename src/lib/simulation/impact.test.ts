import { describe, expect, it } from "vitest";

import { getDemoSessionById } from "@/lib/simulation/fixtures";
import { generateSimulationRun } from "@/lib/simulation/generator";
import {
  calculateImpactSummary,
  estimateManualWorkSaved,
  estimateOccupancy,
  estimateResponseOpportunity,
  estimateRevenueFromBookings,
} from "@/lib/simulation/impact";
import type { DemoEvent } from "@/lib/simulation/types";

const deterministicEvents = [
  {
    id: "evt-001",
    kind: "customer_created",
    at: "2026-05-06T08:00:00Z",
    customerId: "CUS-1",
    customerName: "Sofia Lima",
    source: "whatsapp",
  },
  {
    id: "evt-002",
    kind: "customer_message",
    at: "2026-05-06T08:01:00Z",
    customerName: "Sofia Lima",
    channel: "whatsapp",
    direction: "inbound",
    message: "Can I book a manicure today?",
  },
  {
    id: "evt-003",
    kind: "assistant_reply",
    at: "2026-05-06T08:02:00Z",
    customerName: "Sofia Lima",
    channel: "whatsapp",
    direction: "outbound",
    message: "Yes — 14:00 is available.",
  },
  {
    id: "evt-004",
    kind: "booking_created",
    at: "2026-05-06T08:03:00Z",
    bookingId: "BK-1",
    customerName: "Sofia Lima",
    serviceName: "Gel manicure",
    scheduledFor: "2026-05-06T14:00:00Z",
    status: "requested",
  },
  {
    id: "evt-005",
    kind: "booking_updated",
    at: "2026-05-06T08:04:00Z",
    bookingId: "BK-1",
    customerName: "Sofia Lima",
    serviceName: "Gel manicure",
    scheduledFor: "2026-05-06T14:00:00Z",
    status: "completed",
  },
  {
    id: "evt-006",
    kind: "booking_created",
    at: "2026-05-06T09:03:00Z",
    bookingId: "BK-2",
    customerName: "Miguel Costa",
    serviceName: "Haircut",
    scheduledFor: "2026-05-06T15:00:00Z",
    status: "confirmed",
  },
  {
    id: "evt-007",
    kind: "booking_updated",
    at: "2026-05-06T09:04:00Z",
    bookingId: "BK-2",
    customerName: "Miguel Costa",
    serviceName: "Haircut",
    scheduledFor: "2026-05-06T15:00:00Z",
    status: "cancelled",
  },
  {
    id: "evt-008",
    kind: "warning_generated",
    at: "2026-05-06T10:00:00Z",
    severity: "medium",
    title: "Schedule pressure",
    message: "Two simulated appointments need attention.",
  },
] satisfies DemoEvent[];

describe("impact estimates", () => {
  it("returns safe estimates for empty events", () => {
    expect(calculateImpactSummary([])).toEqual({
      estimatedRevenue: 0,
      messagesHandled: 0,
      assistantReplies: 0,
      manualRepliesSaved: 0,
      manualWorkSavedMinutes: 0,
      bookingsConverted: 0,
      disruptionCount: 0,
      occupancyEstimate: 0,
      newCustomers: 0,
      cancelledNoShowPressure: 0,
      simulatedLabel:
        "Simulated estimate only. This is not production activity or real business performance.",
    });
    expect(estimateOccupancy([])).toBe(0);
  });

  it("keeps revenue estimates deterministic", () => {
    expect(estimateRevenueFromBookings(deterministicEvents)).toBe(40);
    expect(estimateRevenueFromBookings(deterministicEvents)).toBe(
      estimateRevenueFromBookings([...deterministicEvents].reverse()),
    );
  });

  it("keeps manual work estimates deterministic", () => {
    expect(estimateManualWorkSaved(deterministicEvents)).toBe(3);
    expect(estimateResponseOpportunity(deterministicEvents)).toMatchObject({
      assistantReplies: 1,
      manualRepliesSaved: 1,
      manualWorkSavedMinutes: 3,
      messagesHandled: 1,
    });
  });

  it("counts disruptions from booking pressure and warnings", () => {
    const summary = calculateImpactSummary(deterministicEvents);

    expect(summary.disruptionCount).toBe(2);
    expect(summary.cancelledNoShowPressure).toBe(1);
  });

  it("works for the fixture session", () => {
    const session = getDemoSessionById("session-alpha");
    expect(session).toBeDefined();

    const summary = calculateImpactSummary(session!.events);

    expect(summary.estimatedRevenue).toBe(35);
    expect(summary.messagesHandled).toBe(3);
    expect(summary.assistantReplies).toBe(2);
    expect(summary.manualRepliesSaved).toBe(2);
    expect(summary.manualWorkSavedMinutes).toBe(6);
    expect(summary.disruptionCount).toBe(2);
  });

  it("works for generated simulation runs", () => {
    const run = generateSimulationRun({
      profileSlug: "barbershop",
      scenarioSlug: "busy_weekend",
      seed: "impact-demo",
      simulatedDays: 2,
      appointmentsPerDay: 2,
      startDate: "2026-05-06",
      intensity: "medium",
    });

    const summaryFromRun = calculateImpactSummary(run);
    const summaryFromEvents = calculateImpactSummary(run.events);

    expect(summaryFromRun).toEqual(summaryFromEvents);
    expect(summaryFromRun.messagesHandled).toBe(
      run.summary.metrics.inboundMessages,
    );
    expect(summaryFromRun.assistantReplies).toBe(
      run.summary.metrics.assistantReplies,
    );
    expect(summaryFromRun.newCustomers).toBe(
      run.summary.eventCounts.customer_created,
    );
  });
});
