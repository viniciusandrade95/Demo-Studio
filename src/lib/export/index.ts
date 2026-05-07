import type { SalesDemoScript } from "@/lib/demoScripts";
import type { ImpactSummary } from "@/lib/simulation/impact";
import { groupTimelineByDay } from "@/lib/simulation/timeline";
import type { SimulationRun } from "@/lib/simulation/types";

function assertExportableRun(run: SimulationRun) {
  if (!run.runId || !run.session || run.events.length === 0) {
    throw new Error("Cannot export an empty or partial simulation run.");
  }
}

export function exportRunAsJson(run: SimulationRun): string {
  assertExportableRun(run);

  return JSON.stringify(
    {
      runId: run.runId,
      request: run.request,
      session: run.session,
      summary: run.summary,
      simulatedLabel: run.simulatedLabel,
    },
    null,
    2,
  );
}

export function exportRunAsMarkdown(
  run: SimulationRun,
  impactSummary: ImpactSummary,
  script?: SalesDemoScript | null,
): string {
  assertExportableRun(run);
  const timelineHighlights = groupTimelineByDay(run.events)
    .flatMap((group) =>
      group.items
        .slice(0, 3)
        .map(
          (item) =>
            `- ${group.label} ${item.time}: ${item.label} — ${item.detail}`,
        ),
    )
    .slice(0, 10)
    .join("\n");

  return `# ${run.session.title}

## Demo context
- Profile: ${run.request.profileSlug}
- Scenario: ${run.request.scenarioSlug}
- Simulated date range: ${run.startedAt} to ${run.finishedAt}
- Run id: ${run.runId}

## Summary metrics
- Inbound messages: ${run.summary.metrics.inboundMessages}
- Assistant replies: ${run.summary.metrics.assistantReplies}
- Bookings touched: ${run.summary.metrics.bookingsTouched}
- Completed bookings: ${run.summary.metrics.completedBookings}
- Cancelled bookings: ${run.summary.metrics.cancelledBookings}
- No-shows: ${run.summary.metrics.noShowBookings}

## Impact estimates
- Estimated revenue: ${impactSummary.estimatedRevenue}
- Messages handled: ${impactSummary.messagesHandled}
- Manual replies saved: ${impactSummary.manualRepliesSaved}
- Manual work saved minutes: ${impactSummary.manualWorkSavedMinutes}
- Bookings converted: ${impactSummary.bookingsConverted}
- Disruptions: ${impactSummary.disruptionCount}
- Occupancy estimate: ${impactSummary.occupancyEstimate}%

## Timeline highlights
${timelineHighlights}

${script ? `## Sales script / talk track\n- Script: ${script.title}\n- Pain point: ${script.painPoint}\n${script.talkingPoints.map((point) => `- ${point}`).join("\n")}\n` : ""}
## Safety note
This is simulated demo data, not production activity.
`;
}

export function downloadTextFile(filename: string, content: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
