package interview.guide.modules.profile.repository;

import interview.guide.modules.profile.entity.UserProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * 用户画像 Repository
 */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfileEntity, Long> {

    /** 根据用户ID查询画像 */
    Optional<UserProfileEntity> findByUserId(String userId);
}
