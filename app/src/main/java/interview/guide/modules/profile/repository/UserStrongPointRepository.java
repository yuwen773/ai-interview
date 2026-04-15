package interview.guide.modules.profile.repository;

import interview.guide.modules.profile.entity.UserStrongPointEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserStrongPointRepository extends JpaRepository<UserStrongPointEntity, Long> {
    List<UserStrongPointEntity> findByUserId(String userId);
    List<UserStrongPointEntity> findByUserIdAndTopic(String userId, String topic);
}
