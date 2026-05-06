import type { DemoEvent } from "@/lib/simulation/types";

export type PlaybackSpeed = "instant" | "1x" | "2x" | "5x" | "10x";

export type PlaybackStatus = "idle" | "playing" | "paused" | "complete";

export type PlaybackState = {
  revealedCount: number;
  speed: PlaybackSpeed;
  status: PlaybackStatus;
  totalEvents: number;
};

export type PlaybackAction =
  | { type: "initialize"; totalEvents: number }
  | { type: "play" }
  | { type: "pause" }
  | { type: "restart" }
  | { type: "show_full_preview" }
  | { type: "set_speed"; speed: PlaybackSpeed }
  | { type: "tick" };

export const playbackSpeeds = [
  "instant",
  "1x",
  "2x",
  "5x",
  "10x",
] as const satisfies readonly PlaybackSpeed[];

export function createInitialPlaybackState(
  totalEvents = 0,
  speed: PlaybackSpeed = "1x",
): PlaybackState {
  return {
    revealedCount: 0,
    speed,
    status: "idle",
    totalEvents,
  };
}

export function getPlaybackIntervalMs(speed: PlaybackSpeed): number | null {
  switch (speed) {
    case "instant":
      return null;
    case "1x":
      return 1000;
    case "2x":
      return 500;
    case "5x":
      return 200;
    case "10x":
      return 100;
  }
}

function clampRevealedCount(count: number, totalEvents: number): number {
  return Math.min(Math.max(0, count), totalEvents);
}

function completeState(state: PlaybackState): PlaybackState {
  return {
    ...state,
    revealedCount: state.totalEvents,
    status: "complete",
  };
}

export function simulationPlaybackReducer(
  state: PlaybackState,
  action: PlaybackAction,
): PlaybackState {
  switch (action.type) {
    case "initialize":
      return {
        ...state,
        revealedCount: 0,
        status: "idle",
        totalEvents: Math.max(0, action.totalEvents),
      };
    case "play":
      if (state.totalEvents === 0 || state.speed === "instant") {
        return completeState(state);
      }

      if (state.revealedCount >= state.totalEvents) {
        return completeState(state);
      }

      return {
        ...state,
        status: "playing",
      };
    case "pause":
      return {
        ...state,
        status: state.status === "playing" ? "paused" : state.status,
      };
    case "restart":
      return {
        ...state,
        revealedCount: 0,
        status: "idle",
      };
    case "show_full_preview":
      return completeState(state);
    case "set_speed": {
      const nextState = {
        ...state,
        speed: action.speed,
      };

      return action.speed === "instant" ? completeState(nextState) : nextState;
    }
    case "tick": {
      if (state.status !== "playing") {
        return state;
      }

      const revealedCount = clampRevealedCount(
        state.revealedCount + 1,
        state.totalEvents,
      );

      return {
        ...state,
        revealedCount,
        status: revealedCount >= state.totalEvents ? "complete" : "playing",
      };
    }
  }
}

export function getRevealedEvents<TEvent extends DemoEvent>(
  events: readonly TEvent[],
  state: PlaybackState,
): TEvent[] {
  return events.slice(
    0,
    clampRevealedCount(state.revealedCount, events.length),
  );
}
