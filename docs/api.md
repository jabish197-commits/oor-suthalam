# Oor Suthalam API

Base URL in development: `http://localhost:5000/api`.
The Vite frontend forwards `/api` requests to the backend. Start both processes.

## Sessions and permissions

Register or log in to receive the `session` HttpOnly cookie. Browser requests must
include credentials (the frontend API helper already does). Sessions last seven days.
Registration always creates a traveler. Admin access is assigned only through the
local admin setup command; a client-supplied role is ignored.

Mutation requests from browsers must use a configured `CLIENT_URL` origin.
Local development additionally accepts localhost and 127.0.0.1 on ports 5173/5174.
Use the same hostname consistently when visiting the frontend.

Errors return `{ "success": false, "message": "Readable explanation" }`.
Resource endpoints return an object or an array directly. Lists currently cap results
at 200; pagination is not implemented. All resource IDs are MongoDB ObjectId strings.

## Authentication

| Method | Path | Access | Body / result |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public, rate limited | `{ name, email, password }`; creates account and cookie |
| POST | `/auth/login` | Public, rate limited | `{ email, password }`; returns account and cookie |
| POST | `/auth/logout` | Public | Clears session cookie |
| GET | `/auth/me` | Signed in | Current account without password hash |
| PATCH | `/auth/me` | Signed in | `{ name }`; updates display name |
| GET | `/auth/saved` | Signed in | Populated saved destinations |
| PUT | `/auth/saved/:id` | Signed in | Adds destination once; returns updated account |
| DELETE | `/auth/saved/:id` | Signed in | Removes saved destination; returns account |
| GET | `/auth/users` | Admin | Account directory; no password hashes |

Passwords require 10–72 characters at registration and at most 72 UTF-8 bytes.
Email is unique and stored lowercase. Name is 2–100 characters. Email/password
changes and password reset are not part of this version.

## Destinations

| Method | Path | Access |
| --- | --- | --- |
| GET | `/destinations?q=ooty&category=Nature` | Public |
| GET | `/destinations/:id` | Public |
| POST | `/destinations` | Admin |
| PUT | `/destinations/:id` | Admin, full required fields |
| DELETE | `/destinations/:id` | Admin |

Create/update body:

```json
{
  "name": "Example Hills",
  "region": "Tamil Nadu",
  "category": "Nature",
  "description": "An illustrative destination description.",
  "dailyBudget": 2500,
  "image": "",
  "activities": ["Explore the town", "Try regional food"],
  "indoorActivities": ["Visit a gallery"]
}
```

Categories: `Nature`, `Heritage`, `Coast`, `City`. Images are empty strings or HTTPS
URLs. A destination referenced by a package or trip cannot be deleted (409).

## Packages

| Method | Path | Access |
| --- | --- | --- |
| GET | `/packages` | Public; active packages only |
| GET | `/packages/:id` | Public; active package only |
| POST | `/packages` | Admin |
| PUT | `/packages/:id` | Admin, full required fields |
| DELETE | `/packages/:id` | Admin; archives instead of removing history |

Create/update body: `{ title, description, destination, days, price, inclusions?, active? }`.
`destination` must exist. Days: integer 1–30. Price is INR per person. Archived
packages remain referenced by historical bookings but cannot receive new requests.

## Trips and Plan B

| Method | Path | Access |
| --- | --- | --- |
| GET | `/trips` | Signed-in user's trips |
| GET | `/trips/:id` | Owner only |
| POST | `/trips` | Signed in |
| DELETE | `/trips/:id` | Owner only |

```json
{
  "title": "My next escape",
  "destination": "REPLACE_WITH_DESTINATION_ID",
  "startDate": "2027-01-10",
  "days": 3,
  "travelers": 2,
  "budget": 18000
}
```

Start date must be today or later, formatted `YYYY-MM-DD`. Days: 1–30.
Travelers: 1–20. Budget is total group budget in INR. The server generates each
day's activities and indoor alternative from the destination catalog and estimates
cost as `dailyBudget × days × travelers`. This is a rule-based planner, not a live
weather service or a current-price quotation. Longer trips cycle catalog activities.

## Bookings

| Method | Path | Access |
| --- | --- | --- |
| GET | `/bookings` | Traveler: own requests; admin: all requests |
| POST | `/bookings` | Signed in |
| PATCH | `/bookings/:id/status` | Owner cancellation or admin confirmation/cancellation |

Create body: `{ package, startDate, travelers }`.
The server calculates `total` using the stored package price, ignores a supplied
price/status, and starts requests as `pending`.

Status body: `{ "status": "confirmed" }` or `{ "status": "cancelled" }`.
Travelers cannot confirm requests or modify another traveler's booking. Cancelled
requests cannot be reopened. No online payment, capacity allocation, or automatic
confirmation is performed. No email is sent by booking endpoints.

## Inquiries

| Method | Path | Access |
| --- | --- | --- |
| POST | `/inquiries` | Public, rate limited |
| GET | `/inquiries` | Admin |

Create body: `{ name, email, message }`. Message length: 10–3000 characters.
Inquiries are stored for the admin dashboard; email delivery is not configured.

## Health and error codes

## Admin dashboard

`GET /admin/overview` requires an administrator session. It returns full database
counts (not the capped list lengths), booking counts by status, confirmed booking
value, the latest six bookings, and the latest four inquiries. Confirmed value is
not collected revenue. The dashboard polls this read-only endpoint every 30 seconds
while visible and supports manual refresh.

## Health and error codes

`GET /health` returns `{ success: true, message: "Oor Suthalam API is running!" }`.
It checks the HTTP process, not database readiness. Use `npm run db:check` from
`server` for a database ping.

Common HTTP statuses: 400 invalid input, 401 sign-in required, 403 permission or
origin denied, 404 missing resource, 409 duplicate/conflicting state, 429 request
limit, 500 unexpected failure. Internal driver errors and credentials are suppressed.
