"""End-to-End Pipeline Verification Test.

Simulates a full user interaction via WebSocket without a microphone:
1. Connects to WebSocket and sends INIT
2. Waits for session_ready + status
3. Sends text input asking Quill to generate a story page
4. Monitors for tool calls, agent text, page updates (with images)
5. Reports the success/failure of each pipeline stage

Usage:
    python e2e_pipeline_test.py
"""

import asyncio
import json
import sys
import time

import websockets

WS_URL = "ws://localhost:8001/ws/story"
TIMEOUT = 90  # seconds to wait for full pipeline (image gen can be slow)


class PipelineResult:
    def __init__(self):
        self.connected = False
        self.session_ready = False
        self.session_id = None
        self.quill_ready = False
        self.text_sent = False
        self.agent_text_received = False
        self.agent_texts: list[str] = []
        self.page_received = False
        self.page_data = None
        self.has_text = False
        self.has_image = False
        self.has_narration = False
        self.error = None
        self.raw_audio_chunks = 0
        self.all_messages: list[dict] = []

    def report(self):
        print("\n" + "=" * 60)
        print("  STORYFORGE E2E PIPELINE VERIFICATION REPORT")
        print("=" * 60)

        checks = [
            ("WebSocket Connected", self.connected),
            ("Session Ready", self.session_ready),
            ("Quill Agent Ready", self.quill_ready),
            ("Text Input Sent", self.text_sent),
            ("Agent Text Response", self.agent_text_received),
            ("Page Update Received", self.page_received),
            ("Page Has Story Text", self.has_text),
            ("Page Has Illustration (Imagen)", self.has_image),
            ("Page Has Narration Audio", self.has_narration),
        ]

        all_pass = True
        for label, ok in checks:
            icon = "✅" if ok else "❌"
            print(f"  {icon}  {label}")
            if not ok:
                all_pass = False

        print(f"\n  📊  Audio chunks received: {self.raw_audio_chunks}")
        print(f"  📝  Agent texts received: {len(self.agent_texts)}")

        if self.agent_texts:
            print("\n  --- Agent Texts ---")
            for t in self.agent_texts[:5]:
                print(f"    > {t[:120]}...")

        if self.page_data:
            print("\n  --- Page Data ---")
            print(f"    Page #: {self.page_data.get('page_number')}")
            text = self.page_data.get("text", "")
            print(f"    Text: {text[:150]}...")
            print(f"    Summary: {self.page_data.get('summary', 'N/A')[:100]}")
            img = self.page_data.get("image_base64")
            print(f"    Image: {'Yes (' + str(len(img)) + ' chars)' if img else 'No'}")
            narr = self.page_data.get("narration_audio_base64")
            print(f"    Narration: {'Yes (' + str(len(narr)) + ' chars)' if narr else 'No'}")

        if self.error:
            print(f"\n  ⚠️  Error: {self.error}")

        print("\n" + "=" * 60)
        if all_pass:
            print("  🎉  ALL CHECKS PASSED — Pipeline is fully operational!")
        else:
            print("  ⚠️  Some checks failed — see above for details.")
        print("=" * 60 + "\n")

        return all_pass


async def run_e2e_test():
    result = PipelineResult()

    # --- Step 1: Connect ---
    print(f"[1/5] Connecting to {WS_URL}...")
    try:
        ws = await asyncio.wait_for(
            websockets.connect(WS_URL, max_size=50 * 1024 * 1024),
            timeout=10,
        )
        result.connected = True
        print("  ✓ Connected")
    except Exception as e:
        result.error = f"Connection failed: {e}"
        result.report()
        return result

    try:
        # --- Step 2: Send INIT ---
        print("[2/5] Sending INIT message...")
        init_msg = json.dumps({
            "type": "init",
            "style": "watercolour",
            "age_setting": "children_5_8",
            "seed": "A brave little fox named Ember who discovers a hidden garden",
        })
        await ws.send(init_msg)
        print("  ✓ INIT sent")

        # Wait for session_ready and quill_ready
        deadline = time.time() + 30
        while time.time() < deadline:
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=5)
            except asyncio.TimeoutError:
                continue

            if isinstance(raw, bytes):
                result.raw_audio_chunks += 1
                continue

            data = json.loads(raw)
            result.all_messages.append(data)
            msg_type = data.get("type", "")
            message = data.get("message", "")

            if msg_type == "session_ready":
                result.session_ready = True
                result.session_id = data.get("session_id")
                print(f"  ✓ Session ready: {result.session_id}")

            elif msg_type == "status" and "ready" in message.lower():
                result.quill_ready = True
                print(f"  ✓ Quill ready: {message}")
                break
            elif msg_type == "error":
                result.error = message
                print(f"  ✗ Error: {message}")
                break

        if not result.quill_ready:
            if not result.error:
                result.error = "Quill never became ready (timeout)"
            result.report()
            return result

        # --- Step 3: Send text input to trigger page generation ---
        print("[3/5] Sending text input to Quill...")
        text_msg = json.dumps({
            "type": "text_input",
            "text": "Create the first page of the story. Ember the fox wakes up in a meadow and finds a mysterious glowing path leading into the forest. She decides to follow it.",
        })
        await ws.send(text_msg)
        result.text_sent = True
        print("  ✓ Text input sent — waiting for agent response + page generation...")
        print(f"     (Timeout: {TIMEOUT}s — image generation may take time)")

        # --- Step 4: Listen for responses ---
        deadline = time.time() + TIMEOUT
        while time.time() < deadline:
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=5)
            except asyncio.TimeoutError:
                elapsed = int(time.time() - (deadline - TIMEOUT))
                print(f"     ... waiting ({elapsed}s / {TIMEOUT}s)")
                continue

            if isinstance(raw, bytes):
                result.raw_audio_chunks += 1
                if result.raw_audio_chunks == 1:
                    print(f"  ✓ First audio chunk received ({len(raw)} bytes)")
                continue

            data = json.loads(raw)
            result.all_messages.append(data)
            msg_type = data.get("type", "")

            if msg_type == "agent_text":
                text = data.get("text", "")
                result.agent_text_received = True
                result.agent_texts.append(text)
                print(f"  ✓ Agent text: {text[:80]}...")

            elif msg_type == "page_update":
                result.page_received = True
                result.page_data = data
                page_text = data.get("text", "")
                result.has_text = bool(page_text and len(page_text) > 10)
                result.has_image = bool(data.get("image_base64"))
                result.has_narration = bool(data.get("narration_audio_base64"))
                print(f"  ✓ PAGE UPDATE RECEIVED!")
                print(f"    Text: {page_text[:80]}...")
                if result.has_image:
                    print(f"    Image: {len(data['image_base64'])} chars of base64")
                if result.has_narration:
                    print(f"    Narration: {len(data['narration_audio_base64'])} chars")
                break  # Got the page — test complete!

            elif msg_type == "status":
                message = data.get("message", "")
                print(f"  ℹ️ Status: {message}")

            elif msg_type == "error":
                result.error = data.get("message", "Unknown error")
                print(f"  ✗ ERROR: {result.error}")
                break

        # --- Step 5: Report ---
        print("\n[5/5] Generating report...")

    except Exception as e:
        result.error = f"Unexpected error: {e}"
    finally:
        try:
            await ws.close()
        except Exception:
            pass

    return result


if __name__ == "__main__":
    print("\n🔬 StoryForge E2E Pipeline Verification")
    print("=" * 40)
    result = asyncio.run(run_e2e_test())
    success = result.report()
    sys.exit(0 if success else 1)
