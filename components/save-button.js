"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Check } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { accountRequest } from "@/lib/account-request";

export function SaveButton({ resourceType, resourceId, title }) {
  const { user, loading, configured } = useAuth();
  const path = usePathname();
  if (loading || !configured) return null;
  if (!user) {
    const next =
      resourceType === "telescope"
        ? `${path}#${encodeURIComponent(resourceId)}`
        : path;
    return (
      <Link
        className="button secondary"
        href={`/login?next=${encodeURIComponent(next)}`}
      >
        <Bookmark size={16} aria-hidden="true" /> Sign in to save
      </Link>
    );
  }
  return (
    <SaveAction
      key={`${user.uid}:${resourceType}:${resourceId}`}
      user={user}
      resourceType={resourceType}
      resourceId={resourceId}
      title={title}
    />
  );
}

function SaveAction({ user, resourceType, resourceId, title }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  async function save() {
    setStatus("saving");
    setError("");
    try {
      await accountRequest(user, "/api/saved", {
        method: "POST",
        body: { resourceType, resourceId, title },
      });
      setStatus("saved");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }
  return (
    <div className="feature-actions">
      {status === "saved" ? (
        <Link className="button secondary" href="/saved">
          <Check size={16} aria-hidden="true" /> Saved · View My sky
        </Link>
      ) : (
        <button
          type="button"
          className="button secondary"
          onClick={save}
          disabled={status === "saving"}
        >
          <Bookmark size={16} aria-hidden="true" />{" "}
          {status === "saving" ? "Saving…" : `Save ${resourceType}`}
        </button>
      )}
      {error && (
        <p className="feature-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
