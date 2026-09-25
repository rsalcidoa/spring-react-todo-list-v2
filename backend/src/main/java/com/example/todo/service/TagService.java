package com.example.todo.service;

import com.example.todo.dto.TagResponse;
import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.exception.TagAlreadyExistsException;
import com.example.todo.model.Tag;
import com.example.todo.model.User;
import com.example.todo.repository.TagRepository;
import com.example.todo.security.CurrentUserProvider;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TagService {
    private final TagRepository tagRepository;
    private final CurrentUserProvider currentUser;

    public TagService(TagRepository tagRepository, CurrentUserProvider currentUser) {
        this.tagRepository = tagRepository;
        this.currentUser = currentUser;
    }

    public List<TagResponse> list(User me) {
        List<TagResponse> tags = new ArrayList<>();
        for (Tag t : tagRepository.findByUserId(me.getId())) {
            tags.add(new TagResponse(t.getId(), t.getName()));
        }
        tags.sort(Comparator.comparing(TagResponse::getName, String.CASE_INSENSITIVE_ORDER));
        return tags;
    }

    public TagResponse create(User me, String name) {
        String trimmed = name.trim();
        if (exists(me, trimmed)) {
            throw new TagAlreadyExistsException();
        }
        try {
            Tag tag = new Tag(trimmed, me);
            tagRepository.save(tag);
            return new TagResponse(tag.getId(), tag.getName());
        } catch (DataIntegrityViolationException e) {
            if (exists(me, trimmed)) {
                throw new TagAlreadyExistsException();
            }
            throw e;
        }
    }

    public void delete(User me, Long id) {
        Tag tag = tagRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        currentUser.requireOwned(tag.getUser().getId());
        tagRepository.delete(tag);
    }

    public List<Tag> resolve(User me, List<String> names) {
        Map<String, Tag> byKey = new HashMap<>();
        for (Tag t : tagRepository.findByUserId(me.getId())) {
            byKey.put(t.getName().trim().toLowerCase(), t);
        }
        List<Tag> result = new ArrayList<>();
        for (String rawName : names) {
            String key = rawName.trim().toLowerCase();
            Tag existing = byKey.get(key);
            if (existing != null) {
                if (!result.contains(existing)) {
                    result.add(existing);
                }
                continue;
            }
            Tag tag = new Tag(rawName.trim(), me);
            tagRepository.save(tag);
            byKey.put(key, tag);
            result.add(tag);
        }
        return result;
    }

    private boolean exists(User me, String trimmed) {
        for (Tag t : tagRepository.findByUserId(me.getId())) {
            if (t.getName().trim().equalsIgnoreCase(trimmed)) {
                return true;
            }
        }
        return false;
    }
}
