"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function ObservingMap({ locations, launchLabel }) {
  const container = useRef(null);
  const controller = useRef(null);
  const [status, setStatus] = useState("loading");
  const [tileError, setTileError] = useState(false);
  const byType = useMemo(() => {
    const resources = locations.flatMap((location) => location.resources);
    return {
      telescope: resources.filter(({ type }) => type === "telescope"),
      launch: resources.filter(({ type }) => type === "launch"),
    };
  }, [locations]);

  useEffect(() => {
    let active = true;
    const element = container.current;

    import("leaflet")
      .then(({ default: L }) => {
        if (!active || !element) return;
        const map = L.map(element, {
          scrollWheelZoom: false,
          minZoom: 2,
        }).setView([24, -25], 2);
        controller.current = { map, L, pins: L.layerGroup().addTo(map) };
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
          maxZoom: 19,
        })
          .on("tileerror", () => {
            if (active) setTileError(true);
          })
          .addTo(map);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
      controller.current?.map.remove();
      controller.current = null;
    };
  }, []);

  useEffect(() => {
    if (!controller.current) return;
    const { map, L, pins } = controller.current;
    pins.clearLayers();
    for (const { latitude, longitude, resources } of locations) {
      const category = resources.every(({ type }) => type === "launch")
        ? "launch"
        : "telescope";
      const label = resources[0].location ?? resources[0].name;
      const content = document.createElement("div");
      const heading = document.createElement("strong");
      heading.textContent = label;
      content.append(heading);
      const links = document.createElement("ul");
      for (const { href, name } of resources) {
        const entry = document.createElement("li");
        const link = document.createElement("a");
        link.setAttribute("href", href);
        link.textContent = name;
        entry.append(link);
        links.append(entry);
      }
      content.append(links);
      L.marker([latitude, longitude], {
        title: label,
        icon: L.divIcon({
          className: `observing-pin ${category}`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      })
        .bindPopup(content)
        .addTo(pins);
    }
    if (locations.length) {
      map.fitBounds(
        locations.map(({ latitude, longitude }) => [latitude, longitude]),
        {
          maxZoom: 8,
          padding: [28, 28],
          animate: false,
        },
      );
    } else {
      map.setView([24, -25], 2);
    }
  }, [locations, status]);

  return (
    <section
      className="observing-map-section"
      aria-labelledby="observing-map-heading"
    >
      <h2 id="observing-map-heading">Observing and launch map</h2>
      <div className="map-legend">
        <span>
          <i className="observing-pin telescope" /> Observing sites
        </span>
        <span>
          <i className="observing-pin launch" /> {launchLabel}
        </span>
      </div>
      <div
        className="observing-map"
        ref={container}
        aria-label="Interactive world map"
        hidden={status === "error"}
      />
      <p className="map-status" role="status">
        {status === "loading" && "Loading the world map…"}
        {status === "error" &&
          "The map could not load. Browse the locations below."}
        {tileError &&
          "Some map tiles could not load. You can still use the pins or browse the locations below."}
        {status === "ready" &&
          !locations.length &&
          "No Earth locations match the current filters."}
      </p>
      <details className="map-location-list">
        <summary>Browse mapped locations ({locations.length})</summary>
        {Object.entries(byType)
          .filter(([, items]) => items.length)
          .map(([type, items]) => (
            <div key={type}>
              <h3>{type === "launch" ? launchLabel : "Observing sites"}</h3>
              <ul>
                {items.map(({ name, href, location }) => (
                  <li key={href}>
                    <a href={href}>{name}</a>
                    {location && <> · {location}</>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        {!locations.length && (
          <p>No Earth locations match the current filters.</p>
        )}
      </details>
    </section>
  );
}
