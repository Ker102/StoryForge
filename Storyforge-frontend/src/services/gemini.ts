import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VisualStyle, GeneratedStory, StoryPage, NarratorVoice } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateStory = async (
  prompt: string,
  style: VisualStyle,
  genre: string,
  pages: number = 5,
  language: string = "english"
): Promise<GeneratedStory> => {
  const model = "gemini-3.1-pro-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: `Generate a children's story based on the prompt: "${prompt}". 
    Genre: ${genre}. 
    Style: ${style}. 
    Number of pages: ${pages}.
    Language: ${language}.
    For each page, provide the story text and a detailed image description for an AI image generator.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          pages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                imagePrompt: { type: Type.STRING }
              },
              required: ["text", "imagePrompt"]
            }
          }
        },
        required: ["title", "pages"]
      }
    }
  });

  const storyData = JSON.parse(response.text || "{}");
  return {
    ...storyData,
    style,
    genre
  };
};

export const generatePageImage = async (prompt: string, style: VisualStyle): Promise<string> => {
  const model = "gemini-2.5-flash-image";
  const fullPrompt = `A high-quality illustration in ${style} style: ${prompt}`;
  
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: fullPrompt }] }],
    config: {
      imageConfig: {
        aspectRatio: "4:3"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Failed to generate image");
};

export const textToSpeech = async (text: string, voiceType: NarratorVoice = "warm"): Promise<string> => {
  const model = "gemini-2.5-flash-preview-tts";
  
  // Map our UI voices to Gemini TTS voices
  const voiceMap: Record<NarratorVoice, string> = {
    warm: "Kore",
    playful: "Puck",
    calm: "Zephyr",
    dynamic: "Fenrir"
  };

  const voiceName = voiceMap[voiceType] || "Kore";
  
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return `data:audio/mp3;base64,${base64Audio}`;
  }
  
  throw new Error("Failed to generate speech");
};
