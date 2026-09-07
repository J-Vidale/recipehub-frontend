# RecipeHub Frontend

This is the React frontend for **RecipeHub**, a MERN stack recipe sharing application.

---

## Features

- User registration, login, and logout
- Browse, create, edit, and delete recipes
- Save/unsave recipes to your profile
- View your own and saved recipes
- Responsive design with Tailwind CSS
- Authentication and protected routes
- API integration with backend

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)

### Installation

```sh
git clone https://github.com/yourusername/recipehub-frontend.git
cd recipehub-frontend
npm install
```

### Environment Variables

```sh
cp .env.example .env
```

`.env.example` is the full list, with a note on each variable saying what
it is for. It is kept in step with the code, so it is the reference rather
than a copy in this file that can drift.

Running both halves locally, none of it is needed: the dev server proxies
`/api` to `http://localhost:5000`. In production `VITE_API_URL` is
required — it has no production default and falls back to localhost.

### Running the App

```sh
npm run dev
```
The app will start on `http://localhost:5173` (or similar).

---

## Project Structure

- `/src/pages` — Main pages (Home, Login, Register, RecipeDetail, etc.)
- `/src/components` — Reusable UI components (Navbar, RecipeCard, etc.)
- `/src/context` — Context API for authentication and global state
- `/src/lib` — Framework-free helpers: unit conversion, macro estimation,
  allergen detection, image URLs, the external-API cache
- `/src/index.css` — Tailwind CSS and custom styles
- `/seo` — Templates for `robots.txt`, `sitemap.xml` and `llms.txt`. They
  contain a `__SITE_URL__` placeholder that the build substitutes from
  `VITE_SITE_URL`, so a custom domain reaches them too. Edit these rather
  than the files in `dist`.
- `/tests` — Vitest suite, run with `npm test`

### Tests

```sh
npm test
```

No browser or network needed. CI runs it alongside lint, a production
build and a dependency audit on every push and pull request.

---

## Deployment

You can deploy this frontend to [Render](https://render.com/) or any static site hosting provider.

**See `DEPLOYMENT.md`** for the full walkthrough: both services, the
accounts they need, the rewrite rule a static site needs so deep links
work, and what to change when attaching a custom domain.

The short version: **New → Blueprint** on Render, pointed at this repo.
`render.yaml` carries the build command, the publish directory, the rewrite
and the response headers, and Render prompts for `VITE_API_URL`.

By hand instead:

1. Push your code to GitHub.
2. Create a new Static Site on Render, connect your repo.
3. Build command: `npm ci && npm run build`
4. Publish directory: `dist`
5. Environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
6. Add a rewrite: `/*` → `/index.html`, action Rewrite. Without it, opening
   a route like `/explore` directly returns a 404, even though the same
   link works from inside the app.
7. Deploy

Then set `CORS_ORIGINS` on the API service to this site's origin, or the
browser will refuse every response it gets. `/status` on the deployed site
checks all of this and names whichever variable is wrong.

---

## License

MIT

---

## Contact

For questions or support, open an issue or contact [J-Vidale](https://github.com/J-Vidale).
