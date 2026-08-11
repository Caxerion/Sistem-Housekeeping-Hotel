const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/attendance');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const maintenanceUploadDir = path.join(__dirname, '../../uploads/maintenance');
if (!fs.existsSync(maintenanceUploadDir)) {
  fs.mkdirSync(maintenanceUploadDir, { recursive: true });
}

const attendanceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `attendance-${unique}${path.extname(file.originalname)}`);
  },
});

const maintenanceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, maintenanceUploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `maintenance-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format foto tidak didukung. Gunakan JPEG, PNG, atau WebP.'));
  }
};

const uploadAttendancePhotos = multer({
  storage: attendanceStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const uploadMaintenancePhotos = multer({
  storage: maintenanceStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

module.exports = { uploadAttendancePhotos, uploadMaintenancePhotos };
