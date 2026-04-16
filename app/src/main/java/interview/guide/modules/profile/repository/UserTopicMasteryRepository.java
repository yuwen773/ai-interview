package interview.guide.modules.profile.repository;

import interview.guide.modules.profile.entity.UserTopicMasteryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * 知识点掌握度 Repository
 */
@Repository
public interface UserTopicMasteryRepository extends JpaRepository<UserTopicMasteryEntity, Long> {

    /** 根据用户ID和主题查询掌握度记录 */
    Optional<UserTopicMasteryEntity> findByUserIdAndTopic(String userId, String topic);

    /** 查询用户所有主题的掌握度 */
    List<UserTopicMasteryEntity> findByUserId(String userId);
}
