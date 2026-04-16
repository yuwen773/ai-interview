package interview.guide.modules.profile.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 用户知识点掌握度实体
 * 记录用户对各个知识主题的掌握程度，分数随面试评估动态更新
 */
@Entity
@Table(name = "user_topic_mastery")
public class UserTopicMasteryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 用户ID
    @Column(name = "user_id", nullable = false)
    private String userId;

    // 知识主题名称
    @Column(name = "topic", nullable = false)
    private String topic;

    // 掌握度评分（0-100，默认50）
    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score = BigDecimal.valueOf(50.0);

    // 该主题参与的面试会话数
    @Column(name = "session_count")
    private Integer sessionCount = 0;

    // 备注
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // 最后评估时间
    @Column(name = "last_assessed")
    private LocalDateTime lastAssessed;

    // 创建时间（自动填充）
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // 更新时间（自动填充）
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

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

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }

    public Integer getSessionCount() {
        return sessionCount;
    }

    public void setSessionCount(Integer sessionCount) {
        this.sessionCount = sessionCount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getLastAssessed() {
        return lastAssessed;
    }

    public void setLastAssessed(LocalDateTime lastAssessed) {
        this.lastAssessed = lastAssessed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
