import type { TheOneConnectorMode } from "@/connectors/theone/types";

type EnvInput = Record<string, string | undefined>;

export type PublicTheOneConnectorConfig = {
  mode: TheOneConnectorMode;
};

export function parseTheOneConnectorMode(
  value: string | undefined,
): TheOneConnectorMode {
  return value === "mock" ? "mock" : "disabled";
}

export function getPublicTheOneConnectorConfig(
  env: EnvInput = process.env,
): PublicTheOneConnectorConfig {
  return {
    mode: parseTheOneConnectorMode(env.NEXT_PUBLIC_CONNECTOR_MODE),
  };
}

export function getConnectorStatusCopy(
  config = getPublicTheOneConnectorConfig(),
) {
  if (config.mode === "mock") {
    return {
      eyebrow: "Mock connector mode",
      title: "The One mock connector ready",
      description:
        "Local dry runs are available through a mock connector. Live injection remains disabled.",
    };
  }

  return {
    eyebrow: "Disabled / remote unavailable",
    title: "Local mode only",
    description:
      "The app is using local simulation only. No remote connector calls or live writes are enabled.",
  };
}
