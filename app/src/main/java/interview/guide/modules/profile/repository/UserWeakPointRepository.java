package interview.guide.modules.profile.repository;

import interview.guide.modules.profile.entity.UserWeakPointEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface UserWeakPointRepository extends JpaRepository<UserWeakPointEntity, Long> {

    List<UserWeakPointEntity> findByUserIdAndIsImprovedFalse(String userId);

    @Query(value = """
        SELECT * FROM user_weak_points
        WHERE user_id = :userId
          AND topic = :topic
          AND is_improved = false
          AND (sr_state->>'next_review')::date <= :date
        ORDER BY (sr_state->>'ease_factor')::decimal ASC
        """, nativeQuery = true)
    List<UserWeakPointEntity> findDueReviews(
        @Param("userId") String userId,
        @Param("topic") String topic,
        @Param("date") LocalDate date
    );

    @Query(value = """
        SELECT * FROM user_weak_points
        WHERE user_id = :userId
          AND is_improved = false
          AND (sr_state->>'next_review')::date <= :date
        ORDER BY (sr_state->>'ease_factor')::decimal ASC
        """, nativeQuery = true)
    List<UserWeakPointEntity> findAllDueReviews(@Param("userId") String userId, @Param("date") LocalDate date);

    @Query("SELECT w.questionText FROM UserWeakPointEntity w WHERE w.userId = :userId")
    List<String> findAllQuestionTextsByUserId(@Param("userId") String userId);

    long countByUserIdAndIsImprovedTrue(String userId);

    List<UserWeakPointEntity> findByTopicAndUserIdOrderByScoreAsc(String topic, String userId);

    @Query(value = """
        SELECT COUNT(*) FROM user_weak_points
        WHERE user_id = :userId
          AND is_improved = false
          AND (sr_state->>'next_review')::date <= :date
        """, nativeQuery = true)
    long countDueReviews(@Param("userId") String userId, @Param("date") LocalDate date);
}
