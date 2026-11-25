# Security review — November 25, 2026

I reviewed the latest shared `main` at `3bed06f3f9c6946da28b7e2473528f9ba63f03cb`, all fetched branch histories, the account APIs, upstream requests, browser rendering, Firebase rules, dependencies, and production deployment configuration.

## Exposure finding

GitHub has one open Google API key alert for the Firebase browser key in `.env.example`. I removed the real key from the example. The key remains in historical commits and older branch tips; this patch does not erase those copies or invalidate it.

The history scan covered 23 reachable commits and approximately 160 unique file blobs. It found the Firebase browser key and no matching private PEM key, service-account credential, GitHub access token, or AWS credential. A separate `detect-secrets` scan of current files reported test-only passwords and friendly authentication error messages. This is evidence about the fetched repository contents, not proof that credentials were never exposed elsewhere or that no account was misused.

Firebase browser keys are sent to visitors as part of normal app operation. This finding does not establish an exposed Firebase Admin private key. The remaining provider task is to inspect this key's API restrictions and usage, narrow it to the required Firebase APIs, and rotate it if its usage or permissions warrant it. Google Cloud's credentials page was unavailable in this browser session after one reload, so I could not verify or change those settings. I left the GitHub alert open.

## Fixes in this patch

| Finding | Change |
| --- | --- |
| Real key in the shared example | Blank browser key placeholder, clearer setup guidance, more credential file exclusions |
| 11 npm vulnerability entries | Compatible dependency updates and a scoped override to patched `@grpc/grpc-js` 1.14.7; no forced Firebase downgrade |
| Unbounded JSON parsing in account writes | A shared 32 KiB byte limit, including chunked bodies and dishonest content lengths; invalid JSON returns 400, oversized bodies 413, wrong content types 415 |
| Unlimited saved-item list reads | Saved lists are bounded to 100 records, matching the journal's existing limit |
| Accidental emulator configuration in production | Account services fail closed when either emulator host is configured outside the explicitly permitted local demo setup |
| Account token helper accepted arbitrary destinations | Only the expected same-origin journal/saved API paths can receive a bearer token |
| Missing baseline browser protections | Content security policy with restricted frames/connections, clickjacking protection, MIME sniffing protection, referrer and device-permission headers |
| Limited repository prevention | A credential-pattern check, CI security/test workflow with read-only permissions and pinned actions, plus weekly Dependabot update configuration |

The grpc override is scoped to the Firebase client Firestore dependency because the current Firebase release still requests an affected older grpc range. Recheck it when upgrading Firebase and remove it when the upstream dependency is patched. The original high-severity advisory concerns specific grpc certificate configurations; I found the vulnerable package, not evidence that this application was exploited through it.

The content security policy permits Next.js inline scripts and styles; it is baseline containment, not a nonce-based strict script policy. The existing map tiles, Firebase email/password authentication endpoints, and selected telescope/video frames are allowed. HTTPS provider images remain allowed.

## Access controls checked

- The actual published Firestore rules deny all direct browser reads and writes, matching `firestore.rules` in the repo. I did not loosen them.
- Admin credentials are imported only through server-only modules. Account routes verify Firebase ID tokens with revocation checks and select document paths from the verified UID.
- Saved-item and journal reads, edits, and deletes cannot access another account's records. Ownership fields and protected timestamps cannot be supplied through validated request bodies.
- Private successes and errors use `Cache-Control: no-store`. Generic server errors do not return raw exception details or credentials.
- Upstream fetch destinations are fixed provider endpoints. User input does not choose a server-side fetch URL. React text and map popup text are escaped rather than inserted as arbitrary HTML.
- GitHub secret scanning and push protection were already enabled. Dependency graph/Dependabot alert activation returned a GitHub server error, so I could not verify enabling those settings. The committed Dependabot configuration and npm audit workflow provide separate checks.

## Validation

Local verification passed: zero npm audit vulnerabilities, the credential-pattern scan, lint, 39 unit tests, the production build and smoke checks, and 13 Firebase Auth/Firestore integration tests (52 tests total). Smoke checks cover nine pages, public APIs, protected API responses, security headers, and live mode failing closed without credentials. Integration uses only the disposable `demo-opensky` project on loopback hosts, including two-account isolation and denied direct database access with and without a valid user token. The committed workflow repeats the non-emulator checks on pushes and pull requests.

## Remaining production work

1. Verify the Firebase web key's restrictions and usage in the Google Cloud credentials console for `open-sky-e15ed`. If rotating, update `NEXT_PUBLIC_FIREBASE_API_KEY` in the affected Vercel environments and teammates' private local configuration, redeploy, test authentication, then retire the old key. A browser key will still be visible in the built app afterward.
2. Production Vercel currently has the public Firebase configuration, project ID, and service-account email, but no `FIREBASE_PRIVATE_KEY` variable. Real journal/saved writes and the live launch cache still need private server credential configuration and a real-project integration check. I did not create or publish a service-account key during this review.
3. Teammates should merge the latest `main` into their feature branches and replace their example file with the sanitized version. History is retained. Any history cleanup should be coordinated after provider remediation.

No account-activity investigation, IAM permission audit, global abuse protection, or penetration test is claimed here. Valid public signups can still consume provider quotas through legitimate API calls; monitor actual usage and apply appropriate provider-side quotas/abuse controls before opening the project broadly.

## References

- [Firebase API key guidance](https://firebase.google.com/docs/projects/api-keys)
- [Firebase security checklist](https://firebase.google.com/support/guides/security-checklist)
- [GitHub secret remediation](https://docs.github.com/en/code-security/secret-scanning/managing-alerts-from-secret-scanning/resolving-alerts)
- [grpc certificate advisory](https://github.com/advisories/GHSA-m9gg-hp2v-232j)
- [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249)
