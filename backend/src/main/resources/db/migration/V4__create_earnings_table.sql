CREATE TABLE IF NOT EXISTS earnings (
    id          BIGSERIAL PRIMARY KEY,
    driver_id   BIGINT NOT NULL REFERENCES drivers(id),
    ride_id     BIGINT NOT NULL REFERENCES rides(id),
    amount      NUMERIC(8,2) NOT NULL,
    date        DATE    NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earnings_driver ON earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_earnings_ride   ON earnings(ride_id);