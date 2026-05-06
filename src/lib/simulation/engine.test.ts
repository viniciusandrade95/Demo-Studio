import { describe, expect, it } from "vitest";

import { getDemoSessionById } from "@/lib/simulation/fixtures";
import { projectDemoSession } from "@/lib/simulation/engine";

describe("projectDemoSession", () => {
  it("sorts the timeline and derives stable KPI totals", () => {
    const session = getDemoSessionById("session-alpha");
    expect(session).toBeDefined();

    const projection = projectDemoSession(session!);

    expect(projection.timeline[0]?.id).toBe("evt-001");
    expect(projection.timeline.at(-1)?.id).toBe("evt-013");
    expect(projection.metrics).toEqual({
      inboundMessages: 3,
      assistantReplies: 2,
      bookingsTouched: 3,
      confirmedBookings: 0,
      completedBookings: 1,
      cancelledBookings: 1,
      noShowBookings: 1,
      rescheduledBookings: 0,
    });
  });

  it("keeps final booking statuses by booking id", () => {
    const session = getDemoSessionById("session-alpha");
    expect(session).toBeDefined();

    const projection = projectDemoSession(session!);

    expect(projection.bookingStatuses).toEqual({
      "BK-0998": "cancelled",
      "BK-1001": "completed",
      "BK-1002": "no_show",
    });
  });
});
