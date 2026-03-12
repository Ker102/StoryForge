# StoryForge — Progress Tracker

## Current Task
Firebase integration + frontend wiring (feature/firebase branch)

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
- [x] CodeRabbit PR #6 fixes (7 items: lazy init, safety, model, state, cleanup)
- [x] Firebase project created (storyforgegeminilive)
- [x] Backend: Firebase Admin SDK init + auth middleware
- [x] Backend: Firestore persistence + Storage service
- [x] Backend: REST API routes (/api/stories)
- [x] Backend: Auth token verification in WebSocket INIT
- [x] Frontend: Firebase SDK (Google Sign-In) + WebSocket client

## Next Steps

- [ ] Add GOOGLE_API_KEY to .env and run integration tests
- [ ] Wire audio bidi-streaming via ADK run_live()
