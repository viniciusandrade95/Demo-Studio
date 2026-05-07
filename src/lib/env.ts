type EnvInput = Record<string, string | undefined>;

type EnvConfig = {
  appEnv: string;
  appName: string;
  useLocalSimulationOnly: boolean;
  connectorBaseUrl: string | null;
  connectorMode: "mock" | "disabled";
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function optionalTrimmed(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getEnvConfig(env: EnvInput = process.env): EnvConfig {
  return {
    appEnv: env.NEXT_PUBLIC_APP_ENV?.trim() || "development",
    appName: env.NEXT_PUBLIC_APP_NAME?.trim() || "Marqo Demo Studio",
    useLocalSimulationOnly: parseBoolean(
      env.NEXT_PUBLIC_USE_LOCAL_SIMULATION_ONLY,
      true,
    ),
    connectorBaseUrl: optionalTrimmed(env.NEXT_PUBLIC_CONNECTOR_BASE_URL),
    connectorMode:
      env.NEXT_PUBLIC_CONNECTOR_MODE === "mock" ? "mock" : "disabled",
  };
}
