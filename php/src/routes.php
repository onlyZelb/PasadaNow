<?php

declare(strict_types=1);

use App\Core\Router;

$db = new PDO(
    sprintf('pgsql:host=%s;port=%s;dbname=%s',
        getenv('DB_HOST'), getenv('DB_PORT'), getenv('DB_NAME')),
    getenv('DB_USER'),
    getenv('DB_PASSWORD'),
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$router = new Router($db);
$router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);