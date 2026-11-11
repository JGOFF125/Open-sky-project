"use client";
import { useEffect, useState } from "react";
import { countdownState } from "@/lib/launches/model";

export function Countdown({ launch, compact = false }) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const state = countdownState(launch, now ?? 0);
  if (state.seconds === null)
    return <p className="countdown-message">{state.label}</p>;
  const seconds = now === null ? null : state.seconds;
  const values =
    seconds === null
      ? ["—", "—", "—", "—"]
      : [
          Math.floor(seconds / 86400),
          Math.floor(seconds / 3600) % 24,
          Math.floor(seconds / 60) % 60,
          seconds % 60,
        ].map((value) => String(value).padStart(2, "0"));
  return (
    <div
      className={compact ? "countdown compact" : "countdown"}
      role="group"
      aria-label={state.label}
    >
      {values.map((value, index) => (
        <div key={index}>
          <strong>{value}</strong>
          <span>{["Days", "Hours", "Minutes", "Seconds"][index]}</span>
        </div>
      ))}
    </div>
  );
}
