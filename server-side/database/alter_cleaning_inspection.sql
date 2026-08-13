-- Add inspection fields to cleaning schedule
-- Run this if you haven't run it before

ALTER TABLE room_cleaning_schedule
ADD COLUMN inspection_status ENUM('pending', 'approved', 'rejected', 'revision') NULL DEFAULT NULL AFTER photos,
ADD COLUMN inspection_by INT NULL AFTER inspection_status,
ADD COLUMN inspection_note TEXT NULL AFTER inspection_by,
ADD COLUMN inspected_at TIMESTAMP NULL AFTER inspection_note,
ADD FOREIGN KEY (inspection_by) REFERENCES employees(id) ON DELETE SET NULL;
