# OpenSky

I'm building a launch tracker and telescope explorer for our Web Development 2 final project.

## Run locally

Use Node.js 22 or newer.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. The default preview works without a Firebase project. Every sample mission is labelled as illustrative, and its dates are not a verified launch schedule.

```bash
npm run lint
npm test
npm run build
npm run test:smoke
```

## Current foundation

- Responsive home page and shared design system
- Launch explorer with search and provider/status filters
- Mission pages, precision-aware countdowns, broadcast links, and missing-data states
- Launch list/detail JSON endpoints and health endpoint
- Server-only Firebase Admin setup and a shared ID-token verification helper
- Firestore-backed launch-cache implementation with a transaction lock, four-attempt rolling-hour budget, and stale response handling
- Explicit upcoming-feature pages for the telescope explorer, saved items, and journal

Authentication screens, journal/saved-item CRUD, telescope data, and the map are still assigned development work. The current preview does not claim these features are complete.

## Firebase and live data

I'm keeping this project's Firebase configuration separate from our weekly assignments. Copy `.env.example` to `.env.local` and use the configuration from the OpenSky Firebase project. Confirm the database instance and edition before connecting the data layer; the foundation currently targets the default database through the Firebase Admin SDK.

The server expects `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. The private key accepts escaped newline characters. Server credentials must never use a `NEXT_PUBLIC_` prefix or be committed. The four `NEXT_PUBLIC_FIREBASE_*` values configure the browser authentication SDK.

Set `OPENSKY_DATA_MODE=live` only after the database, IAM access, and security rules have been configured and verified. Live mode fails closed when server configuration is missing; it does not silently substitute sample missions. Configure Firestore rules to deny browser access to API-managed collections. Server ownership checks are still required because the Admin SDK bypasses rules.

The cache refreshes on demand, with at most four upstream attempts per rolling hour per shared database cache. There is no background scheduler. Lock expiry handles interrupted refreshes. The current feed holds up to 24 upcoming launches; search and details use that bounded dataset. A launch outside it returns 404. The cache's credentials, transactions, IAM access, and live upstream integration still need testing against the actual project.

## Deployment

Import the repository in Vercel as a Next.js project. Use the `joaquin` branch for a preview deployment while the shared `main` branch is being established. Use the root directory, `npm run build`, and the default Next.js output. Add environment variables in Vercel; a demo build needs none. A Vercel connection or production deployment has not been created by this commit.

## Team and scope

| Member                | Ownership                                                  |
| --------------------- | ---------------------------------------------------------- |
| Joaquin Jessua Urbano | Foundation, launch tracker, cache, integration, deployment |
| Dialyn Villostas      | Authentication and saved-item CRUD                         |
| Matthew Pereira       | Private journal and REST CRUD                              |
| Adil Khan             | Verified telescope directory, resource filters, and map    |

I'm tracking our agreed interfaces in [docs/interfaces.md](docs/interfaces.md) and delivery dates in [docs/delivery-plan.md](docs/delivery-plan.md). Firebase remains our only database. The responsive website comes first; a separate app is optional after the website and course deliverables are ready.

## Sources

- [Launch Library 2](https://thespacedevs.com/llapi)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Firebase token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens)

I'm using original CSS illustrations in the current interface. They are decorative and do not depict actual mission photography or live orbital positions.
