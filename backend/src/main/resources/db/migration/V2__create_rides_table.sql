CREATE TABLE rides (
    id          BIGSERIAL PRIMARY KEY,
    rider_id    BIGINT,
    driver_id   BIGINT,
    pickup      VARCHAR(255),
    dropoff     VARCHAR(255),
    fare_type   VARCHAR(50),
    fare        INTEGER,
    status      VARCHAR(20),
    created_at  TIMESTAMP
);