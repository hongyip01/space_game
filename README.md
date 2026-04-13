# Space Game

A browser-based space game whose scores are stored securely via a Cloudflare Worker that forwards data to Supabase.

## Project layout

```
game_playing/          # Static game assets (HTML, CSS, JS)
src/index.js           # Cloudflare Worker entrypoint
wrangler.toml          # Wrangler configuration
```

## Deploying the Cloudflare Worker

### Prerequisites

- [Node.js](https://nodejs.org/) (16+)
- A [Cloudflare](https://dash.cloudflare.com/) account
- Wrangler CLI (installed on-demand via `npx`)

### 1. Set secrets

Store your Supabase credentials as Worker secrets (they are **never** committed to the repo):

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
```

### 2. Deploy

```bash
npx wrangler deploy
```

This deploys the Worker defined in `wrangler.toml` (`name = "spacegame"`, `main = "src/index.js"`).

### 3. Update the game frontend

After a successful deploy, Wrangler prints the Worker URL (e.g. `https://spacegame.<your-subdomain>.workers.dev`).
Update `game_playing/index.html` if the URL differs from the current hard-coded value.

## Local development

```bash
npx wrangler dev
```

Bind secrets locally with a `.dev.vars` file (not committed):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```
