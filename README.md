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

## Team branches

I'm keeping our shared starting point on `main`. Each member starts their own branch from the latest `main` and opens a pull request back to `main` when their checkpoint is ready.

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c your-name
npm ci
npm run dev
```

If a personal branch already exists, switch to it and merge `origin/main` instead of creating it again. Keep existing work committed before switching branches. Our feature ownership and response formats are in [docs/interfaces.md](docs/interfaces.md).

The launch API works with labelled sample data without credentials, so everyone can start their pages now. Copy `.env.example` to `.env.local` for the shared browser authentication settings. The `NEXT_PUBLIC_FIREBASE_*` values identify the web app and are public configuration, not server credentials.

Protected API routes and real database writes need server credentials supplied privately by the project owner. Keep private keys in `.env.local` or Vercel environment variables. Browser database access stays denied; feature pages call our Next.js API routes.

## Website features

- Responsive home page and shared design system
- Launch explorer with search and provider/status filters
- Mission pages, precision-aware countdowns, broadcast links, and missing-data states
- Launch list/detail JSON endpoints and health endpoint
- Server-only Firebase Admin setup and a shared ID-token verification helper
- Firestore-backed launch-cache implementation with a transaction lock, four-attempt rolling-hour budget, and stale response handling
- Public telescope directory with seven checked sources and an interactive Leaflet map of observatories and launch sites
- Private saved launches and telescope resources with editable notes
- Private observing journal with create, edit, delete, and optional links to saved resources

I'm tracking this review in [docs/checkpoint-status.md](docs/checkpoint-status.md). Dialyn's registration/login/logout and Matthew's journal creation/listing are integrated on `joaquin`. Seven checked telescope source records are in `data/telescopes.json`.

The November 24 launch code includes local-time display, confirmed-status countdowns, detailed-mode broadcast fields, and Firestore cache checks. Production live data still needs verified private Admin credentials.

## Firebase and live data

I'm using the OpenSky project `open-sky-e15ed`, separate from our weekly assignments. Its `(default)` database uses Standard edition, Firestore Native mode, in Montreal (`northamerica-northeast1`). Email/password authentication is enabled. The checked-in rules match the backend-only access policy published in Firebase.

The server expects `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. The private key accepts escaped newline characters. Server credentials must never use a `NEXT_PUBLIC_` prefix or be committed. The four `NEXT_PUBLIC_FIREBASE_*` values configure the browser authentication SDK.

Set `OPENSKY_DATA_MODE=live` only after server credentials, IAM access, and a real launch-cache read/write have been verified. Live mode fails closed when server configuration is missing; it does not silently substitute sample missions. Server ownership checks are still required because the Admin SDK bypasses rules. The checked-in Firebase configuration manages Firestore only; the website stays on Vercel.

The detailed upstream feed includes broadcast fields where available. The cache refreshes on demand, with at most four upstream attempts per rolling hour per shared database cache. There is no background scheduler. Lock expiry handles interrupted refreshes. The current feed holds up to 24 upcoming launches; search and details use that bounded dataset. A launch outside it returns 404. Cache transactions and failure cases pass local Firebase emulator tests. Credentials, IAM access, and a real live-cache write still need verification against the actual project.

## Local integration checks

```bash
npm run test:emulators
```

I'm using disposable local Auth and Standard Firestore emulators under `demo-opensky`; this does not write to our real Firebase project. Java 21 or newer is needed. The first run downloads the Firebase CLI/emulator. The test suite checks registration/sign-in/sign-out, saved-item and journal operations, duplicate prevention, account separation, telescope seeding, denied browser database access, and shared launch-cache transactions. The emulator setup is accepted only outside production, with a `demo-` project ID and loopback emulator hosts.

## Telescope directory

The public explorer and `GET /api/telescopes` work with the seven bundled source records. After configuring private Admin credentials, seed those records into Firestore from the repository root.

```bash
node --env-file=.env.local scripts/seed-telescopes.mjs open-sky-e15ed
```

The seed replaces the seven matching records by ID. The explorer reads the Firestore collection when all seven are valid and falls back to the checked file if the database is unavailable or incomplete. The API reports the active source. The map uses approximate ground coordinates where labelled and links remote viewing to the respective providers.

The explorer includes two new sources in Chile and Mexico. Cerro Tololo’s GONG solar viewer uses the public latest-image feed via `GET /api/telescopes/solar`. It shows the capture time in UTC and refreshes once a minute while open in a visible tab. The image can be older after dark. If the Chile feed is unavailable, the viewer shows a separately labelled GONG network image from Helioviewer. The UNAM Morelia viewer plays the March 2025 lunar eclipse replay and links directly to the official YouTube video.

## Deployment

The Vercel project is `web-dev-2026/opensky` and the repository connection has been set up. Use `main` for the shared deployment and individual branches for previews. Use the root directory, `npm run build`, and the default Next.js output. Add environment variables in Vercel; a demo build needs none. Production environment values and a live Firebase-backed launch request still need verification.

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
