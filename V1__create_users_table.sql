CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL    PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'ROLE_USER',
    full_name   VARCHAR(100),
    phone       VARCHAR(20),
    email       VARCHAR(100),
    license_no  VARCHAR(50),
    plate_no    VARCHAR(30),
    toda_no     VARCHAR(50)
);


INSERT INTO users (username, password, role)
VALUES ('admin', '$2a$10$8.UnVuG9HHgffUDAlk8KnuyWfnyuhdzWMHmUm1u5DBGxuyQXm2AFu', 'ROLE_ADMIN')
ON CONFLICT (username) DO NOTHING;