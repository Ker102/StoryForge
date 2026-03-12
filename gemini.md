# StoryForge — Progress Tracker

## Current Task
ADK (Agent Development Kit) refactor

## Progress
- [x] Backend scaffold (PR #1 on `feature/backend-scaffold`)
- [x] CodeRabbit review fixes applied (25 fixes across 14 files)
- [x] Dependabot config (pip + GitHub Actions, weekly)
- [x] CI workflow (ruff lint, ruff format, mypy, pytest)
- [x] CodeQL security scanning (PRs + weekly)
- [x] pip-audit dependency vulnerability scanning
- [x] SECURITY.md vulnerability reporting policy
- [x] ruff.toml with security-focused lint rules (bandit, bugbear)
- [x] README.md with badges, architecture, and feature grid
- [x] Frontend (Vite+React) merged into main from `frontend-ui`
- [x] ADK refactor: Quill agent definition with FunctionTools
- [x] ADK refactor: WebSocket route uses InMemoryRunner
- [x] google-adk dependency added to pyproject.toml

## Next Steps
- [ ] Add GOOGLE_API_KEY to .env and run integration tests
- [ ] Wire audio bidi-streaming via ADK run_live()
- [ ] Set up Firebase project (Auth, Firestore, Storage)
- [ ] Create auth middleware + persistence layer
- [ ] Wire frontend ↔ backend (WebSocket URLs, auth flow)
