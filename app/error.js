"use client";
export default function ErrorPage({ reset }) {
  return (
    <section className="shell preview-page">
      <span className="eyebrow">Signal interrupted</span>
      <h1>Let’s reconnect.</h1>
      <p className="lead">
        Something interrupted this page. Try loading it again.
      </p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
