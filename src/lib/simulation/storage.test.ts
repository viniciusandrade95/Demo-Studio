import { describe, expect, it } from "vitest";

import { generateSimulationRun } from "@/lib/simulation/generator";
import {
  clearSimulationRuns,
  deleteSimulationRun,
  getSimulationRun,
  listSimulationRuns,
  saveSimulationRun,
} from "@/lib/simulation/storage";

type MemoryStorage = Pick<Storage, "getItem" | "removeItem" | "setItem"> & {
  dump(): Record<string, string>;
};

function createMemoryStorage(
  initial: Record<string, string> = {},
): MemoryStorage {
  const values = new Map(Object.entries(initial));

  return {
    dump: () => Object.fromEntries(values.entries()),
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

function buildRun(seed: string) {
  return generateSimulationRun({
    profileSlug: "barbershop",
    scenarioSlug: "busy_weekend",
    seed,
    simulatedDays: 1,
    appointmentsPerDay: 1,
    startDate: "2026-05-06",
    intensity: "medium",
  });
}

describe("simulation run storage", () => {
  it("saves, lists, gets, and deletes runs", () => {
    const storage = createMemoryStorage();
    const firstRun = buildRun("storage-01");
    const secondRun = buildRun("storage-02");

    saveSimulationRun(firstRun, storage);
    saveSimulationRun(secondRun, storage);

    expect(listSimulationRuns(storage).map((run) => run.runId)).toEqual([
      secondRun.runId,
      firstRun.runId,
    ]);
    expect(getSimulationRun(firstRun.runId, storage)).toEqual(firstRun);

    deleteSimulationRun(firstRun.runId, storage);

    expect(getSimulationRun(firstRun.runId, storage)).toBeUndefined();
    expect(listSimulationRuns(storage)).toEqual([secondRun]);
  });

  it("clears stored runs", () => {
    const storage = createMemoryStorage();
    saveSimulationRun(buildRun("storage-clear"), storage);

    clearSimulationRuns(storage);

    expect(listSimulationRuns(storage)).toEqual([]);
  });

  it("falls back safely for corrupted localStorage", () => {
    const storage = createMemoryStorage({
      "marqo-demo-studio:simulation-runs": "not-json",
    });

    expect(listSimulationRuns(storage)).toEqual([]);
    expect(getSimulationRun("missing", storage)).toBeUndefined();
  });

  it("falls back safely for empty storage", () => {
    const storage = createMemoryStorage();

    expect(listSimulationRuns(storage)).toEqual([]);
  });

  it("does not crash without browser storage", () => {
    expect(() => saveSimulationRun(buildRun("ssr"), undefined)).not.toThrow();
    expect(listSimulationRuns(undefined)).toEqual([]);
    expect(getSimulationRun("run-id", undefined)).toBeUndefined();
    expect(() => deleteSimulationRun("run-id", undefined)).not.toThrow();
    expect(() => clearSimulationRuns(undefined)).not.toThrow();
  });
});
