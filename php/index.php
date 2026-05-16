<?php

declare(strict_types=1);

// ── Load Docker environment variables into getenv() ───────────────────────────
foreach ($_ENV as $key => $value) {
    putenv("$key=$value");
}

// ── CORS is handled exclusively by the API Gateway ────────────────────────────
// DO NOT add Access-Control-Allow-Origin here — the Spring Cloud Gateway
// already sets it. Adding it again causes a duplicate-header CORS error
// that browsers reject.

header('Content-Type: application/json');

// Pre-flight is handled by the gateway, but kept here as a safety net
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── Autoloader (Composer) ─────────────────────────────────────────────────────
require_once __DIR__ . '/vendor/autoload.php';

// ── Routes ───────────────────────────────────────────────────────────────────
require_once __DIR__ . '/src/routes.php';