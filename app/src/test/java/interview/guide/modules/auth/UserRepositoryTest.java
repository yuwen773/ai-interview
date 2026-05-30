package interview.guide.modules.auth;

import interview.guide.modules.auth.entity.UserEntity;
import interview.guide.modules.auth.repository.UserRepository;
import org.junit.jupiter.api.Test;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:auth_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@EnableJpaRepositories(basePackageClasses = UserRepository.class)
class UserRepositoryTest {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void saveAndFindByEmail() {
        UserEntity user = new UserEntity();
        user.setEmail("test@example.com");
        user.setPasswordHash("$2a$10$dummy");
        user.setNickname("Test User");
        userRepository.saveAndFlush(user);
        entityManager.clear();

        var found = userRepository.findByEmail("test@example.com");
        assertTrue(found.isPresent());
        assertEquals("Test User", found.get().getNickname());
    }

    @Test
    void findByEmailNotFound() {
        assertTrue(userRepository.findByEmail("nonexistent@example.com").isEmpty());
    }

    @Test
    void existsByEmail() {
        UserEntity user = new UserEntity();
        user.setEmail("exists@example.com");
        user.setPasswordHash("$2a$10$dummy");
        userRepository.saveAndFlush(user);
        entityManager.clear();

        assertTrue(userRepository.existsByEmail("exists@example.com"));
        assertFalse(userRepository.existsByEmail("notexists@example.com"));
    }
}