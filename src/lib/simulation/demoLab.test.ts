import { describe, expect, it } from "vitest";

import {
  buildDemoLabSummaryCards,
  buildSimulationRequestFromDemoLabForm,
  generateDemoLabPreview,
  getDefaultDemoLabFormState,
} from "@/lib/simulation/demoLab";
import { businessProfiles, scenarioPresets } from "@/lib/simulation/fixtures";

describe("demo lab helpers", () => {
  it("builds safe form defaults from available fixtures", () => {
    const defaults = getDefaultDemoLabFormState();

    expect(defaults).toEqual({
      profileSlug: businessProfiles[0]?.slug,
      scenarioSlug: scenarioPresets[0]?.slug,
      simulatedDays: "2",
      appointmentsPerDay: "3",
      seed: "local-preview-01",
      intensity: "medium",
      startDate: "2026-05-06",
    });
  });

  it("maps generated preview metrics into the summary cards", () => {
    const result = generateDemoLabPreview(getDefaultDemoLabFormState());
    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.error);
    }

    const cards = buildDemoLabSummaryCards(result.preview.run);
    const cardValues = Object.fromEntries(
      cards.map((card) => [card.label, card.value]),
    );

    expect(result.preview.summaryCards).toEqual(cards);
    expect(cardValues.Customers).toBe(
      result.preview.run.summary.eventCounts.customer_created,
    );
    expect(cardValues["Inbound messages"]).toBe(
      result.preview.run.summary.metrics.inboundMessages,
    );
    expect(cardValues["Assistant replies"]).toBe(
      result.preview.run.summary.metrics.assistantReplies,
    );
    expect(cardValues["Bookings touched"]).toBe(
      result.preview.run.summary.metrics.bookingsTouched,
    );
  });

  it("fails safely for an invalid profile", () => {
    const result = generateDemoLabPreview({
      ...getDefaultDemoLabFormState(),
      profileSlug: "missing-profile",
    });

    expect(result).toEqual({
      ok: false,
      error: "Choose a valid business profile before generating a preview.",
    });
  });

  it("fails safely for an invalid scenario", () => {
    const result = buildSimulationRequestFromDemoLabForm({
      ...getDefaultDemoLabFormState(),
      scenarioSlug: "missing-scenario",
    });

    expect(result).toBe("Choose a valid scenario before generating a preview.");
  });

  it("fails safely for missing deterministic controls", () => {
    const result = buildSimulationRequestFromDemoLabForm({
      ...getDefaultDemoLabFormState(),
      seed: " ",
    });

    expect(result).toBe("Seed is required for deterministic local generation.");
  });
});
