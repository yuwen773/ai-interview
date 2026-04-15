package interview.guide.modules.profile.repository;

import interview.guide.modules.profile.entity.UserTopicMasteryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserTopicMasteryRepository extends JpaRepository<UserTopicMasteryEntity, Long> {

    Optional<UserTopicMasteryEntity> findByUserIdAndTopic(String userId, String topic);

    List<UserTopicMasteryEntity> findByUserId(String userId);
}
