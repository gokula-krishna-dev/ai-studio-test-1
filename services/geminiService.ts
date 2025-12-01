import { GoogleGenAI, Type } from "@google/genai";
import { MODELS } from "../constants";
import { Scene, ImageSize, AspectRatio } from "../types";

// Helper to get a fresh instance (important for key switching)
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const checkApiKeySelection = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return true; // Fallback for dev environments without the specific wrapper
};

export const promptApiKeySelection = async (): Promise<void> => {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  }
};

export const parseScriptToScenes = async (script: string): Promise<Omit<Scene, 'id' | 'isLoading'>[]> => {
  const ai = getAIClient();
  
  const prompt = `
    You are an expert storyboard artist and director. 
    Analyze the following script and break it down into distinct visual scenes (shots).
    For each scene, provide:
    1. 'scriptText': The specific dialogue or action description from the script.
    2. 'visualPrompt': A highly detailed, descriptive image generation prompt that describes the camera angle, lighting, characters, setting, and mood for that specific moment.
    
    Script:
    ${script}
  `;

  const response = await ai.models.generateContent({
    model: MODELS.SCRIPT_PARSER,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            scriptText: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
          },
          required: ["scriptText", "visualPrompt"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text);
};

export const generateSceneImage = async (
  prompt: string, 
  size: ImageSize, 
  aspectRatio: AspectRatio
): Promise<string> => {
  const ai = getAIClient();

  const response = await ai.models.generateContent({
    model: MODELS.IMAGE_GENERATOR,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        imageSize: size,
        aspectRatio: aspectRatio,
      }
    }
  });

  // Iterate to find image part
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData && part.inlineData.data) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated");
};

export const chatWithGemini = async (history: {role: 'user' | 'model', text: string}[], newMessage: string) => {
  const ai = getAIClient();
  
  const chat = ai.chats.create({
    model: MODELS.CHAT,
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    })),
    config: {
      systemInstruction: "You are a helpful assistant for a storyboard creation app. You help users refine their scripts, suggest visual ideas, or answer questions about filmmaking.",
    }
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};