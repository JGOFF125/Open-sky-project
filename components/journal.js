"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NotebookPen, Plus } from "lucide-react";
import { AccountArea } from "./account-area";
import { accountRequest } from "@/lib/account-request";
import { resourceHref, resourceTypeLabel } from "@/lib/resources";

function todayInputValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

function formatObservedDate(value) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(value));
}

const referenceValue = (reference) =>
  reference ? `${reference.resourceType}:${reference.resourceId}` : "";

export function Journal() {
  return (
    <section className="shell page-section journal-page">
      <h1>Observing journal</h1>
      <p className="lead">
        Keep a private record of what you observed and what you want to
        remember.
      </p>
      <AccountArea path="/journal">
        {(user) => <JournalCollection key={user.uid} user={user} />}
      </AccountArea>
    </section>
  );
}

function JournalCollection({ user }) {
  const [entries, setEntries] = useState(null);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState(null);
  const [pendingEdit, setPendingEdit] = useState("");
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    accountRequest(user, "/api/journal", { signal: controller.signal }).then(
      ({ entries }) => {
        if (!controller.signal.aborted) setEntries(entries);
      },
      (err) => {
        if (!controller.signal.aborted) setError(err.message);
      },
    );
    accountRequest(user, "/api/saved", { signal: controller.signal }).then(
      ({ items }) => {
        if (!controller.signal.aborted) setResources(items);
      },
      () => {},
    );
    return () => controller.abort();
  }, [user, attempt]);

  async function edit(id) {
    setError("");
    setPendingEdit(id);
    try {
      const { entry } = await accountRequest(user, `/api/journal/${id}`);
      setConfirm("");
      setEditing(entry);
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingEdit("");
    }
  }

  function store(entry) {
    setEntries((previous) =>
      [entry, ...previous.filter(({ id }) => id !== entry.id)].sort(
        (a, b) =>
          b.observedAt.localeCompare(a.observedAt) ||
          b.createdAt.localeCompare(a.createdAt),
      ),
    );
    setEditing(null);
    setMessage("Entry saved.");
  }

  async function remove(id) {
    setDeleting(true);
    setError("");
    try {
      await accountRequest(user, `/api/journal/${id}`, { method: "DELETE" });
      setEntries((current) => current.filter((item) => item.id !== id));
      if (editing?.id === id) setEditing(null);
      setConfirm("");
      setMessage("Entry deleted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  if (!entries) {
    return error ? (
      <div className="empty-state">
        <p role="alert">{error}</p>
        <button
          className="button secondary"
          onClick={() => {
            setError("");
            setAttempt(attempt + 1);
          }}
        >
          Try again
        </button>
      </div>
    ) : (
      <p role="status">Loading your journal…</p>
    );
  }

  return (
    <div className="journal-layout">
      <JournalForm
        key={editing?.id ?? "new"}
        user={user}
        entry={editing}
        resources={resources}
        onSave={store}
        onCancel={() => setEditing(null)}
      />
      <section
        className="journal-entries"
        aria-labelledby="journal-entries-title"
      >
        <div className="journal-list-heading">
          <h2 id="journal-entries-title">Your entries</h2>
          <span className="journal-count">{entries.length}</span>
        </div>
        {error && (
          <p className="feature-error" role="alert">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        {!entries.length && (
          <div className="empty-state">
            <p>Save your first observation to start your journal.</p>
          </div>
        )}
        <div className="journal-entry-list">
          {entries.map((entry) => (
            <article className="journal-entry" key={entry.id}>
              <time dateTime={entry.observedAt}>
                {formatObservedDate(entry.observedAt)}
              </time>
              <h3>{entry.title}</h3>
              {entry.notes && <p>{entry.notes}</p>}
              {entry.eventRef && (
                <Link
                  className="feature-link"
                  href={resourceHref(entry.eventRef)}
                >
                  View linked {entry.eventRef.resourceType}
                </Link>
              )}
              <div className="feature-actions">
                <button
                  type="button"
                  className="button secondary"
                  aria-label={`Edit ${entry.title}`}
                  disabled={Boolean(pendingEdit) || deleting}
                  onClick={() => edit(entry.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="button secondary"
                  aria-label={
                    confirm === entry.id
                      ? "Cancel deletion"
                      : `Delete ${entry.title}`
                  }
                  disabled={deleting}
                  onClick={() =>
                    setConfirm(confirm === entry.id ? "" : entry.id)
                  }
                >
                  {confirm === entry.id ? "Cancel" : "Delete"}
                </button>
                {confirm === entry.id && (
                  <button
                    type="button"
                    className="button danger"
                    disabled={deleting}
                    onClick={() => remove(entry.id)}
                  >
                    Confirm deletion
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function JournalForm({ user, entry, resources, onSave, onCancel }) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [observedAt, setObservedAt] = useState(
    () => entry?.observedAt.slice(0, 10) ?? todayInputValue(),
  );
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [reference, setReference] = useState(referenceValue(entry?.eventRef));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const separator = reference.indexOf(":");
    const eventRef = reference
      ? {
          resourceType: reference.slice(0, separator),
          resourceId: reference.slice(separator + 1),
        }
      : null;
    try {
      const result = await accountRequest(
        user,
        entry ? `/api/journal/${entry.id}` : "/api/journal",
        {
          method: entry ? "PATCH" : "POST",
          body: { title, observedAt, notes, eventRef },
        },
      );
      if (!entry) {
        setTitle("");
        setNotes("");
        setReference("");
      }
      onSave(result.entry);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const originalReference = referenceValue(entry?.eventRef);
  return (
    <form className="journal-form feature-form" onSubmit={submit}>
      <div className="journal-form-heading">
        <NotebookPen size={19} aria-hidden="true" />
        <h2>{entry ? "Edit entry" : "New entry"}</h2>
      </div>
      <label>
        Title
        <input
          value={title}
          required
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          disabled={saving}
        />
      </label>
      <label>
        Observation date
        <input
          type="date"
          value={observedAt}
          required
          onChange={(event) => setObservedAt(event.target.value)}
          disabled={saving}
        />
      </label>
      <label>
        Notes
        <textarea
          value={notes}
          maxLength={5000}
          rows={6}
          onChange={(event) => setNotes(event.target.value)}
          disabled={saving}
        />
      </label>
      <label>
        Reference (optional)
        <select
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          disabled={saving}
        >
          <option value="">No reference</option>
          {originalReference &&
            !resources.some(
              (item) => referenceValue(item) === originalReference,
            ) && (
              <option value={originalReference}>
                Previously linked {entry.eventRef.resourceType}
              </option>
            )}
          {resources.map((resource) => (
            <option key={resource.id} value={referenceValue(resource)}>
              {resourceTypeLabel(resource.resourceType)} · {resource.title}
            </option>
          ))}
        </select>
      </label>
      <div className="feature-actions">
        <button className="button primary" disabled={saving}>
          <Plus size={16} aria-hidden="true" />{" "}
          {saving ? "Saving…" : "Save entry"}
        </button>
        {entry && (
          <button
            type="button"
            className="button secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel edit
          </button>
        )}
      </div>
      {error && (
        <p className="feature-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
