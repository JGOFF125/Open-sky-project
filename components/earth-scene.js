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
      const THREE = await import("three");
      if (disposed) return;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      } catch {
        setStatus("fallback");
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.setAttribute("aria-hidden", "true");
      host.prepend(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1.24, 1.24, 1.24, -1.24, .1, 10);
      camera.position.z = 4;
      const globe = new THREE.Group();
      globe.rotation.x = .12;
      scene.add(globe);
      const geometry = new THREE.SphereGeometry(1, 80, 48);
      const material = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 7, specular: 0x203345 });
      globe.add(new THREE.Mesh(geometry, material));
      scene.add(new THREE.AmbientLight(0xffffff, 1.35));
      const sunlight = new THREE.DirectionalLight(0xd6eeff, 2.1);
      sunlight.position.set(-3, 2, 4);
      scene.add(sunlight);
      const texture = new THREE.TextureLoader().load("/images/earth-blue-marble.jpg", () => {
        if (!disposed) setStatus("ready");
      }, undefined, () => { if (!disposed) setStatus("fallback"); });
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      material.map = texture;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      let visible = true;
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
      observer.observe(host);
      const resize = new ResizeObserver(() => {
        renderer.setSize(host.clientWidth, host.clientHeight);
      });
      resize.observe(host);
      const points = locations.map((location) => {
        const lat = location.latitude * Math.PI / 180;
        const lon = location.longitude * Math.PI / 180;
        return new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon));
      });
      let frame;
      let last = 0;
      const world = new THREE.Vector3();
      function draw(now) {
        frame = requestAnimationFrame(draw);
        if (now - last < 33) return;
        const delta = Math.min((now - last) / 1000, .1);
        last = now;
        if (!visible || document.hidden) return;
        if (!motion.current.paused && !motion.current.hover && !reduced.matches) angle.current += delta * .11;
        globe.rotation.y = angle.current;
        globe.updateMatrixWorld(true);
        renderer.render(scene, camera);
        points.forEach((point, index) => {
          const button = markers.current.get(locations[index].key);
          if (!button) return;
          world.copy(point).applyMatrix4(globe.matrixWorld);
          const front = world.z > .08;
          button.hidden = !front;
          if (front) {
            world.project(camera);
            button.style.left = `${(world.x + 1) * 50}%`;
            button.style.top = `${(1 - world.y) * 50}%`;
          }
        });
      }
      const onLost = (event) => { event.preventDefault(); setStatus("fallback"); };
      renderer.domElement.addEventListener("webglcontextlost", onLost);
      frame = requestAnimationFrame(draw);
      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        resize.disconnect();
        renderer.domElement.removeEventListener("webglcontextlost", onLost);
        geometry.dispose(); material.dispose(); texture.dispose(); renderer.dispose();
        renderer.domElement.remove();
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
          {status === "loading" ? "Loading Earth…" : "3D view unavailable. Explore the locations below."}
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
