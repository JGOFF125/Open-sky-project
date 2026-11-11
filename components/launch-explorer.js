"use client";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { LaunchCard } from "./launch-card";

export function LaunchExplorer({ launches, demo }) {
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState("");
  const providers = [
    ...new Set(launches.map((launch) => launch.provider)),
  ].sort();
  const statuses = [...new Set(launches.map((launch) => launch.status))].sort();
  const filtered = launches.filter(
    (launch) =>
      `${launch.name} ${launch.rocket} ${launch.location}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!provider || provider === launch.provider) &&
      (!status || status === launch.status),
  );
  return (
    <>
      <div className="filter-bar">
        <label className="search-box">
          <Search size={18} />
          <span className="sr-only">Search missions</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search missions, rockets, locations..."
          />
        </label>
        <SlidersHorizontal className="filter-icon" size={18} />
        <label>
          <span className="sr-only">Launch provider</span>
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
          >
            <option value="">All providers</option>
            {providers.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Launch status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="result-count" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "mission" : "missions"} in
        this feed
      </p>
      {filtered.length ? (
        <div className="launch-grid">
          {filtered.map((launch, index) => (
            <LaunchCard
              key={launch.id}
              launch={launch}
              index={index}
              demo={demo}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No missions found</h2>
          <p>Try a different search or clear your filters.</p>
          <button
            className="button secondary"
            onClick={() => {
              setSearch("");
              setProvider("");
              setStatus("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
