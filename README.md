# Oor Suthalam

For manual changes, start with [the editing guide](docs/editing-guide.md).

React/Vite travel frontend with Express/Mongoose APIs for accounts, destinations,
packages, itineraries, saved places, booking requests, and admin management.

## Actual workspace structure

```text
MERN/
├── client/oor-suthalam/       # The one active React app
├── server/
│   ├── src/
│   │   ├── config/           # Existing env loader and verified Atlas configuration
│   │   ├── controllers/
│   │   ├── data/             # Explicitly labeled demo catalog
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/         # Itinerary and Plan B logic
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── scripts/              # DB check, optional demo seed, explicit admin setup
│   ├── tests/
│   └── .env.example
├── docs/                     # API and database reference; legacy frontend recovery ZIP
└── scripts/dev.js            # Starts the existing frontend and backend
```

## Run locally

Use Node 24. The backend commands rely on its system CA trust option.

From the MERN root:

```powershell
npm run setup
npm run dev
```

If dependencies are already installed, only run `npm run dev`. Stop any older
frontend/backend process first to avoid using a stale tab or an occupied port.

Or use two terminals:

```powershell
cd server
npm run dev
```

```powershell
cd client/oor-suthalam
npm run dev
```

Frontend: the URL printed by Vite, normally `http://localhost:5173`.
Backend: `http://localhost:5000/api/health`.

## Environment

### Local database alternative (Windows development)

MongoDB Community is installed as the Windows `MongoDB` service on this laptop.
With the service running, start both apps from the MERN root using:

```powershell
npm run dev:local
```

Or, from `server`, use `npm run dev:local` for the backend alone.
Check it with `npm run db:check:local` from `server`.
These explicit commands use `mongodb://127.0.0.1:27017/oor_suthalam_local`.
They do not modify `.env`, alter Atlas TLS settings, or automatically fall back
to an empty database when Atlas fails. Normal `npm run dev` still uses Atlas.

The local database is separate: Atlas accounts, packages, and bookings are not
copied. Register a local account first; if admin access is needed, run
`npm run admin:local -- your-registered-email` from `server`, then log in again.
No demo records are inserted automatically. Keep this database loopback-only
for local development. Production must use its configured secured database.

For Atlas over a changing ISP address, use a backend host with a fixed outbound
IP and allow only that IP in Atlas. Hosting needs a chosen account/plan; no cloud
resources are provisioned by the local setup. A router/ISP TLS restriction still
requires investigation by the network owner.

Keep your existing `server/.env`. For a new installation only, copy
`server/.env.example` to `server/.env`, then fill in the MongoDB URI and a private,
random JWT secret. Do not paste credentials in chat or commit `.env` files.

```dotenv
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

The working Atlas configuration supports optional process-only `MONGO_DNS_SERVERS`.
Keep certificate verification enabled. A machine's current public egress IP must
be permitted in the correct Atlas project's IP access list.

`client/oor-suthalam/.env` is optional. `VITE_API_URL=/api` uses Vite's backend proxy.
Restart Vite after changing its environment. Browser-exposed Vite variables must
never contain passwords, MongoDB URIs, or JWT signing secrets.

## Optional demo destinations and packages

Run explicitly when you want sample catalog records added to the configured database:

```powershell
cd server
npm run seed
```

The seed preserves existing entries and does not create users. Demo prices and
inclusions are examples, not verified live offers.

## Admin setup

1. Register your intended account in the frontend.
2. From `server`, explicitly promote that registered account:

```powershell
npm run admin -- your-registered-email@example.com
```

3. Refresh the frontend to reload the account role and open `/admin`.

There is no default admin password and no public role-promotion endpoint. Only run
the command for the intended owner/operator's account. The script itself is supplied
for manual use; generating the project does not automatically promote anyone.

## Validation

```powershell
# From MERN
npm test
npm run build

# From server: read-only live database check
npm run db:check
```

Tests exercise real local HTTP, validation, JWT cookies, bcrypt, authorization,
owner scoping, server-calculated prices, and itinerary generation. Database calls
are mocked, so these tests work without Atlas and do not modify user records.
The database check tests connectivity separately; it does not write records.

## Scope

Booking requests require admin confirmation. No payment processing, email delivery,
live weather feed, availability inventory, or password-reset workflow is included.
Admin users can manage catalog entries, review bookings/inquiries, and view the
account directory. The itinerary planner uses catalog activities and indoor
alternatives; costs are planning estimates.

For production, configure HTTPS, a persistent JWT secret of at least 32 characters,
and the exact frontend origin. The included rate limiter is per process; shared
rate limiting is needed when running multiple backend instances.

See [API reference](docs/api.md) and [database design](docs/database-design.md).
