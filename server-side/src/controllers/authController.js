const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const body = req.body || {};
    const full_name = body.full_name;
    const phone = body.phone;
    const email = body.email;
    const position_id = body.position_id;
    const username = body.username || body.Username;
    const password = body.password || body.Password;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const [nextCodeRow] = await pool.query(
            `SELECT CONCAT('EMP-', YEAR(NOW()), '-', LPAD(IFNULL(MAX(CAST(SUBSTRING_INDEX(employee_code, '-', -1) AS UNSIGNED)), 0) + 1, 3, '0')) AS next_code FROM employees`
        );
        const employee_code = nextCodeRow[0].next_code;

        const [employeeResult] = await pool.query(
            "INSERT INTO employees (employee_code, full_name, phone, email, position_id) VALUES (?, ?, ?, ?, ?)",
            [employee_code, full_name, phone, email, position_id]
        );
        const employeeId = employeeResult.insertId;

        const [userResult] = await pool.query(
            "INSERT INTO users (employee_id, username, password, is_active) VALUES (?, ?, ?, TRUE)",
            [employeeId, username, hashedPassword]
        );
        const userId = userResult.insertId;

        const [appResult] = await pool.query(
            "SELECT id FROM applications WHERE name = ?",
            [process.env.APP_NAME || 'Housekeeping Management']
        );

        if (appResult.length === 0) {
            await pool.query("DELETE FROM users WHERE id = ?", [userId]);
            await pool.query("DELETE FROM employees WHERE id = ?", [employeeId]);
            return res.status(500).json({
                success: false,
                message: "Application not found"
            });
        }

        const applicationId = appResult[0].id;

        const [positionRows] = await pool.query("SELECT name FROM positions WHERE id = ?", [position_id]);
        const positionName = positionRows.length > 0 ? positionRows[0].name : '';
        const adminPositions = ['Super Admin', 'Housekeeping Supervisor'];
        const userRole = adminPositions.includes(positionName) ? 'admin' : 'staff';

        await pool.query(
            "INSERT INTO application_users (application_id, user_id, role) VALUES (?, ?, ?)",
            [applicationId, userId, userRole]
        );

        const [userRows] = await pool.query(
            "SELECT * FROM vw_account WHERE user_id = ?",
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(201).json({
                success: true,
                message: "Registration successful",
                data: {
                    user_id: userId,
                    employee_id: employeeId,
                    username: username
                }
            });
        }

        const user = userRows[0];
        const myApp = process.env.APP_NAME || 'Housekeeping Management';
        const App = user.access_rights.find(access => access.app_name === myApp);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            data: {
                token: null,
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    employee_name: user.employee_name,
                    employee_position: user.employee_position,
                    current_role: App ? App.role : null,
                    access_rights: user.access_rights
                }
            }
        });

    } catch (error) {
        console.error('[REGISTER ERROR]:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            const field = error.sqlMessage.includes('email') ? 'Email' : 'Data';
            return res.status(409).json({
                success: false,
                message: `${field} sudah terdaftar. Silakan gunakan ${field.toLowerCase()} lain.`,
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server internal.",
            error: error.message
        });
    }
};

const login = async (req, res) => {
    const body = req.body || {};
    const username = body.username || body.Username;
    const password = body.password || body.Password;

    try {
        const [rows] = await pool.query(
            "SELECT * FROM vw_account WHERE username = ?",
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Username atau password salah"
            });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Username atau password salah"
            });
        }

        const myApp = process.env.APP_NAME || 'Housekeeping Management';
        
        const allowed = Array.isArray(user.access_rights) && 
            user.access_rights.some(access => access.app_name === myApp);

        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "Akses ditolak"
            });
        }

        const App = user.access_rights.find(access => access.app_name === myApp);

        const [empRows] = await pool.query(
            "SELECT employee_id FROM users WHERE id = ?",
            [user.user_id]
        );
        const employeeId = empRows.length > 0 ? empRows[0].employee_id : null;

        const tokenPayload = {
            user_id: user.user_id,
            employee_id: employeeId,
            username: user.username,
            employee_name: user.employee_name,
            employee_position: user.employee_position,
            current_app: myApp,
            role: App ? App.role : null,
            access_rights: user.access_rights 
        };

        const token = jwt.sign(
            tokenPayload, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        return res.status(200).json({
            success: true,
            message: "Login berhasil!",
            data: {
                token: token,
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    employee_name: user.employee_name,
                    employee_position: user.employee_position,
                    current_role: App ? App.role : null,
                    access_rights: user.access_rights
                }
            }
        });

    } catch (error) {
        console.error('[AUTH ERROR]:', error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server internal.",
            error: error.message
        });
    }
};

const logout = async (req, res) => {
    try {
        return res.status(200).json({ success: true, message: "Logout berhasil" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server internal." });
    }
};

module.exports = {
    register,
    login
};
