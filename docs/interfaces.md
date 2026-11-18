# Shared interfaces

## Boundaries

I'm keeping shared infrastructure in `lib/`, reusable UI in `components/`, and pages and API handlers in `app/`. Each member owns their feature's frontend, API, validation, and checks. Feature code stays on individual branches until review.

## Launch feed

`GET /api/launches` returns `{ launches, mode, stale, updatedAt, unavailable }`. The mode is `demo` or `live`. `updatedAt` is a Unix timestamp in milliseconds or null. A missing live service returns HTTP 503. `GET /api/launches/[id]` returns `{ launch, mode, stale, updatedAt }`, or 404 for an item outside the bounded feed.

Launch fields are defined in `lib/launches/model.js`: `id`, `name`, `provider`, `rocket`, `description`, `status`, `statusId`, `net`, `precise`, `location`, `pad`, `latitude`, `longitude`, `orbit`, and `broadcast`. Null dates and coordinates are valid. `net` is an ISO timestamp; precise countdowns require second/minute precision. Every detail view uses the same normalized object.

## Identity and private data

Protected requests send `Authorization: Bearer <Firebase ID token>`. `requireUser(request)` returns verified claims including `uid`; `apiError(error)` formats a safe error response. I'm using a verified UID to select a user's collection, never a UID supplied in a request body.

API-managed collections are `users/{uid}/saved/{itemId}`, `users/{uid}/journal/{entryId}`, `telescopes/{sourceId}`, and `launchCache/upcoming`. The implementation must confirm the actual database edition before deployment. Browser Firestore access is not part of the feature API.

## Dialyn

I'm reserving `/login`, `/register`, and `/saved` for authentication and saved resources. Add the AuthProvider once, in the root layout, and expose user/loading state and the existing Firebase auth instance. Build a reusable SaveButton accepting `{ resourceType, resourceId, title }`. Resource types are `launch` and `telescope`.

Build `GET/POST /api/saved` and `GET/PATCH/DELETE /api/saved/[id]`. A saved record includes `resourceType`, `resourceId`, `title`, `note`, `createdAt`, and `updatedAt`. Prevent duplicate saves for a user using an atomic deterministic key. Personal notes are updateable. Derive internal resource URLs from type and ID rather than trusting arbitrary supplied URLs. Saved resources that leave the launch feed must still display their title and note with an unavailable-details message.

## Matthew

I'm reserving `/journal`, `GET/POST /api/journal`, and `GET/PATCH/DELETE /api/journal/[id]` for the journal. An entry includes `title`, `observedAt`, `notes`, optional `eventRef: { resourceType, resourceId }`, `createdAt`, and `updatedAt`. Dates and text limits must be validated server-side. Each operation uses the verified user's collection. Timestamps for creation/update are assigned by the server.

## Adil

I'm reserving `/explore`, `GET /api/telescopes`, and the map for telescope discovery. Source fields are `id`, `name`, `description`, `providerUrl`, `accessType`, `cost`, `registrationRequired`, `limitations`, `verifiedAt`, `latitude`, and `longitude`. Access types are `broadcast`, `image-request`, `course-access`, `webcam`, and `observation-info`.

Ground coordinates can be null; space telescope resources must not receive fabricated Earth markers. The map takes markers shaped as `{ id, type, name, latitude, longitude, href }`. Joaquin supplies launch coordinates through the launch feed. Provider links use verified HTTPS URLs, and new-tab links include `rel="noreferrer"`. Seed records must come from checked official sources. The directory and map remain pending.

## Response conventions

Use JSON with 200 for reads/updates, 201 for creation, 204 with an empty body for deletion, 400 for invalid input, 401 for missing/invalid identity, 404 for missing or inaccessible owned records, and 503 for unavailable configuration/services. Do not expose private keys, token details, or raw provider/database exceptions. Use `{ error: "Readable message" }` for failures.

## Shared presentation

I'm using dark navy surfaces, cyan accents, quiet borders, and consistent cards/forms. Reuse the `.shell`, `.button`, `.eyebrow`, `.lead`, `.pill`, `.empty-state`, and existing spacing conventions. Every feature needs keyboard access, mobile layout, loading, empty, and failure states. Any new comments I add stay short and in first person; teacher comments stay unchanged.
