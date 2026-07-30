-- Digunakan untuk login

CREATE OR REPLACE VIEW vw_account AS
SELECT 
    u.id AS user_id,
    u.username,
    u.password,
    e.full_name AS employee_name,
    p.name AS employee_position,
    e.email AS employee_email,
    
    -- Menggabungkan data multi-aplikasi menjadi bentuk JSON Array langsung di Database!
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'app_name', app.name,
            'role', au.role 
        )
    ) AS access_rights
FROM users u
JOIN employees e ON u.employee_id = e.id
JOIN positions p ON e.position_id = p.id
JOIN application_users au ON u.id = au.user_id
JOIN applications app ON au.application_id = app.id
WHERE u.is_active = TRUE
GROUP BY u.id;