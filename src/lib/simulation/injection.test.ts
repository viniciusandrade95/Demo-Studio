import { describe, expect, it } from "vitest";

import {
  buildInjectionPreview,
  getPreviewCapabilitiesForMode,
} from "@/lib/simulation/injection";

describe("injection preview", () => {
  it("marks appointments unsupported", () => {
    const preview = buildInjectionPreview({
      capabilities: getPreviewCapabilitiesForMode("mock"),
      runId: "run-1",
    });

    expect(preview.unsupportedEntities).toContainEqual(
      expect.objectContaining({ entity: "appointments", supported: false }),
    );
    expect(preview.copy.appointmentsBlocked).toContain(
      "Appointments are blocked",
    );
  });

  it("marks staff unsupported", () => {
    const preview = buildInjectionPreview({
      capabilities: getPreviewCapabilitiesForMode("mock"),
      runId: "run-1",
    });

    expect(preview.unsupportedEntities).toContainEqual(
      expect.objectContaining({ entity: "staff", supported: false }),
    );
    expect(preview.copy.staffBlocked).toContain("Staff is blocked");
  });

  it("blocks if no run id is present", () => {
    const preview = buildInjectionPreview({
      capabilities: getPreviewCapabilitiesForMode("mock"),
      runId: " ",
    });

    expect(preview.runId).toBeNull();
    expect(
      preview.safetyChecks.find(
        (check) => check.id === "simulation_run_id_required",
      ),
    ).toMatchObject({ passed: false });
  });

  it("uses connector capabilities", () => {
    const mockPreview = buildInjectionPreview({
      capabilities: getPreviewCapabilitiesForMode("mock"),
      runId: "run-1",
    });
    const disabledPreview = buildInjectionPreview({
      capabilities: getPreviewCapabilitiesForMode("disabled"),
      runId: "run-1",
    });

    expect(
      mockPreview.supportedEntities.map((entity) => entity.entity),
    ).toEqual(["customers", "services", "conversations", "messages"]);
    expect(disabledPreview.supportedEntities).toEqual([]);
  });

  it("does not expose write behavior", () => {
    const preview = buildInjectionPreview({
      capabilities: getPreviewCapabilitiesForMode("mock"),
      runId: "run-1",
    });

    expect(preview.canWrite).toBe(false);
    expect(preview.copy.noWrite).toBe("This preview does not write data.");
    expect(Object.keys(preview)).not.toContain("inject");
  });
});
