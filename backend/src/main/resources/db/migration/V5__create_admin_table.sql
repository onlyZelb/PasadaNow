CREATE TABLE IF NOT EXISTS admins (
    id         BIGSERIAL PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- fixed admin account (password: pasadanow2024)
INSERT INTO admins (username, password)
VALUES ('admin', '$2a$10$8.UnVuG9HHgffUDAlk8KnuyWfnyuhdzWMHmUm1u5DBGxuyQXm2AFu')
ON CONFLICT (username) DO NOTHING;