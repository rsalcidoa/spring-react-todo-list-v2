package com.example.todo;

import com.example.todo.model.User;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class UserTest {

    private User userWithId(long id, String email) {
        User user = new User(email, "password");
        user.setId(id);
        return user;
    }

    @Test
    void sameIdMeansEqual() {
        User a = userWithId(1L, "a@example.com");
        User b = userWithId(1L, "b@example.com");

        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void differentIdsAreNotEqual() {
        User a = userWithId(1L, "a@example.com");
        User b = userWithId(2L, "b@example.com");

        assertNotEquals(a, b);
    }

    @Test
    void notAUserIsFalse() {
        User a = userWithId(1L, "a@example.com");

        assertFalse(a.equals("not a user"));
        assertFalse(a.equals(null));
    }
}
