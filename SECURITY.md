# Security

Keep credentials in `.env.local` for local work and in Vercel environment variables for deployment. Never give a private credential a `NEXT_PUBLIC_` prefix. The shared `.env.example` must contain placeholders only.

Run these checks before opening a pull request:

```bash
npm run security:secrets
npm audit --audit-level=moderate
npm run lint
npm test
```

The credential check scans current tracked and unignored files for common credential formats and reports only their location and type. It is a prevention layer, not a complete credential detector or a replacement for GitHub secret scanning. CI runs it alongside dependency auditing, lint, tests, a build, and smoke checks. Dependabot is configured to propose weekly npm and GitHub Actions updates.

If a private credential is exposed, revoke or rotate it with its provider first, update the private deployment configuration, and redeploy. Removing it from the latest commit does not invalidate copies or remove it from Git history. Do not force-push rewritten history across teammates' branches without coordinating first.

Firebase web API keys identify the public browser app. They do not grant Firebase Admin access. Protect data with verified server ownership checks and restrictive database rules, and restrict each web key to the APIs it needs. Check application restrictions against the app's actual domains before applying them. Do not reuse the Firebase web key with unrelated billable Google APIs.

Keep credential values and private user data out of public issues. Use the repository owner's private contact channel for a suspected exposure. The [November 25 assessment](docs/security-review-2026-11-25.md) records the fixes and remaining provider work.
