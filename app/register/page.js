import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <section className="shell auth-page">
      <span className="eyebrow">OpenSky / account</span>
      <h1>Start your own sky.</h1>
      <p className="lead">
        Make a free account to save launches and keep a private observing
        journal.
      </p>
      {/* I need Suspense because the form reads the ?next= value from the URL */}
      <Suspense fallback={<p className="lead">Loading...</p>}>
        <AuthForm mode="register" />
      </Suspense>
    </section>
  );
}