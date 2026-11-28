# November 28 readiness review

## Current scope

The website includes launch search and filters, mission details and broadcasts, seven telescope sources, a ground-location map, Chile and Mexico viewers, deep-space archives and provider links, authentication, private saved items, and a private observing journal. Saved items and journal entries have authenticated REST create, read, update, and delete routes with ownership checks. Firebase remains the only database and Vercel hosts Next.js.

The homepage now has optional animated cloud and grid layers, with pause/play and reduced-motion support. Journal navigation is available in the header. Failed launch requests can be retried without leaving the page. A failed saved-resource lookup in the journal has its own retry message, and sign-out failures remain visible.

## Branch and contribution evidence

Remote branches were fetched on November 28. No new teammate feature commits appeared after the previous review. Dialyn's branch matches main through the security merge. Matthew's branch still ends at `0180db9`, his November 23 journal create/list contribution. No Adil remote branch was present. These observations show repository submissions, not work someone may have kept locally.

Original contributions and the integration work are recorded in `checkpoint-status.md`. A feature being complete on main does not establish that its originally assigned owner completed it. Existing author history is preserved.

## Production blockers

Vercel's OpenSky environment-variable list was checked on November 28. The public Firebase configuration, server project ID, and service-account email are present. `FIREBASE_PRIVATE_KEY` and `OPENSKY_DATA_MODE` are absent. The public site consequently displays labelled illustrative launches.

The project owner must supply the private key privately in Vercel, using the service account for `open-sky-e15ed`. Never paste the key into chat, a commit, an issue, or this document. Set the variables for the intended deployment environments and redeploy. Adding variables does not change an already-built deployment.

After credentials are available, verify one authenticated database write and remove the test record. Set `OPENSKY_DATA_MODE=live`, deploy, and confirm `/api/launches` reports `mode: live`, has a real update timestamp, and persists its shared cache. An upstream outage must remain labelled unavailable or stale. Retry controls respect the existing shared refresh budget.

Seed the seven telescope records with the documented script if a database-backed directory is required for the demonstration. The checked bundled directory already works without a seed, and `/api/telescopes` reports its source.

Check Google Cloud API restrictions for the public Firebase web key in the actual Cloud project. Public configuration alone does not prove that its restrictions are correct. The November 25 code review found no private service-account key in the inspected repository history.

## Final acceptance walkthrough

1. Open the deployed homepage and verify the displayed launch data mode. Pause and resume the decorative Earth animation, then check reduced-motion behavior.
2. Search launches, combine provider/status filters, reset an empty result, open mission details, and inspect the date precision and broadcast link.
3. Register or sign in with a test account. Save a launch twice and confirm only one bookmark remains. Edit its note, reload, and check persistence.
4. Open Observatories. Filter by country and access type, inspect the map, and save a telescope source. Confirm space telescopes have no ground marker.
5. Open the Chile solar viewer and inspect its actual capture time and source. Open the Mexico replay and confirm it remains labelled as a recording.
6. Open Deep Space. Inspect credited archive images, zoom, load the atlas if supported, and follow a public observing-request provider link. Do not describe archives or target listings as live telescope control.
7. Create a journal entry linked to a saved item. Reload, edit, reload again, and delete it. Check the signed-out state and sign-out navigation.
8. Use a second account and confirm the first account's journal and saved items are inaccessible. Remove only the test data created in this walkthrough.
9. Check keyboard navigation, visible focus, mobile layout, missing mission handling, and error/retry behavior.

## Course deliverables still requiring the team

- Record the required 10–15 minute demonstration with all members presenting their actual contributions.
- Complete authentic individual reflections using the course prompts and self-assessment.
- Complete the peer assessment using attributable contribution evidence.
- Submit the required files and the GitHub/deployment links to D2L by December 13.

The full REST CRUD and frontend integration are implemented for the expert scope. Local checks cannot replace signed-in production acceptance or guarantee a rubric score. The optional separate app remains deferred until the website and course submissions are complete.

## Verification on this revision

- ESLint, 39 unit tests, production build, and route/security smoke checks passed.
- All 13 Firebase emulator integration tests passed, including two-account ownership, duplicate-safe bookmarks, journal CRUD, telescope seeding, and launch-cache failure cases.
- The emulator integration timeout is now 30 seconds. Concurrent Firestore transactions exceeded the default five-second test timeout on the first run; the rerun completed all assertions without changing application behavior.
- The current-file credential-pattern scan passed and the production dependency audit reported zero vulnerabilities.
- Production account writes and live launch-cache checks remain pending the private configuration described above.
