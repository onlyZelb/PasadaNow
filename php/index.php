<?php

declare(strict_types=1);

// ── CORS headers ─────────────────────────────────────────────────────────────
// Must be a specific origin (not '*') when withCredentials=true is used
$allowedOrigin = getenv('CORS_ORIGIN') ?: 'http://localhost:3000';
header("Access-Control-Allow-Origin: $allowedOrigin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle pre-flight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── Autoloader (Composer) ─────────────────────────────────────────────────────
require_once __DIR__ . '/vendor/autoload.php';

// ── Routes ───────────────────────────────────────────────────────────────────
require_once __DIR__ . '/src/routes.php';