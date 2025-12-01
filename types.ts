export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export interface Scene {
  id: string;
  scriptText: string;
  visualPrompt: string;
  imageUrl?: string;
  isLoading: boolean;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface GenerationSettings {
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
}

// Extend global interfaces to match environment
declare global {
  // The environment already defines window.aistudio as type AIStudio.
  // We define the interface here to ensure it has the required methods, merging with the existing definition.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}