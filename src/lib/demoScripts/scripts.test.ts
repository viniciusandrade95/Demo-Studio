import { describe, expect, it } from "vitest";

import { salesDemoScripts } from "@/lib/demoScripts";
import { buildSimulationRequestFromDemoLabForm } from "@/lib/simulation/demoLab";
import {
  getBusinessProfileBySlug,
  getScenarioPresetBySlug,
} from "@/lib/simulation/fixtures";

describe("sales demo scripts", () => {
  it("all scripts have required fields", () => {
    for (const script of salesDemoScripts) {
      expect(script.id).toBeTruthy();
      expect(script.title).toBeTruthy();
      expect(script.storyBeats.length).toBeGreaterThan(0);
      expect(script.talkingPoints.length).toBeGreaterThan(0);
      expect(script.expectedImpactHighlights.length).toBeGreaterThan(0);
    }
  });

  it("each script maps to valid profile and scenario", () => {
    for (const script of salesDemoScripts) {
      expect(
        getBusinessProfileBySlug(script.recommendedProfileSlug),
      ).toBeDefined();
      expect(
        getScenarioPresetBySlug(script.recommendedScenarioSlug),
      ).toBeDefined();
    }
  });

  it("loading a script produces valid simulation request defaults", () => {
    for (const script of salesDemoScripts) {
      const request = buildSimulationRequestFromDemoLabForm({
        appointmentsPerDay: String(script.suggestedAppointmentsPerDay),
        intensity: script.suggestedIntensity,
        profileSlug: script.recommendedProfileSlug,
        scenarioSlug: script.recommendedScenarioSlug,
        seed: script.suggestedSeed,
        simulatedDays: String(script.suggestedSimulatedDays),
        startDate: "2026-05-06",
      });

      expect(typeof request).toBe("object");
    }
  });

  it("manual config still works", () => {
    expect(
      buildSimulationRequestFromDemoLabForm({
        appointmentsPerDay: "1",
        intensity: "low",
        profileSlug: "barbershop",
        scenarioSlug: "calm_week",
        seed: "manual",
        simulatedDays: "1",
        startDate: "2026-05-06",
      }),
    ).toMatchObject({ seed: "manual" });
  });
});
