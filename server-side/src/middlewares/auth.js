// /src/middlewares/auth.js

const jwt = require('jsonwebtoken');

// pengecekan token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // Format header: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Akses ditolak:Silakan login terlebih dahulu."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Menyimpan payload user ke objek request
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: "Sesi tidak valid atau sudah kedaluwarsa."
        });
    }
};

// Pengecekan level access
// Paramaeter masukan 'admin' atau 'staff' dalam array ['admin'] or ['admin','staff']
const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        // req.user di-set oleh middleware verifyToken sebelumnya
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak: Informasi role tidak ditemukan dalam sesi.'
            });
        }

        // Cek role user saat ini ada di dalam daftar allowedRoles/(parameter)
        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Akses ditolak: Role '${userRole}' tidak memiliki izin untuk mengakses fitur ini.`
            });
        }

        next(); // Jika cocok, lanjutkan ke controller tujuan
    };
};

module.exports = {
    verifyToken,
    verifyRole
}