"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  simulationPlaybackReducer,
  type PlaybackState,
} from "@/lib/simulation/playback";
import {
  getDemoSession,
  resetDemoSession,
  updateDemoSessionPlayback,
  type LocalDemoSession,
} from "@/lib/simulation/session";

export default function DemoSessionControlPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<LocalDemoSession | null>(null);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setSession(getDemoSession(sessionId) ?? null);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [sessionId]);

  const update = (playbackState: PlaybackState) => {
    const updated = updateDemoSessionPlayback(sessionId, playbackState);
    setSession(updated ?? null);
  };

  if (!session)
    return <main className="page-shell p-8">Session not found.</main>;

  const dispatch = (type: "play" | "pause" | "restart") =>
    update(simulationPlaybackReducer(session.playbackState, { type }));

  return (
    <main className="page-shell px-5 py-6 sm:px-8 lg:px-12">
      <div className="glass-panel mx-auto max-w-4xl rounded-[2rem] p-6">
        <p className="section-eyebrow">Controller</p>
        <h1 className="editorial-title mt-3 text-4xl">
          {session.run.session.title}
        </h1>
        <p className="mt-4 text-sm text-muted">
          Current event index: {session.playbackState.revealedCount} /{" "}
          {session.playbackState.totalEvents}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => dispatch("play")}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            Start playback
          </button>
          <button
            onClick={() => dispatch("pause")}
            className="rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-semibold"
          >
            Pause playback
          </button>
          <button
            onClick={() => dispatch("restart")}
            className="rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-semibold"
          >
            Restart
          </button>
          <button
            onClick={() => setSession(resetDemoSession(sessionId) ?? null)}
            className="rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-semibold text-warn"
          >
            Reset session
          </button>
          <Link
            href={`/demo-session/${sessionId}/viewer`}
            className="rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold"
          >
            Open viewer
          </Link>
        </div>
      </div>
    </main>
  );
}
