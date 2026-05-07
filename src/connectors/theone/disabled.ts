import type {
  DemoTenantSummary,
  RemoteDryRunResult,
  RemoteInjectPreviewResult,
  RemoteInjectResult,
  RemoteResetResult,
  RemoteRunEventsResult,
  RemoteRunResult,
  RemoteSimulationCapabilities,
  TheOneConnector,
} from "@/connectors/theone/types";

export class DisabledTheOneConnector implements TheOneConnector {
  async getCapabilities(): Promise<RemoteSimulationCapabilities> {
    return {
      mode: "disabled",
      supportsDryRun: false,
      supportsInjectPreview: false,
      supportsLiveInject: false,
      supportsReset: false,
      supportsStaff: false,
      supportsAppointments: false,
      notes: [
        "Connector is disabled.",
        "Local simulation remains available without remote calls.",
        "Staff and appointment integration are explicitly unsupported.",
      ],
    };
  }

  async listDemoTenants(): Promise<DemoTenantSummary[]> {
    return [];
  }

  async runDryRun(): Promise<RemoteDryRunResult> {
    return {
      ok: false,
      message: "The One connector is disabled. No remote dry run was started.",
    };
  }

  async getRun(runId: string): Promise<RemoteRunResult> {
    return {
      ok: false,
      message: `The One connector is disabled. Run lookup is unavailable for ${runId}.`,
    };
  }

  async getRunEvents(runId: string): Promise<RemoteRunEventsResult> {
    return {
      ok: false,
      events: [],
      message: `The One connector is disabled. Run events are unavailable for ${runId}.`,
    };
  }

  async prepareInjectPreview(
    runId: string,
  ): Promise<RemoteInjectPreviewResult> {
    return {
      ok: false,
      message: `The One connector is disabled. Injection preview is unavailable for ${runId}.`,
      warnings: ["No live writes are enabled."],
    };
  }

  async injectDemoRun(runId: string): Promise<RemoteInjectResult> {
    return {
      ok: false,
      message: `The One connector is disabled. No injection was performed for ${runId}.`,
    };
  }

  async resetRun(runId: string): Promise<RemoteResetResult> {
    return {
      ok: false,
      message: `The One connector is disabled. Reset is unavailable for ${runId}.`,
    };
  }
}
