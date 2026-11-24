# November 24 checkpoint

I'm keeping the November 20 catch-up work separate from the later team milestones. These changes are collected on `joaquin`; `main` and the original teammate branches stay unchanged.

## Branch review

| Branch           | Work reviewed                                                                    | Outcome                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| main             | Shared foundation, Firebase project configuration, private Firestore rules       | I retained the current `open-sky-e15ed` setup                                                              |
| joaquin          | Launch tracker and server foundation                                             | I completed the November 24 launch code and added local times and cache integration checks                 |
| Dialyn-Villostas | Registration, login, logout, AuthProvider, header account controls               | I integrated her November 20 contribution, retained attribution, and hardened internal redirects           |
| Matthew          | Journal create/list API, journal page, validation, styling, two validation tests | I retained his work and repaired lint, account-switch handling, request validation, and sign-in navigation |
| Adil             | No remote branch found during this review                                        | I normalized his previously shared telescope records and checked the provider access descriptions          |

## Completed in this checkpoint

I'm keeping the launch list, search, provider/status filters, mission details, countdowns, broadcast links, and Firestore cache. The upstream request now uses detailed mode because normal mode omits launch video links. Launch dates use the viewer's time zone when precise, and uncertain schedules remain labelled. Only a confirmed Go for Launch status starts a countdown.

The shared cache has a transaction lock and a four-attempt rolling-hour budget. I checked concurrent refreshes, fresh reuse, stale responses after HTTP 429, locked/budget-limited requests, and valid empty feeds against a local Standard Firestore emulator. I wait fifteen minutes between upstream attempts, including failed requests, and retain the previous schedule if publishing a refreshed cache fails. A production live feed still requires private server credentials and a real read/write check on `open-sky-e15ed`.

For the November 20 catch-up, the journal supports authenticated creation and listing with validation, server timestamps, persistence, and separate user collections. I clear old account data during identity changes and discard late saves from a previous account. Journal read-one, update, and delete are not included in this catch-up.

The five records in `data/telescopes.json` follow the shared access-type fields. Each includes requirements, free-access limitations, a verification link/date, and location precision. I used Adil's earlier `telescopes.json` research as the starting point. Approximate coordinates are labelled, and space telescopes have no Earth marker. Verification covers provider descriptions and public links, not a completed observing session or course enrollment.

## Checks

I'm running `npm run lint`, `npm test`, `npm run build`, and `npm run test:smoke`. The emulator suite runs with `npm run test:emulators` and uses only the disposable `demo-opensky` project. It checks client-SDK registration/sign-in/sign-out, private journal persistence and account separation, invalid input, denied anonymous database access, and launch-cache transactions. Real provider data was also checked using the Launch Library 2 development endpoint to confirm the response shape and detailed-mode broadcast fields.

The cloud browser could not reach localhost, but I checked the deployed branch preview directly: launch search, provider filtering, empty results, filter reset, mission navigation, ticking countdowns, and the journal sign-in link and disabled signed-out form. Production signed-in writes and the real live-data connection still need verification.

## Remaining work

| Owner    | Remaining milestone work                                                                                                                                       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Joaquin  | Verify private Admin credentials and the live cache against the real Firebase project; complete the later saved-button/map integration with the other owners   |
| Dialyn   | November 24 saved-item endpoints, full CRUD, saved-items page, duplicate protection, and later reusable save controls                                          |
| Matthew  | November 24 journal GET-by-ID, PATCH, DELETE, edit/delete interface, and later resource-reference controls                                                     |
| Adil     | November 24 telescope API, Firestore directory seeding, explorer cards, filters, and initial map; later launch-site markers                                    |
| Everyone | Integrated site by November 30, final testing/polish by December 6, demo/documents by December 9, submission target December 11, official deadline December 13 |

## Provider evidence

- Virtual Telescope free online events: https://www.virtualtelescope.eu/upcoming-events/
- Broader event access distinctions: https://www.virtualtelescope.eu/events/
- MicroObservatory: https://mo-www.cfa.harvard.edu/OWN/
- CfA public resources and free access: https://www.cfa.harvard.edu/resources/public
- OpenScience free course and account requirements: https://telescope.org/
- Subaru camera types and refresh interval: https://subarutelescope.org/en/about/instrument/live_stream/index.html
- NASA observing explorer description: https://science.nasa.gov/missions/webb/what-are-hubble-and-webb-observing-right-now-nasa-tool-has-the-answer/
