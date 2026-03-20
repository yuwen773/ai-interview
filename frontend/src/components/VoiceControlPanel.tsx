import { useState } from 'react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useVoicePlayer } from '../hooks/useVoicePlayer';
import styles from './VoiceControlPanel.module.css';

export interface VoiceControlPanelProps {
  sessionId: string;
  questionIndex: number;
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

  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsSubmitting(true);
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
          await playAudioStream(response);
        }

        // Parse response body for callback
        const text = await response.clone().text();
        if (text) {
          try {
            const data = JSON.parse(text);
            if (data.success && onAnswerSubmitted) {
              onAnswerSubmitted(
                data.data.hasNextQuestion,
                data.data.currentIndex
              );
            }
          } catch {
            // SSE stream, ignore JSON parse
          }
        }
      } catch (err) {
        console.error('Voice submission error:', err);
        alert(err instanceof Error ? err.message : 'Submission failed');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      await startRecording();
    }
  };

  const error = recordError || playError;

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
