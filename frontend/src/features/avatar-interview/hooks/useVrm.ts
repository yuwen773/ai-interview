import { useState, useCallback } from 'react';
import type { InterviewAvatarProps } from '../../../components/InterviewAvatar/types';

export interface VrmState {
  loaded: boolean;
  error: Error | null;
}

export interface UseVrmReturn {
  state: VrmState;
  handleLoad: () => void;
  handleError: (error: Error) => void;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
  expression: InterviewAvatarProps['expression'];
  setExpression: (expr: InterviewAvatarProps['expression']) => void;
}

/**
 * Hook for managing VRM avatar loading state and properties.
 * Reuses existing InterviewAvatar component.
 */
export function useVrm(): UseVrmReturn {
  const [state, setState] = useState<VrmState>({ loaded: false, error: null });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [expression, setExpression] = useState<InterviewAvatarProps['expression']>('neutral');

  const handleLoad = useCallback(() => {
    setState({ loaded: true, error: null });
  }, []);

  const handleError = useCallback((error: Error) => {
    setState({ loaded: false, error });
  }, []);

  return {
    state,
    handleLoad,
    handleError,
    isSpeaking,
    setIsSpeaking,
    expression,
    setExpression,
  };
}