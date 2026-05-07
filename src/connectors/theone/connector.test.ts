import { describe, expect, it } from "vitest";

import {
  DisabledTheOneConnector,
  getConnectorStatusCopy,
  getPublicTheOneConnectorConfig,
  MockTheOneConnector,
} from "@/connectors/theone";

describe("The One connector abstraction", () => {
  it("mock connector returns dry-run capabilities without live writes", async () => {
    const connector = new MockTheOneConnector();
    const capabilities = await connector.getCapabilities();

    expect(capabilities).toMatchObject({
      mode: "mock",
      supportsAppointments: false,
      supportsDryRun: true,
      supportsInjectPreview: false,
      supportsLiveInject: false,
      supportsReset: false,
      supportsStaff: false,
    });
    expect(capabilities.notes.join(" ")).toContain("No external API calls");
  });

  it("disabled connector fails safely", async () => {
    const connector = new DisabledTheOneConnector();

    await expect(connector.listDemoTenants()).resolves.toEqual([]);
    await expect(connector.getRun("missing-run")).resolves.toMatchObject({
      ok: false,
    });
    await expect(connector.injectDemoRun("missing-run")).resolves.toMatchObject(
      { ok: false },
    );
  });

  it("does not expose secret env values in public config", () => {
    const config = getPublicTheOneConnectorConfig({
      NEXT_PUBLIC_CONNECTOR_MODE: "mock",
      THEONE_BASE_URL: "https://example.invalid",
      THEONE_INTERNAL_TOKEN: "secret-token",
    });

    expect(config).toEqual({ mode: "mock" });
    expect(JSON.stringify(config)).not.toContain("secret-token");
    expect(JSON.stringify(config)).not.toContain("example.invalid");
  });

  it("connector status card copy covers mock and disabled modes", () => {
    expect(getConnectorStatusCopy({ mode: "mock" })).toMatchObject({
      eyebrow: "Mock connector mode",
    });
    expect(getConnectorStatusCopy({ mode: "disabled" })).toMatchObject({
      eyebrow: "Disabled / remote unavailable",
    });
  });

  it("capabilities explicitly mark staff and appointment support as unsupported", async () => {
    const mockCapabilities = await new MockTheOneConnector().getCapabilities();
    const disabledCapabilities =
      await new DisabledTheOneConnector().getCapabilities();

    expect(mockCapabilities.supportsStaff).toBe(false);
    expect(mockCapabilities.supportsAppointments).toBe(false);
    expect(disabledCapabilities.supportsStaff).toBe(false);
    expect(disabledCapabilities.supportsAppointments).toBe(false);
  });
});
