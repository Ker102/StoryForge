# StoryForge — Progress Tracker

## Current Task
Fix Live Agent audio latency and page generation pipeline

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
- [x] Backend bug fix: Pydantic ValidationError on Character traits (LLM string handling)
- [x] **FIXED**: WebSocket "Connection failed" error by fixing port 8000 -> 8001 conflict
- [x] **FIXED**: Frontend `StorySettings` sending incorrect Enum IDs
- [x] **FIXED**: Loading screen stuck at 5% — rewired navigation flow (session_ready → SpeakScreen)
- [x] **UI ENHANCEMENT**: Completely overhauled `LoadingScreen.tsx` with Framer Motion
- [x] **UI FEATURE**: SpeakScreen with toggleable story sidebar (streams pages in real-time)
- [x] **CRITICAL FIX**: `main.py` — only export GOOGLE_API_KEY (not Firebase vars) to prevent ADK Pydantic crashes
- [x] **CRITICAL FIX**: `config.py` — added `extra="ignore"` to Settings model_config
- [x] **CRITICAL FIX**: `ws.py` — switched from `run_live()` to `run_async()` (native-audio models don't support tool calling)
- [x] **CRITICAL FIX**: `quill.py` — model back to `gemini-2.5-flash` (supports tool calling via standard runner)
- [x] **E2E VERIFIED**: Full pipeline works — text→agent→tools→StoryWriter→Imagen→page update (8/9 checks pass)

### Live Agent Audio Session (2026-03-16)
- [x] **ARCH FIX**: Replaced `tool_context.state` writes in background task with `asyncio.Queue` per-session (tool_context invalid after function returns)
- [x] **ARCH FIX**: Stripped `image_base64` and `narration_audio_base64` from `story_state` Pages to keep ADK session lean
- [x] **BUG FIX**: Queue key mismatch — changed from `str(id(story_state))` to stable `session_id` (ADK deserializes objects, changing Python `id()`)
- [x] **BUG FIX**: Audio gate — drops mic audio during tool calls to prevent Live API `1008 Operation not implemented` race condition
- [x] **VERIFIED**: Background page generation pipeline works (StoryWriter → Imagen → narration all complete)
- [ ] **REMAINING**: Agent still slow after ~3 inputs — likely Live API session context growth from accumulated audio/event history

## Known Issues (For Next Session)
1. **Agent response latency grows after ~3 inputs**: Even after stripping binary data from session state, the Live API session context still grows with audio events. Possible solutions:
   - Try `gemini-2.0-flash-live-001` model (reported to handle audio+tools better)
   - Implement session truncation (limit event history)
   - Consider splitting into fresh sessions after N turns
   - Investigate if ADK stores raw audio in session events
2. **TTS narration may 404**: `gemini-2.5-flash-tts-preview` model may need version verification
3. **Imagen `negative_prompt` parameter**: Not supported in Gemini API, but falls back to Gemini image gen successfully

## Architecture Notes (Live Agent)
- `quill.py`: Tools return immediately, spawn `asyncio.create_task()` for heavy pipeline work
- `_page_queues`: Per-session `asyncio.Queue` keyed by `session_id` for pushing completed pages
- `ws.py`: `consume_page_queue()` awaits pages and sends `PageUpdateMessage` to frontend
- `ws.py`: `audio_gate_open` flag drops mic audio during tool execution to prevent 1008 race condition
- `story_state` Pages store `image_base64=None` to keep ADK session lean; binary data flows only through the queue

## Next Steps
- [ ] Fix agent response latency (see Known Issues #1)
- [ ] Add Web Speech API for browser-based voice input
- [ ] Push to repo and test with teammates
