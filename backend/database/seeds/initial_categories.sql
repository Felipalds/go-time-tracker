-- Initial categories for the time tracker
-- These categories will be seeded when the database is first initialized

INSERT INTO categories (name, created_at, updated_at) VALUES
('Work', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Health', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Study', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Personal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Exercise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Reading', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Hobby', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Social', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
