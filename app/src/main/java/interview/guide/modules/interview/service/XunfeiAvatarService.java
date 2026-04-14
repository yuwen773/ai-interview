package interview.guide.modules.interview.service;

/**
 * 讯飞虚拟人服务接口
 */
public interface XunfeiAvatarService {

    /**
     * 流信息封装
     */
    record XunfeiStreamInfo(String streamUrl, String streamExtend) {}

    /**
     * 为指定面试会话创建数字人会话
     * @param interviewSessionId 面试会话ID（用于管理多会话）
     * @return 流信息
     */
    XunfeiStreamInfo createSession(String interviewSessionId);

    /**
     * 销毁指定面试会话的数字人
     * @param interviewSessionId 面试会话ID
     */
    void destroySession(String interviewSessionId);

    /**
     * 发送问题（驱动数字人播报）
     * @param interviewSessionId 面试会话ID
     * @param question 问题文本
     */
    void sendQuestion(String interviewSessionId, String question);

    /**
     * 停止当前播报
     * @param interviewSessionId 面试会话ID
     */
    void stopSpeaking(String interviewSessionId);

    /**
     * 检查会话是否就绪
     * @param interviewSessionId 面试会话ID
     * @return 是否就绪
     */
    boolean isSessionReady(String interviewSessionId);
}
