/**
 * WebSocket client for StoryForge story sessions.
 * Connects to the FastAPI backend and handles real-time communication.
 */

import { getIdToken } from "./firebase";

// Backend WebSocket URL — relative in production, configurable for dev
const WS_BASE =
  import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8000`;

export interface StoryConfig {
  style: string;
  age_setting: string;
  seed?: string;
}

export interface PageUpdate {
  page_number: number;
  text: string;
  summary: string;
  image_base64?: string;
  narration_audio_base64?: string;
}

export interface StorySession {
  ws: WebSocket;
  sessionId: string | null;
  send: (msg: Record<string, unknown>) => void;
  sendText: (text: string) => void;
  close: () => void;
}

export type MessageHandler = {
  onSessionReady?: (sessionId: string) => void;
  onPageUpdate?: (page: PageUpdate) => void;
  onAgentText?: (text: string) => void;
  onStatus?: (message: string) => void;
  onError?: (message: string) => void;
  onClose?: () => void;
};

/**
 * Connect to the StoryForge backend and start a story session.
 */
export async function connectToStory(
  config: StoryConfig,
  handlers: MessageHandler
): Promise<StorySession> {
  const token = await getIdToken();

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_BASE}/ws/story`);

    const session: StorySession = {
      ws,
      sessionId: null,
      send: (msg) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(msg));
        }
      },
      sendText: (text) => {
        session.send({ type: "text_input", text });
      },
      close: () => {
        ws.close();
      },
    };

    ws.onopen = () => {
      // Send INIT with auth token and story config
      session.send({
        type: "init",
        token: token,
        style: config.style,
        age_setting: config.age_setting,
        seed: config.seed || "",
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "session_ready":
            session.sessionId = data.session_id;
            handlers.onSessionReady?.(data.session_id);
            resolve(session);
            break;

          case "page_update":
            handlers.onPageUpdate?.({
              page_number: data.page_number,
              text: data.text,
              summary: data.summary,
              image_base64: data.image_base64,
              narration_audio_base64: data.narration_audio_base64,
            });
            break;

          case "agent_text":
            handlers.onAgentText?.(data.text);
            break;

          case "status":
            handlers.onStatus?.(data.message);
            break;

          case "error":
            handlers.onError?.(data.message);
            break;
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    ws.onerror = (event) => {
      console.error("WebSocket error:", event);
      handlers.onError?.("Connection error");
      reject(new Error("WebSocket connection failed"));
    };

    ws.onclose = () => {
      handlers.onClose?.();
    };
  });
}

/**
 * Fetch the user's story library from the REST API.
 */
export async function fetchStories(): Promise<
  Array<{
    id: string;
    title: string;
    style: string;
    current_page: number;
    is_complete: boolean;
    page_count: number;
    updated_at: string;
  }>
> {
  const token = await getIdToken();
  if (!token) return [];

  const API_BASE =
    import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

  const res = await fetch(`${API_BASE}/api/stories`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.stories || [];
}
