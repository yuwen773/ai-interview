import { useState } from 'react';

interface UseAvatarReturn {
  isSpeaking: boolean;
  setSpeaking: (speaking: boolean) => void;
  expression: 'neutral' | 'happy' | 'sad' | 'angry';
  setExpression: (expression: 'neutral' | 'happy' | 'sad' | 'angry') => void;
  isLoaded: boolean;
  setLoaded: (loaded: boolean) => void;
}

export function useAvatar(): UseAvatarReturn {
  const [isSpeaking, setSpeaking] = useState(false);
  const [expression, setExpression] = useState<'neutral' | 'happy' | 'sad' | 'angry'>('neutral');
  const [isLoaded, setLoaded] = useState(false);

  return {
    isSpeaking,
    setSpeaking,
    expression,
    setExpression,
    isLoaded,
    setLoaded,
  };
}
