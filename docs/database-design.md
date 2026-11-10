# Database design

MongoDB through Mongoose. Every collection uses timestamps and an automatic `_id`.

| Model / collection | Fields | Relationships |
| --- | --- | --- |
| User / users | name, email, passwordHash, role, savedPlaces | savedPlaces → Destination[] |
| Destination / destinations | name, region, category, description, image, dailyBudget, activities, indoorActivities | Shared catalog |
| Package / packages | title, description, destination, days, price, inclusions, active | destination → Destination |
| Trip / trips | traveler, destination, title, startDate, days, travelers, budget, estimatedCost, itinerary | traveler → User; destination → Destination |
| Booking / bookings | traveler, package, startDate, travelers, total, status | traveler → User; package → Package |
| Inquiry / inquiries | name, email, message | Independent public contact message |

## Invariants

- User email has a unique index; the value is normalized to lowercase.
- Passwords are stored only as bcrypt hashes and excluded from default queries/JSON.
- Roles are `traveler` and `admin`; public registration cannot choose an admin role.
- Requests for trips always include the authenticated traveler's ID in their filter.
- Traveler booking queries and cancellation updates are similarly owner-scoped.
- Booking totals are snapshots calculated on the server from the package price.
- Trip itineraries and estimated costs are snapshots; later catalog changes do not
  rewrite existing trip plans.
- Saved places use `$addToSet` to avoid repeated IDs and `$pull` to remove them.
- Packages are archived using `active: false` so booking references remain valid.
- Referenced destinations cannot be deleted through the API. A removed unreferenced
  saved destination is filtered from populated saved-place responses.
- The only explicitly configured secondary index is unique user email. Additional
  workload-specific indexes/pagination can be added when the dataset grows.

## Booking lifecycle

`pending → confirmed → cancelled`, or `pending → cancelled`.
Only an admin can confirm. The owner or an admin can cancel. Cancellation is final
in this version. There is no inventory counter, payment record, or refund subsystem.

## Configuration and tests

The database name comes from `MONGO_URI`; actual credentials stay in `server/.env`.
Connections retain TLS certificate/hostname verification. Startup commands enable
Node's system CA trust. Optional DNS servers apply only to the Node process.

Automated tests use local HTTP and mocked database calls; they do not read `.env`
or connect to Atlas. A separate read-only database ping command is provided.

## Demo data

The optional seed command adds four sample destinations and four packages. Prices,
activities, and inclusions are illustrative development content. Existing entries
are preserved with `$setOnInsert`; running it again does not intentionally create
another copy of the same named seed entries. Run it from one process at a time.
It never creates or promotes users, and is disabled in production.
