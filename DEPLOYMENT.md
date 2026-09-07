# Deploying RecipeHub

Two Render services, one for the API and one for the web client, plus
three third-party accounts. Everything in the code is done; what is left
is creating accounts and pasting values into dashboards.

The order below matters in one place only: the frontend needs the API's
URL, so deploy the API first.

---

## 1. MongoDB Atlas (required)

The database. The free M0 tier is enough.

1. Create a cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Database Access** → add a database user. Give it a password and keep
   it somewhere safe. This is not your Atlas account password.
3. **Network Access** → add `0.0.0.0/0`. Render's free tier has no fixed
   outbound IP, so an address allowlist cannot work; the database user's
   password is what protects the cluster.
4. **Connect → Drivers** → copy the connection string. Replace
   `<db_password>` with the password from step 2.

Paste it into the API service as `MONGO_URI`.

## 2. Cloudinary (required)

Hosts recipe photos, videos and avatars. The free tier is generous.

Sign up at [cloudinary.com](https://cloudinary.com), then copy the cloud
name, API key and API secret from the dashboard into the API service as
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and
`CLOUDINARY_API_SECRET`.

## 3. Render, API service

Both repositories carry a `render.yaml`, so **New → Blueprint** pointed at
`recipehub-backend` fills in every setting below and prompts only for the
values it cannot know. The tables are the same thing done by hand, for any
other host or if you would rather see each field.

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check path | `/` |

Environment variables — see `.env.example` in that repo for the full list
with notes:

| Variable | Notes |
| --- | --- |
| `MONGO_URI` | From step 1 |
| `JWT_SECRET` | Generate with `openssl rand -base64 48`. Changing it logs everyone out. The blueprint generates one for you |
| `CLOUDINARY_CLOUD_NAME` | From step 2 |
| `CLOUDINARY_API_KEY` | From step 2 |
| `CLOUDINARY_API_SECRET` | From step 2 |
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | The web client's origin — you will not know it until step 4, so come back for this in step 5 |

Once it is live, note the service URL. It will look like
`https://recipehub-backend-xxxx.onrender.com`.

**Read the first lines of the log.** The service prints the environment,
the browser origins it will accept and whether monitoring and caching are
on, then names any variable that is missing or obviously wrong — including
an Atlas connection string still carrying its password placeholder, which
is the usual reason a first deploy answers `bad auth`. If the database is
unreachable the service stays up and keeps saying so rather than dying, so
the log and the health endpoint both stay available while you fix it.

## 4. Render, web client

**New → Blueprint** pointed at `recipehub-frontend`, or by hand:

| Setting | Value |
| --- | --- |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |

Environment variables:

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | The API URL from step 3, with `/api` on the end |

`VITE_API_URL` has no production default. Left unset, the built site calls
`http://localhost:5000/api` and fails for every visitor. Leaving `/api` off
the end is fine — it is added — but the host has to be right. Vite bakes
the value into the JavaScript at build time, so changing it later needs a
new build, not a restart.

### Client-side routing

A static site serves files, so a visitor opening `/explore` directly asks
for a file that does not exist and gets a 404 — even though the link works
fine from inside the app. That is what makes this easy to ship and slow to
notice: it breaks only for people arriving from outside, on a shared link,
a bookmark, a search result or a refresh.

The blueprint includes the rewrite. By hand, add it under
**Redirects/Rewrites**:

| Source | Destination | Action |
| --- | --- | --- |
| `/*` | `/index.html` | Rewrite |

The blueprint also sets `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy` and `Permissions-Policy`, which a static site does not
get otherwise. Configuring by hand, add them under **Headers**.

## 5. Let the API talk to the site

The API only answers browsers whose origin it has been told to accept, and
this is the step that is easy to miss: nothing fails at deploy time, the
site simply behaves as though it has no backend, with the only clue in the
browser console.

Set `CORS_ORIGINS` on the **API** service to the web client's origin from
step 4 — scheme and host, no trailing path:

```
CORS_ORIGINS=https://recipehub-frontend-xxxx.onrender.com
```

Add the `www` variant too if you use one, comma separated. The API needs a
redeploy afterwards. Then open `https://your-site/status`, which checks
this directly.

## 6. Free-tier sleep

A free Render web service sleeps after about 15 minutes idle and takes
roughly 30 seconds to wake. The site says so while it happens: once a
request has been outstanding for a few seconds, a strip appears explaining
that the server is starting up, rather than leaving a blank page that
looks broken.

Any open Socket.IO connection is dropped when the service sleeps. The app
is built for this — notification and message counts poll as well as
listen, so they recover on their own. Paid instances do not sleep.

### Keeping it awake

If the 30-second wait bothers you, point a free uptime monitor
([UptimeRobot](https://uptimerobot.com) and others do this) at the API's
root URL on a 5-minute interval. The service only sleeps after ~15
minutes idle, so a ping every 5 keeps it warm.

The root endpoint is built for exactly this: it does no database work and
answers in a few milliseconds, so pinging it is nearly free. It reports
the database state in its body rather than in its status code, and always
returns 200:

```json
{ "status": "ok", "service": "recipehub-api",
  "database": "connected", "uptimeSeconds": 1834 }
```

The status code answers "is the web process alive", which is what a host's
health check should restart on. A 503 while the database was briefly
unreachable would make Render restart a process that is working perfectly
and cannot fix a database, turning a blip into a restart loop. If you want
alerting on the database specifically, watch the `database` field.

Be aware this keeps a free instance running most of the day. It is within
Render's free allowance for a single service, but if you later run several,
the monthly instance hours are shared.

---

## Optional, and worth doing

### A custom domain

1. Buy a domain anywhere you like.
2. In Render, on the **static site**: Settings → Custom Domains → add it,
   and follow the DNS instructions.
3. Set `VITE_SITE_URL` on the static site to the new origin, no trailing
   slash. This is what canonical tags, Open Graph, the JSON-LD,
   `robots.txt`, `sitemap.xml` and `llms.txt` are all built from.
4. Update `CORS_ORIGINS` on the **API** service to the same origin, plus
   the `www` variant if you use one:
   `https://recipehub.com,https://www.recipehub.com`

Step 4 is step 5 again, for the new origin, and it is the one that is easy
to miss. Without it the API refuses the browser's preflight and the
Socket.IO handshake, and the site looks like it has no backend at all —
with the only clue in the browser console.

Both services need a redeploy afterwards; the frontend because Vite bakes
`VITE_*` values in at build time.

### Contact details

`VITE_CONTACT_EMAIL` and `VITE_CONTACT_PHONE` on the static site. Both are
blank by default and the footer and legal pages render no contact block at
all rather than showing a placeholder. Terms and Privacy both refer to
contacting you, so set at least the email before pointing a real domain at
the site.

### Error monitoring

Without it, a crash in production is invisible: the client sees a generic
message on purpose, and nothing records what actually happened.

Create two projects at [sentry.io](https://sentry.io) — one **Node.js**,
one **React** — and paste each DSN in:

| Service | Variable |
| --- | --- |
| API | `SENTRY_DSN` |
| Web client | `VITE_SENTRY_DSN` |

Both are off unless set. On the frontend the SDK is loaded only when a DSN
is present; enabling it adds an asynchronous chunk of roughly 160 kB
gzipped, fetched after first paint rather than blocking it.

Session Replay is deliberately not enabled, and request bodies, cookies
and auth headers are stripped before anything is sent. This app carries
private messages and a login form.

### Redis

`REDIS_URL` on the API service. Without it the app runs uncached, which is
fine at small scale; the startup summary reports the cache as off.

---

## Checking it worked

**Open `https://your-site/status` first.** It runs three checks in order -
can the browser reach the API, is it allowed to read the reply, and does
the API have a database - and when one fails it names the environment
variable to change. Those three failures look identical from any other
page, which is what makes them slow to diagnose.

Then:

- `https://your-api.onrender.com/` returns
  `{"status":"ok","service":"recipehub-api"}`
- `https://your-site/robots.txt` and `/sitemap.xml` show your domain, not
  the Render one
- Register an account, publish a recipe with a photo, and open it in a
  private window
- Open `/explore` in a new tab directly, to confirm the rewrite in step 4
  is working
- Register, then open a second browser and register again, to confirm the
  two accounts stay separate

## Running it locally

```bash
# API
cd recipehub-backend
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET, Cloudinary keys
npm ci && npm run dev

# Web client, in another terminal
cd recipehub-frontend
npm ci && npm run dev
```

The dev server proxies `/api` to `http://localhost:5000`, so
`VITE_API_URL` can stay unset locally.

`npm test` runs the suite in either repo.
