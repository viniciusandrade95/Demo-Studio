import type { RemoteSimulationCapabilities } from "@/connectors/theone";

export type InjectionEntityPlan = {
  entity:
    | "customers"
    | "services"
    | "conversations"
    | "messages"
    | "staff"
    | "appointments";
  supported: boolean;
  reason: string;
};

export type InjectionSafetyCheck = {
  id:
    | "demo_tenant_required"
    | "production_env_forbidden"
    | "simulation_run_id_required"
    | "provenance_required"
    | "reset_required"
    | "external_sends_blocked";
  label: string;
  passed: boolean;
  detail: string;
};

export type InjectionPreview = {
  runId: string | null;
  targetDemoTenant: string;
  supportedEntities: InjectionEntityPlan[];
  unsupportedEntities: InjectionEntityPlan[];
  safetyChecks: InjectionSafetyCheck[];
  canWrite: false;
  copy: {
    noWrite: "This preview does not write data.";
    appointmentsBlocked: "Appointments are blocked until the backend supports safe provenance and reset.";
    staffBlocked: "Staff is blocked until a non-IAM professional model exists.";
  };
};

type BuildInjectionPreviewInput = {
  runId?: string | null;
  targetDemoTenant?: string | null;
  capabilities: RemoteSimulationCapabilities;
  appEnv?: string;
};

const noWriteCopy = {
  noWrite: "This preview does not write data.",
  appointmentsBlocked:
    "Appointments are blocked until the backend supports safe provenance and reset.",
  staffBlocked: "Staff is blocked until a non-IAM professional model exists.",
} as const;

export function buildInjectionPreview({
  appEnv = "development",
  capabilities,
  runId,
  targetDemoTenant,
}: BuildInjectionPreviewInput): InjectionPreview {
  const safeRunId = runId?.trim() || null;
  const safeTenant = targetDemoTenant?.trim() || "Mock demo tenant placeholder";
  const baseSupported: InjectionEntityPlan[] = [
    {
      entity: "customers",
      supported: capabilities.supportsDryRun,
      reason: "Customer records can be represented in local dry-run payloads.",
    },
    {
      entity: "services",
      supported: capabilities.supportsDryRun,
      reason:
        "Service names are derived from local simulated business profiles.",
    },
    {
      entity: "conversations",
      supported: capabilities.supportsDryRun,
      reason:
        "Conversation threads are simulated locally from generated events.",
    },
    {
      entity: "messages",
      supported: capabilities.supportsDryRun,
      reason: "Inbound and assistant messages are simulated preview events.",
    },
  ];
  const unsupportedEntities: InjectionEntityPlan[] = [
    {
      entity: "staff",
      supported: false,
      reason: noWriteCopy.staffBlocked,
    },
    {
      entity: "appointments",
      supported: false,
      reason: noWriteCopy.appointmentsBlocked,
    },
  ];

  return {
    runId: safeRunId,
    targetDemoTenant: safeTenant,
    supportedEntities: baseSupported.filter((entity) => entity.supported),
    unsupportedEntities,
    safetyChecks: [
      {
        id: "demo_tenant_required",
        label: "Demo tenant required",
        passed: Boolean(safeTenant),
        detail:
          "A placeholder/mock demo tenant is required before any future injection flow.",
      },
      {
        id: "production_env_forbidden",
        label: "Production environment forbidden",
        passed: appEnv !== "production",
        detail: "Injection previews are blocked in production mode.",
      },
      {
        id: "simulation_run_id_required",
        label: "Simulation run id required",
        passed: Boolean(safeRunId),
        detail: "A generated local simulation run id must be present.",
      },
      {
        id: "provenance_required",
        label: "Provenance required",
        passed: false,
        detail:
          "Future writes require backend provenance that does not exist yet.",
      },
      {
        id: "reset_required",
        label: "Reset required",
        passed: false,
        detail:
          "Future writes require safe reset support before they can be enabled.",
      },
      {
        id: "external_sends_blocked",
        label: "External sends blocked",
        passed: true,
        detail:
          "No outbound customer sends or external writes are available in this preview.",
      },
    ],
    canWrite: false,
    copy: noWriteCopy,
  };
}

export function getPreviewCapabilitiesForMode(
  mode: RemoteSimulationCapabilities["mode"],
): RemoteSimulationCapabilities {
  return {
    mode,
    supportsDryRun: mode === "mock",
    supportsInjectPreview: false,
    supportsLiveInject: false,
    supportsReset: false,
    supportsStaff: false,
    supportsAppointments: false,
    notes: ["Local/mock injection preview only. No write behavior exists."],
  };
}
