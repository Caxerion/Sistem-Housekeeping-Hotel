ALTER TABLE rooms
CHANGE status occupancy_status
ENUM(
    'available',
    'reserved',
    'occupied',
    'maintenance'
)
DEFAULT 'available';

ALTER TABLE rooms
ADD COLUMN housekeeping_status
ENUM(
    'clean',
    'dirty',
    'cleaning',
    'maintenance'
)
DEFAULT 'clean'
AFTER occupancy_status;

CREATE TABLE IF NOT EXISTS room_cleaning_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    scheduled_by INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    notes TEXT,
    scheduled_date DATE NOT NULL,
    ended_at DATE NULL,
    status ENUM('scheduled','in_progress','completed','canceled') NOT NULL DEFAULT 'scheduled',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    photos JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    FOREIGN KEY (scheduled_by) REFERENCES employees(id) ON DELETE RESTRICT,
    INDEX idx_cleaning_schedule_room (room_id),
    INDEX idx_cleaning_schedule_date (scheduled_date)
);

CREATE TABLE IF NOT EXISTS room_cleaning_schedule_staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    employee_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES room_cleaning_schedule(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    CONSTRAINT unique_cleaning_schedule_staff UNIQUE (schedule_id, employee_id)
);