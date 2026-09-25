-- V4: enforce normalized tag identity (trimmed, case-insensitive per user).
-- The Java layer normalizes (trim + lower) but the old UNIQUE (user_id, name)
-- is case-sensitive in PostgreSQL, letting race-created case-variants slip
-- through as silent duplicates. This migration merges pre-existing duplicates
-- and replaces the constraint with a functional unique index.

-- 1. Defensive trim (TagService already stores trimmed names).
UPDATE tags SET name = btrim(name) WHERE name <> btrim(name);

-- 2. Groups with duplicates: keeper = MIN(id).
CREATE TEMP TABLE tag_keep AS
SELECT user_id, lower(name) AS norm, MIN(id) AS keep_id
FROM tags
GROUP BY user_id, lower(name)
HAVING COUNT(*) > 1;

-- 3. Remember affected tasks so no association is lost.
CREATE TEMP TABLE affected_tasks AS
SELECT DISTINCT a.task_id, k.keep_id
FROM task_tags a
JOIN tags t ON t.id = a.tag_id
JOIN tag_keep k ON k.user_id = t.user_id AND k.norm = lower(t.name);

-- 4. Drop loser associations (keepers are re-added in step 5).
DELETE FROM task_tags a
USING tags t, tag_keep k
WHERE a.tag_id = t.id
  AND t.user_id = k.user_id
  AND lower(t.name) = k.norm
  AND t.id <> k.keep_id;

-- 5. Re-attach keepers (union semantics; ON CONFLICT guards tasks already linked).
INSERT INTO task_tags (task_id, tag_id)
SELECT task_id, keep_id FROM affected_tasks
ON CONFLICT DO NOTHING;

-- 6. Delete loser tag rows.
DELETE FROM tags t
USING tag_keep k
WHERE t.user_id = k.user_id
  AND lower(t.name) = k.norm
  AND t.id <> k.keep_id;

-- 7. Replace the case-sensitive constraint with the functional unique index.
ALTER TABLE tags DROP CONSTRAINT IF EXISTS uq_user_tag;
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_tag_ci ON tags (user_id, lower(name));
