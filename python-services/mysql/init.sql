-- Um servidor MySQL para o par de serviços Python,
-- com um banco de dados próprio (e usuário próprio) para cada serviço.

CREATE DATABASE IF NOT EXISTS enrollment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS attendance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'enrollment_user'@'%' IDENTIFIED BY 'enrollment_pass';
CREATE USER IF NOT EXISTS 'attendance_user'@'%' IDENTIFIED BY 'attendance_pass';

GRANT ALL PRIVILEGES ON enrollment_db.* TO 'enrollment_user'@'%';
GRANT ALL PRIVILEGES ON attendance_db.* TO 'attendance_user'@'%';

FLUSH PRIVILEGES;
