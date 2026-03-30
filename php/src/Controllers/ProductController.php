<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Middleware\JwtMiddleware;
use PDO;
use PDOException;

class ProductController
{
    // ── GET /products ────────────────────────────────────────────────────────
    public function index(): void
    {
        JwtMiddleware::authenticate();

        try {
            $pdo  = $this->db();
            $stmt = $pdo->query(
                'SELECT id, name, price, category, stock, image_url FROM products ORDER BY id'
            );
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $this->json($rows);
        } catch (PDOException $e) {
            $this->json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    // ── GET /products/:id  (example — add route in routes.php to enable) ────
    // public function show(): void { ... }

    // ── POST /products ───────────────────────────────────────────────────────
    // public function store(): void { ... }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function db(): PDO
    {
        return new PDO(
            sprintf(
                'pgsql:host=%s;port=%s;dbname=%s',
                getenv('DB_HOST') ?: 'localhost',
                getenv('DB_PORT') ?: '5432',
                getenv('DB_NAME') ?: 'auth_db'
            ),
            getenv('DB_USER')     ?: 'postgres',
            getenv('DB_PASSWORD') ?: 'secret',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    }

    private function json(mixed $data, int $code = 200): void
    {
        http_response_code($code);
        echo json_encode($data);
    }
}
