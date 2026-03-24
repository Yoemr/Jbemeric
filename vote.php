<?php
/**
 * vote.php — JB EMERIC
 * Handler AJAX : vote, inscription, vérification doublon
 * Appelé en POST uniquement, répond en JSON
 */

declare(strict_types=1);
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['ok' => false, 'error' => 'Méthode non autorisée.']));
}

session_start_secure();
csrf_check();

$action = trim($_POST['action'] ?? '');

try {
    $pdo = db();

    switch ($action) {

        // ── VOTE pour une date Potential ─────────────────────────────
        case 'vote': {
            $event_id = (int) ($_POST['event_id'] ?? 0);
            if (!$event_id) throw new InvalidArgumentException('event_id manquant.');

            // Vérifier que l'event existe et est bien Potential
            $stmt = $pdo->prepare(
                "SELECT id, nb_votes, status FROM events WHERE id = ? AND status = 'Potential'"
            );
            $stmt->execute([$event_id]);
            $event = $stmt->fetch();
            if (!$event) throw new RuntimeException('Session introuvable ou déjà validée.');

            // Anti-doublon : par user_id si connecté, sinon par IP hashée
            $user_id = $_SESSION['user_id'] ?? null;
            $ip_hash = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '');

            // Vérifier doublon
            if ($user_id) {
                $check = $pdo->prepare(
                    'SELECT id FROM votes WHERE event_id = ? AND user_id = ?'
                );
                $check->execute([$event_id, $user_id]);
            } else {
                $check = $pdo->prepare(
                    'SELECT id FROM votes WHERE event_id = ? AND ip_hash = ?'
                );
                $check->execute([$event_id, $ip_hash]);
            }

            if ($check->fetch()) {
                echo json_encode([
                    'ok'       => false,
                    'already'  => true,
                    'error'    => 'Vous avez déjà voté pour cette date.',
                    'nb_votes' => (int) $event['nb_votes'],
                ]);
                exit;
            }

            // Insérer le vote dans une transaction
            $pdo->beginTransaction();

            $ins = $pdo->prepare(
                'INSERT INTO votes (event_id, user_id, ip_hash) VALUES (?, ?, ?)'
            );
            $ins->execute([$event_id, $user_id, $ip_hash]);

            $new_votes = (int) $event['nb_votes'] + 1;
            $pdo->prepare('UPDATE events SET nb_votes = ? WHERE id = ?')
                ->execute([$new_votes, $event_id]);

            $pdo->commit();

            // Récupérer le seuil depuis config (défaut : 5)
            $seuil = 5;

            echo json_encode([
                'ok'       => true,
                'nb_votes' => $new_votes,
                'seuil'    => $seuil,
                'pct'      => min(100, (int) round($new_votes / $seuil * 100)),
                'reached'  => $new_votes >= $seuil,
            ]);
            break;
        }

        // ── INSCRIPTION à une session Open ───────────────────────────
        case 'inscription': {
            $event_id = (int) ($_POST['event_id'] ?? 0);
            if (!$event_id) throw new InvalidArgumentException('event_id manquant.');

            // Vérifier que l'event est Open et a des places
            $stmt = $pdo->prepare(
                "SELECT id, nb_places, nb_inscrits, prix, prix_coaching, prix_location, status
                   FROM events WHERE id = ? AND status = 'Open'"
            );
            $stmt->execute([$event_id]);
            $event = $stmt->fetch();
            if (!$event) throw new RuntimeException('Session non disponible.');
            if ($event['nb_inscrits'] >= $event['nb_places']) {
                throw new RuntimeException('Cette session est complète.');
            }

            // Données pilote
            $nom    = trim($_POST['nom']    ?? '');
            $prenom = trim($_POST['prenom'] ?? '');
            $email  = trim($_POST['email']  ?? '');
            $tel    = trim($_POST['tel']    ?? '');

            if (!$nom || !$prenom || !$email) {
                throw new InvalidArgumentException('Nom, prénom et e-mail sont obligatoires.');
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException('Adresse e-mail invalide.');
            }

            // Checklist
            $checklist = [
                'assurance' => !empty($_POST['check_assurance']),
                'casque'    => !empty($_POST['check_casque']),
                'crochet'   => !empty($_POST['check_crochet']),
                'reglement' => !empty($_POST['check_reglement']),
            ];
            if (!$checklist['assurance']) {
                throw new InvalidArgumentException('L\'assurance RC est obligatoire.');
            }

            // Options
            $opt_coaching = !empty($_POST['option_coaching']) ? 1 : 0;
            $opt_location = !empty($_POST['option_location']) ? 1 : 0;
            $vehicule_perso = trim($_POST['vehicule_perso'] ?? '');

            // Calcul montant
            $montant = (float) $event['prix'];
            if ($opt_coaching && $event['prix_coaching']) {
                $montant += (float) $event['prix_coaching'];
            }
            if ($opt_location && $event['prix_location']) {
                $montant += (float) $event['prix_location'];
            }

            $pdo->beginTransaction();

            // Récupérer ou créer le user
            $user_id = $_SESSION['user_id'] ?? null;
            if (!$user_id) {
                // Chercher par email
                $stu = $pdo->prepare('SELECT id FROM users WHERE email = ?');
                $stu->execute([$email]);
                $existing = $stu->fetch();

                if ($existing) {
                    $user_id = $existing['id'];
                } else {
                    // Créer un compte client minimal
                    $hash = password_hash(bin2hex(random_bytes(8)), PASSWORD_BCRYPT);
                    $ins = $pdo->prepare(
                        'INSERT INTO users (nom, prenom, email, telephone, password, role)
                         VALUES (?, ?, ?, ?, ?, \'client\')'
                    );
                    $ins->execute([$nom, $prenom, $email, $tel, $hash]);
                    $user_id = (int) $pdo->lastInsertId();
                }
            }

            // Vérifier doublon inscription
            $chk = $pdo->prepare(
                "SELECT id FROM inscriptions WHERE event_id = ? AND user_id = ?
                  AND status NOT IN ('annulee','remboursee')"
            );
            $chk->execute([$event_id, $user_id]);
            if ($chk->fetch()) {
                $pdo->rollBack();
                throw new RuntimeException('Vous êtes déjà inscrit à cette session.');
            }

            // Insérer inscription
            $ins2 = $pdo->prepare(
                'INSERT INTO inscriptions
                 (event_id, user_id, option_coaching, option_location,
                  vehicule_perso, checklist_json, montant_total, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, \'en_attente\')'
            );
            $ins2->execute([
                $event_id, $user_id,
                $opt_coaching, $opt_location,
                $vehicule_perso,
                json_encode($checklist, JSON_UNESCAPED_UNICODE),
                $montant,
            ]);

            // Incrémenter nb_inscrits
            $pdo->prepare('UPDATE events SET nb_inscrits = nb_inscrits + 1 WHERE id = ?')
                ->execute([$event_id]);

            // Vérifier si Full
            $pdo->prepare(
                "UPDATE events SET status = 'Full'
                  WHERE id = ? AND nb_inscrits >= nb_places"
            )->execute([$event_id]);

            $pdo->commit();

            echo json_encode([
                'ok'      => true,
                'message' => 'Inscription enregistrée. JB vous contactera sous 24h.',
                'montant' => $montant,
                'ref'     => 'JBE-' . date('Y') . '-' . str_pad((string)$event_id, 4, '0', STR_PAD_LEFT),
            ]);
            break;
        }

        // ── Vérifier si déjà voté (pour pré-remplir le bouton) ───────
        case 'check_vote': {
            $event_id = (int) ($_POST['event_id'] ?? 0);
            $user_id  = $_SESSION['user_id'] ?? null;
            $ip_hash  = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '');

            if ($user_id) {
                $stmt = $pdo->prepare('SELECT id FROM votes WHERE event_id=? AND user_id=?');
                $stmt->execute([$event_id, $user_id]);
            } else {
                $stmt = $pdo->prepare('SELECT id FROM votes WHERE event_id=? AND ip_hash=?');
                $stmt->execute([$event_id, $ip_hash]);
            }
            echo json_encode(['ok' => true, 'voted' => (bool) $stmt->fetch()]);
            break;
        }

        default:
            throw new InvalidArgumentException('Action inconnue : ' . $action);
    }

} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
