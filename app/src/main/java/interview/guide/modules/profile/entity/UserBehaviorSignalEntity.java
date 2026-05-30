package interview.guide.modules.profile.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(
    name = "user_behavior_signals",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_user_behavior_signal",
        columnNames = {"user_id", "namespace", "signal_key"}
    )
)
public class UserBehaviorSignalEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    @Column(name = "namespace", nullable = false, length = 32)
    private String namespace;

    @Column(name = "signal_key", nullable = false, length = 128)
    private String signalKey;

    @Column(name = "polarity", nullable = false, length = 16)
    private String polarity;

    @Column(name = "statement", nullable = false, columnDefinition = "TEXT")
    private String statement;

    @Type(JsonType.class)
    @Column(name = "evidence_json", nullable = false, columnDefinition = "JSONB")
    private List<Map<String, Object>> evidenceJson = new ArrayList<>();

    @Column(name = "source_type", length = 32)
    private String sourceType;

    @Column(name = "source_session_id")
    private Long sourceSessionId;

    @Column(name = "times_seen", nullable = false)
    private Integer timesSeen = 1;

    @Column(name = "status", nullable = false, length = 24)
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "first_seen", nullable = false)
    private LocalDateTime firstSeen;

    @UpdateTimestamp
    @Column(name = "last_seen", nullable = false)
    private LocalDateTime lastSeen;

    @Column(name = "improved_at")
    private LocalDateTime improvedAt;

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
    public String getNamespace() { return namespace; }
    public void setNamespace(String namespace) { this.namespace = namespace; }
    public String getSignalKey() { return signalKey; }
    public void setSignalKey(String signalKey) { this.signalKey = signalKey; }
    public String getPolarity() { return polarity; }
    public void setPolarity(String polarity) { this.polarity = polarity; }
    public String getStatement() { return statement; }
    public void setStatement(String statement) { this.statement = statement; }
    public List<Map<String, Object>> getEvidenceJson() { return evidenceJson; }
    public void setEvidenceJson(List<Map<String, Object>> evidenceJson) {
        this.evidenceJson = evidenceJson != null ? evidenceJson : new ArrayList<>();
    }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public Long getSourceSessionId() { return sourceSessionId; }
    public void setSourceSessionId(Long sourceSessionId) { this.sourceSessionId = sourceSessionId; }
    public Integer getTimesSeen() { return timesSeen; }
    public void setTimesSeen(Integer timesSeen) { this.timesSeen = timesSeen; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getFirstSeen() { return firstSeen; }
    public void setFirstSeen(LocalDateTime firstSeen) { this.firstSeen = firstSeen; }
    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }
    public LocalDateTime getImprovedAt() { return improvedAt; }
    public void setImprovedAt(LocalDateTime improvedAt) { this.improvedAt = improvedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
