"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";

export function EarthScene() {
  const [paused, setPaused] = useState(false);
  return (
    <div className={`earth-scene${paused ? " earth-paused" : ""}`}>
      <div role="img" aria-label="Illustration of Earth with moving clouds and orbital paths">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="earth">
          <div className="earth-grid" />
          <div className="earth-land land-one" />
          <div className="earth-land land-two" />
          <div className="earth-cloud" />
        </div>
        <span className="satellite-point" />
        <div className="coordinate coord-top">
          EARTH / OUR STARTING POINT<br />
          <span>28.56° N &nbsp; 80.58° W</span>
        </div>
        <div className="coordinate coord-bottom">
          A WORLD OF DISCOVERY <span>↗</span>
        </div>
      </div>
      <button type="button" className="earth-motion" onClick={() => setPaused(!paused)}
        aria-label={paused ? "Play Earth animation" : "Pause Earth animation"}
        aria-pressed={paused}>
        {paused ? <Play size={13} /> : <Pause size={13} />}
        {paused ? "Play motion" : "Pause motion"}
      </button>
    </div>
  );
}
