package com.example.todo.service;

import com.example.todo.dto.TagResponse;
import com.example.todo.exception.TagAlreadyExistsException;
import com.example.todo.model.Tag;
import com.example.todo.model.User;
import com.example.todo.repository.TagRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class TagService {
    private final TagRepository tagRepository;
    private final Ownership ownership;

    public TagService(TagRepository tagRepository, Ownership ownership) {
        this.tagRepository = tagRepository;
        this.ownership = ownership;
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
        if (tagRepository.existsByUserIdAndNameIgnoreCase(me.getId(), trimmed)) {
            throw new TagAlreadyExistsException();
        }
        try {
            Tag tag = new Tag(trimmed, me);
            tagRepository.save(tag);
            return new TagResponse(tag.getId(), tag.getName());
        } catch (DataIntegrityViolationException e) {
            if (tagRepository.existsByUserIdAndNameIgnoreCase(me.getId(), trimmed)) {
                throw new TagAlreadyExistsException();
            }
            throw e;
        }
    }

    public void delete(Long id) {
        Tag tag = ownership.requireOwned(id, tagRepository::findById, t -> t.getUser().getId());
        tagRepository.delete(tag);
    }

    /**
     * Resolve tag names to tag values. Idempotent and safe under retry: every
     * call re-queries, so a caller retrying in a fresh transaction reuses tags
     * committed by a concurrent transaction. Never exposes the entity and
     * never catches persistence errors (the caller's retry loop owns those).
     */
    public List<TagResponse> resolve(User me, List<String> names) {
        Map<String, TagResponse> seen = new java.util.LinkedHashMap<>();
        for (String rawName : names) {
            String trimmed = rawName.trim();
            if (trimmed.isEmpty()) {
                // Internal invariant: the request DTO already rejects blank tag
                // names, so reaching this is a programming error, not a client 400.
                throw new IllegalStateException("Tag name must not be blank");
            }
            String key = trimmed.toLowerCase();
            if (seen.containsKey(key)) {
                continue;
            }
            TagResponse resolved = tagRepository.findByUserIdAndNameIgnoreCase(me.getId(), trimmed)
                    .map(t -> new TagResponse(t.getId(), t.getName()))
                    .orElseGet(() -> {
                        Tag saved = tagRepository.save(new Tag(trimmed, me));
                        return new TagResponse(saved.getId(), saved.getName());
                    });
            seen.put(key, resolved);
        }
        return new ArrayList<>(seen.values());
    }
}
