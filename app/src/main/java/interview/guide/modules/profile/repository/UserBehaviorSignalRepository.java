package interview.guide.modules.profile.repository;

import interview.guide.modules.profile.entity.UserBehaviorSignalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBehaviorSignalRepository extends JpaRepository<UserBehaviorSignalEntity, Long> {

    List<UserBehaviorSignalEntity> findByUserId(String userId);

    List<UserBehaviorSignalEntity> findByUserIdAndStatus(String userId, String status);

    List<UserBehaviorSignalEntity> findByUserIdAndNamespaceAndStatus(String userId, String namespace, String status);

    List<UserBehaviorSignalEntity> findByUserIdAndNamespace(String userId, String namespace);

    Optional<UserBehaviorSignalEntity> findByUserIdAndNamespaceAndSignalKey(
        String userId,
        String namespace,
        String signalKey
    );

    long countByUserIdAndStatus(String userId, String status);
}
