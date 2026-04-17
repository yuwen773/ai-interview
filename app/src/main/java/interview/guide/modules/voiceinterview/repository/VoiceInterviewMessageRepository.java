package interview.guide.modules.voiceinterview.repository;

import interview.guide.modules.voiceinterview.model.VoiceInterviewMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoiceInterviewMessageRepository extends JpaRepository<VoiceInterviewMessageEntity, Long> {
    List<VoiceInterviewMessageEntity> findBySessionIdOrderBySequenceNumAsc(Long sessionId);
    List<VoiceInterviewMessageEntity> findBySessionIdOrderByCreatedAtAsc(Long sessionId);
}
