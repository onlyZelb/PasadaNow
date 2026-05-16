CREATE TABLE reports (
    id          SERIAL PRIMARY KEY,
    ride_id     INT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    commuter_id INT NOT NULL REFERENCES commuters(id) ON DELETE CASCADE,
    reason      TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);