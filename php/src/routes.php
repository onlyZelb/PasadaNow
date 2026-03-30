<?php

declare(strict_types=1);

use App\Core\Router;
use App\Controllers\ProductController;

$router = new Router();

// ── Public routes (no auth) ───────────────────────────────────────────────────
$router->get('/health', fn() => print json_encode([
    'status'  => 'ok',
    'service' => 'php-products-api',
]));

// ── Protected routes (JWT cookie required) ────────────────────────────────────
$router->get('/products', [ProductController::class, 'index']);

// Add more routes here, for example:
// $router->post('/products',       [ProductController::class, 'store']);
// $router->get('/products/{id}',   [ProductController::class, 'show']);
// $router->delete('/products/{id}',[ProductController::class, 'destroy']);
// $router->get('/orders',          [OrderController::class,   'index']);

// ── Dispatch ──────────────────────────────────────────────────────────────────
$router->dispatch();
