<?php

declare(strict_types=1);

namespace App\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

class JwtMiddleware
{
    /**
     * Validate the JWT from the HttpOnly 'jwt' cookie set by Spring Boot.
     * Returns the decoded payload on success, or sends a 401 JSON and exits.
     */
    public static function authenticate(): object
    {
        // Let pre-flight pass through
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }

        // Read from the same HttpOnly cookie that Spring Boot sets on login
        $token = $_COOKIE['jwt'] ?? null;

        if (!$token) {
            self::abort(401, 'No authentication cookie found. Please log in.');
        }

        $secret = getenv('JWT_SECRET');
        if (!$secret) {
            self::abort(500, 'JWT_SECRET not configured on server');
        }

        // Spring Boot Base64-decodes the secret before signing,
        // so PHP must do the same to use the same raw key bytes.
        $keyBytes = base64_decode($secret);

        try {
            // SB signs tokens with HMAC-SHA256
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
