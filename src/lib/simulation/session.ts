import { generateSimulationRun } from "@/lib/simulation/generator";
import { calculateImpactSummary } from "@/lib/simulation/impact";
import {
  createInitialPlaybackState,
  type PlaybackState,
} from "@/lib/simulation/playback";
import { groupTimelineByDay } from "@/lib/simulation/timeline";
import type { SimulationRequest, SimulationRun } from "@/lib/simulation/types";

const SESSION_KEY = "marqo-demo-studio:demo-sessions";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type LocalDemoSession = {
  sessionId: string;
  run: SimulationRun;
  playbackState: PlaybackState;
  createdAt: string;
  updatedAt: string;
};

export type ViewerViewModel = {
  sessionId: string;
  title: string;
  simulatedLabel: string;
  timelineGroups: ReturnType<typeof groupTimelineByDay>;
  impactSummary: ReturnType<typeof calculateImpactSummary>;
  readOnly: true;
  controlActions: [];
};

function browserStorage(): StorageLike | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

function readSessions(storage = browserStorage()): LocalDemoSession[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(SESSION_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((session): session is LocalDemoSession =>
          Boolean(
            session &&
            typeof session === "object" &&
            typeof (session as LocalDemoSession).sessionId === "string" &&
            (session as LocalDemoSession).run,
          ),
        )
      : [];
  } catch {
    return [];
  }
}

function writeSessions(
  sessions: LocalDemoSession[],
  storage = browserStorage(),
) {
  storage?.setItem(SESSION_KEY, JSON.stringify(sessions));
}

export function createDemoSession(
  request: SimulationRequest,
  storage = browserStorage(),
): LocalDemoSession {
  const run = generateSimulationRun(request);
  const now = new Date().toISOString();
  const session: LocalDemoSession = {
    sessionId: `local-${run.runId}`,
    run,
    playbackState: createInitialPlaybackState(run.events.length),
    createdAt: now,
    updatedAt: now,
  };

  if (storage) {
    writeSessions([session, ...readSessions(storage)], storage);
  }

  return session;
}

export function getDemoSession(
  sessionId: string,
  storage = browserStorage(),
): LocalDemoSession | undefined {
  return readSessions(storage).find(
    (session) => session.sessionId === sessionId,
  );
}

export function updateDemoSessionPlayback(
  sessionId: string,
  playbackState: PlaybackState,
  storage = browserStorage(),
): LocalDemoSession | undefined {
  const sessions = readSessions(storage);
  const index = sessions.findIndex(
    (session) => session.sessionId === sessionId,
  );
  if (index === -1) return undefined;

  const updated = {
    ...sessions[index]!,
    playbackState,
    updatedAt: new Date().toISOString(),
  };
  sessions[index] = updated;
  writeSessions(sessions, storage);
  return updated;
}

export function resetDemoSession(
  sessionId: string,
  storage = browserStorage(),
): LocalDemoSession | undefined {
  const session = getDemoSession(sessionId, storage);
  if (!session) return undefined;
  return updateDemoSessionPlayback(
    sessionId,
    createInitialPlaybackState(session.run.events.length),
    storage,
  );
}

export function buildViewerViewModel(
  session: LocalDemoSession,
): ViewerViewModel {
  return {
    sessionId: session.sessionId,
    title: session.run.session.title,
    simulatedLabel: session.run.simulatedLabel,
    timelineGroups: groupTimelineByDay(session.run.events),
    impactSummary: calculateImpactSummary(session.run),
    readOnly: true,
    controlActions: [],
  };
}

export function clearDemoSessions(storage = browserStorage()) {
  storage?.removeItem(SESSION_KEY);
}
