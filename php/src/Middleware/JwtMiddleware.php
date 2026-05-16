<?php

declare(strict_types=1);

namespace App\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

class JwtMiddleware
{
    public static function authenticate(): object
    {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }

        // Try Authorization: Bearer <token> header first, then fall back to cookie
        $token = null;

        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);
        }

        if (!$token) {
            $token = $_COOKIE['jwt'] ?? null;
        }

        if (!$token) {
            self::abort(401, 'No authentication token found. Please log in.');
        }

        $secret = getenv('JWT_SECRET');
        if (!$secret) {
            self::abort(500, 'JWT_SECRET not configured on server');
        }

        $keyBytes = base64_decode($secret);

        try {
            $decoded = JWT::decode($token, new Key($keyBytes, 'HS256'));
            return $decoded;

        } catch (ExpiredException) {
            self::abort(401, 'Token has expired');
        } catch (SignatureInvalidException) {
            self::abort(401, 'Token signature is invalid');
        } catch (\Exception $e) {
            self::abort(401, 'Invalid token: ' . $e->getMessage());
        }
    }

    private static function abort(int $code, string $message): never
    {
        http_response_code($code);
        echo json_encode(['error' => $message]);
        exit();
    }
}