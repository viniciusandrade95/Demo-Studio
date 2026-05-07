"use client";

import Link from "next/link";
import { useState } from "react";
import { createDemoSession } from "@/lib/simulation/session";
import type { SimulationIntensity } from "@/lib/simulation/types";

export default function NewDemoSessionPage() {
  const [seed, setSeed] = useState("controller-seed");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<SimulationIntensity>("medium");

  const create = () => {
    const session = createDemoSession({
      profileSlug: "barbershop",
      scenarioSlug: "busy_weekend",
      seed,
      simulatedDays: 1,
      appointmentsPerDay: 2,
      startDate: "2026-05-06",
      intensity,
    });
    setSessionId(session.sessionId);
  };

  return (
    <main className="page-shell px-5 py-6 sm:px-8 lg:px-12">
      <div className="glass-panel mx-auto max-w-3xl rounded-[2rem] p-6">
        <p className="section-eyebrow">New Demo Session</p>
        <h1 className="editorial-title mt-3 text-4xl">
          Create local controller session
        </h1>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            Seed
            <input
              className="rounded-xl border border-line bg-white/70 px-3 py-3"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Intensity
            <select
              className="rounded-xl border border-line bg-white/70 px-3 py-3"
              value={intensity}
              onChange={(event) =>
                setIntensity(event.target.value as SimulationIntensity)
              }
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <button
            onClick={create}
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
          >
            Generate run
          </button>
        </div>
        {sessionId ? (
          <div className="mt-6 flex gap-3">
            <Link
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
              href={`/demo-session/${sessionId}/control`}
            >
              Open controller
            </Link>
            <Link
              className="rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-semibold"
              href={`/demo-session/${sessionId}/viewer`}
            >
              Open viewer
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
