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
    'cleaning'
)
DEFAULT 'clean'
AFTER occupancy_status;