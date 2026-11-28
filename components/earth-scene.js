"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { resourceHref } from "@/lib/resources";

function groupLocations(telescopes, launches) {
  const groups = new Map();
  for (const [type, records] of [["telescope", telescopes], ["launch", launches]]) {
    for (const record of records) {
      const { latitude, longitude } = record;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
          Math.abs(latitude) > 90 || Math.abs(longitude) > 180) continue;
      const key = `${type}:${latitude.toFixed(3)},${longitude.toFixed(3)}`;
      if (!groups.has(key)) groups.set(key, {
        key, type, latitude, longitude,
        name: type === "launch" ? record.pad || record.location : record.locationName,
        resources: [],
      });
      groups.get(key).resources.push({
        name: record.name,
        href: resourceHref({ resourceType: type, resourceId: record.id }),
      });
    }
  }
  return [...groups.values()];
}

export function EarthScene({ telescopes = [], launches = [], demo = false }) {
  const locations = useMemo(() => groupLocations(telescopes, launches), [telescopes, launches]);
  const mount = useRef(null);
  const markers = useRef(new Map());
  const angle = useRef(0);
  const motion = useRef({ paused: false, hover: false });
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState("loading");
  const [selected, setSelected] = useState(null);

  function pause(value) {
    motion.current.paused = value;
    setPaused(value);
  }
  function select(location) {
    pause(true);
    angle.current = -Math.PI / 2 - location.longitude * Math.PI / 180;
    setSelected(location);
  }

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    const host = mount.current;
    async function initialize() {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 480;
      canvas.setAttribute("aria-hidden", "true");
      const context = canvas.getContext("2d");
      if (!context) { setStatus("fallback"); return; }
      const image = new Image();
      image.src = "/images/earth-blue-marble.jpg";
      try { await image.decode(); } catch { setStatus("fallback"); return; }
      if (disposed) return;
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = image.width;
      sourceCanvas.height = image.height;
      const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
      sourceContext.drawImage(image, 0, 0);
      const source = sourceContext.getImageData(0, 0, image.width, image.height).data;
      const output = context.createImageData(480, 480);
      const radius = 240 / 1.24;
      const samples = [];
      const tiltCos = Math.cos(.12);
      const tiltSin = Math.sin(.12);
      // I map the texture back onto the visible half of the sphere
      for (let y = 0; y < 480; y++) {
        for (let x = 0; x < 480; x++) {
          const nx = (x - 239.5) / radius;
          const ny = (239.5 - y) / radius;
          const distance = nx * nx + ny * ny;
          if (distance > 1) continue;
          const nz = Math.sqrt(1 - distance);
          const localY = ny * tiltCos + nz * tiltSin;
          const localZ = -ny * tiltSin + nz * tiltCos;
          const u = (.5 + Math.atan2(-localZ, nx) / (2 * Math.PI)) * image.width;
          const row = Math.min(image.height - 1, Math.max(0, Math.floor((.5 - Math.asin(localY) / Math.PI) * image.height)));
          const light = .28 + .78 * Math.max(0, (-.45 * nx + .45 * ny + nz) / 1.185);
          samples.push({ output: (y * 480 + x) * 4, row: row * image.width, u, light });
          output.data[(y * 480 + x) * 4 + 3] = Math.min(255, (1 - distance) * radius * 255);
        }
      }
      host.prepend(canvas);
      setStatus("ready");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      let visible = true;
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
      observer.observe(host);
      const points = locations.map((location) => {
        const lat = location.latitude * Math.PI / 180;
        const lon = location.longitude * Math.PI / 180;
        return { x: Math.cos(lat) * Math.cos(lon), y: Math.sin(lat), z: -Math.cos(lat) * Math.sin(lon) };
      });
      let frame;
      let last = 0;
      let renderedAngle = null;
      function draw(now) {
        frame = requestAnimationFrame(draw);
        if (now - last < 33) return;
        const delta = Math.min((now - last) / 1000, .1);
        last = now;
        if (!visible || document.hidden) return;
        if (!motion.current.paused && !motion.current.hover && !reduced.matches) angle.current += delta * .11;
        if (renderedAngle !== angle.current) {
        const offset = angle.current / (2 * Math.PI) * image.width;
        for (const pixel of samples) {
          const column = ((Math.floor(pixel.u - offset) % image.width) + image.width) % image.width;
          const index = (pixel.row + column) * 4;
          output.data[pixel.output] = source[index] * pixel.light;
          output.data[pixel.output + 1] = source[index + 1] * pixel.light;
          output.data[pixel.output + 2] = source[index + 2] * pixel.light;
        }
        context.putImageData(output, 0, 0);
        renderedAngle = angle.current;
        }
        const cos = Math.cos(angle.current);
        const sin = Math.sin(angle.current);
        points.forEach((point, index) => {
          const button = markers.current.get(locations[index].key);
          if (!button) return;
          const x = point.x * cos + point.z * sin;
          const rotatedZ = -point.x * sin + point.z * cos;
          const y = point.y * tiltCos - rotatedZ * tiltSin;
          const z = point.y * tiltSin + rotatedZ * tiltCos;
          button.hidden = z <= .08;
          if (z > .08) {
            button.style.left = `${50 + x / 1.24 * 50}%`;
            button.style.top = `${50 - y / 1.24 * 50}%`;
          }
        });
      }
      frame = requestAnimationFrame(draw);
      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        canvas.remove();
      };
    }
    initialize().catch(() => { if (!disposed) setStatus("fallback"); });
    return () => { disposed = true; cleanup(); };
  }, [locations]);

  return (
    <section className="earth-scene globe-scene" aria-label="Earth and observing locations">
      <div className="globe-heading"><span className="signal-dot" /> ONE PLANET. A WORLD TO EXPLORE.</div>
      <div className={`globe-viewport globe-${status}`} ref={mount}
        onPointerEnter={() => { motion.current.hover = true; }}
        onPointerLeave={() => { motion.current.hover = false; }}>
        <div className="globe-halo" aria-hidden="true" />
        {status !== "ready" && <p className="globe-status" role="status">
          {status === "loading" ? "Loading Earth…" : "Globe rendering unavailable. Explore the locations below."}
        </p>}
        {status === "ready" && locations.map((location) => (
          <button key={location.key} type="button" className={`globe-pin pin-${location.type}`}
            ref={(element) => { if (element) markers.current.set(location.key, element); else markers.current.delete(location.key); }}
            onClick={() => select(location)} onFocus={() => pause(true)}
            aria-label={`${location.type === "launch" ? "Launch site" : "Telescope"}: ${location.name}`}
            title={location.name} hidden />
        ))}
      </div>
      <div className="globe-toolbar">
        <button type="button" onClick={() => { pause(true); angle.current -= Math.PI / 6; }} aria-label="Rotate Earth west" disabled={status !== "ready"}><ChevronLeft size={16} /></button>
        <button type="button" onClick={() => pause(!paused)} aria-pressed={paused} disabled={status !== "ready"}>
          {paused ? <Play size={13} /> : <Pause size={13} />}{paused ? "Play rotation" : "Pause rotation"}
        </button>
        <button type="button" onClick={() => { pause(true); angle.current += Math.PI / 6; }} aria-label="Rotate Earth east" disabled={status !== "ready"}><ChevronRight size={16} /></button>
      </div>
      <div className="globe-legend"><span><i className="legend-telescope" /> Telescopes</span><span><i className="legend-launch" /> {demo ? "Sample launch sites" : "Upcoming launch sites"}</span></div>
      {selected && <aside className="globe-detail" aria-label="Selected location">
        <button className="globe-close" type="button" aria-label="Close location details" onClick={() => setSelected(null)}><X size={16} /></button>
        <span className="eyebrow">{selected.type === "launch" ? "Launch site" : "Observing location"}</span>
        <h3>{selected.name}</h3>
        <p>{selected.latitude.toFixed(2)}°, {selected.longitude.toFixed(2)}° · Approximate ground location</p>
        {selected.resources.map((resource) => <Link key={resource.href} href={resource.href}>{resource.name} ↗</Link>)}
      </aside>}
      <details className="globe-locations"><summary>Browse all {locations.length} ground locations</summary>
        <div>{locations.map((location) => <button key={location.key} type="button" onClick={() => select(location)}>{location.name} <span>{location.type === "launch" ? "Launch" : "Telescope"}</span></button>)}</div>
      </details>
      <p className="globe-credit">Earth imagery: NASA · Geographic illustration, not a live satellite feed</p>
    </section>
  );
}
