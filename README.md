# IRCTC railway booking project

A railway booking application with a React frontend, an Express API gateway, and separate services for users, administration, search, inventory, bookings, payments, and email notifications. PostgreSQL stores service data, Redis handles sessions and locks, Kafka carries events, and Elasticsearch powers search.

This guide runs infrastructure in Docker and application processes directly on your computer. The supplied `docker-compose.yml` contains infrastructure only. There are no application Dockerfiles or root npm scripts.

## Local setup checklist

1. Install the prerequisites.
2. Install dependencies in each application directory and copy the environment templates.
3. Correct the user service module setting and configure the environment files.
4. Start Docker infrastructure and create the five databases.
5. Push each Prisma schema and generate its client.
6. Start the services and frontend in separate terminals.
7. Register a user, create railway data, and try a booking.

Commands below run from the project root unless stated otherwise. PowerShell examples work on Windows; Bash alternatives are provided for the setup loops.

## Prerequisites

- Node.js 22.12 or newer in the 22.x line, or Node.js 24+, with npm. The checked-in Prisma dependencies require these Node versions (they also support Node 20.19+).
- Docker Engine with Docker Compose v2, or Docker Desktop configured for Linux containers. On Windows, enable its WSL 2 backend.
- Enough Docker memory for PostgreSQL, Kafka, Elasticsearch, and the optional dashboards. Allow several GB; Elasticsearch alone has a configured 512 MB Java heap.
- A SendGrid API key with mail sending access and a verified sender address for registration emails.
- A Google OAuth client ID: the user service currently requires this variable at startup even when using password login.
- Razorpay test credentials for the payment flow. There is no mock payment provider in this project.

Check your tools:

```text
node --version
npm --version
docker --version
docker compose version
```

Keep ports 3000, 4000-4003, 4005-4007, 5432, 6379, 9092, 9093, 2181, and 9200 available. Optional dashboards also use 8080, 8081, 8001, and 5601.

## Project layout and application ports

| Directory | Port | Responsibility |
| --- | --- | --- |
| `api-gateway/` | 4000 | Client API, authentication, rate limits, service proxying |
| `user-service/` | 4001 | Registration, email OTP, login, profiles |
| `search-service/` | 4002 | Station autocomplete and train search |
| `admin-service/` | 4003 | Stations, trains, routes, schedules |
| `notification-service/` | None | Kafka consumer that sends SendGrid email; its example PORT=4004 is unused |
| `booking-service/` | 4005 | Booking orchestration, expiry, cancellation |
| `payment-service/` | 4006 | Razorpay orders, verification, refunds, webhooks |
| `inventory-service/` | 4007 | Seats, availability, segment locks |
| `frontend/` | 3000 | React, Vite, Tailwind application |
| `shared/` | None | Shared Kafka topics and utilities |

Each application has its own `package.json` and lockfile. Keep the sibling directory structure intact because services import code from `shared/`.

## 1. Install dependencies and copy configuration

Open a terminal in this directory. This copies templates only when `.env` does not already exist, preserving existing configuration.

PowerShell:

```powershell
$apps = @('api-gateway', 'user-service', 'search-service', 'admin-service', 'notification-service', 'booking-service', 'payment-service', 'inventory-service', 'frontend')
foreach ($app in $apps) {
    if (!(Test-Path "$app/.env")) {
        Copy-Item "$app/.env.example" "$app/.env"
    }
    Push-Location $app
    try {
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed for $app" }
    } finally {
        Pop-Location
    }
}
```

Bash:

```bash
for app in api-gateway user-service search-service admin-service notification-service booking-service payment-service inventory-service frontend; do
  [ -f "$app/.env" ] || cp "$app/.env.example" "$app/.env"
  (cd "$app" && npm ci) || break
done
```

If PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm`. If `npm ci` reports a manifest/lockfile mismatch, inspect that mismatch before using `npm install`, which updates the lockfile.

### Required user service module correction

The current `user-service/package.json` declares `"type": "module"`, but its JavaScript uses `require()` and `module.exports`. Before starting that service, change its type to `commonjs`:

```text
npm --prefix user-service pkg set type=commonjs
```

This is a local source configuration correction, not an environment variable. Without it, Node fails with `require is not defined in ES module scope`. Other backend services already declare CommonJS.

## 2. Configure the environment files

Edit the `.env` in each application directory. Several template values are placeholders, and some template ports differ from the Compose setup. Use the values below for this local configuration.

### PostgreSQL

Compose creates the PostgreSQL login `admin` with password `irctcpass`. Set each database-backed service's `DATABASE_URL`:

| Service | DATABASE_URL |
| --- | --- |
| user-service | `postgres://admin:irctcpass@localhost:5432/user_service_database` |
| admin-service | `postgres://admin:irctcpass@localhost:5432/admin_service_database` |
| booking-service | `postgres://admin:irctcpass@localhost:5432/booking_service_database` |
| payment-service | `postgres://admin:irctcpass@localhost:5432/payment_service_database` |
| inventory-service | `postgres://admin:irctcpass@localhost:5432/inventory_service_database` |

These are local Compose credentials. If you change them, update both Compose and the relevant connection URLs. Existing PostgreSQL volumes retain their original credentials.

### Redis, Kafka, Elasticsearch, and CORS

- Set `REDIS_URL=redis://:irctcpass@localhost:6379` in `api-gateway/.env`, `user-service/.env`, and `booking-service/.env`.
- Set `KAFKA_BROKER=localhost:9093` in every backend service except the gateway. In particular, replace the user template's `localhost:9094`. Port 9092 advertises the Docker-internal `kafka` hostname; local Node processes use 9093.
- Set `KAFKA_CLIENT_ID` to the service directory name in each Kafka service, including `user-service`.
- In `search-service/.env`, keep `ELASTICSEARCH_URL=http://localhost:9200` and change `ES_RECREATE_INDICES=false`. Setting it to true deletes and recreates search indices on every startup; existing consumer offsets do not automatically rebuild deleted data.
- Include `http://localhost:3000` in `ALLOWED_ORIGINS` for the gateway and HTTP services. Preserve the other origins from the examples. Use `localhost` consistently in the browser rather than mixing it with `127.0.0.1`.
- Keep `NODE_ENV=development` for local HTTP and cookie behavior.

### Gateway and internal service URLs

In `api-gateway/.env`, use this complete mapping. It corrects the booking and payment ports from the example and explicitly includes admin and inventory:

```dotenv
USER_SERVICE_URL=http://localhost:4001
SEARCH_SERVICE_URL=http://localhost:4002
ADMIN_SERVICE_URL=http://localhost:4003
BOOKING_SERVICE_URL=http://localhost:4005
PAYMENT_SERVICE_URL=http://localhost:4006
INVENTORY_SERVICE_URL=http://localhost:4007
```

Keep the booking service's `USER_SERVICE_URL`, `ADMIN_SERVICE_URL`, `PAYMENT_SERVICE_URL`, and `INVENTORY_SERVICE_URL` on these same ports.

### Shared authentication secrets

Generate independent secrets with this command, repeating it for each secret you need:

```text
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- Set the same `JWT_ACCESS_SECRET` in the gateway and user service.
- Set the same `JWT_REFRESH_SECRET` in the gateway and user service, using a different value from the access secret.
- Set a separate `OTP_HMAC_SECRET` in the user service.
- Set the same `INTERNAL_SERVICE_KEY` in the user, admin, booking, payment, and inventory services.
- Keep the token expiry strings and corresponding seconds consistent: `15m` / `900` for access tokens and `7d` / `604800` for refresh tokens.

### Email and Google configuration

In both `user-service/.env` and `notification-service/.env`, set:

```dotenv
SENDGRID_API_KEY=<your SendGrid API key>
MAIL_SEND=<your verified SendGrid sender email>
```

`MAIL_SEND` is missing from the user template but is required by its startup validation. Add `GOOGLE_CLIENT_ID=<your Google OAuth client ID>` to `user-service/.env` as well; this is also absent from the template and required at startup. The configuration reads `GOOGLE_CLIENT_SECRET`, but the current Google ID token verification uses the client ID.

In `notification-service/.env`, keep `FRONTEND_URL=http://localhost:3000/login`. Registration needs a running notification consumer and working SendGrid credentials to deliver the OTP.

### Payments and frontend

In `payment-service/.env`, set `PAYMENT_GATEWAY=razorpay`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Use test-mode credentials for local development.

In `frontend/.env`, keep:

```dotenv
VITE_API_BASE_URL=/api
```

The Vite development server forwards `/api` to `http://localhost:4000`. Restart Vite after changing frontend environment variables. Never put private keys into `VITE_` variables, which are exposed to the browser.

## 3. Start the infrastructure

Start the required infrastructure:

```text
docker compose up -d postgres redis zookeeper kafka elasticsearch
docker compose ps
```

Optionally start the administration dashboards:

```text
docker compose up -d pgadmin kafka-ui kibana
```

Or use `docker compose up -d` to start everything defined in Compose. Initial image downloads and broker/search startup can take a few minutes. Running containers are not necessarily ready; check these commands before starting applications:

```text
docker compose exec postgres pg_isready -U admin -d postgres
docker compose exec redis redis-cli -a irctcpass ping
docker compose exec kafka kafka-topics --bootstrap-server kafka:9092 --list
```

Elasticsearch should return JSON at `http://localhost:9200`. In PowerShell:

```powershell
Invoke-RestMethod http://localhost:9200
```

Inspect startup problems with `docker compose logs --tail=100 postgres kafka elasticsearch`.

### Optional infrastructure interfaces

| Interface | URL | Local login / connection |
| --- | --- | --- |
| pgAdmin | http://localhost:8081 | `admin@admin.com` / `admin`; register PostgreSQL host `postgres`, port 5432, user `admin`, password `irctcpass` |
| RedisInsight | http://localhost:8001 | If prompted, connect to host `redis`, port 6379, password `irctcpass` |
| Kafka UI | http://localhost:8080 | Cluster is configured by Compose |
| Kibana | http://localhost:5601 | Elasticsearch security is disabled in this local configuration |

## 4. Create the service databases

Compose creates only the default `postgres` database. On a fresh volume, create all five application databases:

```text
docker compose exec postgres createdb -U admin user_service_database
docker compose exec postgres createdb -U admin admin_service_database
docker compose exec postgres createdb -U admin booking_service_database
docker compose exec postgres createdb -U admin payment_service_database
docker compose exec postgres createdb -U admin inventory_service_database
```

Run this once. An `already exists` message on subsequent runs means that database is already present.

## 5. Initialize Prisma schemas and clients

The repository includes Prisma schemas but no SQL migration files, so `prisma migrate deploy` alone will not create the tables. For an initial local database, use `db push`, then generate each service's client explicitly.

PowerShell:

```powershell
$dbApps = @('user-service', 'admin-service', 'booking-service', 'payment-service', 'inventory-service')
foreach ($app in $dbApps) {
    Push-Location $app
    try {
        npx prisma db push
        if ($LASTEXITCODE -ne 0) { throw "Schema setup failed for $app" }
        npx prisma generate
        if ($LASTEXITCODE -ne 0) { throw "Client generation failed for $app" }
    } finally {
        Pop-Location
    }
}
```

Bash:

```bash
for app in user-service admin-service booking-service payment-service inventory-service; do
  (cd "$app" && npx prisma db push && npx prisma generate) || break
done
```

Run these commands from the individual service directories so Prisma loads the correct `prisma.config.ts` and `.env`. After schema edits, regenerate that service's client. For future versioned database changes, create and commit migrations rather than relying on `db push` for deployments.

## 6. Run the application

Open a separate terminal at the project root for each row below, and keep it running. Start consumers before creating stations or schedules, and wait for their startup logs before continuing.

| Suggested order | Command |
| --- | --- |
| 1 | `npm --prefix notification-service run dev` |
| 2 | `npm --prefix inventory-service run dev` |
| 3 | `npm --prefix search-service run dev` |
| 4 | `npm --prefix user-service run dev` |
| 5 | `npm --prefix admin-service run dev` |
| 6 | `npm --prefix payment-service run dev` |
| 7 | `npm --prefix booking-service run dev` |
| 8 | `npm --prefix api-gateway run dev` |
| 9 | `npm --prefix frontend run dev` |

Backend `dev` scripts use nodemon. Use `npm --prefix <service> start` if you do not need automatic restarts. There is no root command that starts all applications.

Open **http://localhost:3000**. Confirm Vite actually selected port 3000; if it falls back to another port, free port 3000 or update allowed origins accordingly.

### Check the HTTP services

PowerShell:

```powershell
foreach ($port in @(4000, 4001, 4002, 4003, 4005, 4006, 4007)) {
    Write-Host "Checking port $port"
    Invoke-RestMethod "http://localhost:$port/health"
}
```

The notification service has no HTTP health endpoint; check its terminal for a successful Kafka consumer startup. Some HTTP health endpoints only confirm that the process is responding. Booking, inventory, and payment additionally check their data dependencies.

## 7. Register and create local railway data

There is no seed script, pre-created account, or sample train dataset.

1. Visit `/login`, choose registration, and enter your name, email, password, and confirmation.
2. Read the emailed OTP and verify it in the same browser session. The backend tracks the OTP session in an HTTP-only cookie.
3. Log in, then open `/admin` to create stations, a train with seats and prices, an ordered route connecting those stations, and a schedule with a future departure date.
4. Wait for Kafka consumers to populate Elasticsearch and inventory, then search using the matching stations and schedule date.
5. Select seats, enter passengers, and complete Razorpay test checkout. Check the booking detail and bookings pages for the resulting status.

The current gateway does not expose every admin listing route implemented by the admin service. If an admin screen receives a 404 when listing trains or schedules, compare `frontend/src/api/admin.api.js` with `api-gateway/src/routes/index.js`; this is an application routing gap, not a database setup failure.

For clients calling the API directly, preserve cookies between registration, OTP verification, and login. Example gateway route groups:

| Feature | Gateway route |
| --- | --- |
| Registration | `POST /api/users/auth/send-otp` with `firstName`, `lastName`, `email`, `password`, `confirmPassword` |
| OTP verification | `POST /api/users/auth/verify-otp` with `otp` and the saved `otp_session` cookie |
| Login | `POST /api/users/auth/login` with `email`, `password` |
| Profile | `GET /api/users/user/profile` |
| Train search | `GET /api/search/trains` |
| Station autocomplete | `GET /api/search/autocomplete` |
| Availability | `GET /api/inventory/schedules/:scheduleId/availability` |
| Bookings | `GET` / `POST /api/bookings/bookings` |
| Razorpay webhook | `POST /api/payments/webhooks/razorpay` |

### Receiving payment webhooks locally

Razorpay cannot call your computer's `localhost` URL directly. If testing asynchronous webhooks, expose the gateway through an HTTPS tunnel and configure the Razorpay webhook URL as:

```text
https://<your-tunnel-host>/api/payments/webhooks/razorpay
```

Use the same signing secret as `RAZORPAY_WEBHOOK_SECRET` and enable the payment events handled in `payment-service/src/controllers/webhook.controller.js`. Keep the tunnel running while testing.

## Frontend build

```text
npm --prefix frontend run build
npm --prefix frontend run preview
```

The build output is `frontend/dist/`. The `/api` proxy is configured for the development server; when serving a built frontend, configure an API reverse proxy or set an appropriate `VITE_API_BASE_URL` before building and allow that frontend origin in the backend.

## Stop and restart

Stop each application terminal with `Ctrl+C`, then stop infrastructure:

```text
docker compose stop
```

Use `docker compose start` to resume existing containers, or `docker compose up -d` to create/start them. `docker compose down` removes containers and the network but retains named data volumes. Adding `-v` deletes those volumes, including databases, Kafka history, Redis data, and search indices; use that only for an intentional full local reset, then repeat database initialization.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `require is not defined in ES module scope` | Apply the user service CommonJS correction in step 1. |
| Missing Google, SendGrid, or sender variable | Add `GOOGLE_CLIENT_ID`, `SENDGRID_API_KEY`, and `MAIL_SEND` to the user service; the example omits some required values. |
| Database missing or tables missing | Create all five databases and run `prisma db push` in each database service. |
| Prisma client missing or stale | Run `npx prisma generate` inside the affected service directory. |
| Redis authentication failure | Use the Compose password `irctcpass` in all three Redis URLs. |
| Kafka connection or hostname errors | Use `localhost:9093` for host processes; wait for Kafka readiness. |
| Gateway sends requests to the wrong service | Correct booking to 4005 and payment to 4006 in the gateway `.env`. |
| No OTP email | Start notification-service before requesting the OTP; confirm SendGrid key, verified sender, spam folder, and consumer logs. Its consumer starts new subscriptions at the latest messages. |
| Empty train search | Create stations, route, and dated schedule through admin APIs; check search/inventory consumers. Keep `ES_RECREATE_INDICES=false` when restarting. |
| Browser CORS or cookie errors | Use `http://localhost:3000`, keep development mode, and include that origin in the HTTP services' allowed origins. |
| Container exits or Elasticsearch stays unavailable | Read Compose logs and check Docker memory; follow any host kernel setting requirement reported by Elasticsearch. |
| Module not found on Linux | The auth controller imports `deviceFingerPrint`, while the file is `deviceFingerprint.js`; make the import casing match the file on a case-sensitive filesystem. |

## Repository hygiene

The root `.gitignore` excludes dependencies, local environment files, generated Prisma clients, logs, build output, caches, and local credentials across all service directories. Keep `.env.example`, npm lockfiles, Prisma schemas, and migration SQL under version control.

The root `.dockerignore` excludes local dependencies, secrets, repository metadata, and generated artifacts from future Docker builds using the repository root as their build context. It does not change what the current infrastructure-only Compose file starts. Generate Prisma clients during an application image build rather than copying host-generated clients.
