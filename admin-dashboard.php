<?php
/**
 * admin-dashboard.php — JB EMERIC
 * Tableau de bord Back-Office — Admin + Modérateur
 */

declare(strict_types=1);
require_once __DIR__ . '/config.php';

require_auth('admin', 'moderateur');

$user = current_user();
$role = $user['role'];

// ════════════════════════════════════════════════════════════════════
//  Actions POST (AJAX-friendly : répondent en JSON)
// ════════════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    csrf_check();

    $action = $_POST['action'] ?? '';

    try {
        switch ($action) {

            // Basculer statut event (Potential → Open, etc.)
            case 'set_status':
                $id     = (int) ($_POST['event_id'] ?? 0);
                $status = $_POST['status'] ?? '';
                $allowed = ['Draft','Potential','Open','Full','Annulé'];
                if (!$id || !in_array($status, $allowed, true)) {
                    throw new InvalidArgumentException('Paramètres invalides.');
                }
                db()->prepare('UPDATE events SET status=?, updated_at=NOW() WHERE id=?')
                   ->execute([$status, $id]);
                echo json_encode(['ok' => true, 'status' => $status]);
                exit;

            // Toggle visibilité site
            case 'toggle_visible':
                $id  = (int) ($_POST['event_id'] ?? 0);
                $vis = (int) ($_POST['visible']   ?? 0);
                db()->prepare('UPDATE events SET visible_site=? WHERE id=?')
                   ->execute([$vis ? 1 : 0, $id]);
                echo json_encode(['ok' => true]);
                exit;

            // Supprimer event (admin uniquement)
            case 'delete_event':
                if ($role !== 'admin') throw new RuntimeException('Accès refusé.');
                $id = (int) ($_POST['event_id'] ?? 0);
                db()->prepare('DELETE FROM events WHERE id=?')->execute([$id]);
                echo json_encode(['ok' => true]);
                exit;

            // Import CSV clients
            case 'import_csv':
                if (empty($_FILES['csv_file'])) {
                    throw new RuntimeException('Aucun fichier reçu.');
                }
                $file = $_FILES['csv_file'];
                if ($file['error'] !== UPLOAD_ERR_OK) {
                    throw new RuntimeException('Erreur upload : ' . $file['error']);
                }
                if ($file['size'] > CSV_MAX_SIZE) {
                    throw new RuntimeException('Fichier trop volumineux (max 5 Mo).');
                }
                $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
                if (!in_array($ext, ['csv','txt'], true)) {
                    throw new RuntimeException('Format accepté : .csv ou .txt');
                }

                if (!is_dir(CSV_UPLOAD_DIR)) mkdir(CSV_UPLOAD_DIR, 0750, true);
                $dest = CSV_UPLOAD_DIR . uniqid('import_', true) . '.csv';
                move_uploaded_file($file['tmp_name'], $dest);

                // Traitement CSV
                $handle  = fopen($dest, 'r');
                $headers = fgetcsv($handle, 0, ';') ?: fgetcsv($handle, 0, ',');
                $headers = array_map('strtolower', array_map('trim', $headers));

                $ok = $errors = 0;
                $log = [];
                $pdo = db();
                $stmt = $pdo->prepare(
                    'INSERT IGNORE INTO users (nom,prenom,email,password,role,telephone)
                     VALUES (?,?,?,?,\'client\',?)'
                );

                while (($row = fgetcsv($handle, 0, ';')) !== false) {
                    if (count($row) < 2) continue;
                    $map = array_combine($headers, $row);
                    $email = trim($map['email'] ?? $map['mail'] ?? '');
                    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        $errors++;
                        $log[] = "Email invalide : $email";
                        continue;
                    }
                    $nom    = trim($map['nom']    ?? $map['lastname']  ?? '');
                    $prenom = trim($map['prenom'] ?? $map['firstname'] ?? '');
                    $tel    = trim($map['tel']    ?? $map['telephone'] ?? '');
                    $hash   = password_hash(bin2hex(random_bytes(8)), PASSWORD_BCRYPT);
                    try {
                        $stmt->execute([$nom, $prenom, $email, $hash, $tel]);
                        $ok++;
                    } catch (PDOException $e) {
                        $errors++;
                        $log[] = "Doublon ignoré : $email";
                    }
                }
                fclose($handle);

                // Enregistrer l'import
                $pdo->prepare(
                    'INSERT INTO imports_csv (filename,nb_lignes,nb_ok,nb_erreurs,log_json,imported_by)
                     VALUES (?,?,?,?,?,?)'
                )->execute([
                    $file['name'],
                    $ok + $errors,
                    $ok,
                    $errors,
                    json_encode($log),
                    $user['id'],
                ]);

                echo json_encode(['ok' => true, 'imported' => $ok, 'errors' => $errors, 'log' => $log]);
                exit;


            // ── Ajouter un event depuis la veille (Potential) ──────────────
            case 'add_veille':
                if ($role !== 'admin') throw new RuntimeException('Accès refusé.');
                $circuit_id = (int)  ($_POST['circuit_id']  ?? 0);
                $date       = trim(  $_POST['date_event']   ?? '');
                $type       = trim(  $_POST['type']         ?? 'Track-Day');
                $prix       = (float)($_POST['prix']        ?? 0);
                $source     = trim(  $_POST['source']       ?? '');
                if (!$circuit_id || !$date) throw new InvalidArgumentException('Données manquantes.');
                $stmt = db()->prepare(
                    "INSERT INTO events
                     (circuit_id, date_event, type, status, prix, visible_site, source_veille, created_by)
                     VALUES (?, ?, ?, 'Potential', ?, 0, ?, ?)"
                );
                $stmt->execute([$circuit_id, $date, $type, $prix, $source, $user['id']]);
                $new_id = db()->lastInsertId();
                echo json_encode(['ok' => true, 'event_id' => $new_id]);
                exit;

            // ── Gestion véhicule ───────────────────────────────────────────
            case 'add_vehicule':
                if ($role !== 'admin') throw new RuntimeException('Accès refusé.');
                $fields = ['nom','marque','modele','propriete','type_vehicule','boite','concessionnaire'];
                $vals   = [];
                foreach ($fields as $f) $vals[$f] = trim($_POST[$f] ?? '');
                $puissance = (int)($_POST['puissance_ch'] ?? 0);
                if (!$vals['nom'] || !$vals['marque']) throw new InvalidArgumentException('Nom et marque requis.');
                db()->prepare(
                    "INSERT INTO vehicules
                     (nom,marque,modele,propriete,type_vehicule,puissance_ch,boite,concessionnaire,visible_site)
                     VALUES(?,?,?,?,?,?,?,?,1)"
                )->execute(array_merge(array_values($vals), [$puissance]));
                echo json_encode(['ok' => true]);
                exit;

            case 'update_vehicule':
                if ($role !== 'admin') throw new RuntimeException('Accès refusé.');
                $id = (int)($_POST['vehicule_id'] ?? 0);
                if (!$id) throw new InvalidArgumentException('ID manquant.');
                db()->prepare(
                    "UPDATE vehicules SET nom=?,marque=?,modele=?,propriete=?,
                     type_vehicule=?,puissance_ch=?,boite=?,concessionnaire=?,
                     contact_concess=?,visible_site=? WHERE id=?"
                )->execute([
                    $_POST['nom']??'', $_POST['marque']??'', $_POST['modele']??'',
                    $_POST['propriete']??'jb_emeric', $_POST['type_vehicule']??'Tourisme',
                    (int)($_POST['puissance_ch']??0), $_POST['boite']??'Manuelle',
                    $_POST['concessionnaire']??'', $_POST['contact_concess']??'',
                    (int)($_POST['visible_site']??1), $id
                ]);
                echo json_encode(['ok' => true]);
                exit;

            case 'delete_vehicule':
                if ($role !== 'admin') throw new RuntimeException('Accès refusé.');
                $id = (int)($_POST['vehicule_id'] ?? 0);
                db()->prepare('DELETE FROM vehicules WHERE id=?')->execute([$id]);
                echo json_encode(['ok' => true]);
                exit;

            case 'lier_vehicule':
                $event_id   = (int)($_POST['event_id']   ?? 0);
                $vehicule_id= (int)($_POST['vehicule_id'] ?? 0);
                db()->prepare('UPDATE events SET vehicule_id=? WHERE id=?')
                   ->execute([$vehicule_id ?: null, $event_id]);
                echo json_encode(['ok' => true]);
                exit;

            default:
                throw new InvalidArgumentException('Action inconnue.');
        }
    } catch (Throwable $e) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

// ════════════════════════════════════════════════════════════════════
//  Données pour la vue
// ════════════════════════════════════════════════════════════════════
$pdo = db();

// KPIs
$kpis = [
    'open'   => (int) $pdo->query("SELECT COUNT(*) FROM events WHERE status='Open'")->fetchColumn(),
    'votes'  => (int) $pdo->query("SELECT COUNT(*) FROM events WHERE status='Potential'")->fetchColumn(),
    'inscrits'=> (int) $pdo->query("SELECT SUM(nb_inscrits) FROM events WHERE status='Open'")->fetchColumn(),
    'full'   => (int) $pdo->query("SELECT COUNT(*) FROM events WHERE status='Full'")->fetchColumn(),
    'users'  => (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role='client'")->fetchColumn(),
];

// Sessions Potential triées par votes (vue Modérateur)
$potential = $pdo->query(
    "SELECT e.*, c.nom AS circuit_nom, c.region
       FROM events e
       JOIN circuits c ON c.id = e.circuit_id
      WHERE e.status = 'Potential'
      ORDER BY e.nb_votes DESC, e.date_event ASC
      LIMIT 20"
)->fetchAll();

// Toutes les dates à venir
$upcoming = $pdo->query(
    "SELECT e.*, c.nom AS circuit_nom, c.region
       FROM events e
       JOIN circuits c ON c.id = e.circuit_id
      WHERE e.date_event >= CURDATE()
      ORDER BY e.date_event ASC
      LIMIT 30"
)->fetchAll();

// Liste utilisateurs (admin uniquement)
$users_list = [];
if ($role === 'admin') {
    $users_list = $pdo->query(
        "SELECT id,prenom,nom,email,role,niveau,created_at
           FROM users ORDER BY created_at DESC LIMIT 50"
    )->fetchAll();
}

// Imports récents
$imports = $pdo->query(
    "SELECT i.*, u.prenom, u.nom AS unom
       FROM imports_csv i
  LEFT JOIN users u ON u.id = i.imported_by
      ORDER BY i.created_at DESC LIMIT 5"
)->fetchAll();


// ── Circuits (pour le sélecteur veille) ──────────────────────────
$circuits = $pdo->query(
    "SELECT id, nom, region FROM circuits WHERE actif=1 ORDER BY priorite, nom"
)->fetchAll();

// ── Véhicules (pour la flotte) ────────────────────────────────────
$vehicules = $pdo->query(
    "SELECT v.*, 
            (SELECT COUNT(*) FROM events e WHERE e.vehicule_id=v.id AND e.status='Open') AS sessions_actives
       FROM vehicules v ORDER BY v.propriete, v.nom"
)->fetchAll();

// ── Veille simulée (sources statiques — à remplacer par vrai scraper) ─
$veille_sources = [
    ['circuit_id'=>2, 'nom'=>'Paul Ricard HTTT',    'region'=>'PACA',      'date'=>date('Y-m-d',strtotime('+18 days')), 'type'=>'Track-Day',     'prix'=>320, 'source'=>'circuitpaulricard.com',  'org'=>'HTTT'],
    ['circuit_id'=>1, 'nom'=>'Grand Sambuc',         'region'=>'PACA',      'date'=>date('Y-m-d',strtotime('+32 days')), 'type'=>'Stage GT',       'prix'=>195, 'source'=>'circuitgrandsambuc.fr',  'org'=>'Orga PACA'],
    ['circuit_id'=>4, 'nom'=>'Cuges-les-Pins',       'region'=>'PACA',      'date'=>date('Y-m-d',strtotime('+45 days')), 'type'=>'Stage Tourisme', 'prix'=>210, 'source'=>'circuit-cuges.fr',        'org'=>'Club 13'],
    ['circuit_id'=>6, 'nom'=>'Lédenon',              'region'=>'Occitanie', 'date'=>date('Y-m-d',strtotime('+52 days')), 'type'=>'Stage GT',       'prix'=>245, 'source'=>'ledenon.com',             'org'=>'Lédenon Events'],
    ['circuit_id'=>7, 'nom'=>'Nogaro',               'region'=>'Occitanie', 'date'=>date('Y-m-d',strtotime('+60 days')), 'type'=>'Track-Day',      'prix'=>310, 'source'=>'circuitdenogaro.fr',      'org'=>'ASACA'],
    ['circuit_id'=>8, 'nom'=>'Albi',                 'region'=>'Occitanie', 'date'=>date('Y-m-d',strtotime('+75 days')), 'type'=>'Stage Monoplace','prix'=>340, 'source'=>'circuit-albi.fr',         'org'=>'Albi Track'],
    ['circuit_id'=>6, 'nom'=>'Dijon-Prenois',        'region'=>'Autre France','date'=>date('Y-m-d',strtotime('+88 days')),'type'=>'Stage GT',      'prix'=>380, 'source'=>'circuit-dijon.fr',        'org'=>'Dijon Events'],
];
// Exclure les dates déjà en DB
$existing_dates = $pdo->query(
    "SELECT CONCAT(circuit_id,'_',date_event) AS key_ev FROM events WHERE status != 'Annulé'"
)->fetchAll(PDO::FETCH_COLUMN);
$veille_sources = array_filter($veille_sources, function($v) use ($existing_dates) {
    return !in_array($v['circuit_id'].'_'.$v['date'], $existing_dates, true);
});
$veille_sources = array_values($veille_sources);

// ── Stats dataviz ─────────────────────────────────────────────────
$top3_circuits = $pdo->query(
    "SELECT c.nom, c.region, COALESCE(SUM(e.nb_votes),0) AS total_votes
       FROM circuits c
  LEFT JOIN events e ON e.circuit_id=c.id AND e.status IN ('Potential','Open','Full')
      GROUP BY c.id ORDER BY total_votes DESC LIMIT 3"
)->fetchAll();

$fill_sessions = $pdo->query(
    "SELECT c.nom AS circuit_nom, e.date_event, e.nb_inscrits, e.nb_places,
            ROUND(e.nb_inscrits/GREATEST(e.nb_places,1)*100) AS pct, e.status
       FROM events e JOIN circuits c ON c.id=e.circuit_id
      WHERE e.status IN ('Open','Full') AND e.visible_site=1
      ORDER BY e.date_event ASC LIMIT 6"
)->fetchAll();

$monthly_ins = $pdo->query(
    "SELECT DATE_FORMAT(created_at,'%b') AS mois, COUNT(*) AS nb
       FROM inscriptions WHERE created_at >= DATE_SUB(NOW(),INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY DATE_FORMAT(created_at,'%Y-%m') ASC"
)->fetchAll();

// ── LOGOUT ────────────────────────────────────────────────────────
if (isset($_GET['logout'])) {
    session_unset(); session_destroy();
    redirect('login.php');
}
?>

// ── Véhicules ───────────────────────────────────────────────────────────────
$vehicules_list = $pdo->query(
    "SELECT v.*, e.id AS event_linked, e.date_event, c.nom AS circuit_linked
       FROM vehicules v
  LEFT JOIN events e ON e.vehicule_id = v.id AND e.date_event >= CURDATE()
  LEFT JOIN circuits c ON c.id = e.circuit_id
      ORDER BY v.propriete, v.nom"
)->fetchAll();

// ── Circuits pour le select veille ──────────────────────────────────────────
$circuits_list = $pdo->query(
    "SELECT id, nom, region FROM circuits WHERE actif=1 ORDER BY priorite, nom"
)->fetchAll();

// ── Data viz ────────────────────────────────────────────────────────────────
$top_circuits = $pdo->query(
    "SELECT c.nom, c.region, SUM(e.nb_votes) AS total_votes
       FROM events e
       JOIN circuits c ON c.id = e.circuit_id
      WHERE e.status IN ('Potential','Open')
      GROUP BY c.id
      ORDER BY total_votes DESC
      LIMIT 5"
)->fetchAll();

$fill_stats = $pdo->query(
    "SELECT e.id, e.date_event, e.nb_inscrits, e.nb_places, c.nom AS circuit_nom
       FROM events e
       JOIN circuits c ON c.id = e.circuit_id
      WHERE e.status = 'Open' AND e.visible_site = 1
        AND e.date_event >= CURDATE()
      ORDER BY e.date_event ASC
      LIMIT 6"
)->fetchAll();

// ── Données veille simulées (en prod : remplacer par vrai scraper/cron) ──────
$veille_data = [
    ['day'=>'12','mo'=>'Avr','date'=>'2026-04-12','circuit_id'=>1,'circuit'=>'Circuit du Grand Sambuc','region'=>'PACA','type'=>'Track-Day','prix'=>195,'source'=>'circuitgrandsambuc.fr','org'=>'Orga PACA Auto'],
    ['day'=>'26','mo'=>'Avr','date'=>'2026-04-26','circuit_id'=>2,'circuit'=>'Paul Ricard — Track Day Series','region'=>'PACA','type'=>'Stage GT','prix'=>320,'source'=>'circuitpaulricard.com','org'=>'HTTT'],
    ['day'=>'03','mo'=>'Mai','date'=>'2026-05-03','circuit_id'=>5,'circuit'=>'Circuit du Luc','region'=>'PACA','type'=>'Stage Tourisme','prix'=>210,'source'=>'circuitlenet.fr','org'=>'ASA Var'],
    ['day'=>'17','mo'=>'Mai','date'=>'2026-05-17','circuit_id'=>6,'circuit'=>'Circuit de Lédenon','region'=>'Occitanie','type'=>'Stage Tourisme','prix'=>230,'source'=>'ledenon.com','org'=>'Lédenon Events'],
    ['day'=>'31','mo'=>'Mai','date'=>'2026-05-31','circuit_id'=>7,'circuit'=>'Circuit de Nogaro','region'=>'Occitanie','type'=>'Stage GT','prix'=>310,'source'=>'circuitdenogaro.fr','org'=>'ASACA'],
    ['day'=>'14','mo'=>'Juin','date'=>'2026-06-14','circuit_id'=>8,'circuit'=>'Circuit d\'Albi','region'=>'Occitanie','type'=>'Stage Coaching','prix'=>290,'source'=>'circuit-albi.fr','org'=>'Albi Track Days'],
    ['day'=>'28','mo'=>'Juin','date'=>'2026-06-28','circuit_id'=>3,'circuit'=>'Circuit de Brignoles','region'=>'PACA','type'=>'Track-Day','prix'=>195,'source'=>'circuit-brignoles.fr','org'=>'Club 83 Sport'],
];

<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Back-Office — JB EMERIC</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
/* ── Variables ── */
:root {
  --Y:#FFCF00; --Yd:#C8A000; --B2:#0A3D91; --B4:#1252C0;
  --BN:#040a1e; --NK:#08080f;
  --bg:#07080f; --card:#0d1120; --card2:#111827;
  --border:rgba(255,255,255,.07); --border-y:rgba(255,207,0,.18);
  --text:rgba(255,255,255,.92); --sec:rgba(255,255,255,.45);
  --muted:rgba(255,255,255,.22);
  --s-open:#22c55e; --s-full:#ef4444;
  --s-potential:#6366f1; --s-draft:#94a3b8;
  --sidebar-w:220px;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;-webkit-font-smoothing:antialiased}

/* ── Sidebar ── */
.sidebar{width:var(--sidebar-w);background:var(--NK);border-right:1px solid var(--border);position:fixed;top:0;bottom:0;left:0;z-index:100;overflow-y:auto;display:flex;flex-direction:column}
.sb-logo{padding:18px 16px 14px;border-bottom:1px solid var(--border)}
.sb-logo-text{font-family:'Bebas Neue';font-size:22px;letter-spacing:2px;color:#fff}
.sb-logo-text em{font-style:normal;background:linear-gradient(135deg,#F5D061,#C8860A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sb-role{font-family:'DM Mono';font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-top:3px}
.sb-role strong{color:var(--Y)}
.sb-user{padding:10px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
.sb-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#F5D061,#C8860A);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue';font-size:12px;color:#000;flex-shrink:0}
.sb-un{font-size:12px;font-weight:600;color:var(--text)}
.sb-ur{font-family:'DM Mono';font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--Y)}
.sb-nav{flex:1;padding:8px 0}
.sb-sec{font-family:'DM Mono';font-size:7px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);padding:12px 16px 5px}
.sb-link{display:flex;align-items:center;gap:9px;padding:8px 16px;font-size:12px;font-weight:500;color:var(--sec);text-decoration:none;border-left:2px solid transparent;transition:all .15s;cursor:pointer;background:none;border-right:none;border-top:none;border-bottom:none;width:100%;text-align:left}
.sb-link:hover{color:var(--text);background:rgba(255,255,255,.04)}
.sb-link.active{color:var(--Y);background:rgba(255,207,0,.06);border-left-color:var(--Y)}
.sb-link svg{width:15px;height:15px;fill:currentColor;opacity:.6;flex-shrink:0}
.sb-link.active svg{opacity:1}
.sb-badge{margin-left:auto;background:var(--s-open);color:#000;font-family:'DM Mono';font-size:8px;font-weight:700;padding:2px 6px;border-radius:10px}
.sb-logout{color:var(--s-full) !important;margin-top:8px}

/* ── Main ── */
.main{margin-left:var(--sidebar-w);flex:1;display:flex;flex-direction:column;min-height:100vh}
.topbar{background:rgba(13,17,32,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 24px;height:50px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;gap:12px}
.tb-title{font-family:'DM Mono';font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)}
.tb-title strong{color:var(--text);font-size:11px}
.tb-actions{display:flex;align-items:center;gap:8px}
.content{padding:20px 24px;display:flex;flex-direction:column;gap:20px}

/* ── KPIs ── */
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.kpi{background:var(--card);border:1px solid var(--border);border-radius:6px;padding:14px 16px;position:relative;overflow:hidden;transition:border-color .2s}
.kpi:hover{border-color:rgba(255,207,0,.18)}
.kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--kpi-c,linear-gradient(90deg,#F5D061,#C8860A))}
.kpi-lbl{font-family:'DM Mono';font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--muted)}
.kpi-val{font-family:'Bebas Neue';font-size:30px;line-height:1.1;letter-spacing:-1px;color:var(--text)}
.kpi-sub{font-size:10px;color:var(--muted);margin-top:2px}
.up{color:var(--s-open)} .dn{color:var(--s-full)}

/* ── Cards ── */
.card{background:var(--card);border:1px solid var(--border);border-radius:6px;overflow:hidden}
.card-head{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px}
.card-title{font-family:'DM Mono';font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--text);font-weight:600;display:flex;align-items:center;gap:8px}
.ctd{width:6px;height:6px;border-radius:50%;background:var(--Y);flex-shrink:0}
.card-acts{display:flex;gap:6px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
.grid3{display:grid;grid-template-columns:2fr 1fr;gap:16px;align-items:start}
@media(max-width:900px){.grid2,.grid3{grid-template-columns:1fr}}

/* ── Tableau ── */
.tw{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12px}
thead tr{background:rgba(255,255,255,.03);border-bottom:1px solid var(--border)}
th{padding:9px 14px;font-family:'DM Mono';font-size:7.5px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);text-align:left;white-space:nowrap}
td{padding:10px 14px;color:var(--sec);border-bottom:1px solid rgba(255,255,255,.04);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(255,255,255,.02);color:var(--text)}
.td-m{color:var(--text);font-weight:500}
.td-mono{font-family:'DM Mono';font-size:11px;letter-spacing:.5px}
.td-acts{display:flex;gap:4px;align-items:center}

/* ── Badges ── */
.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:10px;font-family:'DM Mono';font-size:7px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600}
.badge::before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.8;flex-shrink:0}
.badge-open{background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.22)}
.badge-open::before{animation:bp 1.4s infinite}
@keyframes bp{0%,100%{opacity:.8}50%{opacity:.2}}
.badge-potential{background:rgba(99,102,241,.12);color:#818cf8;border:1px solid rgba(99,102,241,.25)}
.badge-full{background:rgba(239,68,68,.1);color:#f87171;border:1px solid rgba(239,68,68,.22)}
.badge-draft{background:rgba(148,163,184,.08);color:#94a3b8;border:1px solid rgba(148,163,184,.18)}
.badge-cancelled{background:rgba(239,68,68,.06);color:#fca5a5;border:1px solid rgba(239,68,68,.15)}
.badge-admin{background:rgba(245,208,97,.1);color:rgba(245,208,97,.9);border:1px solid rgba(245,208,97,.2)}
.badge-mod{background:rgba(18,82,192,.12);color:#60a5fa;border:1px solid rgba(18,82,192,.25)}

/* ── Boutons ── */
.btn{padding:5px 11px;font-family:'DM Mono';font-size:8px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;border-radius:4px;border:none;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:5px;text-decoration:none}
.btn-primary{background:linear-gradient(135deg,#F5D061,#C8860A);color:#000}
.btn-primary:hover{filter:brightness(1.08)}
.btn-ok{background:rgba(34,197,94,.12);color:#22c55e;border:1px solid rgba(34,197,94,.25)}
.btn-ok:hover{background:rgba(34,197,94,.22)}
.btn-ghost{background:rgba(255,255,255,.06);color:var(--sec);border:1px solid var(--border)}
.btn-ghost:hover{background:rgba(255,255,255,.1);color:var(--text)}
.btn-danger{background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.2)}
.btn-danger:hover{background:rgba(239,68,68,.18)}
.btn-sm{padding:4px 9px;font-size:7px}

/* ── Toggle ── */
.tog{width:28px;height:16px;border-radius:8px;background:rgba(255,255,255,.1);position:relative;cursor:pointer;transition:background .2s;flex-shrink:0}
.tog.on{background:var(--B4)}
.tog::after{content:'';position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.tog.on::after{transform:translateX(12px)}

/* ── Votes progress ── */
.vb-wrap{display:flex;align-items:center;gap:6px;min-width:90px}
.vb{flex:1;height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}
.vb-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#6366f1,#818cf8)}
.vc{font-family:'DM Mono';font-size:9px;color:var(--muted)}

/* ── Log ── */
.log-item{display:flex;align-items:flex-start;gap:10px;padding:9px 16px;border-bottom:1px solid rgba(255,255,255,.04)}
.log-item:last-child{border-bottom:none}
.log-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:4px}
.log-txt{flex:1;font-size:11px;color:var(--sec);line-height:1.5}
.log-txt strong{color:var(--text)}
.log-time{font-family:'DM Mono';font-size:8px;color:var(--muted);flex-shrink:0;white-space:nowrap}

/* ── Import CSV ── */
.drop-zone{border:2px dashed rgba(255,255,255,.12);border-radius:6px;padding:28px;text-align:center;cursor:pointer;transition:all .2s;margin:16px}
.drop-zone:hover,.drop-zone.drag{border-color:rgba(255,207,0,.4);background:rgba(255,207,0,.04)}
.drop-icon{font-size:28px;margin-bottom:8px}
.drop-text{font-family:'DM Mono';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted)}
.drop-text strong{color:var(--Y);display:block;margin-bottom:4px}
#csv-input{display:none}
.import-result{padding:14px 16px;background:rgba(34,197,94,.06);border-top:1px solid rgba(34,197,94,.15);font-size:12px;color:var(--sec);display:none}
.import-result.show{display:block}

/* ── Section tabs ── */
.stabs{display:flex;border-bottom:1px solid var(--border);padding:0 16px}
.stab{padding:9px 14px;font-family:'DM Mono';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .15s}
.stab:hover{color:var(--text)}
.stab.active{color:var(--Y);border-bottom-color:var(--Y)}

/* ── Form inline ── */
.fi{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.fi input,.fi select{background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:4px;color:var(--text);font-family:'DM Mono';font-size:11px;padding:6px 10px;outline:none;transition:border-color .15s}
.fi input:focus,.fi select:focus{border-color:rgba(255,207,0,.4)}
.fi select option{background:var(--card2)}
.fi label{font-family:'DM Mono';font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);white-space:nowrap}

/* ── Notif toast ── */
#toast{position:fixed;bottom:20px;right:20px;z-index:999;background:var(--card2);border:1px solid var(--border);border-radius:6px;padding:12px 18px;font-family:'DM Mono';font-size:10px;letter-spacing:1px;text-transform:uppercase;box-shadow:0 8px 32px rgba(0,0,0,.5);transform:translateY(20px);opacity:0;transition:all .25s;pointer-events:none}
#toast.show{transform:translateY(0);opacity:1}
#toast.ok{border-color:rgba(34,197,94,.3);color:#22c55e}
#toast.err{border-color:rgba(239,68,68,.3);color:#f87171}

@media(max-width:768px){:root{--sidebar-w:0px}.sidebar{display:none}.main{margin-left:0}.content{padding:14px}}

/* ══ VEILLE ══ */
.scr-header{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:rgba(34,197,94,.04)}
.scr-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px rgba(34,197,94,.7);flex-shrink:0;animation:scp 2s ease-in-out infinite}
@keyframes scp{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.7)}}
.scr-status-txt{font-family:'DM Mono';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#22c55e}
.scr-time{margin-left:auto;font-family:'DM Mono';font-size:9px;color:var(--text-muted)}
.scr-filters{display:flex;gap:8px;flex-wrap:wrap;padding:12px 18px;border-bottom:1px solid var(--border);align-items:center}
.scr-flt{padding:4px 12px;border-radius:12px;font-family:'DM Mono';font-size:8px;letter-spacing:1.5px;text-transform:uppercase;border:1px solid var(--border);cursor:pointer;transition:all .15s;background:transparent;color:var(--text-muted)}
.scr-flt:hover{background:rgba(255,255,255,.06);color:var(--text-pri)}
.scr-flt.active{background:rgba(255,207,0,.1);border-color:rgba(255,207,0,.35);color:var(--Y)}
.scr-row{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:14px;padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s}
.scr-row:hover{background:rgba(255,255,255,.02)}
.scr-row:last-child{border-bottom:none}
.scr-row.added{opacity:.4;pointer-events:none}
.scr-dblk{text-align:center;flex-shrink:0;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:5px;padding:5px 9px;min-width:48px}
.scr-dd{font-family:'Bebas Neue';font-size:20px;color:var(--text-pri);line-height:1}
.scr-dm{font-family:'DM Mono';font-size:7px;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted)}
.scr-info{}
.scr-circuit{font-size:13px;font-weight:600;color:var(--text-pri);margin-bottom:4px}
.scr-tags{display:flex;gap:6px;flex-wrap:wrap}
.scr-tag{font-family:'DM Mono';font-size:7px;letter-spacing:1.5px;text-transform:uppercase;padding:2px 8px;border-radius:10px;white-space:nowrap}
.scr-tag-paca{background:rgba(10,61,145,.2);color:#60a5fa;border:1px solid rgba(10,61,145,.3)}
.scr-tag-occ{background:rgba(99,102,241,.12);color:#818cf8;border:1px solid rgba(99,102,241,.2)}
.scr-tag-fr{background:rgba(255,255,255,.06);color:var(--text-muted);border:1px solid var(--border)}
.scr-tag-gt{background:rgba(245,208,97,.08);color:rgba(245,208,97,.8);border:1px solid rgba(245,208,97,.15)}
.scr-src{font-family:'DM Mono';font-size:8px;color:var(--text-muted);margin-top:3px}
.scr-src span{color:rgba(255,207,0,.45)}
.scr-prix{font-family:'Bebas Neue';font-size:20px;color:var(--text-pri);letter-spacing:-1px;text-align:right;flex-shrink:0}
.scr-prix-sub{font-family:'DM Mono';font-size:7px;color:var(--text-muted);text-transform:uppercase}
.scr-acts{display:flex;flex-direction:column;gap:4px;flex-shrink:0}
.btn-add-veille{padding:6px 12px;border-radius:4px;font-family:'DM Mono';font-size:8px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;background:linear-gradient(135deg,#F5D061,#C8860A);color:#000;border:none;cursor:pointer;transition:all .15s;white-space:nowrap}
.btn-add-veille:hover{filter:brightness(1.08)}
.btn-add-veille.done{background:rgba(34,197,94,.12);color:#22c55e;border:1px solid rgba(34,197,94,.25);cursor:default}
.btn-ign{padding:5px 10px;border-radius:4px;font-family:'DM Mono';font-size:7px;letter-spacing:1px;text-transform:uppercase;background:transparent;color:var(--text-muted);border:1px solid var(--border);cursor:pointer;transition:all .15s}
.btn-ign:hover{background:rgba(239,68,68,.08);color:#f87171;border-color:rgba(239,68,68,.2)}

/* ══ FLOTTE ══ */
.fleet-ico{font-size:18px;flex-shrink:0}
.spec-pill{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:3px;font-family:'DM Mono';font-size:7px;letter-spacing:1px;text-transform:uppercase;background:rgba(255,255,255,.04);border:1px solid var(--border);color:var(--text-muted);margin:1px}
.spec-pill.jb{background:rgba(255,207,0,.07);border-color:rgba(255,207,0,.18);color:rgba(255,207,0,.7)}
.spec-pill.part{background:rgba(18,82,192,.1);border-color:rgba(18,82,192,.25);color:#60a5fa}
.spec-pill.link{background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.2);color:#4ade80;cursor:pointer}
.add-form{padding:16px 18px;border-top:1px solid var(--border);display:none;flex-direction:column;gap:12px}
.add-form.open{display:flex}
.fg3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:10px}

/* ══ DATAVIZ ══ */
.dv-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:700px){.dv-grid{grid-template-columns:1fr}}
.fill-row{padding:11px 18px;border-bottom:1px solid rgba(255,255,255,.04);display:flex;flex-direction:column;gap:6px}
.fill-row:last-child{border-bottom:none}
.fill-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.fill-circuit{font-size:12px;font-weight:600;color:var(--text-pri)}
.fill-nums{font-family:'DM Mono';font-size:10px;color:var(--text-muted);white-space:nowrap}
.fill-pct{font-family:'DM Mono';font-size:10px;font-weight:700}
.fill-bar{height:6px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden}
.fill-bar-in{height:100%;border-radius:3px;transition:width 1.2s cubic-bezier(.34,1.2,.64,1)}
.podium-row{display:flex;align-items:center;gap:13px;padding:12px 14px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:6px;margin-bottom:8px;transition:border-color .18s}
.podium-row:hover{border-color:rgba(255,207,0,.2)}
.podium-rank{font-family:'Bebas Neue';font-size:26px;line-height:1;min-width:26px;text-align:center;flex-shrink:0}
.podium-info{flex:1;min-width:0}
.podium-circuit{font-size:12px;font-weight:600;color:var(--text-pri)}
.podium-region{font-family:'DM Mono';font-size:7.5px;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-top:2px}
.podium-bw{flex:1;display:flex;align-items:center;gap:7px;max-width:110px}
.podium-b{flex:1;height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}
.podium-bf{height:100%;border-radius:2px;transition:width 1s}
.podium-vn{font-family:'Bebas Neue';font-size:20px;letter-spacing:-1px;line-height:1;flex-shrink:0}
.podium-vl{font-family:'DM Mono';font-size:7px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)}
.chart-wrap{padding:16px 18px}
.chart-title{font-family:'DM Mono';font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px}
canvas.mc{width:100%;display:block}

</style>
</head>
<body>

<!-- ── Toast ──────────────────────────────────────────── -->
<div id="toast"></div>

<!-- ═══ SIDEBAR ═══ -->
<aside class="sidebar">
  <div class="sb-logo">
    <div class="sb-logo-text">JB <em>EMERIC</em></div>
    <div class="sb-role">
      Back-Office ·
      <strong><?= $role === 'admin' ? 'ADMIN' : 'MODÉRATEUR' ?></strong>
    </div>
  </div>

  <div class="sb-user">
    <div class="sb-av"><?= strtoupper(mb_substr($user['prenom'],0,1) . mb_substr($user['nom'],0,1)) ?></div>
    <div>
      <div class="sb-un"><?= e($user['prenom'] . ' ' . $user['nom']) ?></div>
      <div class="sb-ur"><?= e($role) ?></div>
    </div>
  </div>

  <nav class="sb-nav">
    <div class="sb-sec">Vue d'ensemble</div>
    <button class="sb-link active" onclick="show('dashboard')">
      <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
      Dashboard
    </button>

    <div class="sb-sec">Track-Days</div>
    <button class="sb-link" onclick="show('potential')">
      <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      Sessions Potential
      <span class="sb-badge"><?= count($potential) ?></span>
    </button>
    <button class="sb-link" onclick="show('events')">
      <svg viewBox="0 0 24 24"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>
      Toutes les dates
    </button>

    <?php if ($role === 'admin'): ?>
    <div class="sb-sec">Administration</div>
    <button class="sb-link" onclick="show('users')">
      <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
      Utilisateurs
    </button>
    <?php endif; ?>

    <a class="sb-link" onclick="show('veille')">
      <svg viewBox="0 0 24 24" fill="currentColor" class="sb-link-icon"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      Veille Circuits
      <span class="sb-badge" style="background:#22c55e;color:#000"><?= count($veille_sources) ?></span>
    </a>
    <a class="sb-link" onclick="show('flotte')">
      <svg viewBox="0 0 24 24" fill="currentColor" class="sb-link-icon"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/></svg>
      Flotte & Partenaires
    </a>
    <a class="sb-link" onclick="show('dataviz')">
      <svg viewBox="0 0 24 24" fill="currentColor" class="sb-link-icon"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
      Data-Viz
    </a>

    <div class="sb-sec">Intelligence</div>
    <button class="sb-link" onclick="show('veille')">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      Veille Circuits
      <span class="sb-badge" style="background:#22c55e;color:#000"><?= count($veille_data) ?></span>
    </button>
    <button class="sb-link" onclick="show('fleet')">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/></svg>
      Flotte & Partenaires
    </button>
    <button class="sb-link" onclick="show('dataviz')">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
      Data Visualisation
    </button>
    <div class="sb-sec">Import</div>
    <button class="sb-link" onclick="show('import')">
      <svg viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
      Import CSV / Access
    </button>

    <div class="sb-sec">Compte</div>
    <a class="sb-link sb-logout" href="?logout=1"
       onclick="return confirm('Se déconnecter ?')">
      <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
      Déconnexion
    </a>
  </nav>
</aside>

<!-- ═══ MAIN ═══ -->
<div class="main">
  <div class="topbar">
    <div class="tb-title"><strong id="page-title">Dashboard</strong> · JB EMERIC</div>
    <div class="tb-actions">
      <span style="font-family:'DM Mono';font-size:8px;letter-spacing:2px;color:var(--muted)">
        <?= date('D d M Y · H:i') ?>
      </span>
      <a href="index.html" class="btn btn-ghost btn-sm">← Site public</a>
      <?php if ($role === 'admin'): ?>
      <button class="btn btn-primary btn-sm" onclick="show('events')">+ Nouvelle date</button>
      <?php endif; ?>
    </div>
  </div>

  <div class="content">

  <!-- ════ DASHBOARD ════ -->
  <div id="s-dashboard">

    <div class="kpis">
      <div class="kpi" style="--kpi-c:linear-gradient(90deg,#22c55e,#16a34a)">
        <div class="kpi-lbl">Dates ouvertes</div>
        <div class="kpi-val"><?= $kpis['open'] ?></div>
        <div class="kpi-sub">Inscriptions actives</div>
      </div>
      <div class="kpi" style="--kpi-c:linear-gradient(90deg,#6366f1,#818cf8)">
        <div class="kpi-lbl">Votes en attente</div>
        <div class="kpi-val"><?= $kpis['votes'] ?></div>
        <div class="kpi-sub">Dates Potential</div>
      </div>
      <div class="kpi">
        <div class="kpi-lbl">Pilotes inscrits</div>
        <div class="kpi-val"><?= $kpis['inscrits'] ?: 0 ?></div>
        <div class="kpi-sub">Sessions ouvertes</div>
      </div>
      <div class="kpi" style="--kpi-c:linear-gradient(90deg,#ef4444,#dc2626)">
        <div class="kpi-lbl">Sessions complètes</div>
        <div class="kpi-val"><?= $kpis['full'] ?></div>
      </div>
      <?php if ($role === 'admin'): ?>
      <div class="kpi" style="--kpi-c:linear-gradient(90deg,#0A3D91,#1252C0)">
        <div class="kpi-lbl">Clients enregistrés</div>
        <div class="kpi-val"><?= $kpis['users'] ?></div>
      </div>
      <?php endif; ?>
    </div>

    <div class="grid3">
      <div class="card">
        <div class="card-head">
          <div class="card-title"><div class="ctd"></div>Prochaines dates</div>
          <button class="btn btn-primary btn-sm" onclick="show('events')">Voir tout</button>
        </div>
        <div class="tw">
          <table>
            <thead><tr><th>Date</th><th>Circuit</th><th>Statut</th><th>Places</th><th>Actions</th></tr></thead>
            <tbody>
            <?php foreach (array_slice($upcoming, 0, 6) as $ev): ?>
              <tr id="row-<?= $ev['id'] ?>">
                <td class="td-mono td-m"><?= date('d M', strtotime($ev['date_event'])) ?></td>
                <td class="td-m"><?= e($ev['circuit_nom']) ?></td>
                <td><?= badge_status($ev['status']) ?></td>
                <td class="td-mono"><?= $ev['nb_inscrits'] ?>/<?= $ev['nb_places'] ?></td>
                <td><div class="td-acts">
                  <?php if ($ev['status'] === 'Potential'): ?>
                  <button class="btn btn-ok btn-sm"
                    onclick="setStatus(<?= $ev['id'] ?>,'Open')">→ Open</button>
                  <?php endif; ?>
                  <button class="btn btn-ghost btn-sm">Modifier</button>
                </div></td>
              </tr>
            <?php endforeach; ?>
            <?php if (empty($upcoming)): ?>
              <tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">
                Aucune date à venir — <button class="btn btn-primary btn-sm" onclick="show('events')">+ Ajouter</button>
              </td></tr>
            <?php endif; ?>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Log activité (statique pour l'instant) -->
      <div class="card">
        <div class="card-head">
          <div class="card-title"><div class="ctd" style="background:#6366f1"></div>Activité</div>
        </div>
        <div class="log-item">
          <div class="log-dot" style="background:#22c55e"></div>
          <div class="log-txt">Dashboard chargé — <strong><?= e($user['prenom']) ?></strong></div>
          <div class="log-time"><?= date('H:i') ?></div>
        </div>
        <div class="log-item">
          <div class="log-dot" style="background:#6366f1"></div>
          <div class="log-txt"><strong><?= count($potential) ?> date(s)</strong> en attente de validation</div>
          <div class="log-time">En cours</div>
        </div>
        <?php foreach ($imports as $imp): ?>
        <div class="log-item">
          <div class="log-dot" style="background:#F5D061"></div>
          <div class="log-txt">Import CSV — <strong><?= $imp['nb_ok'] ?> clients</strong> ajoutés</div>
          <div class="log-time"><?= date('d/m', strtotime($imp['created_at'])) ?></div>
        </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div><!-- /dashboard -->

  <!-- ════ SESSIONS POTENTIAL ════ -->
  <div id="s-potential" style="display:none">
    <div class="card">
      <div class="card-head">
        <div class="card-title">
          <div class="ctd" style="background:#6366f1"></div>
          Sessions Potential — triées par votes
        </div>
        <div class="card-acts">
          <span style="font-family:'DM Mono';font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)">
            Seuil de validation :
          </span>
          <select style="background:rgba(255,255,255,.05);border:1px solid var(--border);color:var(--text);font-family:'DM Mono';font-size:9px;padding:4px 8px;border-radius:4px;outline:none">
            <option>5 votes</option><option>10 votes</option><option>15 votes</option>
          </select>
        </div>
      </div>
      <div class="tw">
        <table>
          <thead><tr>
            <th>Date</th><th>Circuit</th><th>Région</th><th>Type</th>
            <th>Prix</th><th>Votes</th><th>Statut</th><th>Actions</th>
          </tr></thead>
          <tbody>
          <?php foreach ($potential as $ev): ?>
            <tr id="row-p-<?= $ev['id'] ?>">
              <td class="td-mono td-m"><?= date('d M Y', strtotime($ev['date_event'])) ?></td>
              <td class="td-m"><?= e($ev['circuit_nom']) ?></td>
              <td><?= e($ev['region']) ?></td>
              <td><?= e($ev['type']) ?></td>
              <td class="td-mono"><?= number_format((float)$ev['prix'], 0, ',', ' ') ?> €</td>
              <td>
                <div class="vb-wrap">
                  <div class="vb">
                    <div class="vb-fill"
                      style="width:<?= min(100, round($ev['nb_votes']/5*100)) ?>%"></div>
                  </div>
                  <span class="vc"><?= $ev['nb_votes'] ?>/5</span>
                </div>
              </td>
              <td id="badge-p-<?= $ev['id'] ?>"><?= badge_status($ev['status']) ?></td>
              <td><div class="td-acts">
                <button class="btn btn-ok btn-sm"
                  onclick="setStatus(<?= $ev['id'] ?>,'Open',this)">
                  ✓ Valider → Open
                </button>
                <button class="btn btn-ghost btn-sm"
                  onclick="setStatus(<?= $ev['id'] ?>,'Annulé',this)">
                  ✕ Annuler
                </button>
              </div></td>
            </tr>
          <?php endforeach; ?>
          <?php if (empty($potential)): ?>
            <tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px">
              Aucune session en attente de vote.
            </td></tr>
          <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div><!-- /potential -->

  <!-- ════ TOUTES LES DATES ════ -->
  <div id="s-events" style="display:none">
    <div class="card">
      <div class="card-head">
        <div class="card-title"><div class="ctd"></div>Gestion des dates</div>
        <div class="card-acts">
          <button class="btn btn-primary btn-sm">+ Nouvelle date</button>
        </div>
      </div>
      <div class="fi">
        <label>Statut</label>
        <select onchange="filterTable(this.value)">
          <option value="">Tous</option>
          <option>Draft</option><option>Potential</option>
          <option>Open</option><option>Full</option><option>Annulé</option>
        </select>
        <label>Région</label>
        <select>
          <option value="">Toutes</option>
          <option>PACA</option><option>Occitanie</option>
        </select>
        <input type="text" placeholder="Rechercher un circuit..."
          style="flex:1;min-width:180px"
          oninput="searchTable(this.value)">
      </div>
      <div class="tw">
        <table id="events-table">
          <thead><tr>
            <th>Date</th><th>Circuit</th><th>Région</th><th>Type</th><th>Statut</th>
            <th>Places</th><th>Prix</th><th>Visible</th><th>Actions</th>
          </tr></thead>
          <tbody>
          <?php foreach ($upcoming as $ev): ?>
            <tr id="ev-<?= $ev['id'] ?>" data-status="<?= e($ev['status']) ?>">
              <td class="td-mono td-m"><?= date('d M Y', strtotime($ev['date_event'])) ?></td>
              <td class="td-m"><?= e($ev['circuit_nom']) ?></td>
              <td><?= e($ev['region']) ?></td>
              <td style="font-size:11px"><?= e($ev['type']) ?></td>
              <td id="ev-badge-<?= $ev['id'] ?>"><?= badge_status($ev['status']) ?></td>
              <td class="td-mono"><?= $ev['nb_inscrits'] ?>/<?= $ev['nb_places'] ?></td>
              <td class="td-mono"><?= number_format((float)$ev['prix'],0,',',' ') ?> €</td>
              <td>
                <div class="tog <?= $ev['visible_site'] ? 'on' : '' ?>"
                  onclick="toggleVisible(<?= $ev['id'] ?>,this)"></div>
              </td>
              <td><div class="td-acts">
                <?php if ($ev['status'] === 'Potential'): ?>
                <button class="btn btn-ok btn-sm"
                  onclick="setStatus(<?= $ev['id'] ?>,'Open',this)">→ Open</button>
                <?php endif; ?>
                <button class="btn btn-ghost btn-sm">Modifier</button>
                <?php if ($role === 'admin'): ?>
                <button class="btn btn-danger btn-sm"
                  onclick="deleteEvent(<?= $ev['id'] ?>,this)">Suppr.</button>
                <?php endif; ?>
              </div></td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div><!-- /events -->

  <!-- ════ UTILISATEURS (admin only) ════ -->
  <?php if ($role === 'admin'): ?>
  <div id="s-users" style="display:none">
    <div class="card">
      <div class="card-head">
        <div class="card-title"><div class="ctd" style="background:#1252C0"></div>Utilisateurs</div>
        <div class="card-acts">
          <span style="font-family:'DM Mono';font-size:9px;color:var(--muted)">
            <?= count($users_list) ?> enregistrés
          </span>
        </div>
      </div>
      <div class="tw">
        <table>
          <thead><tr>
            <th>#</th><th>Nom</th><th>Email</th><th>Rôle</th>
            <th>Niveau</th><th>Inscrit le</th><th>Actions</th>
          </tr></thead>
          <tbody>
          <?php foreach ($users_list as $u): ?>
            <tr>
              <td class="td-mono"><?= $u['id'] ?></td>
              <td class="td-m"><?= e($u['prenom'] . ' ' . $u['nom']) ?></td>
              <td style="font-size:11px"><?= e($u['email']) ?></td>
              <td>
                <?php if ($u['role'] === 'admin'): ?>
                  <span class="badge badge-admin">Admin</span>
                <?php elseif ($u['role'] === 'moderateur'): ?>
                  <span class="badge badge-mod">Modérateur</span>
                <?php else: ?>
                  <span class="badge badge-draft">Client</span>
                <?php endif; ?>
              </td>
              <td style="font-size:11px"><?= e($u['niveau'] ?? '—') ?></td>
              <td class="td-mono"><?= date('d/m/Y', strtotime($u['created_at'])) ?></td>
              <td><div class="td-acts">
                <button class="btn btn-ghost btn-sm">Modifier</button>
                <?php if ($u['role'] !== 'admin'): ?>
                <button class="btn btn-danger btn-sm">Suppr.</button>
                <?php endif; ?>
              </div></td>
            </tr>
          <?php endforeach; ?>
          <?php if (empty($users_list)): ?>
            <tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">
              Aucun utilisateur — <a href="signup.html" style="color:var(--Y)">Créer un compte</a>
            </td></tr>
          <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <?php endif; ?>

  <!-- ════ IMPORT CSV ════ -->
  <div id="s-import" style="display:none">
    <div class="grid2">
      <div class="card">
        <div class="card-head">
          <div class="card-title"><div class="ctd" style="background:#F5D061"></div>Import clients CSV / Access</div>
        </div>

        <form id="import-form" enctype="multipart/form-data">
          <input type="hidden" name="action" value="import_csv">
          <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
          <input type="file" id="csv-input" name="csv_file" accept=".csv,.txt">

          <div class="drop-zone" id="drop-zone"
               onclick="document.getElementById('csv-input').click()"
               ondragover="event.preventDefault();this.classList.add('drag')"
               ondragleave="this.classList.remove('drag')"
               ondrop="handleDrop(event)">
            <div class="drop-icon">📂</div>
            <div class="drop-text">
              <strong>Glisser-déposer votre fichier CSV</strong>
              ou cliquer pour parcourir<br>
              Colonnes attendues : nom, prenom, email, tel
            </div>
          </div>

          <div style="padding:0 16px 16px;display:flex;gap:8px">
            <button type="button" class="btn btn-primary" onclick="submitImport()">
              ↑ Importer les clients
            </button>
            <span style="font-family:'DM Mono';font-size:9px;color:var(--muted);align-self:center">
              Doublons ignorés automatiquement
            </span>
          </div>
        </form>

        <div class="import-result" id="import-result"></div>
      </div>

      <!-- Historique imports -->
      <div class="card">
        <div class="card-head">
          <div class="card-title"><div class="ctd" style="background:#22c55e"></div>Historique</div>
        </div>
        <?php if (empty($imports)): ?>
          <div style="padding:20px 16px;color:var(--muted);font-size:12px;text-align:center">
            Aucun import effectué.
          </div>
        <?php else: ?>
        <div class="tw">
          <table>
            <thead><tr><th>Fichier</th><th>Importés</th><th>Erreurs</th><th>Par</th><th>Date</th></tr></thead>
            <tbody>
            <?php foreach ($imports as $imp): ?>
              <tr>
                <td style="font-size:11px"><?= e($imp['filename']) ?></td>
                <td class="td-mono"><span style="color:#22c55e"><?= $imp['nb_ok'] ?></span></td>
                <td class="td-mono"><span style="color:<?= $imp['nb_erreurs'] ? '#f87171' : 'var(--muted)' ?>"><?= $imp['nb_erreurs'] ?></span></td>
                <td style="font-size:11px"><?= e(($imp['prenom'] ?? '') . ' ' . ($imp['unom'] ?? '')) ?></td>
                <td class="td-mono"><?= date('d/m H:i', strtotime($imp['created_at'])) ?></td>
              </tr>
            <?php endforeach; ?>
            </tbody>
          </table>
        </div>
        <?php endif; ?>
      </div>
    </div>
  </div><!-- /import -->


  <!-- ════ VEILLE CIRCUITS ════ -->
  <div id="s-veille" style="display:none">
    <div class="kpis" style="margin-bottom:16px">
      <div class="kpi" style="--kpi-c:linear-gradient(90deg,#22c55e,#16a34a)">
        <div class="kpi-lbl">Sources surveillées</div>
        <div class="kpi-val">7</div>
        <div class="kpi-sub">Calendriers circuits actifs</div>
      </div>
      <div class="kpi" style="--kpi-c:linear-gradient(90deg,#F5D061,#C8860A)">
        <div class="kpi-lbl">Nouvelles dates trouvées</div>
        <div class="kpi-val"><?= count($veille_sources) ?></div>
        <div class="kpi-sub">Non ajoutées au site</div>
      </div>
      <div class="kpi" style="--kpi-c:linear-gradient(90deg,#0A3D91,#1252C0)">
        <div class="kpi-lbl">Dates PACA en priorité</div>
        <div class="kpi-val"><?= count(array_filter($veille_sources, fn($v) => $v['region']==='PACA')) ?></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="card-title"><div class="ctd" style="background:#22c55e"></div>Veille Automatique — Journées Circuit</div>
        <div class="card-acts">
          <button class="btn btn-ghost btn-sm" onclick="simulateScan()">↻ Scanner maintenant</button>
        </div>
      </div>

      <div class="scr-header" id="scr-hdr">
        <div class="scr-dot"></div>
        <div class="scr-status-txt">Surveillance active — mise à jour toutes les 6h</div>
        <div class="scr-time" id="scr-time">Dernière analyse : <?= date('H:i') ?></div>
      </div>

      <div class="scr-filters">
        <button class="scr-flt active" onclick="scrFlt(this,'all')">Tout</button>
        <button class="scr-flt" onclick="scrFlt(this,'PACA')">PACA</button>
        <button class="scr-flt" onclick="scrFlt(this,'Occitanie')">Occitanie</button>
        <button class="scr-flt" onclick="scrFlt(this,'Autre France')">Reste France</button>
        <div style="margin-left:auto;display:flex;align-items:center;gap:6px;font-family:'DM Mono';font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted)">
          Trier :
          <select style="background:rgba(255,255,255,.05);border:1px solid var(--border);color:var(--text-sec);font-family:'DM Mono';font-size:8px;padding:4px 8px;outline:none;border-radius:4px" onchange="renderVeille(this.value)">
            <option value="prox">Proximité (PACA)</option>
            <option value="date">Date</option>
            <option value="prix">Prix</option>
          </select>
        </div>
      </div>

      <div id="veille-results">
        <?php
        $prox_order = ['PACA'=>1,'Occitanie'=>2,'Autre France'=>3];
        usort($veille_sources, fn($a,$b) => ($prox_order[$a['region']]??9) <=> ($prox_order[$b['region']]??9));
        foreach ($veille_sources as $idx => $vs):
          $d   = new DateTime($vs['date']);
          $tag_reg = match($vs['region']) { 'PACA'=>'scr-tag-paca','Occitanie'=>'scr-tag-occ', default=>'scr-tag-fr' };
          $tag_typ = str_contains($vs['type'],'GT') ? 'scr-tag-gt' : '';
        ?>
        <div class="scr-row" id="scr-row-<?= $idx ?>"
             data-region="<?= e($vs['region']) ?>" data-date="<?= e($vs['date']) ?>" data-prix="<?= $vs['prix'] ?>">
          <div class="scr-dblk">
            <div class="scr-dd"><?= $d->format('d') ?></div>
            <div class="scr-dm"><?= $d->format('M') ?></div>
          </div>
          <div class="scr-info">
            <div class="scr-circuit"><?= e($vs['nom']) ?></div>
            <div class="scr-tags">
              <span class="scr-tag <?= $tag_reg ?>"><?= e($vs['region']) ?></span>
              <span class="scr-tag <?= $tag_typ ?>"><?= e($vs['type']) ?></span>
            </div>
            <div class="scr-src">Source : <span><?= e($vs['source']) ?></span> · <?= e($vs['org']) ?></div>
          </div>
          <div>
            <div class="scr-prix"><?= $vs['prix'] ?> €</div>
            <div class="scr-prix-sub">/ pilote</div>
          </div>
          <div class="scr-acts">
            <button class="btn-add-veille" id="scr-add-<?= $idx ?>"
              onclick="addVeille(<?= $idx ?>,<?= $vs['circuit_id'] ?>,'<?= e($vs['date']) ?>','<?= e($vs['type']) ?>',<?= $vs['prix'] ?>,'<?= e($vs['source']) ?>')">
              + Ajouter
            </button>
            <button class="btn-ign" onclick="document.getElementById('scr-row-<?= $idx ?>').classList.add('added')">Ignorer</button>
          </div>
        </div>
        <?php endforeach; ?>
        <?php if (empty($veille_sources)): ?>
        <div style="text-align:center;padding:28px;color:var(--text-muted);font-family:'DM Mono';font-size:9px;letter-spacing:2px;text-transform:uppercase">
          Toutes les dates trouvées ont déjà été ajoutées.
        </div>
        <?php endif; ?>
      </div>
    </div>
  </div><!-- /veille -->

  <!-- ════ FLOTTE & PARTENAIRES ════ -->
  <div id="s-flotte" style="display:none">
    <div class="card">
      <div class="card-head">
        <div class="card-title"><div class="ctd" style="background:#F5D061"></div>Flotte complète</div>
        <div class="card-acts">
          <button class="btn btn-add" onclick="document.getElementById('add-car-frm').classList.toggle('open')">+ Ajouter un véhicule</button>
        </div>
      </div>
      <div class="tw">
        <table>
          <thead><tr>
            <th>Type</th><th>Véhicule</th><th>Propriété</th><th>Specs</th>
            <th>Sessions actives</th><th>Concessionnaire</th><th>Visible</th><th>Actions</th>
          </tr></thead>
          <tbody id="fleet-tbody">
          <?php foreach ($vehicules as $v): ?>
            <tr id="fveh-<?= $v['id'] ?>">
              <td>
                <?php
                $ico = match($v['type_vehicule']) {
                    'Monoplace'      => '🏎️',
                    'GT'             => '🏁',
                    'Prestige route' => '🔴',
                    'Sport légère'   => '⚡',
                    default          => '🚗',
                };
                echo $ico;
                ?>
              </td>
              <td class="td-m"><?= e($v['nom']) ?></td>
              <td>
                <span class="spec-pill <?= $v['propriete'] === 'jb_emeric' ? 'jb' : 'part' ?>">
                  <?= $v['propriete'] === 'jb_emeric' ? 'JB EMERIC' : 'Partenaire' ?>
                </span>
              </td>
              <td>
                <?php if ($v['puissance_ch']): ?><span class="spec-pill"><?= $v['puissance_ch'] ?> ch</span><?php endif; ?>
                <span class="spec-pill"><?= e($v['boite']) ?></span>
                <span class="spec-pill"><?= e($v['type_vehicule']) ?></span>
              </td>
              <td class="td-mono"><?= $v['sessions_actives'] ?></td>
              <td>
                <?php if ($v['concessionnaire']): ?>
                  <span class="spec-pill link"><?= e($v['concessionnaire']) ?></span>
                <?php else: ?>
                  <button class="btn btn-ghost btn-sm" onclick="alert('Lier un concessionnaire — à connecter')">+ Lier</button>
                <?php endif; ?>
              </td>
              <td>
                <div class="tog <?= $v['visible_site'] ? 'on' : '' ?>"
                  onclick="toggleVehVisible(<?= $v['id'] ?>,this)"></div>
              </td>
              <td><div class="td-acts">
                <button class="btn btn-ghost btn-sm">Modifier</button>
                <?php if ($_SESSION['user_role'] === 'admin'): ?>
                <button class="btn btn-danger btn-sm"
                  onclick="deleteVeh(<?= $v['id'] ?>)">Suppr.</button>
                <?php endif; ?>
              </div></td>
            </tr>
          <?php endforeach; ?>
          <?php if (empty($vehicules)): ?>
          <tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted)">
            Aucun véhicule — ajoutez-en un ci-dessous.
          </td></tr>
          <?php endif; ?>
          </tbody>
        </table>
      </div>

      <!-- Formulaire ajout véhicule -->
      <div class="add-form" id="add-car-frm">
        <div style="font-family:'DM Mono';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);padding-bottom:8px;border-bottom:1px solid var(--border)">
          Nouveau véhicule
        </div>
        <div class="fg3">
          <div style="display:flex;flex-direction:column;gap:5px">
            <label class="form-label">Nom affiché *</label>
            <input class="form-input" id="car-nom" placeholder="BMW 325i HTCC">
          </div>
          <div style="display:flex;flex-direction:column;gap:5px">
            <label class="form-label">Marque *</label>
            <input class="form-input" id="car-marque" placeholder="BMW">
          </div>
          <div style="display:flex;flex-direction:column;gap:5px">
            <label class="form-label">Modèle *</label>
            <input class="form-input" id="car-modele" placeholder="325i">
          </div>
        </div>
        <div class="fg3">
          <div style="display:flex;flex-direction:column;gap:5px">
            <label class="form-label">Propriété</label>
            <select class="form-select" id="car-proprio">
              <option value="jb_emeric">JB EMERIC</option>
              <option value="partenaire">Partenaire</option>
            </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px">
            <label class="form-label">Type</label>
            <select class="form-select" id="car-type">
              <option>GT</option><option>Tourisme</option><option>Monoplace</option>
              <option>Sport légère</option><option>Prestige route</option>
            </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px">
            <label class="form-label">Boîte</label>
            <select class="form-select" id="car-boite">
              <option>Manuelle</option><option>Séquentielle</option>
              <option>DCT/PDK</option><option>Auto</option>
            </select>
          </div>
        </div>
        <div class="fg2">
          <div style="display:flex;flex-direction:column;gap:5px">
            <label class="form-label">Puissance (ch)</label>
            <input class="form-input" id="car-ch" type="number" placeholder="320">
          </div>
          <div style="display:flex;flex-direction:column;gap:5px">
            <label class="form-label">Concessionnaire lié</label>
            <input class="form-input" id="car-concess" placeholder="Ferrari Marseille">
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-add" onclick="submitAddCar()">Enregistrer</button>
          <button class="btn btn-ghost" onclick="document.getElementById('add-car-frm').classList.remove('open')">Annuler</button>
        </div>
      </div>
    </div>
  </div><!-- /flotte -->

  <!-- ════ DATA-VISUALISATION ════ -->
  <div id="s-dataviz" style="display:none">
    <div class="dv-grid" style="margin-bottom:16px">

      <!-- Taux de remplissage -->
      <div class="card">
        <div class="card-head">
          <div class="card-title"><div class="ctd" style="background:#22c55e"></div>Taux de remplissage</div>
        </div>
        <?php if (empty($fill_sessions)): ?>
          <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px">Aucune session ouverte.</div>
        <?php else: ?>
        <div id="fill-list">
          <?php foreach ($fill_sessions as $fs):
            $pct   = (int)$fs['pct'];
            $color = $pct >= 100 ? '#ef4444' : ($pct >= 75 ? '#F5D061' : '#22c55e');
          ?>
          <div class="fill-row">
            <div class="fill-top">
              <div class="fill-circuit"><?= e($fs['circuit_nom']) ?> · <?= date('d M', strtotime($fs['date_event'])) ?></div>
              <div class="fill-nums"><?= $fs['nb_inscrits'] ?>/<?= $fs['nb_places'] ?></div>
              <div class="fill-pct" style="color:<?= $color ?>"><?= $pct ?>%</div>
            </div>
            <div class="fill-bar">
              <div class="fill-bar-in" data-pct="<?= $pct ?>"
                   style="width:0%;background:<?= $color ?>"></div>
            </div>
          </div>
          <?php endforeach; ?>
        </div>
        <?php endif; ?>
      </div>

      <!-- Top 3 circuits votés -->
      <div class="card">
        <div class="card-head">
          <div class="card-title"><div class="ctd" style="background:#6366f1"></div>Top Circuits — Votes clients</div>
        </div>
        <div style="padding:16px 18px">
          <?php
          $medals = ['🥇','🥈','🥉'];
          $mc     = ['#F5D061','#94a3b8','#78350f'];
          foreach ($top3_circuits as $i => $t):
            $max_votes = max(1, (int)($top3_circuits[0]['total_votes'] ?? 1));
            $pct_v     = min(100, round((int)$t['total_votes'] / $max_votes * 100));
          ?>
          <div class="podium-row">
            <div class="podium-rank" style="color:<?= $mc[$i] ?>"><?= $medals[$i] ?></div>
            <div class="podium-info">
              <div class="podium-circuit"><?= e($t['nom']) ?></div>
              <div class="podium-region"><?= e($t['region']) ?></div>
            </div>
            <div class="podium-bw">
              <div class="podium-b">
                <div class="podium-bf" data-pct="<?= $pct_v ?>"
                     style="width:0%;background:<?= $mc[$i] ?>"></div>
              </div>
            </div>
            <div>
              <div class="podium-vn" style="color:<?= $mc[$i] ?>"><?= $t['total_votes'] ?></div>
              <div class="podium-vl">votes</div>
            </div>
          </div>
          <?php endforeach; ?>
          <?php if (empty($top3_circuits)): ?>
            <div style="color:var(--text-muted);font-size:12px;text-align:center;padding:16px">Aucun vote enregistré.</div>
          <?php endif; ?>
        </div>
      </div>
    </div>

    <!-- Graphique inscriptions 6 mois -->
    <div class="card">
      <div class="card-head">
        <div class="card-title"><div class="ctd"></div>Inscriptions — 6 derniers mois</div>
      </div>
      <div class="chart-wrap">
        <div class="chart-title">Nombre d'inscriptions par mois</div>
        <canvas id="insc-chart" class="mc" height="110"
          data-labels="<?= e(json_encode(array_column($monthly_ins,'mois'))) ?>"
          data-vals="<?= e(json_encode(array_column($monthly_ins,'nb'))) ?>">
        </canvas>
      </div>
    </div>
  </div><!-- /dataviz -->


<style>
/* ── Veille ── */
.vl-status { display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border);background:rgba(34,197,94,.04) }
.vl-dot { width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px rgba(34,197,94,.7);flex-shrink:0;animation:vlp 2s ease-in-out infinite }
@keyframes vlp{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.65)}}
.vl-status-txt { font-family:'DM Mono';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#22c55e }
.vl-status-time { margin-left:auto;font-family:'DM Mono';font-size:8px;color:var(--muted) }
.vl-filters { display:flex;gap:7px;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid var(--border);align-items:center }
.vl-fbtn { padding:4px 12px;border-radius:12px;font-family:'DM Mono';font-size:7.5px;letter-spacing:1.5px;text-transform:uppercase;border:1px solid var(--border);cursor:pointer;transition:all .15s;background:transparent;color:var(--muted) }
.vl-fbtn:hover { background:rgba(255,255,255,.05);color:var(--text) }
.vl-fbtn.on { background:rgba(255,207,0,.1);border-color:rgba(255,207,0,.35);color:var(--Y) }
.vl-row { display:grid;grid-template-columns:56px 1fr auto auto;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s }
.vl-row:hover { background:rgba(255,255,255,.02) }
.vl-row:last-child { border-bottom:none }
.vl-row.added { opacity:.38;pointer-events:none }
.vl-date-box { text-align:center;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:4px;padding:5px 8px }
.vl-day { font-family:'Bebas Neue';font-size:22px;line-height:1;color:var(--text) }
.vl-mo  { font-family:'DM Mono';font-size:7px;letter-spacing:1px;text-transform:uppercase;color:var(--muted) }
.vl-info { min-width:0 }
.vl-circuit { font-size:13px;font-weight:600;color:var(--text);margin-bottom:3px }
.vl-tags { display:flex;gap:5px;flex-wrap:wrap }
.vl-tag { font-family:'DM Mono';font-size:7px;letter-spacing:1.5px;text-transform:uppercase;padding:2px 7px;border-radius:10px }
.vl-tag-paca  { background:rgba(10,61,145,.18);color:#60a5fa;border:1px solid rgba(10,61,145,.3) }
.vl-tag-occ   { background:rgba(99,102,241,.12);color:#818cf8;border:1px solid rgba(99,102,241,.2) }
.vl-tag-gt    { background:rgba(245,208,97,.08);color:rgba(245,208,97,.8);border:1px solid rgba(245,208,97,.15) }
.vl-tag-tour  { background:rgba(34,197,94,.07);color:#4ade80;border:1px solid rgba(34,197,94,.14) }
.vl-src { font-family:'DM Mono';font-size:8px;color:var(--muted);margin-top:3px }
.vl-src span { color:rgba(255,207,0,.45) }
.vl-price { font-family:'Bebas Neue';font-size:20px;letter-spacing:-1px;color:var(--text);text-align:right;white-space:nowrap }
.vl-price-sub { font-family:'DM Mono';font-size:7px;text-transform:uppercase;letter-spacing:1px;color:var(--muted) }
.vl-acts { display:flex;flex-direction:column;gap:4px;flex-shrink:0 }
.btn-add-proj { padding:6px 12px;border-radius:4px;font-family:'DM Mono';font-size:7.5px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;background:linear-gradient(135deg,#F5D061,#C8860A);color:#000;border:none;cursor:pointer;transition:all .15s;white-space:nowrap }
.btn-add-proj:hover { filter:brightness(1.08) }
.btn-add-proj.done { background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.2);cursor:default }
.btn-ign { padding:5px 10px;border-radius:4px;font-family:'DM Mono';font-size:7px;letter-spacing:1px;text-transform:uppercase;background:transparent;color:var(--muted);border:1px solid var(--border);cursor:pointer;transition:all .15s }
.btn-ign:hover { background:rgba(239,68,68,.07);color:#f87171;border-color:rgba(239,68,68,.2) }
.vl-add-form { display:none;padding:12px 16px;border-top:1px solid var(--border);background:rgba(255,207,0,.03) }
.vl-add-form.open { display:block }

/* ── Fleet table ── */
.fleet-icon { font-size:18px }
.prop-pill { display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-family:'DM Mono';font-size:7px;letter-spacing:1px;text-transform:uppercase }
.prop-jb   { background:rgba(255,207,0,.07);border:1px solid rgba(255,207,0,.18);color:rgba(255,207,0,.75) }
.prop-part { background:rgba(18,82,192,.1);border:1px solid rgba(18,82,192,.25);color:#60a5fa }
.spec-tag  { display:inline-flex;padding:2px 6px;border-radius:3px;font-family:'DM Mono';font-size:7px;letter-spacing:1px;text-transform:uppercase;background:rgba(255,255,255,.04);border:1px solid var(--border);color:var(--muted);margin:1px }
.spec-tag.type-gt   { background:rgba(239,68,68,.07);color:#f87171;border-color:rgba(239,68,68,.18) }
.spec-tag.type-tour { background:rgba(34,197,94,.06);color:#4ade80;border-color:rgba(34,197,94,.15) }
.spec-tag.type-mono { background:rgba(99,102,241,.09);color:#818cf8;border-color:rgba(99,102,241,.2) }
.link-tag  { display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-family:'DM Mono';font-size:7px;letter-spacing:1px;text-transform:uppercase;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);color:#4ade80;cursor:pointer;transition:all .15s }
.link-tag:hover { background:rgba(34,197,94,.15) }
.unlink-tag { background:rgba(255,255,255,.04);border:1px solid var(--border);color:var(--muted) }
.fleet-add-form { display:none;padding:14px 16px;border-top:1px solid var(--border);background:rgba(255,207,0,.02) }
.fleet-add-form.open { display:block }
.fg3 { display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px }
.fg2 { display:grid;grid-template-columns:1fr 1fr;gap:8px }

/* ── DataViz ── */
.dv-grid { display:grid;grid-template-columns:1fr 1fr;gap:16px }
@media(max-width:700px){ .dv-grid { grid-template-columns:1fr } }
.fill-row { padding:11px 16px;border-bottom:1px solid rgba(255,255,255,.04) }
.fill-row:last-child { border-bottom:none }
.fill-top { display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;gap:8px }
.fill-name { font-size:12px;font-weight:600;color:var(--text);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap }
.fill-nums { font-family:'DM Mono';font-size:10px;color:var(--muted);white-space:nowrap }
.fill-pct  { font-family:'Bebas Neue';font-size:18px;letter-spacing:-1px }
.fill-bar  { height:5px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden }
.fill-fill { height:100%;border-radius:3px;transition:width 1.2s cubic-bezier(.34,1.2,.64,1) }
.podium { padding:16px }
.pod-row { display:flex;align-items:center;gap:12px;padding:11px 12px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:5px;margin-bottom:8px;transition:border-color .18s }
.pod-row:last-child { margin-bottom:0 }
.pod-row:hover { border-color:rgba(255,207,0,.2) }
.pod-medal { font-size:22px;flex-shrink:0;line-height:1 }
.pod-info  { flex:1;min-width:0 }
.pod-name  { font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.pod-reg   { font-family:'DM Mono';font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-top:2px }
.pod-votes-wrap { display:flex;align-items:center;gap:7px;flex-shrink:0 }
.pod-bar   { width:60px;height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden }
.pod-fill  { height:100%;border-radius:2px }
.pod-votes { font-family:'Bebas Neue';font-size:18px;letter-spacing:-1px;white-space:nowrap }
.chart-wrap { padding:16px }
.chart-lbl  { font-family:'DM Mono';font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:10px }
canvas.mini-chart { width:100%;display:block }
</style>

<?php
// ── Récupérer les events liés à chaque véhicule pour le select
$events_for_link = $pdo->query(
    "SELECT e.id, e.date_event, c.nom AS circuit_nom
       FROM events e
       JOIN circuits c ON c.id = e.circuit_id
      WHERE e.status IN ('Open','Potential','Draft')
        AND e.date_event >= CURDATE()
      ORDER BY e.date_event ASC LIMIT 20"
)->fetchAll();
?>

<!-- ═══ VEILLE AUTOMATIQUE ═══ -->
<div id="s-veille" style="display:none">
  <div class="kpis" style="margin-bottom:16px">
    <div class="kpi" style="--kpi-c:linear-gradient(90deg,#22c55e,#16a34a)">
      <div class="kpi-lbl">Sources actives</div>
      <div class="kpi-val">7</div>
      <div class="kpi-sub">Calendriers circuits</div>
    </div>
    <div class="kpi" style="--kpi-c:linear-gradient(90deg,#F5D061,#C8860A)">
      <div class="kpi-lbl">Nouvelles détections</div>
      <div class="kpi-val"><?= count($veille_data) ?></div>
      <div class="kpi-sub kpi-up">↑ PACA prioritaires</div>
    </div>
    <div class="kpi" style="--kpi-c:linear-gradient(90deg,#6366f1,#818cf8)">
      <div class="kpi-lbl">Déjà en Potential</div>
      <div class="kpi-val"><?= count($potential) ?></div>
      <div class="kpi-sub">Dates en attente vote</div>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div class="card-title"><div class="ctd" style="background:#22c55e"></div>Veille — Journées circuit détectées</div>
      <div class="card-acts">
        <button class="btn btn-ghost btn-sm" onclick="simulateScan()">↻ Rescanner</button>
      </div>
    </div>

    <div class="vl-status" id="vl-status">
      <div class="vl-dot"></div>
      <div class="vl-status-txt">Surveillance active — cron toutes les 6h</div>
      <div class="vl-status-time" id="vl-time">Analyse : aujourd'hui 08:42</div>
    </div>

    <div class="vl-filters">
      <button class="vl-fbtn on" onclick="vlFilter(this,'all')">Tout</button>
      <button class="vl-fbtn" onclick="vlFilter(this,'PACA')">PACA</button>
      <button class="vl-fbtn" onclick="vlFilter(this,'Occitanie')">Occitanie</button>
      <button class="vl-fbtn" onclick="vlFilter(this,'Track-Day')">Track-Day</button>
      <button class="vl-fbtn" onclick="vlFilter(this,'Stage GT')">Stage GT</button>
      <div style="margin-left:auto;display:flex;align-items:center;gap:6px;font-family:'DM Mono';font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)">
        Trier :
        <select onchange="vlSort(this.value)"
          style="background:rgba(255,255,255,.05);border:1px solid var(--border);color:var(--text);font-family:'DM Mono';font-size:8px;padding:3px 8px;outline:none;border-radius:4px">
          <option value="prox">Proximité</option>
          <option value="date">Date</option>
          <option value="prix">Prix</option>
        </select>
      </div>
    </div>

    <div id="vl-results">
      <?php
      $prox_map = ['PACA'=>1,'Occitanie'=>2];
      usort($veille_data, fn($a,$b) => ($prox_map[$a['region']]??9) <=> ($prox_map[$b['region']]??9) ?: strcmp($a['date'],$b['date']));
      foreach ($veille_data as $vl):
        $region_cls = strtolower($vl['region']) === 'paca' ? 'vl-tag-paca' : 'vl-tag-occ';
        $type_cls   = str_contains($vl['type'],'GT') ? 'vl-tag-gt' : 'vl-tag-tour';
      ?>
      <div class="vl-row" data-region="<?= e($vl['region']) ?>" data-type="<?= e($vl['type']) ?>"
           id="vlr-<?= $vl['circuit_id'] ?>-<?= $vl['date'] ?>">
        <div class="vl-date-box">
          <div class="vl-day"><?= $vl['day'] ?></div>
          <div class="vl-mo"><?= $vl['mo'] ?></div>
        </div>
        <div class="vl-info">
          <div class="vl-circuit"><?= e($vl['circuit']) ?></div>
          <div class="vl-tags">
            <span class="vl-tag <?= $region_cls ?>"><?= e($vl['region']) ?></span>
            <span class="vl-tag <?= $type_cls ?>"><?= e($vl['type']) ?></span>
          </div>
          <div class="vl-src">Source : <span><?= e($vl['source']) ?></span> · <?= e($vl['org']) ?></div>
        </div>
        <div>
          <div class="vl-price"><?= number_format($vl['prix'],0,',',' ') ?> €</div>
          <div class="vl-price-sub">/ pilote</div>
        </div>
        <div class="vl-acts">
          <button class="btn-add-proj" id="vlbtn-<?= $vl['circuit_id'] ?>-<?= $vl['date'] ?>"
            onclick="addVeille(this,<?= $vl['circuit_id'] ?>,<?= json_encode($vl['date']) ?>,<?= json_encode($vl['type']) ?>,<?= $vl['prix'] ?>,<?= json_encode($vl['source']) ?>)">
            + Ajouter
          </button>
          <button class="btn-ign" onclick="ignoreVl(this)">Ignorer</button>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
  </div>
</div><!-- /veille -->

<!-- ═══ FLOTTE & PARTENAIRES ═══ -->
<div id="s-fleet" style="display:none">
  <div class="card">
    <div class="card-head">
      <div class="card-title"><div class="ctd" style="background:#F5D061"></div>Flotte & Partenaires</div>
      <div class="card-acts">
        <button class="btn btn-primary btn-sm"
          onclick="document.getElementById('fleet-add-form').classList.toggle('open')">
          + Véhicule
        </button>
      </div>
    </div>

    <div class="tw">
      <table id="fleet-table">
        <thead><tr>
          <th>Type</th><th>Véhicule</th><th>Propriété</th><th>Specs</th>
          <th>Circuits</th><th>Lié à un stage</th><th>Visible</th><th>Actions</th>
        </tr></thead>
        <tbody>
        <?php foreach ($vehicules_list as $v):
          $type_map = ['GT'=>'gt','Tourisme'=>'tour','Monoplace'=>'mono','Sport légère'=>'tour'];
          $type_cls  = $type_map[$v['type_vehicule']] ?? 'tour';
          $icon_map  = ['GT'=>'🏎️','Tourisme'=>'🚗','Monoplace'=>'🏁','Sport légère'=>'⚡','Prestige route'=>'🔴'];
          $icon      = $icon_map[$v['type_vehicule']] ?? '🚗';
        ?>
          <tr id="veh-row-<?= $v['id'] ?>">
            <td><span class="fleet-icon"><?= $icon ?></span></td>
            <td class="td-m"><?= e($v['nom']) ?></td>
            <td>
              <?php if ($v['propriete'] === 'jb_emeric'): ?>
                <span class="prop-pill prop-jb">JB EMERIC</span>
              <?php else: ?>
                <span class="prop-pill prop-part">Partenaire</span>
              <?php endif; ?>
            </td>
            <td>
              <span class="spec-tag type-<?= $type_cls ?>"><?= e($v['type_vehicule']) ?></span>
              <?php if ($v['puissance_ch']): ?>
                <span class="spec-tag"><?= $v['puissance_ch'] ?> ch</span>
              <?php endif; ?>
              <span class="spec-tag"><?= e($v['boite'] ?? '—') ?></span>
            </td>
            <td style="font-size:11px;color:var(--muted)">PACA</td>
            <td>
              <?php if ($v['event_linked']): ?>
                <span class="link-tag">
                  ✓ <?= date('d/m', strtotime($v['date_event'])) ?> — <?= e(substr($v['circuit_linked'],0,18)) ?>
                </span>
              <?php else: ?>
                <span class="link-tag unlink-tag"
                  onclick="openLinkModal(<?= $v['id'] ?>, <?= json_encode($v['nom']) ?>)">
                  + Lier un stage
                </span>
              <?php endif; ?>
            </td>
            <td>
              <div class="tog <?= $v['visible_site'] ? 'on' : '' ?>"
                onclick="this.classList.toggle('on')"></div>
            </td>
            <td><div class="td-acts">
              <button class="btn btn-ghost btn-sm"
                onclick="editVeh(<?= json_encode($v) ?>)">Modifier</button>
              <?php if ($role === 'admin'): ?>
              <button class="btn btn-danger btn-sm"
                onclick="deleteVeh(<?= $v['id'] ?>,this)">Suppr.</button>
              <?php endif; ?>
            </div></td>
          </tr>
        <?php endforeach; ?>
        <?php if (empty($vehicules_list)): ?>
          <tr><td colspan="8" style="text-align:center;padding:24px;color:var(--muted)">
            Aucun véhicule enregistré.
          </td></tr>
        <?php endif; ?>
        </tbody>
      </table>
    </div>

    <!-- Formulaire ajout -->
    <div class="fleet-add-form" id="fleet-add-form">
      <div style="font-family:'DM Mono';font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)">
        Nouveau véhicule
      </div>
      <div class="fg3" style="margin-bottom:10px">
        <div style="display:flex;flex-direction:column;gap:6px">
          <label class="form-label">Nom complet *</label>
          <input class="form-input" id="fnew-nom" type="text" placeholder="BMW 325i HTCC">
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label class="form-label">Marque *</label>
          <input class="form-input" id="fnew-marque" type="text" placeholder="BMW">
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label class="form-label">Modèle</label>
          <input class="form-input" id="fnew-modele" type="text" placeholder="325i">
        </div>
      </div>
      <div class="fg3" style="margin-bottom:10px">
        <div style="display:flex;flex-direction:column;gap:6px">
          <label class="form-label">Propriété</label>
          <select class="form-select" id="fnew-prop">
            <option value="jb_emeric">JB EMERIC</option>
            <option value="partenaire">Partenaire</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label class="form-label">Type</label>
          <select class="form-select" id="fnew-type">
            <option>GT</option><option>Tourisme</option>
            <option>Monoplace</option><option>Sport légère</option>
            <option>Prestige route</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label class="form-label">Puissance (ch)</label>
          <input class="form-input" id="fnew-ch" type="number" placeholder="320">
        </div>
      </div>
      <div class="fg2" style="margin-bottom:12px">
        <div style="display:flex;flex-direction:column;gap:6px">
          <label class="form-label">Boîte de vitesses</label>
          <select class="form-select" id="fnew-boite">
            <option>Manuelle</option><option>Séquentielle</option>
            <option>DCT/PDK</option><option>Auto</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label class="form-label">Concessionnaire / Partenaire</label>
          <input class="form-input" id="fnew-concess" type="text" placeholder="Ferrari Marseille...">
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="saveNewVeh()">Enregistrer</button>
        <button class="btn btn-ghost"
          onclick="document.getElementById('fleet-add-form').classList.remove('open')">
          Annuler
        </button>
      </div>
    </div>

  </div>
</div><!-- /fleet -->

<!-- ═══ DATA VISUALISATION ═══ -->
<div id="s-dataviz" style="display:none">

  <div class="dv-grid">

    <!-- Taux de remplissage -->
    <div class="card">
      <div class="card-head">
        <div class="card-title"><div class="ctd" style="background:#22c55e"></div>Taux de remplissage</div>
      </div>
      <div id="fill-list">
      <?php if (empty($fill_stats)): ?>
        <div style="padding:24px;text-align:center;color:var(--muted);font-family:'DM Mono';font-size:9px;letter-spacing:2px;text-transform:uppercase">
          Aucune session ouverte
        </div>
      <?php else: ?>
        <?php
        $max_votes = max(1, max(array_column($top_circuits, 'total_votes')));
        foreach ($fill_stats as $fs):
          $pct = $fs['nb_places'] > 0 ? min(100, round($fs['nb_inscrits']/$fs['nb_places']*100)) : 0;
          $color = $pct >= 90 ? '#ef4444' : ($pct >= 65 ? '#F5D061' : '#22c55e');
        ?>
        <div class="fill-row">
          <div class="fill-top">
            <div class="fill-name"><?= e($fs['circuit_nom']) ?> · <?= date('d M', strtotime($fs['date_event'])) ?></div>
            <div class="fill-nums"><?= $fs['nb_inscrits'] ?>/<?= $fs['nb_places'] ?></div>
            <div class="fill-pct" style="color:<?= $color ?>"><?= $pct ?>%</div>
          </div>
          <div class="fill-bar">
            <div class="fill-fill"
                 style="width:0%;background:<?= $color ?>"
                 data-w="<?= $pct ?>%"></div>
          </div>
        </div>
        <?php endforeach; ?>
      <?php endif; ?>
      </div>
    </div>

    <!-- Top circuits votés -->
    <div class="card">
      <div class="card-head">
        <div class="card-title"><div class="ctd" style="background:#6366f1"></div>Top circuits — Votes clients</div>
      </div>
      <div class="podium" id="podium">
      <?php
      $medals = ['🥇','🥈','🥉','4.','5.'];
      $pod_colors = ['#F5D061','#94a3b8','#78350f','#64748b','#475569'];
      foreach ($top_circuits as $i => $tc):
        $vote_pct = $tc['total_votes'] > 0 ? min(100, round((int)$tc['total_votes'] / max(1,$max_votes) * 100)) : 0;
      ?>
      <div class="pod-row">
        <div class="pod-medal"><?= $medals[$i] ?></div>
        <div class="pod-info">
          <div class="pod-name"><?= e($tc['nom']) ?></div>
          <div class="pod-reg"><?= e($tc['region']) ?></div>
        </div>
        <div class="pod-votes-wrap">
          <div class="pod-bar">
            <div class="pod-fill"
                 style="width:0%;background:<?= $pod_colors[$i] ?>"
                 data-w="<?= $vote_pct ?>%"></div>
          </div>
          <div class="pod-votes" style="color:<?= $pod_colors[$i] ?>"><?= (int)$tc['total_votes'] ?></div>
        </div>
      </div>
      <?php endforeach; ?>
      <?php if (empty($top_circuits)): ?>
        <div style="padding:20px;text-align:center;color:var(--muted);font-family:'DM Mono';font-size:9px;letter-spacing:2px;text-transform:uppercase">Aucun vote enregistré</div>
      <?php endif; ?>
      </div>
    </div>

  </div>

  <!-- Graphique inscriptions -->
  <div class="card">
    <div class="card-head">
      <div class="card-title"><div class="ctd"></div>Inscriptions — 6 derniers mois</div>
    </div>
    <div class="chart-wrap">
      <div class="chart-lbl">Inscriptions confirmées par mois</div>
      <canvas id="insc-chart" height="110"></canvas>
    </div>
  </div>

</div><!-- /dataviz -->

<!-- ═══ MODAL : Lier véhicule à un stage ═══ -->
<div class="mo-overlay" id="link-modal-overlay" onclick="if(event.target===this)closeLinkModal()"
  style="position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.8);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:16px">
  <div style="background:var(--card2);border:1px solid rgba(255,207,0,.15);border-radius:8px;width:100%;max-width:400px;padding:20px;box-shadow:0 40px 80px rgba(0,0,0,.8)">
    <div style="font-family:'DM Mono';font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--Y);margin-bottom:14px" id="link-veh-title">Lier un véhicule</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div>
        <label class="form-label" style="display:block;margin-bottom:5px">Choisir le stage</label>
        <select class="form-select" id="link-event-sel" style="width:100%">
          <option value="">-- Sélectionner --</option>
          <?php foreach ($events_for_link as $ef): ?>
          <option value="<?= $ef['id'] ?>">
            <?= date('d/m/Y', strtotime($ef['date_event'])) ?> — <?= e($ef['circuit_nom']) ?>
          </option>
          <?php endforeach; ?>
        </select>
      </div>
      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="btn btn-primary" onclick="confirmLink()">Lier</button>
        <button class="btn btn-ghost" onclick="closeLinkModal()">Annuler</button>
      </div>
    </div>
  </div>
</div>


  </div><!-- /content -->
</div><!-- /main -->

<script>

// ── Étendre la liste des sections ────────────────────────────────
const SECTIONS = ['dashboard','potential','events','users','import','veille','fleet','dataviz'];
function show(name) {
  SECTIONS.forEach(s => {
    const el = document.getElementById('s-' + s);
    if (el) el.style.display = (s === name) ? 'block' : 'none';
  });
  const titles = {
    dashboard:'Dashboard', potential:'Sessions Potential',
    events:'Toutes les dates', users:'Utilisateurs',
    import:'Import CSV / Access', veille:'Veille Circuits',
    fleet:'Flotte & Partenaires', dataviz:'Data Visualisation'
  };
  document.getElementById('page-title').textContent = titles[name] || name;
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
  // Retrouver le bouton actif par son onclick
  document.querySelectorAll('.sb-link').forEach(l => {
    if (l.getAttribute('onclick') === `show('${name}')`) l.classList.add('active');
  });
  if (name === 'dataviz') requestAnimationFrame(initDataviz);
}

// ── API helper ────────────────────────────────────────────────────
async function api(data) {
  const fd = new FormData();
  data.csrf_token = CSRF;
  Object.entries(data).forEach(([k,v]) => fd.append(k, v));
  const r = await fetch('', { method:'POST', body:fd });
  return r.json();
}

// ── Toast ─────────────────────────────────────────────────────────
function toast(msg, type='ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._to);
  t._to = setTimeout(() => t.className = '', 3200);
}

// ── Veille : filtres ──────────────────────────────────────────────
let _vlFilter = 'all';
function vlFilter(btn, f) {
  document.querySelectorAll('.vl-fbtn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  _vlFilter = f;
  document.querySelectorAll('.vl-row').forEach(row => {
    const region = row.dataset.region || '';
    const type   = row.dataset.type   || '';
    const show   = f === 'all' || region === f || type === f;
    row.style.display = show ? '' : 'none';
  });
}
function vlSort(val) {
  const container = document.getElementById('vl-results');
  const rows = [...container.querySelectorAll('.vl-row')];
  rows.sort((a, b) => {
    if (val === 'prox') {
      const prox = {PACA:1, Occitanie:2};
      return (prox[a.dataset.region]||9) - (prox[b.dataset.region]||9);
    }
    return 0;
  });
  rows.forEach(r => container.appendChild(r));
}

// ── Veille : ajouter aux projets ──────────────────────────────────
async function addVeille(btn, circuitId, date, type, prix, source) {
  btn.disabled = true; btn.textContent = '…';
  const r = await api({ action:'add_veille', circuit_id:circuitId, date_event:date, type, prix, source });
  if (r.ok) {
    btn.textContent = '✓ Ajouté en Potential';
    btn.classList.add('done');
    const row = btn.closest('.vl-row');
    if (row) setTimeout(() => { row.classList.add('added') }, 400);
    toast('Date ajoutée en Potential — visible dans Track-Days');
  } else {
    toast(r.error || 'Erreur', 'err');
    btn.disabled = false; btn.textContent = '+ Ajouter';
  }
}
function ignoreVl(btn) {
  const row = btn.closest('.vl-row');
  if (row) { row.style.opacity='.3'; row.style.pointerEvents='none'; }
}
function simulateScan() {
  const st  = document.getElementById('vl-status');
  const dot = st.querySelector('.vl-dot');
  const txt = st.querySelector('.vl-status-txt');
  dot.style.background = '#F5D061';
  txt.textContent = 'Analyse en cours…';
  setTimeout(() => {
    dot.style.background = '#22c55e';
    txt.textContent = 'Surveillance active — cron toutes les 6h';
    const now = new Date();
    document.getElementById('vl-time').textContent =
      'Analyse : ' + now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
    toast('Scan terminé — ' + document.querySelectorAll('.vl-row:not(.added)').length + ' nouvelles dates');
  }, 2400);
}

// ── Fleet : CRUD ──────────────────────────────────────────────────
async function saveNewVeh() {
  const r = await api({
    action:       'add_vehicule',
    nom:          document.getElementById('fnew-nom').value,
    marque:       document.getElementById('fnew-marque').value,
    modele:       document.getElementById('fnew-modele').value,
    propriete:    document.getElementById('fnew-prop').value,
    type_vehicule:document.getElementById('fnew-type').value,
    puissance_ch: document.getElementById('fnew-ch').value,
    boite:        document.getElementById('fnew-boite').value,
    concessionnaire: document.getElementById('fnew-concess').value,
  });
  if (r.ok) {
    toast('Véhicule ajouté — rechargez la page pour voir');
    document.getElementById('fleet-add-form').classList.remove('open');
  } else {
    toast(r.error || 'Erreur', 'err');
  }
}

async function deleteVeh(id, btn) {
  if (!confirm('Supprimer ce véhicule ?')) return;
  btn.disabled = true;
  const r = await api({ action:'delete_vehicule', vehicule_id:id });
  if (r.ok) {
    const row = document.getElementById('veh-row-' + id);
    if (row) { row.style.opacity='0'; row.style.transition='opacity .3s'; setTimeout(()=>row.remove(),300); }
    toast('Véhicule supprimé');
  } else { toast(r.error||'Erreur','err'); btn.disabled=false; }
}

function editVeh(data) {
  toast('Formulaire de modification — à implémenter en modale complète');
}

// ── Fleet : Lier à un stage ───────────────────────────────────────
let _linkVehId = null;
function openLinkModal(vehId, vehNom) {
  _linkVehId = vehId;
  document.getElementById('link-veh-title').textContent = 'Lier "' + vehNom + '" à un stage';
  document.getElementById('link-modal-overlay').style.display = 'flex';
}
function closeLinkModal() {
  document.getElementById('link-modal-overlay').style.display = 'none';
}
async function confirmLink() {
  const eventId = document.getElementById('link-event-sel').value;
  if (!eventId) { toast('Sélectionnez un stage','err'); return; }
  const r = await api({ action:'lier_vehicule', vehicule_id:_linkVehId, event_id:eventId });
  if (r.ok) {
    toast('Véhicule lié au stage avec succès');
    closeLinkModal();
    setTimeout(()=>location.reload(), 1200);
  } else { toast(r.error||'Erreur','err'); }
}

// ── DataViz ───────────────────────────────────────────────────────
function initDataviz() {
  // Animer les barres de remplissage
  document.querySelectorAll('.fill-fill[data-w]').forEach(b => {
    setTimeout(()=>{ b.style.width = b.dataset.w; }, 80);
  });
  // Animer les barres podium
  document.querySelectorAll('.pod-fill[data-w]').forEach(b => {
    setTimeout(()=>{ b.style.width = b.dataset.w; }, 120);
  });
  // Canvas graphique
  const canvas = document.getElementById('insc-chart');
  if (!canvas || canvas.dataset.drawn) return;
  canvas.dataset.drawn = '1';
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 580;
  canvas.width = W; canvas.height = 110;

  // Données simulées (en prod : requête PHP injectée en JSON)
  const months = ['Oct','Nov','Déc','Jan','Fév','Mar'];
  const vals   = [8, 11, 6, 15, 19, 23];
  const maxV   = Math.max(...vals);
  const pad    = { l:28, r:12, t:10, b:26 };
  const cw = W - pad.l - pad.r;
  const ch = 110 - pad.t - pad.b;
  const step = cw / (vals.length - 1);

  // Grilles horizontales
  ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
  for (let i=0; i<=4; i++) {
    const y = pad.t + (ch/4)*i;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(pad.l+cw,y); ctx.stroke();
  }

  // Gradient fill
  const gFill = ctx.createLinearGradient(0,pad.t,0,pad.t+ch);
  gFill.addColorStop(0, 'rgba(245,208,97,.22)');
  gFill.addColorStop(1, 'rgba(245,208,97,.01)');
  ctx.beginPath();
  vals.forEach((v,i) => {
    const x = pad.l + i*step, y = pad.t + ch - (v/maxV)*ch;
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.lineTo(pad.l+(vals.length-1)*step, pad.t+ch);
  ctx.lineTo(pad.l, pad.t+ch);
  ctx.closePath();
  ctx.fillStyle = gFill; ctx.fill();

  // Ligne
  const gLine = ctx.createLinearGradient(pad.l,0,pad.l+cw,0);
  gLine.addColorStop(0,'#F5D061'); gLine.addColorStop(1,'#C8860A');
  ctx.strokeStyle = gLine; ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  vals.forEach((v,i) => {
    const x = pad.l+i*step, y = pad.t+ch-(v/maxV)*ch;
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.stroke();

  // Points + labels
  vals.forEach((v,i) => {
    const x = pad.l+i*step, y = pad.t+ch-(v/maxV)*ch;
    ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2);
    ctx.fillStyle='#F5D061'; ctx.fill();
    ctx.strokeStyle='#040a1e'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.7)';
    ctx.font='bold 9px DM Mono,monospace'; ctx.textAlign='center';
    ctx.fillText(v, x, y-8);
    ctx.fillStyle='rgba(255,255,255,.25)';
    ctx.font='9px DM Mono,monospace';
    ctx.fillText(months[i], x, pad.t+ch+16);
  });
}


</script>
</body>
</html>
