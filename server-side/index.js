const express = require('express');
const cors = require('cors');
const app = express();
const roomRoutes = require('./src/routes/roomRoutes');
const roomScheduleRoutes = require('./src/routes/roomScheduleRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const roomTypeRoutes = require('./src/routes/roomTypeRoutes');
const roomLogsRoutes = require('./src/routes/roomLogsRoutes');
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Hello, Express is working!');
});

app.use('/api/rooms', roomRoutes);
app.use('/api/room-schedule', roomScheduleRoutes);
app.use('/api/room-types', roomTypeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/room-logs', roomLogsRoutes);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
