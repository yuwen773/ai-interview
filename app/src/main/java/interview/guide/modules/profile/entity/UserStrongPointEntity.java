package interview.guide.modules.profile.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 用户强项实体
 * 记录用户在面试中表现突出的知识点，由AI从面试回答中提取
 */
@Entity
@Table(name = "user_strong_points")
public class UserStrongPointEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 用户ID
    @Column(name = "user_id", nullable = false)
    private String userId;

    // 知识主题名称
    @Column(name = "topic", nullable = false)
    private String topic;

    // 强项描述
    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    // 来源（INTERVIEW / MANUAL）
    @Column(name = "source")
    private String source = "INTERVIEW";

    // 关联的面试会话ID
    @Column(name = "session_id")
    private Long sessionId;

    // 首次发现时间（自动填充）
    @CreationTimestamp
    @Column(name = "first_seen")
    private LocalDateTime firstSeen;

    // 创建时间（自动填充）
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public LocalDateTime getFirstSeen() { return firstSeen; }
    public void setFirstSeen(LocalDateTime firstSeen) { this.firstSeen = firstSeen; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
