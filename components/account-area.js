"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function AccountArea({ path, children }) {
  const { user, loading, configured } = useAuth();
  if (loading) return <p role="status">Checking your account…</p>;
  if (!configured)
    return <p role="status">Account services are temporarily unavailable.</p>;
  if (!user) {
    return (
      <div className="empty-state">
        <p>Sign in to access your private collection.</p>
        <Link
          className="button primary"
          href={`/login?next=${encodeURIComponent(path)}`}
        >
          Sign in
        </Link>
      </div>
    );
  }
  return children(user);
}
