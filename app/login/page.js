import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <section className="shell auth-page">
      <span className="eyebrow">OpenSky / account</span>
      <h1>Welcome back.</h1>
      <p className="lead">
        Sign in to see your saved launches, resources, and journal.
      </p>
      {/* I need Suspense because the form reads the ?next= value from the URL */}
      <Suspense fallback={<p className="lead">Loading...</p>}>
        <AuthForm mode="login" />
      </Suspense>
    </section>
  );
}