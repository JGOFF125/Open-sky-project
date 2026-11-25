"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, MapPin, Telescope } from "lucide-react";
import { SaveButton } from "@/components/save-button";
import { ObservingMap } from "@/components/observing-map";
import { TelescopeView } from "@/components/telescope-view";
import { resourceHref } from "@/lib/resources";

const accessLabels = {
  broadcast: "Scheduled telescope broadcasts",
  "telescope-images": "Near-live telescope images",
  "telescope-replay": "Telescope replays",
  "image-request": "Image requests",
  "course-access": "Course access",
  webcam: "Observatory cameras",
  "observation-info": "Observing schedules",
};

function locationRegion(source) {
  return source.locationName.split(",").at(-1).trim();
}

function mapLocations(telescopes, launches) {
  const groups = new Map();
  for (const [type, resources] of [
    ["telescope", telescopes],
    ["launch", launches],
  ]) {
    for (const resource of resources) {
      const { id, name, latitude, longitude } = resource;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
      if (!groups.has(key))
        groups.set(key, { key, latitude, longitude, resources: [] });
      groups.get(key).resources.push({
        type,
        name,
        location:
          type === "launch"
            ? (resource.pad ?? resource.location)
            : resource.locationName,
        href: resourceHref({ resourceType: type, resourceId: id }),
      });
    }
  }
  return [...groups.values()];
}

export function TelescopeExplorer({ telescopes, launches, launchLabel }) {
  const [access, setAccess] = useState("");
  const [region, setRegion] = useState("");
  const [showLaunches, setShowLaunches] = useState(true);

  useEffect(() => {
    function revealSource() {
      if (telescopes.some(({ id }) => window.location.hash === `#${id}`)) {
        setAccess("");
        setRegion("");
      }
    }
    window.addEventListener("hashchange", revealSource);
    return () => window.removeEventListener("hashchange", revealSource);
  }, [telescopes]);

  const regions = useMemo(
    () => [...new Set(telescopes.map(locationRegion))].sort(),
    [telescopes],
  );
  const visible = useMemo(
    () =>
      telescopes.filter(
        (source) =>
          (!access || source.accessType === access) &&
          (!region || locationRegion(source) === region),
      ),
    [access, region, telescopes],
  );
  const locations = useMemo(
    () => mapLocations(visible, showLaunches ? launches : []),
    [launches, showLaunches, visible],
  );
  return (
    <div className="telescope-explorer">
      <div className="filter-bar telescope-controls">
        <label>
          Access type
          <select
            value={access}
            onChange={(event) => setAccess(event.target.value)}
          >
            <option value="">All observing options</option>
            {Object.entries(accessLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Location
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            <option value="">All locations</option>
            {regions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="map-toggle">
          <input
            type="checkbox"
            checked={showLaunches}
            onChange={(event) => setShowLaunches(event.target.checked)}
          />
          {launchLabel}
        </label>
      </div>
      <ObservingMap locations={locations} launchLabel={launchLabel} />
      <p className="result-count" aria-live="polite">
        {visible.length} observing{" "}
        {visible.length === 1 ? "resource" : "resources"}
      </p>
      {visible.length === 0 && (
        <div className="empty-state">
          <p>No observing resources match these filters.</p>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setAccess("");
              setRegion("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <div className="telescope-grid">
        {visible.map((source) => (
          <TelescopeCard key={source.id} source={source} />
        ))}
      </div>
    </div>
  );
}

function TelescopeCard({ source }) {
  const hasViewer = [
    "cerro-tololo-solar",
    "unam-morelia-lunar-eclipse",
  ].includes(source.id);
  return (
    <article className="telescope-card" id={source.id}>
      <span className="eyebrow">
        <Telescope size={15} aria-hidden="true" />{" "}
        {accessLabels[source.accessType]} · Free
      </span>
      <h2>{source.name}</h2>
      <p className="source-provider">{source.provider}</p>
      <p>{source.description}</p>
      <p className="source-location">
        <MapPin size={15} aria-hidden="true" /> {source.locationName}
      </p>
      <p className="source-location-note">{source.locationNotes}</p>
      <details>
        <summary>Access requirements and limitations</summary>
        <ul>
          {[...source.requirements, ...source.limitations].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>
      <div className="feature-actions">
        {hasViewer && <TelescopeView sourceId={source.id} />}
        <a
          className={`button ${hasViewer ? "secondary" : "primary"}`}
          href={source.providerUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {source.accessType === "broadcast"
            ? "Check broadcast schedule"
            : source.accessType === "telescope-replay"
              ? "Watch on YouTube"
              : "Open provider"}{" "}
          <ArrowUpRight size={16} aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <SaveButton
          resourceType="telescope"
          resourceId={source.id}
          title={source.name}
        />
      </div>
      <a
        className="source-verification"
        href={source.verificationUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Source checked{" "}
        <time dateTime={source.verifiedAt}>{source.verifiedAt}</time>{" "}
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </article>
  );
}
