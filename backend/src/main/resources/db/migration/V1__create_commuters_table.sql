CREATE TABLE IF NOT EXISTS commuters (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100),
    age             VARCHAR(10),
    phone           VARCHAR(20),
    email           VARCHAR(100),
    address         VARCHAR(255),
    profile_photo   TEXT,
    verified_status VARCHAR(20)  NOT NULL DEFAULT 'verified'
                    CHECK (verified_status IN ('pending','verified','rejected')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commuters_username ON commuters(username);