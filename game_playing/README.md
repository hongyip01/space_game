# Space Game – Developer Setup

## Architecture

| Layer | What it serves | Dev URL |
|-------|---------------|---------|
| **Game UI (static)** | `index.html`, `js/`, `css/`, `assets/` | Cloudflare Pages `*.pages.dev` (or open `index.html` directly in a browser) |
| **API Worker** | `POST /api/scores` → Supabase | `https://spacegame.trainingctr.workers.dev` |

The Cloudflare Worker (`functions/api/scores.js`) is deployed with `wrangler.toml` and only handles the `/api/scores` endpoint.  All other paths return a 404 JSON response.

## Switching the API Base URL

The frontend resolves the Worker URL from a single constant in `js/game.js`:

```js
// API base URL – change to '/' (same origin) when deploying game and Worker on the same domain
const API_BASE = 'https://spacegame.trainingctr.workers.dev';
```

When you later move the game UI to the same origin as the Worker (e.g., a custom domain with a route), change `API_BASE` to `''` (empty string) so that the fetch call becomes `fetch('/api/scores', ...)` and uses a relative path with no cross-origin request needed.

## Worker Environment Variables

Set these in the Cloudflare dashboard (Workers → spacegame → Settings → Variables):

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_KEY` | Your Supabase **service-role** key (keep secret – never expose to the frontend) |

## Local Development

```bash
# Install Wrangler
npm install -g wrangler

# Run the Worker locally (from the game_playing/ directory)
wrangler dev

# The Worker will be available at http://localhost:8787
# Update API_BASE in js/game.js to http://localhost:8787 for local testing
```

## Deployment

```bash
# Deploy the Worker (from the game_playing/ directory)
wrangler deploy
```

Deploy the game UI to Cloudflare Pages by connecting the repository in the Pages dashboard and setting the **build output directory** to `game_playing/`.
