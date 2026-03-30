<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Minimal router: register GET/POST routes, then dispatch.
 *
 * Usage:
 *   $router = new Router();
 *   $router->get('/products', [ProductController::class, 'index']);
 *   $router->post('/products', [ProductController::class, 'store']);
 *   $router->dispatch();
 */
class Router
{
    /** @var array<string, array<string, callable|array>> */
    private array $routes = [];

    public function get(string $path, callable|array $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, callable|array $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, callable|array $handler): void
    {
        $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, callable|array $handler): void
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute(string $method, string $path, callable|array $handler): void
    {
        $this->routes[$method][$path] = $handler;
    }

    /**
     * Match the current request and call the registered handler.
     * Sends 404 JSON if no route matches.
     */
    public function dispatch(): never
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $path   = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/') ?: '/';

        // Hand off OPTIONS pre-flight (CORS headers already sent in index.php)
        if ($method === 'OPTIONS') {
            http_response_code(200);
            exit();
        }

        $handler = $this->routes[$method][$path] ?? null;

        if ($handler === null) {
            http_response_code(404);
            echo json_encode(['error' => "Route $method $path not found"]);
            exit();
        }

        // Support both closures and [ClassName::class, 'method'] arrays
        if (is_array($handler)) {
            [$class, $methodName] = $handler;
            (new $class())->$methodName();
        } else {
            $handler();
        }

        exit();
    }
}
