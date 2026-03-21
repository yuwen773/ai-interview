package interview.guide.modules.interview.voice.model;


/**
 * 面试官输出模式。
 *
 * 一期先通过模式标记区分是否需要语音播报，真正播放逻辑后续接入。
 */
public enum InterviewerOutputMode {
    TEXT,
    TEXT_VOICE
}
