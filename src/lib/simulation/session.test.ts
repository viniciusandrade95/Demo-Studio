import { describe, expect, it } from "vitest";

import {
  buildViewerViewModel,
  clearDemoSessions,
  createDemoSession,
  getDemoSession,
  resetDemoSession,
  updateDemoSessionPlayback,
} from "@/lib/simulation/session";
import { createInitialPlaybackState } from "@/lib/simulation/playback";

type MemoryStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;
function memoryStorage(): MemoryStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

const request = {
  profileSlug: "barbershop",
  scenarioSlug: "busy_weekend",
  seed: "session-test",
  simulatedDays: 1,
  appointmentsPerDay: 1,
  startDate: "2026-05-06",
  intensity: "medium",
} as const;

describe("local demo sessions", () => {
  it("creates sessions", () => {
    const storage = memoryStorage();
    const session = createDemoSession(request, storage);
    expect(session.sessionId).toContain("local-run-");
    expect(getDemoSession(session.sessionId, storage)).toEqual(session);
  });

  it("looks up sessions", () => {
    const storage = memoryStorage();
    const session = createDemoSession(request, storage);
    expect(getDemoSession(session.sessionId, storage)?.run.runId).toBe(
      session.run.runId,
    );
  });

  it("updates control playback state", () => {
    const storage = memoryStorage();
    const session = createDemoSession(request, storage);
    const updated = updateDemoSessionPlayback(
      session.sessionId,
      { ...session.playbackState, revealedCount: 2, status: "paused" },
      storage,
    );
    expect(updated?.playbackState).toMatchObject({
      revealedCount: 2,
      status: "paused",
    });
  });

  it("builds read-only viewer view model", () => {
    const viewModel = buildViewerViewModel(
      createDemoSession(request, memoryStorage()),
    );
    expect(viewModel.readOnly).toBe(true);
    expect(viewModel.controlActions).toEqual([]);
    expect(viewModel.timelineGroups.length).toBeGreaterThan(0);
  });

  it("resets session", () => {
    const storage = memoryStorage();
    const session = createDemoSession(request, storage);
    updateDemoSessionPlayback(
      session.sessionId,
      { ...session.playbackState, revealedCount: 3 },
      storage,
    );
    expect(resetDemoSession(session.sessionId, storage)?.playbackState).toEqual(
      createInitialPlaybackState(session.run.events.length),
    );
  });

  it("clears without crashing", () => {
    const storage = memoryStorage();
    createDemoSession(request, storage);
    clearDemoSessions(storage);
    expect(getDemoSession("missing", storage)).toBeUndefined();
  });
});
