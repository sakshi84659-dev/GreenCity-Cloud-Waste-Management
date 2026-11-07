-- GreenCity migration 001: upgrade the complaints table for photos and search.
-- Existing complaint rows are NOT changed or deleted.
-- Run this ONCE. If you run it twice, MySQL says "Duplicate column name" - that is harmless.

USE greencity;

ALTER TABLE complaints
  ADD COLUMN image_key VARCHAR(255) NULL AFTER description,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD INDEX idx_complaints_status (status),
  ADD INDEX idx_complaints_category (category),
  ADD INDEX idx_complaints_created_at (created_at);

-- Check the result:
DESCRIBE complaints;
SELECT COUNT(*) AS total_complaints FROM complaints;
