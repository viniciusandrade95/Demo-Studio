import { describe, expect, it } from "vitest";

import { salesDemoScripts } from "@/lib/demoScripts";
import { exportRunAsJson, exportRunAsMarkdown } from "@/lib/export";
import { generateSimulationRun } from "@/lib/simulation/generator";
import { calculateImpactSummary } from "@/lib/simulation/impact";

type ExportableRun = ReturnType<typeof generateSimulationRun>;

function run() {
  return generateSimulationRun({
    profileSlug: "barbershop",
    scenarioSlug: "busy_weekend",
    seed: "export-demo",
    simulatedDays: 1,
    appointmentsPerDay: 2,
    startDate: "2026-05-06",
    intensity: "medium",
  });
}

describe("demo pack export", () => {
  it("markdown contains required sections", () => {
    const demoRun = run();
    const markdown = exportRunAsMarkdown(
      demoRun,
      calculateImpactSummary(demoRun),
      salesDemoScripts[0],
    );

    expect(markdown).toContain("## Demo context");
    expect(markdown).toContain("## Summary metrics");
    expect(markdown).toContain("## Impact estimates");
    expect(markdown).toContain("## Timeline highlights");
    expect(markdown).toContain("## Sales script / talk track");
    expect(markdown).toContain(
      "This is simulated demo data, not production activity.",
    );
  });

  it("JSON export is valid", () => {
    const parsed = JSON.parse(exportRunAsJson(run()));

    expect(parsed.runId).toBeTruthy();
    expect(parsed.session.events.length).toBeGreaterThan(0);
  });

  it("does not include known secret names", () => {
    const json = exportRunAsJson(run());
    const markdown = exportRunAsMarkdown(run(), calculateImpactSummary(run()));

    expect(json).not.toContain("THEONE_INTERNAL_TOKEN");
    expect(markdown).not.toContain("THEONE_INTERNAL_TOKEN");
  });

  it("empty or partial run export fails safely", () => {
    const emptyRun = { ...run(), events: [], runId: "" } as ExportableRun;

    expect(() => exportRunAsJson(emptyRun)).toThrow(
      "Cannot export an empty or partial simulation run.",
    );
  });
});
