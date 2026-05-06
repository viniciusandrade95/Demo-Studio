import { generateSimulationRun } from "@/lib/simulation/generator";
import type {
  DemoTenantSummary,
  RemoteDryRunRequest,
  RemoteDryRunResult,
  RemoteInjectPreviewResult,
  RemoteInjectResult,
  RemoteResetResult,
  RemoteRunEventsResult,
  RemoteRunResult,
  RemoteSimulationCapabilities,
  TheOneConnector,
} from "@/connectors/theone/types";

export class MockTheOneConnector implements TheOneConnector {
  private readonly runs = new Map<
    string,
    NonNullable<RemoteDryRunResult["run"]>
  >();

  async getCapabilities(): Promise<RemoteSimulationCapabilities> {
    return {
      mode: "mock",
      supportsDryRun: true,
      supportsInjectPreview: false,
      supportsLiveInject: false,
      supportsReset: false,
      supportsStaff: false,
      supportsAppointments: false,
      notes: [
        "Mock connector uses local deterministic simulation only.",
        "Staff and appointment sync are explicitly unsupported in this PR.",
        "No external API calls or live writes are performed.",
      ],
    };
  }

  async listDemoTenants(): Promise<DemoTenantSummary[]> {
    return [
      {
        id: "tenant-local-mock",
        name: "Local Mock Tenant",
        region: "local",
        safetyStatus: "mocked_connector",
        slug: "local-mock-tenant",
      },
    ];
  }

  async runDryRun(request: RemoteDryRunRequest): Promise<RemoteDryRunResult> {
    const run = generateSimulationRun(request.request);
    this.runs.set(run.runId, run);

    return {
      ok: true,
      run,
      message: "Mock dry run generated locally. No external API was called.",
    };
  }

  async getRun(runId: string): Promise<RemoteRunResult> {
    const run = this.runs.get(runId);

    return run
      ? { ok: true, run, message: "Mock run found locally." }
      : { ok: false, message: "Mock run not found." };
  }

  async getRunEvents(runId: string): Promise<RemoteRunEventsResult> {
    const run = this.runs.get(runId);

    return run
      ? {
          ok: true,
          events: run.events,
          message: "Mock run events found locally.",
        }
      : { ok: false, events: [], message: "Mock run events not found." };
  }

  async prepareInjectPreview(
    runId: string,
  ): Promise<RemoteInjectPreviewResult> {
    return {
      ok: false,
      message: `Injection preview is disabled for mock run ${runId}.`,
      warnings: ["Live writes are intentionally unsupported."],
    };
  }

  async injectDemoRun(runId: string): Promise<RemoteInjectResult> {
    return {
      ok: false,
      message: `Live injection is disabled for mock run ${runId}. No writes were performed.`,
    };
  }

  async resetRun(runId: string): Promise<RemoteResetResult> {
    return {
      ok: false,
      message: `Remote reset is disabled for local mock run ${runId}.`,
    };
  }
}
