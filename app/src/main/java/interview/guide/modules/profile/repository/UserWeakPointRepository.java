package interview.guide.modules.profile.repository;

import interview.guide.modules.profile.entity.UserWeakPointEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 用户弱项 Repository
 * 提供弱项的查询、待复习项检索等功能，使用PostgreSQL JSONB操作符访问SM-2状态
 */
@Repository
public interface UserWeakPointRepository extends JpaRepository<UserWeakPointEntity, Long> {

    /** 查询用户所有未改善的弱项 */
    List<UserWeakPointEntity> findByUserIdAndIsImprovedFalse(String userId);

    /**
     * 查询指定主题下到期的待复习弱项
     * 按难度因子升序排列（难度因子越低，优先复习）
     */
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

    /**
     * 查询所有到期待复习的弱项（不限主题）
     * 按难度因子升序排列
     */
    @Query(value = """
        SELECT * FROM user_weak_points
        WHERE user_id = :userId
          AND is_improved = false
          AND (sr_state->>'next_review')::date <= :date
        ORDER BY (sr_state->>'ease_factor')::decimal ASC
        """, nativeQuery = true)
    List<UserWeakPointEntity> findAllDueReviews(@Param("userId") String userId, @Param("date") LocalDate date);

    /** 查询用户所有弱项的题目文本（用于语义去重匹配） */
    @Query("SELECT w.questionText FROM UserWeakPointEntity w WHERE w.userId = :userId")
    List<String> findAllQuestionTextsByUserId(@Param("userId") String userId);

    /** 统计用户已改善的弱项数量 */
    long countByUserIdAndIsImprovedTrue(String userId);

    /** 按主题查询用户弱项，按评分升序排列（最低分优先） */
    List<UserWeakPointEntity> findByTopicAndUserIdOrderByScoreAsc(String topic, String userId);

    /** 统计用户到期待复习的弱项数量 */
    @Query(value = """
        SELECT COUNT(*) FROM user_weak_points
        WHERE user_id = :userId
          AND is_improved = false
          AND (sr_state->>'next_review')::date <= :date
        """, nativeQuery = true)
    long countDueReviews(@Param("userId") String userId, @Param("date") LocalDate date);
}
