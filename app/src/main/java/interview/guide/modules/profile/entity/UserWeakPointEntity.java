package interview.guide.modules.profile.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户弱项实体
 * 记录用户在面试中暴露的知识薄弱点，支持SM-2间隔重复复习和语义去重
 */
@Entity
@Table(name = "user_weak_points")
public class UserWeakPointEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 用户ID
    @Column(name = "user_id", nullable = false)
    private String userId;

    // 知识主题名称
    @Column(name = "topic", nullable = false)
    private String topic;

    // 面试原题文本
    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    // 用户回答摘要
    @Column(name = "answer_summary", columnDefinition = "TEXT")
    private String answerSummary;

    // 评分（0-10）
    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    // 来源（INTERVIEW / MANUAL）
    @Column(name = "source")
    private String source = "INTERVIEW";

    // 关联的面试会话ID
    @Column(name = "session_id")
    private Long sessionId;

    // SM-2间隔重复状态（JSONB：interval_days, ease_factor, repetitions, next_review, last_score）
    @Type(JsonType.class)
    @Column(name = "sr_state", columnDefinition = "jsonb")
    private Map<String, Object> srState = new HashMap<>(Map.of(
        "interval_days", 1,
        "ease_factor", 2.5,
        "repetitions", 0,
        "next_review", LocalDate.now().plusDays(1).toString(),
        "last_score", 0
    ));

    // 操作历史记录（JSONB数组，记录每次状态变更）
    @Type(JsonType.class)
    @Column(name = "history", columnDefinition = "jsonb")
    private List<Map<String, String>> history = new ArrayList<>();

    // 是否已改善
    @Column(name = "is_improved")
    private Boolean isImproved = false;

    // 标记为已改善的时间
    @Column(name = "improved_at")
    private LocalDateTime improvedAt;

    // 被观察到的次数
    @Column(name = "times_seen")
    private Integer timesSeen = 1;

    // 首次发现时间（自动填充）
    @CreationTimestamp
    @Column(name = "first_seen")
    private LocalDateTime firstSeen;

    // 最后观察时间（自动更新）
    @UpdateTimestamp
    @Column(name = "last_seen")
    private LocalDateTime lastSeen;

    // 创建时间（自动填充）
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getAnswerSummary() {
        return answerSummary;
    }

    public void setAnswerSummary(String answerSummary) {
        this.answerSummary = answerSummary;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public Map<String, Object> getSrState() {
        return srState;
    }

    public void setSrState(Map<String, Object> srState) {
        this.srState = srState;
    }

    public Boolean isImproved() {
        return isImproved;
    }

    public void setImproved(Boolean isImproved) {
        this.isImproved = isImproved;
    }

    public LocalDateTime getImprovedAt() {
        return improvedAt;
    }

    public void setImprovedAt(LocalDateTime improvedAt) {
        this.improvedAt = improvedAt;
    }

    public Integer getTimesSeen() {
        return timesSeen;
    }

    public void setTimesSeen(Integer timesSeen) {
        this.timesSeen = timesSeen;
    }

    public LocalDateTime getFirstSeen() {
        return firstSeen;
    }

    public void setFirstSeen(LocalDateTime firstSeen) {
        this.firstSeen = firstSeen;
    }

    public LocalDateTime getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(LocalDateTime lastSeen) {
        this.lastSeen = lastSeen;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<Map<String, String>> getHistory() { return history; }
    public void setHistory(List<Map<String, String>> history) { this.history = history; }

    // ========== 领域辅助方法 ==========

    /** 记录该弱项再次被观察到，更新观察次数和最后观察时间 */
    public void recordSeen() {
        this.timesSeen = this.timesSeen != null ? this.timesSeen + 1 : 2;
        this.lastSeen = LocalDateTime.now();
    }

    /** 标记该弱项为已改善，并记录操作历史 */
    public void markImproved(String action, String reason) {
        this.isImproved = true;
        this.improvedAt = LocalDateTime.now();
        addHistoryEntry(action, reason);
    }

    /** 追加一条操作历史记录 */
    public void addHistoryEntry(String action, String reason) {
        if (this.history == null) this.history = new ArrayList<>();
        Map<String, String> entry = new LinkedHashMap<>();
        entry.put("action", action);
        entry.put("reason", reason);
        entry.put("at", LocalDateTime.now().toString());
        this.history.add(entry);
    }

    /** 追加一条包含变更前后值的操作历史记录 */
    public void addHistoryEntry(String action, String from, String to, String reason) {
        if (this.history == null) this.history = new ArrayList<>();
        Map<String, String> entry = new LinkedHashMap<>();
        entry.put("action", action);
        entry.put("from", from);
        entry.put("to", to);
        entry.put("at", LocalDateTime.now().toString());
        this.history.add(entry);
    }

    /** 从面试提取结果创建新的弱项实体，自动初始化SM-2状态 */
    public static UserWeakPointEntity create(String userId, String topic, String questionText,
                                              String answerSummary, double score, Long sessionId) {
        UserWeakPointEntity entity = new UserWeakPointEntity();
        entity.setUserId(userId);
        entity.setTopic(topic);
        entity.setQuestionText(questionText);
        entity.setAnswerSummary(answerSummary);
        entity.setScore(BigDecimal.valueOf(score));
        entity.setSource("INTERVIEW");
        entity.setSessionId(sessionId);
        entity.setSrState(interview.guide.modules.profile.service.SpacedRepetitionService
            .buildInitialSrState(score));
        return entity;
    }
}
