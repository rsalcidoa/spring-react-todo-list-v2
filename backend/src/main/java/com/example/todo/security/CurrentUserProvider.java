package com.example.todo.security;

import com.example.todo.exception.OwnershipDeniedException;
import com.example.todo.exception.UnauthenticatedException;
import com.example.todo.model.User;
import com.example.todo.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class CurrentUserProvider {
    private final UserRepository userRepository;

    public CurrentUserProvider(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> current() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = authentication.getPrincipal();
        String email;
        if (principal instanceof org.springframework.security.core.userdetails.User userDetails) {
            email = userDetails.getUsername();
        } else if (principal instanceof String s) {
            email = s;
        } else {
            return Optional.empty();
        }
        return userRepository.findByEmail(email);
    }

    public User requireCurrent() {
        return current().orElseThrow(UnauthenticatedException::new);
    }

    public User requireOwned(Long ownerId) {
        User me = requireCurrent();
        if (!me.getId().equals(ownerId)) {
            throw new OwnershipDeniedException();
        }
        return me;
    }
}
