<?php

declare(strict_types=1);

namespace App\Core;

use App\Controllers\RideController;
use App\Middleware\JwtMiddleware;
use PDO;

class Router {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function dispatch(string $method, string $uri): void {
        $controller = new RideController($this->db);
        $user       = null;

        // Strip query string
        $path = strtok($uri, '?');

        // Public routes — no JWT needed
        if ($method === 'GET' && $path === '/rides/fare') {
            $controller->fareEstimate();
            return;
        }

        if ($method === 'GET' && $path === '/drivers/online') {
            $controller->onlineDrivers();
            return;
        }

        // All other routes require a valid JWT
        $user = JwtMiddleware::authenticate();

        match (true) {
            $method === 'POST' && $path === '/rides'
                => $controller->book($user),

            $method === 'GET' && $path === '/rides'
                => $controller->history($user),

            $method === 'PATCH' && preg_match('#^/rides/(\d+)/cancel$#', $path, $m)
                => $controller->cancel($user, (int)$m[1]),

            $method === 'GET' && preg_match('#^/rides/(\d+)/status$#', $path, $m)
                => $controller->rideStatus((int)$m[1]),

            $method === 'POST' && preg_match('#^/rides/(\d+)/location$#', $path, $m)
                => $controller->commuterLocation($user, (int)$m[1]),

            // ── Driver status & location ───────────────────────────────────
            $method === 'PATCH' && $path === '/drivers/me/status'
                => $controller->updateDriverStatus($user),

            $method === 'PATCH' && $path === '/drivers/me/location'
                => $controller->updateDriverLocation($user),

            default => $this->notFound(),
        };
    }

    private function notFound(): void {
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
    }
}