-- Inventory Taking Tables
-- Run this after init.sql

USE hotel_db;

CREATE TABLE IF NOT EXISTS inventory_takings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    INDEX idx_taking_employee (employee_id),
    INDEX idx_taking_date (taken_at)
);

CREATE TABLE IF NOT EXISTS inventory_taking_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    taking_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (taking_id) REFERENCES inventory_takings(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
    CONSTRAINT chk_taking_qty_positive CHECK (quantity > 0),
    INDEX idx_taking_item (taking_id),
    INDEX idx_item_ref (item_id)
);
