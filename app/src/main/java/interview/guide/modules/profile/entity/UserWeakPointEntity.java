package interview.guide.modules.profile.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "user_weak_points")
public class UserWeakPointEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "topic", nullable = false)
    private String topic;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "answer_summary", columnDefinition = "TEXT")
    private String answerSummary;

    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "source")
    private String source = "INTERVIEW";

    @Column(name = "session_id")
    private Long sessionId;

    @Type(JsonType.class)
    @Column(name = "sr_state", columnDefinition = "jsonb")
    private Map<String, Object> srState = new HashMap<>(Map.of(
        "interval_days", 1,
        "ease_factor", 2.5,
        "repetitions", 0,
        "next_review", LocalDateTime.now().plusDays(1).toString(),
        "last_score", null
    ));

    @Column(name = "is_improved")
    private Boolean isImproved = false;

    @Column(name = "improved_at")
    private LocalDateTime improvedAt;

    @Column(name = "times_seen")
    private Integer timesSeen = 1;

    @CreationTimestamp
    @Column(name = "first_seen")
    private LocalDateTime firstSeen;

    @UpdateTimestamp
    @Column(name = "last_seen")
    private LocalDateTime lastSeen;

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
}
