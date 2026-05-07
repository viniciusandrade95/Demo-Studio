import type { SimulationRun } from "@/lib/simulation/types";

const STORAGE_KEY = "marqo-demo-studio:simulation-runs";
const MAX_RUNS = 10;

type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

type StoredRunRecord = {
  run: SimulationRun;
  savedAt: string;
};

function getBrowserStorage(): StorageLike | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
}

function safeParseRecords(value: string | null): StoredRunRecord[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((record): record is StoredRunRecord => {
      if (!record || typeof record !== "object") {
        return false;
      }

      const candidate = record as Partial<StoredRunRecord>;
      return Boolean(
        candidate.run &&
        typeof candidate.run === "object" &&
        typeof candidate.run.runId === "string" &&
        typeof candidate.savedAt === "string",
      );
    });
  } catch {
    return [];
  }
}

function readRecords(storage = getBrowserStorage()): StoredRunRecord[] {
  if (!storage) {
    return [];
  }

  return safeParseRecords(storage.getItem(STORAGE_KEY));
}

function writeRecords(
  records: StoredRunRecord[],
  storage = getBrowserStorage(),
) {
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function saveSimulationRun(
  run: SimulationRun,
  storage = getBrowserStorage(),
): void {
  if (!storage) {
    return;
  }

  const existingRecords = readRecords(storage).filter(
    (record) => record.run.runId !== run.runId,
  );
  const nextRecords = [
    {
      run,
      savedAt: new Date().toISOString(),
    },
    ...existingRecords,
  ].slice(0, MAX_RUNS);

  writeRecords(nextRecords, storage);
}

export function listSimulationRuns(
  storage = getBrowserStorage(),
): SimulationRun[] {
  return readRecords(storage).map((record) => record.run);
}

export function getSimulationRun(
  runId: string,
  storage = getBrowserStorage(),
): SimulationRun | undefined {
  return listSimulationRuns(storage).find((run) => run.runId === runId);
}

export function deleteSimulationRun(
  runId: string,
  storage = getBrowserStorage(),
): void {
  if (!storage) {
    return;
  }

  writeRecords(
    readRecords(storage).filter((record) => record.run.runId !== runId),
    storage,
  );
}

export function clearSimulationRuns(storage = getBrowserStorage()): void {
  storage?.removeItem(STORAGE_KEY);
}
