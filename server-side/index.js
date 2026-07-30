const express = require('express');
const app = express();
const roomRoutes = require('./src/routes/roomRoutes');
const roomScheduleRoutes = require('./src/routes/roomScheduleRoutes');
const PORT = 3000;

app.use(express.json());

const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Hello, Express is working!');
});

app.use('/api/rooms', roomRoutes);
app.use('/api/room-schedule', roomScheduleRoutes);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
