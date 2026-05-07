import type {
  DemoSafetyStatus,
  SimulationRequest,
  SimulationRun,
} from "@/lib/simulation/types";

export type TheOneConnectorMode = "mock" | "disabled";

export type DemoTenantSummary = {
  id: string;
  name: string;
  slug: string;
  region: string;
  safetyStatus: DemoSafetyStatus;
};

export type RemoteSimulationCapabilities = {
  mode: TheOneConnectorMode;
  supportsDryRun: boolean;
  supportsInjectPreview: boolean;
  supportsLiveInject: boolean;
  supportsReset: boolean;
  supportsStaff: boolean;
  supportsAppointments: boolean;
  notes: string[];
};

export type RemoteDryRunRequest = {
  request: SimulationRequest;
  tenantId?: string;
};

export type RemoteDryRunResult = {
  ok: boolean;
  run?: SimulationRun;
  message: string;
};

export type RemoteRunResult = {
  ok: boolean;
  run?: SimulationRun;
  message: string;
};

export type RemoteRunEventsResult = {
  ok: boolean;
  events: SimulationRun["events"];
  message: string;
};

export type RemoteInjectPreviewRequest = {
  runId: string;
};

export type RemoteInjectPreviewResult = {
  ok: boolean;
  message: string;
  warnings: string[];
};

export type RemoteInjectResult = {
  ok: boolean;
  message: string;
};

export type RemoteResetResult = {
  ok: boolean;
  message: string;
};

export interface TheOneConnector {
  getCapabilities(): Promise<RemoteSimulationCapabilities>;
  listDemoTenants(): Promise<DemoTenantSummary[]>;
  runDryRun(request: RemoteDryRunRequest): Promise<RemoteDryRunResult>;
  getRun(runId: string): Promise<RemoteRunResult>;
  getRunEvents(runId: string): Promise<RemoteRunEventsResult>;
  prepareInjectPreview(runId: string): Promise<RemoteInjectPreviewResult>;
  injectDemoRun(runId: string): Promise<RemoteInjectResult>;
  resetRun(runId: string): Promise<RemoteResetResult>;
}
