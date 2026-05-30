import { useVrm } from '../hooks/useVrm';
import { InterviewAvatar } from '../../../components/InterviewAvatar';

export interface VrmViewerProps {
  modelUrl?: string;
  autoPlay?: boolean;
}

const DEFAULT_SIZE = 400;

/**
 * Thin wrapper around the existing InterviewAvatar component.
 * Provides a clean interface for the features module.
 */
export function VrmViewer({ modelUrl = '/models/avatar.vrm', autoPlay = false }: VrmViewerProps) {
  const { handleLoad, handleError, isSpeaking, expression } = useVrm();

  return (
    <div style={{ width: DEFAULT_SIZE, height: DEFAULT_SIZE }}>
      <InterviewAvatar
        modelUrl={modelUrl}
        isSpeaking={autoPlay ? isSpeaking : false}
        expression={expression}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}