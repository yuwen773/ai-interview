package interview.guide.modules.profile.repository;

import interview.guide.modules.profile.entity.UserStrongPointEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 用户强项 Repository
 */
@Repository
public interface UserStrongPointRepository extends JpaRepository<UserStrongPointEntity, Long> {

    /** 查询用户所有强项 */
    List<UserStrongPointEntity> findByUserId(String userId);

    /** 根据用户ID和主题查询强项 */
    List<UserStrongPointEntity> findByUserIdAndTopic(String userId, String topic);
}
