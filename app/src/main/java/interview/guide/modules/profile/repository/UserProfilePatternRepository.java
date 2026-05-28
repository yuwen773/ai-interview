package interview.guide.modules.profile.repository;

import interview.guide.modules.profile.entity.UserProfilePatternEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserProfilePatternRepository extends JpaRepository<UserProfilePatternEntity, Long> {

    List<UserProfilePatternEntity> findByUserIdAndStatusOrderByLastSeenDesc(String userId, String status);

    long countByUserIdAndStatus(String userId, String status);
}
