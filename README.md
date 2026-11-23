# Calora

Calora is a multi-user nutrition catering app. Users set a weight target, eat one kitchen lunch per day, photograph other meals, and get a tonight recommendation plus tomorrow's calorie target.

## Run with Docker

```
cp .env.example .env
docker compose up --build
```

Open `http://localhost:3005`. Admins use `http://localhost:3005/admin`.

## Local development

Postgres 16 and Node 22.5+ are required. Start Postgres, then run the API on the host.

```
docker compose up postgres
```

```
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma generate
npm run css:build
npm run dev
```

Open `http://localhost:3005`.

Dave/1234, Alex/5678, Aifih/1414, and Admin/2468 are created when `NODE_ENV` is not production and `CALORA_USERS_JSON` is unset. When that variable is set, those names are not created.

## Photo analysis with Claude Code

Instead of a vision API key, the host's Claude Code login can read meal photos. `scripts/claude-vision-bridge.mjs` runs on the host (Node 18+, no dependencies) and answers Calora's vision requests with `claude -p`, with no tools, so a photo cannot make Claude read files.

```
BRIDGE_TOKEN=a-long-random-string CLAUDE_CODE_OAUTH_TOKEN=from-claude-setup-token node scripts/claude-vision-bridge.mjs
```

Point the API container at it with `VISION_BASE_URL=http://host.docker.internal:8787/v1`, `VISION_API_KEY` set to the same `BRIDGE_TOKEN`, `VISION_MODEL=claude-opus-5-5`, `VISION_TIMEOUT_MS=150000`, and `extra_hosts: ["host.docker.internal:host-gateway"]`.

## Tests

```
npm test
```
