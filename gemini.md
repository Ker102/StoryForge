# StoryForge — Progress Tracker

## Current Task
Observability pipeline + test suite (new-feature branch)

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
- [x] ADK refactor: WebSocket route uses Runner with shared session_service
- [x] google-adk dependency added to pyproject.toml
- [x] CodeRabbit PR #6 fixes (7 items: lazy init, safety, model, state, cleanup)
- [x] Firebase project created (storyforgegeminilive)
- [x] Backend: Firebase Admin SDK init + auth middleware
- [x] Backend: Firestore persistence + Storage service
- [x] Backend: REST API routes (/api/stories)
- [x] Backend: Auth token verification in WebSocket INIT
- [x] Frontend: Firebase SDK (Google Sign-In) + WebSocket client
- [x] Observability: in-process tracing (trace.py) with ring buffer
- [x] Observability: thread-safe metrics (metrics.py) - counters, histograms, gauges
- [x] Observability: dashboard endpoints (/observability/health, /metrics, /traces)
- [x] Instrumented quill.py (generate_story_page, finish_story)
- [x] Instrumented orchestrator.py (pipeline steps with parent/child spans)
- [x] Instrumented ws.py (active_websockets gauge)
- [x] Instrumented story_writer.py (API latency + tracing)
- [x] Instrumented image_service.py (Imagen/Gemini fallback tracing)
- [x] Instrumented narration.py (TTS tracing)
- [x] Instrumented safety.py (block counting with labels)
- [x] Wired observability dashboard into main.py
- [x] Test suite: 122 tests across 5 files (models, safety, state, observability, API)
- [x] All tests passing ✅
- [x] Bug fix: InMemoryRunner → Runner(session_service=_session_service)
- [x] E2E verification: REST endpoints, WebSocket gauge tracking, Gemini API pipeline
- [x] Frontend bug fix: ReferenceError on session object in `Home.tsx`
- [x] Frontend bug fix: Microphone button navigation to Speak screen

## Next Steps

- [ ] Wire audio bidi-streaming via ADK run_live()
