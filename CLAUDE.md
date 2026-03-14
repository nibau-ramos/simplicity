# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All development runs inside Docker — there is no local Node.js required.

```bash
# Build and start
docker compose up --build -d

# Stop
docker compose down

# Follow logs
docker compose logs -f
```

The app is served at **http://localhost:8080**.

## Architecture

React (Vite) SPA built inside Docker and served statically by Nginx.

**Build pipeline (Dockerfile — multi-stage):**
1. `node:20-alpine` — installs dependencies and runs `vite build`, outputting to `dist/`
2. `nginx:alpine` — serves the `dist/` folder; custom config at `nginx/nginx.conf`

**Nginx** is configured with `try_files $uri $uri/ /index.html` so client-side routing works correctly.

**Entry points:**
- `index.html` → `src/main.jsx` → `src/App.jsx`


## Git Workflow
- After every code change, commit it to the current branch
- Use descriptive commit messages that explain what was changed and why
- Never switch branches or create new branches unless explicitly asked
- Run any relevant checks before committing if applicable


## Behavior
- Before starting any non-trivial task, ask clarifying questions to better 
  understand the requirements, edge cases, and expected outcome
- If a request is ambiguous, always ask rather than assume
- Confirm your understanding of the task before writing any code

## Communication
- Be concise in explanations unless asked for detail
- When something is unclear, ask don't assume
- Flag potential issues or risks even if not asked