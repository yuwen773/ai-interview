package interview.guide.modules.profile.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "user_profile_patterns")
public class UserProfilePatternEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    @Column(name = "pattern_type", nullable = false, length = 32)
    private String patternType;

    @Column(name = "title", nullable = false, length = 256)
    private String title;

    @Column(name = "summary", nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Type(JsonType.class)
    @Column(name = "related_topics", nullable = false, columnDefinition = "jsonb")
    private List<String> relatedTopics = new ArrayList<>();

    @Type(JsonType.class)
    @Column(name = "related_signal_ids", nullable = false, columnDefinition = "jsonb")
    private List<Long> relatedSignalIds = new ArrayList<>();

    @Type(JsonType.class)
    @Column(name = "evidence_json", nullable = false, columnDefinition = "jsonb")
    private List<Map<String, Object>> evidenceJson = new ArrayList<>();

    @Column(name = "confidence", precision = 4, scale = 3)
    private BigDecimal confidence;

    @Column(name = "status", nullable = false, length = 24)
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "first_seen", nullable = false)
    private LocalDateTime firstSeen;

    @UpdateTimestamp
    @Column(name = "last_seen", nullable = false)
    private LocalDateTime lastSeen;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getPatternType() { return patternType; }
    public void setPatternType(String patternType) { this.patternType = patternType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public List<String> getRelatedTopics() { return relatedTopics; }
    public void setRelatedTopics(List<String> relatedTopics) {
        this.relatedTopics = relatedTopics != null ? relatedTopics : new ArrayList<>();
    }
    public List<Long> getRelatedSignalIds() { return relatedSignalIds; }
    public void setRelatedSignalIds(List<Long> relatedSignalIds) {
        this.relatedSignalIds = relatedSignalIds != null ? relatedSignalIds : new ArrayList<>();
    }
    public List<Map<String, Object>> getEvidenceJson() { return evidenceJson; }
    public void setEvidenceJson(List<Map<String, Object>> evidenceJson) {
        this.evidenceJson = evidenceJson != null ? evidenceJson : new ArrayList<>();
    }
    public BigDecimal getConfidence() { return confidence; }
    public void setConfidence(BigDecimal confidence) { this.confidence = confidence; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getFirstSeen() { return firstSeen; }
    public void setFirstSeen(LocalDateTime firstSeen) { this.firstSeen = firstSeen; }
    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
