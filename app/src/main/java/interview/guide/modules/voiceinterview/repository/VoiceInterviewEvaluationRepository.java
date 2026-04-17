package interview.guide.modules.voiceinterview.repository;

import interview.guide.modules.voiceinterview.model.VoiceInterviewEvaluationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoiceInterviewEvaluationRepository extends JpaRepository<VoiceInterviewEvaluationEntity, Long> {
    Optional<VoiceInterviewEvaluationEntity> findBySessionId(Long sessionId);
}
