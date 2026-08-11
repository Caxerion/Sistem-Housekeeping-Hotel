const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();
const roomRoutes = require('./src/routes/roomRoutes');
const roomScheduleRoutes = require('./src/routes/roomScheduleRoutes');
const cleaningScheduleRoutes = require('./src/routes/cleaningScheduleRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const roomTypeRoutes = require('./src/routes/roomTypeRoutes');
const roomLogsRoutes = require('./src/routes/roomLogsRoutes');
const maintenanceHistoryRoutes = require('./src/routes/maintenanceHistoryRoutes');
const staffOverviewRoutes = require('./src/routes/staffOverviewRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const jwt = require('jsonwebtoken');
const { addClient } = require('./src/utils/sse');
const PORT = 3000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Hello, Express is working!');
});

app.use('/api/rooms', roomRoutes);
app.use('/api/room-schedule', roomScheduleRoutes);
app.use('/api/cleaning-schedule', cleaningScheduleRoutes);
app.use('/api/room-types', roomTypeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/maintenance', require('./src/routes/maintenanceHistoryRoutes'));
app.use('/api/room-logs', roomLogsRoutes);
app.use('/api/staff', staffOverviewRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/api/events', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token required' });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    addClient(res);
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
});

app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Terjadi kesalahan pada server.',
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
