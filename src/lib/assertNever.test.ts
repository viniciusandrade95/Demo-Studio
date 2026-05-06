import { describe, expect, it } from "vitest";

import { assertNever } from "@/lib/assertNever";
import { getEnvConfig } from "@/lib/env";

describe("assertNever", () => {
  it("throws with context when an unreachable case is forced", () => {
    expect(() => assertNever("demo" as never, "unit-test")).toThrow(
      "Unhandled case in unit-test: demo",
    );
  });
});

describe("getEnvConfig", () => {
  it("returns local-safe defaults", () => {
    expect(getEnvConfig({})).toEqual({
      appEnv: "development",
      appName: "Marqo Demo Studio",
      useLocalSimulationOnly: true,
      connectorBaseUrl: null,
    });
  });
});
