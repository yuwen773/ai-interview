import { useState } from 'react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useVoicePlayer } from '../hooks/useVoicePlayer';
import styles from './VoiceControlPanel.module.css';

export interface VoiceControlPanelProps {
  sessionId: string;
  /**
   * Current question index (not sent to backend - backend tracks question state internally).
   * Kept for potential future use or parent component tracking.
   */
  questionIndex: number;
  /**
   * Callback invoked when answer is submitted (text mode only).
   * For voice mode, parent should check backend for next question after audio completes.
   */
  onAnswerSubmitted?: (hasNext: boolean, nextQuestionIndex: number) => void;
  disabled?: boolean;
}

export function VoiceControlPanel({
  sessionId,
  questionIndex: _questionIndex,
  onAnswerSubmitted,
  disabled = false
}: VoiceControlPanelProps) {
  const { isRecording, startRecording, stopRecording, error: recordError } = useVoiceRecorder();
  const { isPlaying, playAudioStream, error: playError } = useVoicePlayer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outputMode, setOutputMode] = useState<'text' | 'voice'>('voice');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const audioBlob = await stopRecording();

        // Create form data
        const formData = new FormData();
        formData.append('file', audioBlob, 'answer.wav');
        formData.append('outputMode', outputMode);

        // Submit to backend
        const response = await fetch(
          `/api/interview/${sessionId}/answer/voice`,
          {
            method: 'POST',
            body: formData
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Handle response based on output mode
        if (outputMode === 'voice') {
          // For voice mode: SSE stream contains only audio chunks
          // The parent component should handle navigation by calling
          // the existing text endpoint to get the response data
          await playAudioStream(response);

          // Note: onAnswerSubmitted is NOT called for voice mode
          // because the SSE stream doesn't include interview response data.
          // Parent component should call GET /api/interview/sessions/{sessionId}/question
          // to check if there's a next question after audio playback completes.
        } else {
          // For text mode: Response is JSON with interview data
          const data = await response.json();
          if (data.success && onAnswerSubmitted) {
            onAnswerSubmitted(
              data.data.hasNextQuestion,
              data.data.currentIndex
            );
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Submission failed';
        console.error('Voice submission error:', err);
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setSubmitError(null);
      await startRecording();
    }
  };

  const error = recordError || playError || submitError;

  return (
    <div className={styles.voicePanel}>
      <div className={styles.controls}>
        <label className={styles.modeToggle}>
          <input
            type="checkbox"
            checked={outputMode === 'voice'}
            onChange={(e) => setOutputMode(e.target.checked ? 'voice' : 'text')}
            disabled={disabled || isRecording || isSubmitting}
          />
          <span>语音输出</span>
        </label>

        <button
          onClick={handleToggleRecording}
          disabled={disabled || isSubmitting || isPlaying}
          className={`${styles.recordButton} ${
            isRecording ? styles.recording : ''
          }`}
        >
          {isSubmitting ? '处理中...' :
           isRecording ? '停止录音' :
           isPlaying ? '播放中...' :
           '开始录音'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.hint}>
        {isRecording && '正在录音... 点击停止按钮提交'}
        {!isRecording && '点击开始录音，完成后点击停止提交'}
      </div>
    </div>
  );
}
