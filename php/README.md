# PHP — Products Microservice

This service exposes a product catalog API. It runs on **port 8081** and is protected by the same JWT token that Spring Boot issues on login.

---

## What Does This Service Do?

- Serves a list of products from the database (`GET /products`)
- Validates the JWT cookie on every protected request
- Returns JSON responses

It does **not** handle login or user management. That's Spring Boot's job.

---

## Project Structure

```
php/
├── composer.json          ← PHP dependency file (like package.json)
├── composer.lock          ← Locked versions (auto-generated, don't edit)
├── vendor/                ← Downloaded packages (like node_modules, git-ignored)
├── index.php              ← Entry point — every request starts here
├── init.sql               ← Seeds the products table in Postgres on first run
├── .htaccess              ← Tells Apache to route all requests through index.php
└── src/
    ├── routes.php         ← Maps URLs to controller methods
    ├── Core/
    │   └── Router.php     ← Simple router class
    ├── Controllers/
    │   └── ProductController.php  ← Handles /products logic
    └── Middleware/
        └── JwtMiddleware.php      ← Validates the JWT cookie
```

---

## Core Concepts

### 1. Composer — PHP's Package Manager

Composer does for PHP what `npm` does for JavaScript.

```bash
# Install all dependencies from composer.json
composer install

# Add a new package
composer require some/package
```

This project uses one package:

```json
"require": {
    "firebase/php-jwt": "^6.10"
}
```

`firebase/php-jwt` decodes and verifies JWT tokens — the same tokens Spring Boot creates.

### 2. How a Request Flows Through the App

```
Browser: GET http://localhost:8081/products
        ↓
Apache receives the request
        ↓
.htaccess rewrites the URL → runs index.php
        ↓
index.php sets CORS headers, loads Composer autoloader
        ↓
routes.php is included → Router matches GET /products
        ↓
ProductController::index() is called
        ↓
JwtMiddleware::authenticate() checks the cookie
        ↓
PDO queries PostgreSQL for products
        ↓
JSON response sent back to browser
```

### 3. `index.php` — The Entry Point

Every single request goes through this file first. It:

1. Sets CORS headers so the React frontend (on port 3000) is allowed to call this API
2. Handles `OPTIONS` pre-flight requests (browsers send these before the real request)
3. Loads the Composer autoloader (makes all packages and classes available)
4. Includes `routes.php`

```php
// CORS must be set before any output
header("Access-Control-Allow-Origin: http://localhost:3000");
header('Access-Control-Allow-Credentials: true'); // required when sending cookies
```

> `withCredentials: true` on the React side and `Access-Control-Allow-Credentials: true` on the PHP side must both be set for cookies to work cross-origin.

### 4. `.htaccess` — URL Rewriting

Without this file, Apache would look for a physical file matching the URL. `/products` would return a 404 because there's no `products.php` file.

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f   # not a real file
RewriteCond %{REQUEST_FILENAME} !-d   # not a real directory
RewriteRule ^ index.php [QSA,L]       # send everything to index.php
```

This is the same pattern used by Laravel, WordPress, and most PHP frameworks.

### 5. `JwtMiddleware.php` — Protecting Routes

This class reads the `jwt` cookie and verifies it:

```php
$token = $_COOKIE['jwt'] ?? null;  // read the cookie the browser sent

$decoded = JWT::decode($token, new Key($secret, 'HS256'));
// HS256 = HMAC-SHA256, same algorithm Spring Boot uses
```

- Cookie missing → `401 Unauthorized`
- Token expired → `401 Unauthorized`
- Signature invalid (wrong secret) → `401 Unauthorized`
- All good → controller continues ✅

The `JWT_SECRET` environment variable must match Spring Boot's exactly. This is how PHP knows it can trust the token.

### 6. `ProductController.php` — Database Query

Uses PHP's built-in `PDO` (PHP Data Objects) to query PostgreSQL:

```php
$pdo = new PDO('pgsql:host=db;port=5432;dbname=auth_db', $user, $pass);
$stmt = $pdo->query('SELECT id, name, price, category, stock, image_url FROM products');
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC); // returns array of associative arrays
echo json_encode($rows);
```

### 7. `init.sql` — Database Seeding

This SQL file creates the `products` table and inserts sample data. Docker Compose mounts it into Postgres's init folder, which runs it automatically on first startup.

```sql
CREATE TABLE IF NOT EXISTS products ( ... );
INSERT INTO products (name, price, ...) SELECT ...
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1); -- only if table is empty
```

> To re-run the seed: `docker compose down -v` then `docker compose up -d`

---

## API Endpoints

| Method | Path | Auth Required | Description |
|---|---|---|---|
| GET | `/health` | No | Check if the service is running |
| GET | `/products` | Yes (JWT cookie) | List all products |

### Example: Health Check

```bash
curl http://localhost:8081/health
# → {"status":"ok","service":"php-products-api"}
```

### Example: Get Products (with cookie)

```bash
# After logging in via Spring Boot and saving the cookie:
curl -b cookies.txt http://localhost:8081/products
```

---

## Adding a New Route

1. Add a method to `ProductController.php` (or create a new controller):

```php
public function show(): void
{
    JwtMiddleware::authenticate();
    $id = /* get from URL */;
    // query by id...
}
```

2. Register it in `routes.php`:

```php
$router->get('/products/{id}', [ProductController::class, 'show']);
```

---

## Environment Variables (set by Docker Compose)

| Variable | Purpose |
|---|---|
| `DB_HOST` | Postgres hostname (`db` inside Docker) |
| `DB_PORT` | Postgres port (5432 inside Docker) |
| `DB_NAME` | Database name |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Must match Spring Boot's secret exactly |
| `CORS_ORIGIN` | Allowed frontend origin (default: `http://localhost:3000`) |
