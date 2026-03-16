/**
 * WebSocket client for StoryForge story sessions.
 * Connects to the FastAPI backend and handles real-time communication.
 */

import { getIdToken } from "./firebase";

// Derive protocol from current page (ws:// for http, wss:// for https)
const wsScheme = window.location.protocol === "https:" ? "wss:" : "ws:";
const httpScheme = window.location.protocol === "https:" ? "https:" : "http:";

// In production (Cloud Run) backend is on the same host; in dev it's on :8001
const WS_BASE =
  import.meta.env.VITE_WS_URL ||
  `${wsScheme}//${window.location.hostname}${window.location.port === "5000" ? ":8001" : ""}`;

// Base URL for REST API calls (used by SpeakScreen etc.)
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  `${httpScheme}//${window.location.hostname}${window.location.port === "5000" ? ":8001" : ""}`;


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
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  close: () => void;
}

export type MessageHandler = {
  onSessionReady?: (sessionId: string, session: StorySession) => void;
  onPageUpdate?: (page: PageUpdate) => void;
  onAgentText?: (text: string) => void;
  onAudioData?: (audioData: ArrayBuffer | Blob) => void;
  onAudioLevel?: (level: number) => void;
  onStatus?: (message: string) => void;
  onError?: (message: string) => void;
  onClose?: () => void;
  onToolStarted?: (tool: string) => void;
  onToolCompleted?: () => void;
};

/**
 * Connect to the StoryForge backend and start a story session.
 */
export async function connectToStory(
  config: StoryConfig,
  handlers: MessageHandler
): Promise<StorySession> {
  const token = await getIdToken();
  let resolved = false;

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_BASE}/ws/story`);

    let audioContext: AudioContext | null = null;
    let mediaStream: MediaStream | null = null;
    let scriptProcessor: ScriptProcessorNode | null = null;
    let sourceNode: MediaStreamAudioSourceNode | null = null;

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
      startRecording: async () => {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              sampleRate: 16000,
            },
          });
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000,
          });

          sourceNode = audioContext.createMediaStreamSource(mediaStream);

          // Use ScriptProcessorNode to get raw PCM data (4096 batch size)
          scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Compute RMS audio level for mic visualization (0-1)
            let sumSq = 0;
            for (let i = 0; i < inputData.length; i++) {
              sumSq += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sumSq / inputData.length);
            // Scale and clamp to 0-1 (typical speech RMS is 0.01-0.15)
            const level = Math.min(1, rms * 8);
            handlers.onAudioLevel?.(level);

            // Convert Float32 to Int16
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              let s = Math.max(-1, Math.min(1, inputData[i]));
              pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            
            // Send binary frame
            ws.send(pcmData.buffer);
          };

          sourceNode.connect(scriptProcessor);
          scriptProcessor.connect(audioContext.destination);
        } catch (err) {
          console.error("Microphone error:", err);
          if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop());
            mediaStream = null;
          }
          handlers.onError?.("Could not access microphone.");
        }
      },
      stopRecording: () => {
        if (scriptProcessor) {
          scriptProcessor.disconnect();
          scriptProcessor = null;
        }
        if (sourceNode) {
          sourceNode.disconnect();
          sourceNode = null;
        }
        if (audioContext) {
          audioContext.close();
          audioContext = null;
        }
        if (mediaStream) {
          mediaStream.getTracks().forEach((t) => t.stop());
          mediaStream = null;
        }
      },
      close: () => {
        session.stopRecording();
        ws.close();
      },
    };

    ws.binaryType = "arraybuffer";

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
      // Handle incoming binary audio chunks
      if (typeof event.data !== "string") {
        handlers.onAudioData?.(event.data);
        return;
      }

      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "session_ready":
            session.sessionId = data.session_id;
            handlers.onSessionReady?.(data.session_id, session);
            resolved = true;
            resolve(session);
            break;

          case "page_update":
            console.log(
              `[WS] page_update received: page=${data.page_number}, has_image=${!!data.image_base64}, text_len=${(data.text || "").length}`
            );
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
            // Reject promise if session hasn't started yet
            if (!resolved) {
              resolved = true;
              reject(new Error(data.message || "Server error"));
            }
            break;

          case "tool_started":
            handlers.onToolStarted?.(data.tool || "unknown");
            break;

          case "tool_completed":
            handlers.onToolCompleted?.();
            break;
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    ws.onerror = (event) => {
      console.error("WebSocket error:", event);
      handlers.onError?.("Connection error");
      if (!resolved) {
        resolved = true;
        reject(new Error("WebSocket connection failed"));
      }
    };

    ws.onclose = () => {
      handlers.onClose?.();
      // Reject if closed before session_ready
      if (!resolved) {
        resolved = true;
        reject(new Error("Connection closed before session started"));
      }
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

  const res = await fetch(`${API_BASE}/api/stories`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.stories || [];
}
