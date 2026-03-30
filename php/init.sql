-- Products table and seed data
-- This file is run once by Postgres on first container start

CREATE TABLE IF NOT EXISTS products (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(120) NOT NULL,
    price     NUMERIC(10, 2) NOT NULL,
    category  VARCHAR(80)  NOT NULL,
    stock     INT          NOT NULL DEFAULT 0,
    image_url TEXT
);

-- Seed sample products (idempotent: only insert if table is empty)
INSERT INTO products (name, price, category, stock, image_url)
SELECT * FROM (VALUES
    ('Wireless Noise-Cancelling Headphones', 89.99, 'Electronics', 42,
     'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'),
    ('Mechanical Keyboard RGB', 129.00, 'Electronics', 18,
     'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400'),
    ('Ergonomic Office Chair', 349.95, 'Furniture', 7,
     'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400'),
    ('USB-C Hub 7-in-1', 45.00, 'Electronics', 95,
     'https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=400'),
    ('Running Shoes – Men''s', 79.99, 'Footwear', 60,
     'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'),
    ('Stainless Steel Water Bottle', 24.99, 'Accessories', 200,
     'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400'),
    ('Yoga Mat Premium', 39.95, 'Sports', 33,
     'https://images.unsplash.com/photo-1601925228216-cf6e48bd4ae5?w=400'),
    ('Smart LED Desk Lamp', 54.99, 'Electronics', 25,
     'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400')
) AS v(name, price, category, stock, image_url)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
