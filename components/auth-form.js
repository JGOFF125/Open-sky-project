"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { safeNextPath } from "@/lib/auth-path";

// I turn Firebase error codes into messages people can understand
const friendlyErrors = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Your password needs at least 6 characters.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/wrong-password": "The email or password is incorrect.",
  "auth/user-not-found": "The email or password is incorrect.",
  "auth/too-many-requests":
    "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed":
    "We couldn't connect. Check your internet and try again.",
};

export function AuthForm({ mode }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const { auth, user, loading, configured } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If someone is already signed in, I send them along
  useEffect(() => {
    if (!loading && user) router.replace(nextPath);
  }, [loading, user, router, nextPath]);

  function validate() {
    if (isRegister && !name.trim()) return "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return "Please enter a valid email address.";
    if (password.length < 6)
      return "Your password needs at least 6 characters.";
    if (isRegister && password !== confirm)
      return "Your passwords don't match.";
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      if (isRegister) {
        const result = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        await updateProfile(result.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      router.replace(nextPath);
    } catch (err) {
      setError(
        friendlyErrors[err.code] ?? "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  }

  if (!configured) {
    return (
      <div className="empty-state">
        <h2>Accounts aren&apos;t set up here yet.</h2>
        <p>
          Account services are temporarily unavailable. Please try again later.
        </p>
      </div>
    );
  }

  const otherLink = isRegister
    ? { text: "Already have an account?", label: "Sign in", href: "/login" }
    : {
        text: "New to OpenSky?",
        label: "Create an account",
        href: "/register",
      };
  const query = searchParams.get("next")
    ? `?next=${encodeURIComponent(nextPath)}`
    : "";

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {isRegister && (
        <label>
          Name
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
      )}
      <label>
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label>
        Password
        <input
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </label>
      {isRegister && (
        <label>
          Confirm password
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </label>
      )}

      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      <button className="button primary" type="submit" disabled={submitting}>
        {submitting
          ? "Please wait..."
          : isRegister
            ? "Create account"
            : "Sign in"}
        <ArrowRight size={16} />
      </button>

      <p className="auth-switch">
        {otherLink.text}{" "}
        <Link href={`${otherLink.href}${query}`}>{otherLink.label}</Link>
      </p>
    </form>
  );
}
