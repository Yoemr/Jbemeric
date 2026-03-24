<?php
/**
 * config.php — JB EMERIC
 * Configuration centrale : DB, sessions, constantes
 * À placer HORS du webroot en production (ex: /var/www/config/)
 */

declare(strict_types=1);

// ── Environnement ──────────────────────────────────────────────────
define('ENV',         getenv('APP_ENV') ?: 'development'); // 'production' en prod
define('BASE_URL',    getenv('BASE_URL') ?: 'http://localhost');
define('SITE_NAME',   'JB EMERIC — Back-Office');

// ── Base de données ────────────────────────────────────────────────
define('DB_HOST',     getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT',     getenv('DB_PORT') ?: '3306');
define('DB_NAME',     getenv('DB_NAME') ?: 'jbemeric');
define('DB_USER',     getenv('DB_USER') ?: 'jbemeric_user');
define('DB_PASS',     getenv('DB_PASS') ?: '');
define('DB_CHARSET',  'utf8mb4');

// ── Sécurité sessions ──────────────────────────────────────────────
define('SESSION_LIFETIME', 7200);         // 2h
define('CSRF_TOKEN_LEN',   32);
define('BCRYPT_COST',      12);

// ── Upload CSV ─────────────────────────────────────────────────────
define('CSV_UPLOAD_DIR',   __DIR__ . '/uploads/csv/');
define('CSV_MAX_SIZE',     5 * 1024 * 1024); // 5 Mo

// ── Erreurs ────────────────────────────────────────────────────────
if (ENV === 'development') {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    error_reporting(0);
}

// ════════════════════════════════════════════════════════════════════
//  Connexion PDO (singleton)
// ════════════════════════════════════════════════════════════════════
function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
    );
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone='+01:00'",
        ]);
    } catch (PDOException $e) {
        http_response_code(503);
        die(ENV === 'development'
            ? 'Erreur DB : ' . $e->getMessage()
            : 'Service temporairement indisponible.'
        );
    }
    return $pdo;
}

// ════════════════════════════════════════════════════════════════════
//  Gestion des sessions
// ════════════════════════════════════════════════════════════════════
function session_start_secure(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => SESSION_LIFETIME,
            'path'     => '/',
            'secure'   => (ENV === 'production'),
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
        session_start();
    }
    // Régénération anti-fixation
    if (empty($_SESSION['_init'])) {
        session_regenerate_id(true);
        $_SESSION['_init'] = true;
    }
    // Timeout
    if (!empty($_SESSION['_last_activity'])
        && (time() - $_SESSION['_last_activity']) > SESSION_LIFETIME) {
        session_unset();
        session_destroy();
        session_start();
    }
    $_SESSION['_last_activity'] = time();
}

// ════════════════════════════════════════════════════════════════════
//  CSRF
// ════════════════════════════════════════════════════════════════════
function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(CSRF_TOKEN_LEN));
    }
    return $_SESSION['csrf_token'];
}

function csrf_check(): void
{
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        http_response_code(403);
        die(json_encode(['error' => 'Token CSRF invalide.']));
    }
}

// ════════════════════════════════════════════════════════════════════
//  Auth helpers
// ════════════════════════════════════════════════════════════════════
function is_logged(): bool
{
    return !empty($_SESSION['user_id']);
}

function current_user(): ?array
{
    if (!is_logged()) return null;
    static $user = null;
    if ($user !== null) return $user;
    $stmt = db()->prepare('SELECT id,nom,prenom,email,role FROM users WHERE id=?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch() ?: null;
    return $user;
}

function require_auth(string ...$roles): void
{
    session_start_secure();
    if (!is_logged()) {
        header('Location: login.php?redirect=' . urlencode($_SERVER['REQUEST_URI']));
        exit;
    }
    if (!empty($roles)) {
        $user = current_user();
        if (!$user || !in_array($user['role'], $roles, true)) {
            http_response_code(403);
            die('Accès refusé.');
        }
    }
}

// ════════════════════════════════════════════════════════════════════
//  Utilitaires
// ════════════════════════════════════════════════════════════════════
function e(string $str): string
{
    return htmlspecialchars($str, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function badge_status(string $status): string
{
    $map = [
        'Draft'     => ['class' => 'badge-draft',     'label' => 'Draft'],
        'Potential' => ['class' => 'badge-potential',  'label' => 'En attente de votes'],
        'Open'      => ['class' => 'badge-open',       'label' => 'Inscriptions ouvertes'],
        'Full'      => ['class' => 'badge-full',       'label' => 'Complet'],
        'Annulé'    => ['class' => 'badge-cancelled',  'label' => 'Annulé'],
        'en_attente'=> ['class' => 'badge-potential',  'label' => 'En attente'],
        'confirmee' => ['class' => 'badge-open',       'label' => 'Confirmée'],
        'annulee'   => ['class' => 'badge-cancelled',  'label' => 'Annulée'],
    ];
    $b = $map[$status] ?? ['class' => 'badge-draft', 'label' => $status];
    return '<span class="badge ' . $b['class'] . '">' . e($b['label']) . '</span>';
}

function redirect(string $url): never
{
    header('Location: ' . $url);
    exit;
}
