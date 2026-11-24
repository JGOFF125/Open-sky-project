"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowUpRight, LoaderCircle, NotebookPen, Plus } from "lucide-react";
import { clientAuth } from "@/lib/firebase/client";

function todayInputValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

function formatObservedDate(value) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function Journal() {
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState("checking");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("");
  const [observedAt, setObservedAt] = useState(todayInputValue);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let active = true;
    let generation = 0;
    let unsubscribe;

    async function loadEntries(currentUser, currentGeneration) {
      setLoading(true);
      setError("");
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/journal", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Could not load entries.");
        if (active && generation === currentGeneration) setEntries(result.entries);
      } catch (loadError) {
        if (active && generation === currentGeneration)
          setError(loadError.message || "Could not load your journal.");
      } finally {
        if (active && generation === currentGeneration) setLoading(false);
      }
    }

    try {
      unsubscribe = onAuthStateChanged(clientAuth(), (currentUser) => {
        const currentGeneration = ++generation;
        setUser(currentUser);
        setNotice("");
        if (!currentUser) {
          setEntries([]);
          setLoading(false);
          setError("");
          setAuthState("signed-out");
          return;
        }
        setAuthState("signed-in");
        loadEntries(currentUser, currentGeneration);
      });
    } catch {
      setAuthState("unavailable");
      setError("Account services are not configured in this environment.");
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  async function createEntry(event) {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, observedAt, notes }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save this entry.");
      setEntries((current) => [result.entry, ...current]);
      setTitle("");
      setNotes("");
      setNotice("Entry saved.");
    } catch (saveError) {
      setError(saveError.message || "Could not save this entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="shell page-section journal-page">
      <span className="eyebrow">OpenSky / your observations</span>
      <h1>
        Keep looking.
        <br />
        <em>Keep noticing.</em>
      </h1>
      <p className="lead">
        A private record of what you saw, what surprised you, and what you want
        to find next.
      </p>
      <ul className="journal-highlights" aria-label="Journal features">
        <li>Private entries</li>
        <li>Mission references</li>
        <li>Your observing history</li>
      </ul>

      {authState === "signed-out" && (
        <p className="journal-auth-message" role="status">
          Sign in with your Firebase account to view or add private entries.
        </p>
      )}
      {error && <p className="journal-message error" role="alert">{error}</p>}
      {notice && <p className="journal-message" role="status">{notice}</p>}

      <div className="journal-layout">
        <form className="journal-form" onSubmit={createEntry}>
          <div className="journal-form-heading">
            <NotebookPen size={19} aria-hidden="true" />
            <h2>New entry</h2>
          </div>
          <label htmlFor="journal-title">Title</label>
          <input
            id="journal-title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
            disabled={!user || saving}
            placeholder="The first clear night"
          />
          <label htmlFor="journal-date">Observation date</label>
          <input
            id="journal-date"
            name="observedAt"
            type="date"
            value={observedAt}
            onChange={(event) => setObservedAt(event.target.value)}
            required
            disabled={!user || saving}
          />
          <label htmlFor="journal-notes">Notes</label>
          <textarea
            id="journal-notes"
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={5000}
            rows={7}
            disabled={!user || saving}
            placeholder="What did you observe? What do you want to remember?"
          />
          <button className="button primary journal-submit" type="submit" disabled={!user || saving}>
            {saving ? <LoaderCircle size={16} className="journal-spinner" /> : <Plus size={17} />}
            {saving ? "Saving entry" : "Save entry"}
          </button>
        </form>

        <section className="journal-entries" aria-labelledby="journal-entries-title">
          <div className="journal-list-heading">
            <div>
              <span className="eyebrow">Field notes</span>
              <h2 id="journal-entries-title">Your journal</h2>
            </div>
            {user && <span className="journal-count">{entries.length} entries</span>}
          </div>
          {authState === "checking" || loading ? (
            <p className="journal-list-state" role="status">Loading your journal…</p>
          ) : entries.length ? (
            <div className="journal-entry-list">
              {entries.map((entry) => (
                <article className="journal-entry" key={entry.id}>
                  <time dateTime={entry.observedAt}>{formatObservedDate(entry.observedAt)}</time>
                  <h3>{entry.title}</h3>
                  {entry.notes && <p>{entry.notes}</p>}
                  {entry.eventRef && (
                    <a
                      className="journal-reference"
                      href={entry.eventRef.resourceType === "launch"
                        ? `/launches/${encodeURIComponent(entry.eventRef.resourceId)}`
                        : "/explore"}
                    >
                      {entry.eventRef.resourceType === "launch" ? "View mission" : "View observatories"}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  )}
                </article>
              ))}
            </div>
          ) : authState === "signed-in" ? (
            <div className="empty-state journal-empty">
              <h2>Your first observation starts here.</h2>
              <p>Save a note and it will appear in this private journal.</p>
            </div>
          ) : authState === "unavailable" ? (
            <p className="journal-list-state">Your journal needs configured account services.</p>
          ) : null}
        </section>
      </div>
    </section>
  );
}