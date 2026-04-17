package interview.guide.modules.voiceinterview.repository;

import interview.guide.modules.voiceinterview.model.VoiceInterviewSessionEntity;
import interview.guide.modules.voiceinterview.model.VoiceInterviewSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoiceInterviewSessionRepository extends JpaRepository<VoiceInterviewSessionEntity, Long> {
    List<VoiceInterviewSessionEntity> findByUserIdOrderByCreatedAtDesc(String userId);
    List<VoiceInterviewSessionEntity> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, VoiceInterviewSessionStatus status);
    Optional<VoiceInterviewSessionEntity> findByIdAndUserId(Long id, String userId);
}
