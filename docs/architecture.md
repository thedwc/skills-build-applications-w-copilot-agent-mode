# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the frontend dumb and contract-driven; fetch from the shared `/api` client, render loading/empty/error states, and surface actual data only after the backend contract exists.
- Logic tier decision: Implement Express routes and services in the backend first, validating input and returning deliberate 4xx responses instead of uncaught cast errors or 500s.
- Data tier decision: Define required Mongoose schema fields and defaults, then seed idempotent sample data that preserves preexisting records and links users to teams cleanly.
- Activity tracking approach: Validate `userId` and `teamId` as real ObjectIds, reject malformed or missing references, and compute `points` and `occurredAt` when creating each activity.
- Team management approach: Require `name` and `mascot`, default `members` to an empty array, and keep member IDs serialized consistently in list and create responses.
- Leaderboard approach: Aggregate team totals from activity points, sort descending by `totalPoints`, and assign 1-based ranking values.
- Workout suggestions approach: Match the request email to a seeded user, prefer a workout whose `focus` matches that user’s goal or recent activity pattern, and include a human-readable `reason`.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — verifies Mongoose validation and idempotent seed behavior; current failures show required schema fields are missing.
- API command: `npm run test:api --prefix octofit-tracker/backend` — verifies route validation and business logic; current failures show 501/placeholder responses instead of 4xx validation and missing leaderboard/workout logic.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — verifies the UI loads actual data, renders empty/loading/error states, and requests specific workout suggestions; current failures show placeholder rendering instead of real API-driven content.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — confirms TypeScript compiles once the backend contract is implemented.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — confirms the React app compiles after the data-fetching and presentation logic are complete.
