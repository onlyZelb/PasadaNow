<?php

namespace App\Controllers;

use PDO;

class RideController
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function book(object $user): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $commuterId = $this->getCommuterId($user->sub);

        // ── FIX: use the fare/distance sent by the Flutter app ────────────
        $distanceKm = isset($data['distance_km']) ? (float) $data['distance_km'] : 0.0;
        $fare = ($distanceKm > 0)
            ? $this->computeFare($distanceKm)
            : (float) ($data['fare'] ?? 25.50);
        // ─────────────────────────────────────────────────────────────────

        // ── resolve driver_id from the request ────────────────────────────
        $driverId = null;
        if (!empty($data['driver_id'])) {
            $driverId = (int) $data['driver_id'];
        }
        // ─────────────────────────────────────────────────────────────────

        $stmt = $this->db->prepare("
            INSERT INTO rides (commuter_id, driver_id, pickup_location, destination, fare, distance_km, status)
            VALUES (:commuter_id, :driver_id, :pickup, :destination, :fare, :distance_km, 'pending')
            RETURNING id, commuter_id, driver_id, pickup_location, destination, fare, distance_km, status, created_at
        ");

        $stmt->execute([
            'commuter_id' => $commuterId,
            'driver_id'   => $driverId,
            'pickup'      => $data['pickup_location'],
            'destination' => $data['destination'],
            'fare'        => $fare,
            'distance_km' => $distanceKm,
        ]);

        $ride = $stmt->fetch(PDO::FETCH_ASSOC);
        http_response_code(201);
        echo json_encode($ride);
    }

    public function history(object $user): void
    {
        $commuterId = $this->getCommuterId($user->sub);

        $stmt = $this->db->prepare("
            SELECT r.*, d.username AS driver_username
            FROM rides r
            LEFT JOIN drivers d ON d.id = r.driver_id
            WHERE r.commuter_id = :commuter_id
            ORDER BY r.created_at DESC
        ");
        $stmt->execute(['commuter_id' => $commuterId]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function cancel(object $user, int $id): void
    {
        $commuterId = $this->getCommuterId($user->sub);

        $stmt = $this->db->prepare("
            UPDATE rides SET status = 'cancelled'
            WHERE id = :id AND commuter_id = :commuter_id AND status = 'pending'
            RETURNING *
        ");
        $stmt->execute(['id' => $id, 'commuter_id' => $commuterId]);
        $ride = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$ride) {
            http_response_code(404);
            echo json_encode(['error' => 'Ride not found or cannot be cancelled']);
            return;
        }
        echo json_encode($ride);
    }

    public function fareEstimate(): void
    {
        $distanceKm = isset($_GET['distance_km']) ? (float) $_GET['distance_km'] : 0.0;
        $fare       = $this->computeFare($distanceKm);
        echo json_encode(['fare' => $fare]);
    }

    // GET /drivers/online — commuter sees available drivers
    public function onlineDrivers(): void
    {
        $stmt = $this->db->prepare("
            SELECT id, username AS name, plate_no AS plate_number,
                   'Tricycle' AS vehicle_type, is_online
            FROM drivers
            WHERE is_online = true AND verified_status = 'verified'
        ");
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // GET /rides/{id}/status — commuter polls ride status
    public function rideStatus(int $id): void
    {
        $stmt = $this->db->prepare("
            SELECT r.*, d.username AS driver_name,
                   d.plate_no AS driver_plate
            FROM rides r
            LEFT JOIN drivers d ON d.id = r.driver_id
            WHERE r.id = :id
        ");
        $stmt->execute(['id' => $id]);
        $ride = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$ride) {
            http_response_code(404);
            echo json_encode(['error' => 'Ride not found']);
            return;
        }
        echo json_encode($ride);
    }

    // POST /rides/{id}/location — commuter pushes GPS to backend
    public function commuterLocation(object $user, int $id): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $stmt = $this->db->prepare("
            UPDATE rides
            SET commuter_lat = :lat, commuter_lng = :lng,
                updated_at = NOW()
            WHERE id = :id
            RETURNING id, commuter_lat, commuter_lng
        ");
        $stmt->execute([
            'lat' => $data['lat'],
            'lng' => $data['lng'],
            'id'  => $id,
        ]);
        echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
    }

    // PATCH /drivers/me/status — driver toggles online/offline
    public function updateDriverStatus(object $user): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $isOnline = isset($data['is_online']) ? (bool) $data['is_online'] : false;

        $stmt = $this->db->prepare("
            UPDATE drivers
            SET is_online  = :is_online,
                last_lat   = :lat,
                last_lng   = :lng,
                updated_at = NOW()
            WHERE username = :username
            RETURNING id, username, is_online, last_lat, last_lng
        ");

        $stmt->execute([
            'is_online' => $isOnline ? 'true' : 'false',
            'lat'       => $data['lat'] ?? null,
            'lng'       => $data['lng'] ?? null,
            'username'  => $user->sub,
        ]);

        $driver = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$driver) {
            http_response_code(404);
            echo json_encode(['error' => 'Driver not found']);
            return;
        }

        echo json_encode($driver);
    }

    // PATCH /drivers/me/location — driver pushes live GPS while online
    public function updateDriverLocation(object $user): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $stmt = $this->db->prepare("
            UPDATE drivers
            SET last_lat   = :lat,
                last_lng   = :lng,
                updated_at = NOW()
            WHERE username = :username AND is_online = true
            RETURNING id, username, last_lat, last_lng
        ");

        $stmt->execute([
            'lat'      => $data['lat'] ?? null,
            'lng'      => $data['lng'] ?? null,
            'username' => $user->sub,
        ]);

        $driver = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$driver) {
            http_response_code(404);
            echo json_encode(['error' => 'Driver not found or currently offline']);
            return;
        }

        echo json_encode($driver);
    }

    private function getCommuterId(string $username): int
    {
        $stmt = $this->db->prepare("
            SELECT id FROM commuters WHERE username = :username
        ");
        $stmt->execute(['username' => $username]);
        $commuter = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$commuter) {
            http_response_code(403);
            echo json_encode(['error' => 'Only commuters can book rides']);
            exit();
        }

        return (int) $commuter['id'];
    }

    // ── Fetch live fare config from Django ────────────────────────────────────
    private function fetchFareConfig(): array
    {
        $djangoUrl = $_ENV['DJANGO_URL'] ?? 'http://django:8000';

        $ctx = stream_context_create([
            'http' => [
                'timeout' => 3,
                'method'  => 'GET',
                'header'  => "Accept: application/json\r\n",
            ]
        ]);

        $json = @file_get_contents("{$djangoUrl}/api/fare-config", false, $ctx);

        if ($json === false) {
            error_log("[RideController] Could not reach Django fare-config, using defaults.");
            return [];
        }

        return json_decode($json, true) ?? [];
    }

    // ── Compute fare using Django config ──────────────────────────────────────
    private function computeFare(float $distanceKm): float
    {
        $config = $this->fetchFareConfig();

        $baseFare        = (float) ($config['base_fare']        ?? 40.0);
        $perKmRate       = (float) ($config['per_km_rate']       ?? 10.0);
        $minimumFare     = (float) ($config['minimum_fare']      ?? 40.0);
        $bookingFee      = (float) ($config['booking_fee']       ?? 0.0);
        $surgeMultiplier = (float) ($config['surge_multiplier']  ?? 1.0);
        $surgeActive     = (bool)  ($config['surge_active']      ?? false);

        $multiplier = $surgeActive ? $surgeMultiplier : 1.0;

        $fare = max(
            $minimumFare,
            ($baseFare + $perKmRate * $distanceKm) * $multiplier
        ) + $bookingFee;

        return round($fare, 2);
    }
}