const validateRegister = (req, res, next) => {
    const body = req.body || {};
    const full_name = body.full_name;
    const phone = body.phone;
    const email = body.email;
    const position_id = body.position_id;
    const username = body.username || body.Username;
    const password = body.password || body.Password;
    const role = body.role;
    const errors = [];

    if (!full_name || full_name.trim() === '') {
        errors.push({ msg: 'full_name is required' });
    }
    if (!phone || phone.trim() === '') {
        errors.push({ msg: 'phone is required' });
    }
    if (email && email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ msg: 'email must be a valid email address' });
    }
    if (position_id === undefined || position_id === null || position_id === '') {
        errors.push({ msg: 'position_id is required' });
    }
    if (!username || username.trim() === '') {
        errors.push({ msg: 'username is required' });
    } else if (username.length < 3) {
        errors.push({ msg: 'username must be at least 3 characters' });
    }
    if (!password || password.length < 6) {
        errors.push({ msg: 'password must be at least 6 characters' });
    }
    if (role !== undefined && role !== null && role !== '') {
        if (role !== 'admin' && role !== 'staff') {
            errors.push({ msg: 'role must be either admin or staff' });
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const body = req.body || {};
    const username = body.username || body.Username;
    const password = body.password || body.Password;
    const errors = [];

    if (!username || username.trim() === '') {
        errors.push({ msg: 'username is required' });
    }
    if (!password || password.trim() === '') {
        errors.push({ msg: 'password is required' });
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

module.exports = { validateRegister, validateLogin };