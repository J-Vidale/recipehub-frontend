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

New → **Web Service**, pointed at `recipehub-backend`.

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
| `JWT_SECRET` | Generate with `openssl rand -base64 48`. Changing it logs everyone out |
| `CLOUDINARY_CLOUD_NAME` | From step 2 |
| `CLOUDINARY_API_KEY` | From step 2 |
| `CLOUDINARY_API_SECRET` | From step 2 |
| `NODE_ENV` | `production` |

Once it is live, note the service URL. It will look like
`https://recipehub-backend-xxxx.onrender.com`.

## 4. Render, web client

New → **Static Site**, pointed at `recipehub-frontend`.

| Setting | Value |
| --- | --- |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |

Environment variables:

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | The API URL from step 3, **with `/api` on the end** |

`VITE_API_URL` has no production default. Left unset, the built site calls
`http://localhost:5000/api` and fails for every visitor.

### Client-side routing

A static site serves files, so a visitor opening `/explore` directly asks
for a file that does not exist and gets a 404 — even though the link works
fine from inside the app. Add a rewrite under **Redirects/Rewrites**:

| Source | Destination | Action |
| --- | --- | --- |
| `/*` | `/index.html` | Rewrite |

## 5. Free-tier sleep

A free Render web service sleeps after about 15 minutes idle and takes
roughly 30 seconds to wake. The first request after a quiet spell is slow,
and any open Socket.IO connection is dropped when it happens. The app is
built for this — notification and message counts poll as well as listen,
so they recover on their own — but it is worth knowing before you assume
something is broken. Paid instances do not sleep.

---

## Optional, and worth doing

### A custom domain

1. Buy a domain anywhere you like.
2. In Render, on the **static site**: Settings → Custom Domains → add it,
   and follow the DNS instructions.
3. Set `VITE_SITE_URL` on the static site to the new origin, no trailing
   slash. This is what canonical tags, Open Graph, the JSON-LD,
   `robots.txt`, `sitemap.xml` and `llms.txt` are all built from.
4. Set `CORS_ORIGINS` on the **API** service to the same origin, plus the
   `www` variant if you use one:
   `https://recipehub.com,https://www.recipehub.com`

Step 4 is the one that is easy to miss and hard to diagnose. Without it
the API refuses the browser's preflight and the Socket.IO handshake, and
the site looks like it has no backend at all — with the only clue in the
browser console.

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
fine at small scale; the startup log says so.

---

## Checking it worked

- `https://your-api.onrender.com/` returns
  `{"status":"ok","service":"recipehub-api"}`
- `https://your-site/robots.txt` and `/sitemap.xml` show your domain, not
  the Render one
- Register an account, publish a recipe with a photo, and open it in a
  private window
- Open `/explore` in a new tab directly, to confirm the rewrite in step 4
  is working

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
