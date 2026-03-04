export interface InterviewAvatarProps {
  modelUrl?: string;
  isSpeaking?: boolean;
  expression?: 'neutral' | 'happy' | 'sad' | 'angry';
  position?: { x: number; y: number; z: number };
  scale?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export type Expression = 'neutral' | 'happy' | 'sad' | 'angry';
