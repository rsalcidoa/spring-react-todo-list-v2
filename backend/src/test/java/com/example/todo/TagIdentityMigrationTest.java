package com.example.todo;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import com.example.todo.model.Tag;
import com.example.todo.model.User;
import com.example.todo.repository.TagRepository;
import com.example.todo.repository.UserRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Locks V4__tag_identity_ci: normalized identity (user_id, lower(name)))
 * enforced by the database, and the dedupe merge left no duplicates,
 * orphans, or untrimmed names behind.
 */
@SpringBootTest
class TagIdentityMigrationTest {

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbc;

    private User newUser() {
        return userRepository.save(new User(UUID.randomUUID() + "@example.com", "secret123"));
    }

    @Test
    void functionalIndexRejectsCaseVariantAtDbLevel() {
        User me = newUser();
        String base = "Idx" + UUID.randomUUID().toString().substring(0, 8);
        tagRepository.saveAndFlush(new Tag(base, me));

        // Bypass of the Java exists()-check: the DB itself must refuse the variant.
        assertThrows(DataIntegrityViolationException.class,
                () -> tagRepository.saveAndFlush(new Tag(base.toLowerCase(), me)));
    }

    @Test
    void sameNameAcrossUsersIsAllowed() {
        User a = newUser();
        User b = newUser();
        String name = "Shared" + UUID.randomUUID().toString().substring(0, 8);
        tagRepository.saveAndFlush(new Tag(name, a));
        tagRepository.saveAndFlush(new Tag(name, b));

        assertEquals(1, tagRepository.findByUserId(a.getId()).stream()
                .filter(t -> t.getName().equals(name)).count());
        assertEquals(1, tagRepository.findByUserId(b.getId()).stream()
                .filter(t -> t.getName().equals(name)).count());
    }

    @Test
    void noNormalizedDuplicatesRemainAfterMigration() {
        Integer dupGroups = jdbc.queryForObject(
                "SELECT COUNT(*) FROM (SELECT user_id, lower(name) FROM tags "
                        + "GROUP BY user_id, lower(name) HAVING COUNT(*) > 1) d",
                Integer.class);
        assertEquals(0, dupGroups, "Migration V4 must leave no normalized duplicates");
    }

    @Test
    void noOrphanAssociationsOrUntrimmedNamesRemain() {
        Integer orphans = jdbc.queryForObject(
                "SELECT COUNT(*) FROM task_tags tt LEFT JOIN tags t ON t.id = tt.tag_id "
                        + "WHERE t.id IS NULL",
                Integer.class);
        assertEquals(0, orphans, "No task_tags row may point to a missing tag");

        Integer untrimmed = jdbc.queryForObject(
                "SELECT COUNT(*) FROM tags WHERE name <> btrim(name)", Integer.class);
        assertEquals(0, untrimmed, "All tag names must be trimmed after V4");
    }
}
