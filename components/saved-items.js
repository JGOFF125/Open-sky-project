"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AccountArea } from "./account-area";
import { accountRequest } from "@/lib/account-request";
import { resourceHref, resourceTypeLabel } from "@/lib/resources";

export function SavedItems({ available, launchAvailability }) {
  return (
    <AccountArea path="/saved">
      {(user) => (
        <SavedCollection
          key={user.uid}
          user={user}
          available={available}
          launchAvailability={launchAvailability}
        />
      )}
    </AccountArea>
  );
}

function SavedCollection({ user, available, launchAvailability }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    accountRequest(user, "/api/saved", { signal: controller.signal }).then(
      ({ items }) => {
        if (!controller.signal.aborted) setItems(items);
      },
      (err) => {
        if (!controller.signal.aborted) setError(err.message);
      },
    );
    return () => controller.abort();
  }, [user, attempt]);

  if (error)
    return (
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
    );
  if (!items) return <p role="status">Loading your saved items…</p>;
  if (!items.length)
    return (
      <div className="empty-state">
        <h2>Nothing saved yet</h2>
        <p>Save a launch or telescope resource to find it here.</p>
        <Link className="button primary" href="/launches">
          Browse launches
        </Link>
      </div>
    );

  return (
    <ul className="feature-grid">
      {items.map((item) => (
        <SavedCard
          key={item.id}
          item={item}
          user={user}
          available={available[item.resourceType].includes(item.resourceId)}
          launchAvailability={launchAvailability}
          onUpdate={(updated) =>
            setItems((current) =>
              current.map((entry) =>
                entry.id === updated.id ? updated : entry,
              ),
            )
          }
          onRemove={() =>
            setItems((current) =>
              current.filter((entry) => entry.id !== item.id),
            )
          }
        />
      ))}
    </ul>
  );
}

function SavedCard({
  item,
  user,
  available,
  launchAvailability,
  onUpdate,
  onRemove,
}) {
  const [note, setNote] = useState(item.note);
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function change(method) {
    setPending(true);
    setError("");
    setMessage("");
    try {
      const result = await accountRequest(user, `/api/saved/${item.id}`, {
        method,
        body: method === "PATCH" ? { note } : undefined,
      });
      if (method === "DELETE") onRemove();
      else {
        setNote(result.item.note);
        onUpdate(result.item);
        setMessage("Note saved.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="feature-card">
      <span className="eyebrow">{resourceTypeLabel(item.resourceType)}</span>
      <h2>{item.title}</h2>
      {available ? (
        <Link className="feature-link" href={resourceHref(item)}>
          Open {item.resourceType}
        </Link>
      ) : (
        <p>
          {item.resourceType === "launch" && !launchAvailability
            ? "Launch details are temporarily unavailable."
            : "This resource is no longer in the current catalog."}
        </p>
      )}
      <form
        className="feature-form"
        onSubmit={(event) => {
          event.preventDefault();
          change("PATCH");
        }}
      >
        <label>
          Personal note
          <textarea
            value={note}
            maxLength={1000}
            rows={3}
            onChange={(event) => setNote(event.target.value)}
            disabled={pending}
          />
        </label>
        <div className="feature-actions">
          <button
            className="button primary"
            disabled={pending || note.trim() === item.note}
          >
            Save note
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={pending}
            onClick={() => setConfirm(!confirm)}
          >
            {confirm ? "Cancel" : "Remove"}
          </button>
          {confirm && (
            <button
              type="button"
              className="button danger"
              disabled={pending}
              onClick={() => change("DELETE")}
            >
              Confirm removal
            </button>
          )}
        </div>
      </form>
      {error && (
        <p className="feature-error" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </li>
  );
}
