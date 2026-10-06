CREATE TABLE projects (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX uq_user_project_ci ON projects (user_id, lower(name));
ALTER TABLE tasks ADD COLUMN project_id BIGINT NULL REFERENCES projects(id) ON DELETE SET NULL;
