<?php
/**
 * track.php — JB EMERIC
 * Page Track-Days & Stages — Dynamique PHP + MySQL
 * Remplace track.html pour la production
 */

declare(strict_types=1);
require_once __DIR__ . '/config.php';

session_start_secure();

$pdo     = db();
$user    = current_user();          // null si non connecté
$csrf    = csrf_token();

// ── Charger les sessions Open ────────────────────────────────────
$open_events = $pdo->query(
    "SELECT e.*, c.nom AS circuit_nom, c.region, c.ville,
            c.longueur_km, c.lat, c.lng, c.photo_url,
            v.nom AS veh_nom, v.type_vehicule
       FROM events e
       JOIN circuits c ON c.id = e.circuit_id
  LEFT JOIN vehicules v ON v.id = e.vehicule_id
      WHERE e.status = 'Open'
        AND e.visible_site = 1
        AND e.date_event >= CURDATE()
      ORDER BY e.date_event ASC
      LIMIT 20"
)->fetchAll();

// ── Charger les sessions Potential ───────────────────────────────
$potential_events = $pdo->query(
    "SELECT e.*, c.nom AS circuit_nom, c.region, c.ville,
            c.longueur_km, c.photo_url,
            v.nom AS veh_nom, v.type_vehicule
       FROM events e
       JOIN circuits c ON c.id = e.circuit_id
  LEFT JOIN vehicules v ON v.id = e.vehicule_id
      WHERE e.status = 'Potential'
        AND e.visible_site = 1
      ORDER BY e.nb_votes DESC, e.date_event ASC
      LIMIT 10"
)->fetchAll();

// ── Votes déjà effectués par l'utilisateur courant ───────────────
$user_votes = [];
if ($user) {
    $stmt = $pdo->prepare('SELECT event_id FROM votes WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $user_votes = array_column($stmt->fetchAll(), 'event_id');
} else {
    // Votes par IP pour utilisateurs non connectés
    $ip_hash = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '');
    $stmt = $pdo->prepare('SELECT event_id FROM votes WHERE ip_hash = ?');
    $stmt->execute([$ip_hash]);
    $user_votes = array_column($stmt->fetchAll(), 'event_id');
}

// ── Photos fallback par type ──────────────────────────────────────
$photo_fallback = [
    'default'    => 'https://jbemeric.com/wp-content/uploads/2026/02/B-M-W-325-I-HTCC-3-4-AVANT.jpg',
    'GT'         => 'https://jbemeric.com/wp-content/uploads/2020/07/G-T-3-R-S-3-4-AVANT-JOELLE-LE-LUC-15-8-19-4-300x200.jpg',
    'Tourisme'   => 'https://jbemeric.com/wp-content/uploads/2026/02/B-M-W-325-I-HTCC-COTE.jpg',
    'Monoplace'  => 'https://jbemeric.com/wp-content/uploads/2022/01/BARCELONNETTE-LES-MONOPLACES-4.jpg',
    'Stage GT'   => 'https://jbemeric.com/wp-content/uploads/2020/07/G-T-3-R-S-3-4-AVANT-JOELLE-LE-LUC-15-8-19-4-300x200.jpg',
    'Track-Day'  => 'https://jbemeric.com/wp-content/uploads/2022/01/COACHING-CIRCUIT-compresse-768x576.jpg',
];

function event_photo(array $ev, array $fallback): string {
    if (!empty($ev['photo_url'])) return $ev['photo_url'];
    return $fallback[$ev['type_vehicule'] ?? '']
        ?? $fallback[$ev['type'] ?? '']
        ?? $fallback['default'];
}

$seuil_votes = 5; // configurable
?>
<!DOCTYPE html>
<html lang="fr" data-theme="track">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Track-Days & Stages — JB EMERIC École de Pilotage</title>
<link rel="stylesheet" href="theme.css">
<link rel="stylesheet" href="nav.css">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
/* ══════════════════════════════════════
   Variables locales Track
   ══════════════════════════════════════ */
:root {
  --Y:#FFCF00; --Yd:#C8A000;
  --B2:#0A3D91; --B4:#1252C0; --BN:#040a1e;
  --bg-track:#07080f;
  --card-track:#0d1120;
  --bd-track:rgba(255,255,255,.07);
  --txt:rgba(255,255,255,.92);
  --sec:rgba(255,255,255,.48);
  --muted:rgba(255,255,255,.25);
  --s-open:#22c55e;
  --s-vote:#6366f1;
  --s-full:#ef4444;
}

/* ── Page ── */
.track-root { background: var(--bg-track); color: var(--txt); font-family: 'Outfit', sans-serif; -webkit-font-smoothing: antialiased }

/* ── Section header ── */
.sr-header { padding: clamp(52px,7vw,80px) clamp(20px,5vw,72px) clamp(32px,4vw,48px); position: relative; border-bottom: 1px solid var(--bd-track) }
.sr-header::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--Y),var(--Yd),transparent) }
.sr-kicker { font-family:'DM Mono'; font-size:9px; letter-spacing:4px; text-transform:uppercase; color:rgba(255,207,0,.5); display:flex; align-items:center; gap:12px; margin-bottom:14px }
.sr-kicker::before { content:''; width:28px; height:2px; background:linear-gradient(90deg,var(--Y),var(--Yd)); flex-shrink:0 }
.sr-title { font-family:'Bebas Neue'; font-size:clamp(38px,6vw,64px); line-height:.88; letter-spacing:-1px; color:#fff; margin-bottom:12px }
.sr-title em { font-style:normal; color:var(--Y) }
.sr-lead { font-size:clamp(14px,1.6vw,16px); line-height:1.75; color:var(--sec); max-width:560px }

/* ── Tabs ── */
.sr-tabs { display:flex; gap:0; margin-top:28px; border-bottom:1px solid var(--bd-track) }
.sr-tab { padding:10px 20px; font-family:'DM Mono'; font-size:9px; letter-spacing:2px; text-transform:uppercase; color:var(--muted); cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:all .18s; background:none; border-left:none; border-right:none; border-top:none }
.sr-tab:hover { color:#fff }
.sr-tab.active { color:var(--Y); border-bottom-color:var(--Y) }
.sr-tab .dot { width:6px; height:6px; border-radius:50%; background:var(--s-open); display:inline-block; margin-right:6px; animation:pls 1.4s infinite }
@keyframes pls { 0%,100%{opacity:.9}50%{opacity:.2} }

/* ── Grilles ── */
.sr-section { padding:clamp(28px,4vw,48px) clamp(20px,5vw,72px) }
.sr-section-title { font-family:'DM Mono'; font-size:9px; letter-spacing:3px; text-transform:uppercase; color:var(--muted); margin-bottom:20px; display:flex; align-items:center; gap:10px }
.sr-section-title::after { content:''; flex:1; height:1px; background:var(--bd-track) }
.sr-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px }

/* ── Carte event ── */
.ev-card { background:var(--card-track); border:1px solid var(--bd-track); border-radius:8px; overflow:hidden; display:flex; flex-direction:column; transition:border-color .22s, transform .22s; position:relative }
.ev-card:hover { border-color:rgba(255,207,0,.2); transform:translateY(-3px) }
.ev-card.status-open  { border-top:3px solid var(--s-open) }
.ev-card.status-vote  { border-top:3px solid var(--s-vote) }
.ev-card.status-full  { border-top:3px solid var(--s-full); opacity:.72 }

/* Photo */
.ev-img { position:relative; height:150px; overflow:hidden; background:#040a1e; flex-shrink:0 }
.ev-img img { width:100%; height:100%; object-fit:cover; object-position:center; transition:transform .5s; filter:brightness(.6) saturate(1.2) }
.ev-card:hover .ev-img img { transform:scale(1.06) }
.ev-img::after { content:''; position:absolute; inset:0; background:linear-gradient(to top,rgba(13,17,32,.88) 0%,transparent 55%) }
.ev-badge { position:absolute; top:10px; right:10px; z-index:2; font-family:'DM Mono'; font-size:8px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:4px 10px; border-radius:12px; display:flex; align-items:center; gap:5px }
.ev-badge::before { content:''; width:5px; height:5px; border-radius:50%; background:currentColor; flex-shrink:0 }
.ev-badge.open   { background:rgba(34,197,94,.15); border:1px solid rgba(34,197,94,.35); color:#22c55e }
.ev-badge.open::before { animation:pls 1.4s infinite }
.ev-badge.vote   { background:rgba(99,102,241,.15); border:1px solid rgba(99,102,241,.35); color:#818cf8 }
.ev-badge.full   { background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.3); color:#f87171 }
.ev-date-overlay { position:absolute; bottom:10px; left:14px; z-index:2; font-family:'DM Mono'; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,.85) }

/* Corps */
.ev-body { padding:16px; flex:1; display:flex; flex-direction:column; gap:10px }
.ev-circuit { font-size:17px; font-weight:700; color:#fff; line-height:1.2 }
.ev-meta { font-family:'DM Mono'; font-size:9px; letter-spacing:1px; text-transform:uppercase; color:var(--muted); line-height:1.8 }
.ev-meta strong { color:var(--Y); font-size:10px }

/* Places dots */
.ev-places { display:flex; align-items:center; gap:8px }
.ev-dots { display:flex; gap:3px; flex-wrap:wrap }
.ev-dot { width:8px; height:8px; border-radius:50%; background:var(--s-open) }
.ev-dot.taken { background:rgba(255,255,255,.14) }
.ev-places-lbl { font-family:'DM Mono'; font-size:9px; letter-spacing:1px; color:var(--muted) }

/* Barre vote */
.ev-vote-block { display:flex; flex-direction:column; gap:6px }
.ev-vote-top { display:flex; align-items:center; justify-content:space-between }
.ev-vote-lbl { font-family:'DM Mono'; font-size:8px; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted) }
.ev-vote-num { font-family:'Bebas Neue'; font-size:20px; color:#818cf8; letter-spacing:-1px; line-height:1 }
.ev-vote-bar { height:5px; background:rgba(255,255,255,.08); border-radius:3px; overflow:hidden }
.ev-vote-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,var(--s-vote),#818cf8); transition:width .6s cubic-bezier(.34,1.56,.64,1) }
.ev-vote-fill.almost { background:linear-gradient(90deg,var(--Y),var(--Yd)) }
.ev-vote-fill.done   { background:linear-gradient(90deg,var(--s-open),#16a34a) }
.ev-vote-hint { font-family:'DM Mono'; font-size:8px; letter-spacing:1px; text-transform:uppercase }
.ev-vote-hint.almost { color:rgba(255,207,0,.7) }
.ev-vote-hint.done   { color:#22c55e }
.ev-vote-hint.normal { color:var(--muted) }

/* Tags */
.ev-tags { display:flex; gap:5px; flex-wrap:wrap }
.ev-tag { font-family:'DM Mono'; font-size:7px; letter-spacing:1.5px; text-transform:uppercase; padding:3px 8px; border-radius:10px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); color:var(--muted) }
.ev-tag.gold { background:rgba(255,207,0,.08); border-color:rgba(255,207,0,.2); color:rgba(255,207,0,.7) }

/* Footer carte */
.ev-foot { padding:0 16px 16px; display:flex; gap:8px }
.ev-btn { flex:1; padding:11px 14px; font-family:'DM Mono'; font-size:9px; letter-spacing:2px; text-transform:uppercase; font-weight:700; border:none; border-radius:5px; cursor:pointer; transition:all .18s; display:flex; align-items:center; justify-content:center; gap:7px }
.ev-btn-inscr { background:linear-gradient(135deg,#F5D061,#C8860A); color:#000; box-shadow:0 4px 20px rgba(245,208,97,.2) }
.ev-btn-inscr:hover { filter:brightness(1.08); transform:translateY(-1px) }
.ev-btn-vote  { background:rgba(99,102,241,.15); border:1px solid rgba(99,102,241,.35); color:#818cf8 }
.ev-btn-vote:hover  { background:rgba(99,102,241,.28); color:#fff }
.ev-btn-vote.voted  { background:rgba(99,102,241,.07); border-color:rgba(99,102,241,.15); color:rgba(99,102,241,.45); cursor:default }
.ev-btn-full  { background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.2); color:#f87171; cursor:not-allowed; flex:1 }
.ev-btn-share { flex:0; padding:11px 12px; background:rgba(255,255,255,.05); border:1px solid var(--bd-track); color:var(--sec); border-radius:5px; cursor:pointer; transition:all .18s; font-size:14px }
.ev-btn-share:hover { background:rgba(255,255,255,.1); color:#fff }

/* Vide */
.ev-empty { grid-column:1/-1; text-align:center; padding:44px; color:var(--muted); font-family:'DM Mono'; font-size:10px; letter-spacing:2px; text-transform:uppercase }

/* ═══════════════════════════════════════
   MODAL INSCRIPTION
   ═══════════════════════════════════════ */
.mo-overlay { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.85); backdrop-filter:blur(8px); display:none; align-items:center; justify-content:center; padding:16px }
.mo-overlay.open { display:flex }
.mo { background:var(--card-track); border:1px solid rgba(255,207,0,.15); border-radius:10px; width:100%; max-width:520px; max-height:92vh; overflow-y:auto; box-shadow:0 40px 100px rgba(0,0,0,.8), 0 0 60px rgba(245,208,97,.06) }

.mo-head { padding:18px 22px 14px; border-bottom:1px solid var(--bd-track); display:flex; align-items:flex-start; justify-content:space-between; gap:12px; position:sticky; top:0; background:var(--card-track); z-index:5 }
.mo-title { font-family:'Bebas Neue'; font-size:22px; letter-spacing:1px; color:#fff; line-height:1 }
.mo-sub { font-family:'DM Mono'; font-size:8px; letter-spacing:2px; text-transform:uppercase; color:rgba(255,207,0,.5); margin-top:4px }
.mo-close { background:rgba(255,255,255,.07); border:1px solid var(--bd-track); border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--sec); font-size:14px; transition:all .15s; flex-shrink:0 }
.mo-close:hover { background:rgba(255,255,255,.14); color:#fff }

.mo-body { padding:18px 22px; display:flex; flex-direction:column; gap:18px }
.mo-step { font-family:'DM Mono'; font-size:8px; letter-spacing:2.5px; text-transform:uppercase; color:rgba(255,207,0,.5); margin-bottom:-6px }
.mo-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px }
.mo-field { display:flex; flex-direction:column; gap:6px }
.mo-label { font-family:'DM Mono'; font-size:8px; letter-spacing:2px; text-transform:uppercase; color:var(--muted) }
.mo-input,.mo-select { background:rgba(255,255,255,.05); border:1px solid var(--bd-track); border-radius:5px; color:#fff; font-family:'DM Mono'; font-size:11px; letter-spacing:.5px; padding:10px 12px; outline:none; transition:border-color .15s; -webkit-appearance:none }
.mo-input:focus,.mo-select:focus { border-color:rgba(255,207,0,.45) }
.mo-input::placeholder { color:rgba(255,255,255,.18) }
.mo-select option { background:#111827 }

/* Choix véhicule */
.mo-veh-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px }
.mo-veh { background:rgba(255,255,255,.04); border:2px solid var(--bd-track); border-radius:6px; padding:12px; cursor:pointer; transition:all .18s; text-align:center; display:flex; flex-direction:column; gap:5px }
.mo-veh:hover { border-color:rgba(255,207,0,.3); background:rgba(255,207,0,.04) }
.mo-veh.sel { border-color:var(--Y); background:rgba(255,207,0,.07) }
.mo-veh-icon { font-size:22px }
.mo-veh-name { font-size:12px; font-weight:600; color:#fff; line-height:1.2 }
.mo-veh-sub { font-family:'DM Mono'; font-size:8px; letter-spacing:1px; text-transform:uppercase; color:var(--muted) }

/* Checklist */
.mo-checklist { display:flex; flex-direction:column; gap:7px }
.mo-check { display:flex; align-items:center; gap:12px; padding:10px 13px; background:rgba(255,255,255,.03); border:1px solid var(--bd-track); border-radius:6px; cursor:pointer; transition:all .18s }
.mo-check:hover { background:rgba(255,255,255,.06) }
.mo-check.checked { border-color:rgba(34,197,94,.3); background:rgba(34,197,94,.05) }
.mo-checkbox { width:18px; height:18px; border-radius:4px; border:2px solid rgba(255,255,255,.15); flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:all .18s; font-size:11px; font-weight:700 }
.mo-check.checked .mo-checkbox { background:var(--s-open); border-color:var(--s-open); color:#000 }
.mo-check-text { flex:1; font-size:12px; color:rgba(255,255,255,.65); line-height:1.3 }
.mo-check-icon { font-size:15px; flex-shrink:0 }
.mo-required { font-family:'DM Mono'; font-size:7px; letter-spacing:1px; text-transform:uppercase; color:var(--s-full); flex-shrink:0 }

/* Option coaching */
.mo-coaching { display:flex; align-items:center; gap:13px; padding:13px 15px; background:rgba(255,207,0,.05); border:1px solid rgba(255,207,0,.15); border-radius:6px; cursor:pointer; transition:all .18s }
.mo-coaching:hover { border-color:rgba(255,207,0,.3); background:rgba(255,207,0,.08) }
.mo-coaching.sel { border-color:var(--Y); background:rgba(255,207,0,.1) }
.mo-tog { width:36px; height:20px; border-radius:10px; background:rgba(255,255,255,.12); position:relative; flex-shrink:0; transition:background .2s }
.mo-coaching.sel .mo-tog { background:var(--Y) }
.mo-tog::after { content:''; position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform .2s; box-shadow:0 1px 3px rgba(0,0,0,.3) }
.mo-coaching.sel .mo-tog::after { transform:translateX(16px) }
.mo-coaching-txt .name { font-size:12px; font-weight:600; color:#fff; margin-bottom:2px }
.mo-coaching-txt .sub { font-family:'DM Mono'; font-size:8px; letter-spacing:1px; text-transform:uppercase; color:rgba(255,207,0,.55) }

/* Récap */
.mo-recap { background:rgba(255,255,255,.03); border:1px solid var(--bd-track); border-radius:6px; overflow:hidden }
.mo-recap-row { display:flex; align-items:center; justify-content:space-between; padding:9px 14px; border-bottom:1px solid rgba(255,255,255,.04); font-size:12px }
.mo-recap-row:last-child { border-bottom:none }
.mo-recap-lbl { color:var(--sec) }
.mo-recap-val { font-family:'DM Mono'; font-size:11px; color:#fff; font-weight:500 }
.mo-recap-total .mo-recap-lbl { font-weight:700; color:#fff }
.mo-recap-total .mo-recap-val { font-family:'Bebas Neue'; font-size:22px; color:var(--Y); letter-spacing:-1px }

/* Footer modal */
.mo-foot { padding:14px 22px; border-top:1px solid var(--bd-track); display:flex; gap:8px; position:sticky; bottom:0; background:var(--card-track) }
.mo-btn-confirm { flex:1; padding:13px; background:linear-gradient(135deg,#F5D061,#C8860A); color:#000; font-family:'DM Mono'; font-size:10px; letter-spacing:2.5px; text-transform:uppercase; font-weight:700; border:none; border-radius:6px; cursor:pointer; transition:all .18s; box-shadow:0 4px 20px rgba(245,208,97,.25) }
.mo-btn-confirm:hover { filter:brightness(1.08) }
.mo-btn-confirm:disabled { opacity:.5; cursor:not-allowed }
.mo-btn-cancel { padding:13px 16px; background:rgba(255,255,255,.05); border:1px solid var(--bd-track); color:var(--sec); font-family:'DM Mono'; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; border-radius:6px; cursor:pointer; transition:all .18s }
.mo-btn-cancel:hover { background:rgba(255,255,255,.1); color:#fff }

/* Alerte dans modal */
.mo-alert { padding:10px 14px; border-radius:5px; font-size:12px; line-height:1.5 }
.mo-alert-err { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.25); color:#fca5a5 }
.mo-alert-ok  { background:rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.2); color:#86efac }

/* Écran confirmation */
.mo-confirm-screen { padding:36px 22px; text-align:center; display:none; flex-direction:column; align-items:center; gap:14px }
.mo-confirm-icon { width:60px; height:60px; border-radius:50%; background:rgba(34,197,94,.12); border:2px solid rgba(34,197,94,.3); display:flex; align-items:center; justify-content:center; font-size:26px }
.mo-confirm-title { font-family:'Bebas Neue'; font-size:26px; color:#fff; letter-spacing:1px }
.mo-confirm-sub { font-size:14px; color:var(--sec); line-height:1.65 }
.mo-confirm-ref { font-family:'DM Mono'; font-size:11px; letter-spacing:2px; color:var(--Y) }

/* Toast */
#tr-toast { position:fixed; bottom:22px; right:22px; z-index:2000; background:#0d1120; border:1px solid var(--bd-track); border-radius:6px; padding:12px 18px; font-family:'DM Mono'; font-size:10px; letter-spacing:1px; text-transform:uppercase; box-shadow:0 8px 32px rgba(0,0,0,.6); transform:translateY(20px); opacity:0; transition:all .25s; pointer-events:none }
#tr-toast.show { transform:translateY(0); opacity:1 }
#tr-toast.ok  { border-color:rgba(34,197,94,.3); color:#22c55e }
#tr-toast.err { border-color:rgba(239,68,68,.3); color:#f87171 }

/* Empty state */
.ev-empty-state { grid-column:1/-1; text-align:center; padding:52px 20px }
.ev-empty-icon { font-size:36px; margin-bottom:12px; opacity:.4 }
.ev-empty-text { font-family:'DM Mono'; font-size:9px; letter-spacing:2.5px; text-transform:uppercase; color:var(--muted) }
</style>
</head>
<body>

<!-- nav injectée via nav.css / JS include selon votre setup -->

<div class="track-root">

<!-- ── Header section ── -->
<div class="sr-header">
  <div class="sr-kicker">Track-Days & Stages 2026</div>
  <h1 class="sr-title">SESSIONS <em>DISPONIBLES</em><br>& EN ATTENTE DE VOTE</h1>
  <p class="sr-lead">
    Inscrivez-vous aux sessions confirmées ou votez pour déclencher une date.
    À partir de <?= $seuil_votes ?> pilotes intéressés, JB valide la sortie.
  </p>

  <div class="sr-tabs">
    <button class="sr-tab active" onclick="switchTab('all',this)">Toutes</button>
    <button class="sr-tab" onclick="switchTab('open',this)">
      <span class="dot"></span>Inscriptions ouvertes
      <span style="background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);color:#22c55e;font-family:'DM Mono';font-size:7px;padding:1px 7px;border-radius:10px;margin-left:4px">
        <?= count($open_events) ?>
      </span>
    </button>
    <button class="sr-tab" onclick="switchTab('vote',this)">Vote en cours
      <span style="background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);color:#818cf8;font-family:'DM Mono';font-size:7px;padding:1px 7px;border-radius:10px;margin-left:4px">
        <?= count($potential_events) ?>
      </span>
    </button>
  </div>
</div>

<!-- ══════════════════════════════════════
     SESSIONS CONFIRMÉES — Open
     ══════════════════════════════════════ -->
<div class="sr-section" id="section-open" data-section="open">
  <div class="sr-section-title">
    <span style="color:var(--s-open)">●</span>
    Sessions confirmées — Inscriptions ouvertes
  </div>

  <?php if (empty($open_events)): ?>
  <div class="sr-grid">
    <div class="ev-empty-state">
      <div class="ev-empty-icon">🏁</div>
      <div class="ev-empty-text">Aucune session ouverte pour le moment — revenez bientôt</div>
    </div>
  </div>
  <?php else: ?>
  <div class="sr-grid">
    <?php foreach ($open_events as $ev):
      $photo   = event_photo($ev, $photo_fallback);
      $taken   = (int) $ev['nb_inscrits'];
      $total   = (int) $ev['nb_places'];
      $restant = $total - $taken;
      $is_full = $taken >= $total;
    ?>
    <div class="ev-card status-<?= $is_full ? 'full' : 'open' ?>"
         id="evc-<?= $ev['id'] ?>">

      <div class="ev-img">
        <img src="<?= e($photo) ?>" alt="<?= e($ev['circuit_nom']) ?>" loading="lazy">
        <?php if ($is_full): ?>
          <span class="ev-badge full">Complet</span>
        <?php else: ?>
          <span class="ev-badge open">Confirmé</span>
        <?php endif; ?>
        <div class="ev-date-overlay">
          <?= date('D d M Y', strtotime($ev['date_event'])) ?>
        </div>
      </div>

      <div class="ev-body">
        <div class="ev-circuit"><?= e($ev['circuit_nom']) ?></div>
        <div class="ev-meta">
          <?= e($ev['region']) ?> · <?= e($ev['ville'] ?? '') ?><br>
          <?= e($ev['type']) ?> · <?= date('H\h', strtotime($ev['heure_debut'])) ?>–<?= date('H\h', strtotime($ev['heure_fin'])) ?><br>
          <strong><?= number_format((float)$ev['prix'], 0, ',', ' ') ?> €</strong> / pilote
          <?php if ($ev['prix_coaching']): ?>
            · Coaching +<?= number_format((float)$ev['prix_coaching'], 0) ?> €
          <?php endif; ?>
        </div>

        <!-- Jauges places -->
        <div class="ev-places">
          <div class="ev-dots" id="dots-<?= $ev['id'] ?>">
            <?php for ($i = 0; $i < $total; $i++): ?>
              <div class="ev-dot <?= $i < $taken ? 'taken' : '' ?>"></div>
            <?php endfor; ?>
          </div>
          <span class="ev-places-lbl">
            <?= $is_full ? 'Complet' : $restant . ' place' . ($restant > 1 ? 's' : '') ?>
          </span>
        </div>

        <div class="ev-tags">
          <?php if ($ev['veh_nom']): ?>
            <span class="ev-tag"><?= e($ev['veh_nom']) ?></span>
          <?php endif; ?>
          <?php if ($ev['longueur_km']): ?>
            <span class="ev-tag"><?= $ev['longueur_km'] ?> km</span>
          <?php endif; ?>
          <?php if ($ev['prix_coaching']): ?>
            <span class="ev-tag gold">+ Coaching JB</span>
          <?php endif; ?>
        </div>
      </div>

      <div class="ev-foot">
        <?php if ($is_full): ?>
          <button class="ev-btn ev-btn-full">Complet — liste d'attente</button>
        <?php else: ?>
          <button class="ev-btn ev-btn-inscr"
            onclick="openModal(<?= $ev['id'] ?>,<?= e(json_encode([
              'titre'         => $ev['circuit_nom'] . ' — ' . date('d M', strtotime($ev['date_event'])),
              'type'          => $ev['type'],
              'prix'          => (float)$ev['prix'],
              'prix_coaching' => (float)($ev['prix_coaching'] ?? 0),
              'prix_location' => (float)($ev['prix_location'] ?? 0),
            ])) ?>)">
            S'inscrire →
          </button>
        <?php endif; ?>
        <button class="ev-btn-share" title="Partager" onclick="shareEvent('<?= e($ev['circuit_nom']) ?>')">⎘</button>
      </div>

    </div>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>
</div>

<!-- ══════════════════════════════════════
     PROJETS EN ATTENTE — Potential
     ══════════════════════════════════════ -->
<div class="sr-section" id="section-vote" data-section="vote">
  <div class="sr-section-title">
    <span style="color:var(--s-vote)">●</span>
    Projets en attente — Votez pour déclencher une date
  </div>

  <?php if (empty($potential_events)): ?>
  <div class="sr-grid">
    <div class="ev-empty-state">
      <div class="ev-empty-icon">🗳️</div>
      <div class="ev-empty-text">Aucun projet en attente de vote pour le moment</div>
    </div>
  </div>
  <?php else: ?>
  <div class="sr-grid">
    <?php foreach ($potential_events as $ev):
      $photo    = event_photo($ev, $photo_fallback);
      $nb       = (int) $ev['nb_votes'];
      $pct      = min(100, (int) round($nb / $seuil_votes * 100));
      $has_voted = in_array((int)$ev['id'], $user_votes, true);
      $hint_class = $pct >= 100 ? 'done' : ($pct >= 60 ? 'almost' : 'normal');
      $fill_class = $pct >= 100 ? 'done' : ($pct >= 60 ? 'almost' : '');
    ?>
    <div class="ev-card status-vote" id="evc-<?= $ev['id'] ?>">

      <div class="ev-img">
        <img src="<?= e($photo) ?>" alt="<?= e($ev['circuit_nom']) ?>" loading="lazy">
        <span class="ev-badge vote" id="badge-<?= $ev['id'] ?>">
          <?= $pct >= 100 ? 'Proche validation' : 'Vote en cours' ?>
        </span>
        <div class="ev-date-overlay">
          <?= date('D d M Y', strtotime($ev['date_event'])) ?>
        </div>
      </div>

      <div class="ev-body">
        <div class="ev-circuit"><?= e($ev['circuit_nom']) ?></div>
        <div class="ev-meta">
          <?= e($ev['region']) ?> · <?= e($ev['ville'] ?? '') ?><br>
          <?= e($ev['type']) ?> · <strong><?= number_format((float)$ev['prix'], 0, ',', ' ') ?> €</strong>
        </div>

        <!-- Barre vote -->
        <div class="ev-vote-block">
          <div class="ev-vote-top">
            <span class="ev-vote-lbl">Pilotes intéressés</span>
            <span class="ev-vote-num" id="vnum-<?= $ev['id'] ?>"><?= $nb ?></span>
          </div>
          <div class="ev-vote-bar">
            <div class="ev-vote-fill <?= $fill_class ?>"
                 id="vfill-<?= $ev['id'] ?>"
                 style="width:<?= $pct ?>%"></div>
          </div>
          <span class="ev-vote-hint <?= $hint_class ?>" id="vhint-<?= $ev['id'] ?>">
            <?php if ($pct >= 100): ?>
              ✅ Seuil atteint — validation en cours
            <?php elseif ($pct >= 60): ?>
              ⚡ Proche — encore <?= $seuil_votes - $nb ?> vote<?= ($seuil_votes - $nb > 1 ? 's' : '') ?>
            <?php else: ?>
              <?= $seuil_votes - $nb ?> vote<?= ($seuil_votes - $nb > 1 ? 's' : '') ?> pour valider la sortie
            <?php endif; ?>
          </span>
        </div>

        <div class="ev-tags">
          <?php if ($ev['veh_nom']): ?>
            <span class="ev-tag"><?= e($ev['veh_nom']) ?></span>
          <?php endif; ?>
          <?php if ($ev['longueur_km']): ?>
            <span class="ev-tag"><?= $ev['longueur_km'] ?> km</span>
          <?php endif; ?>
          <?php if ($ev['prix_coaching']): ?>
            <span class="ev-tag gold">+ Coaching JB</span>
          <?php endif; ?>
        </div>
      </div>

      <div class="ev-foot">
        <button
          class="ev-btn ev-btn-vote <?= $has_voted ? 'voted' : '' ?>"
          id="vbtn-<?= $ev['id'] ?>"
          data-event="<?= $ev['id'] ?>"
          data-seuil="<?= $seuil_votes ?>"
          onclick="doVote(<?= $ev['id'] ?>, this)"
          <?= $has_voted ? 'disabled' : '' ?>>
          <?= $has_voted ? '✓ Votre vote est enregistré' : '✋ Voter pour cette date' ?>
        </button>
        <button class="ev-btn-share" title="Partager"
          onclick="shareEvent('<?= e($ev['circuit_nom']) ?>')">⎘</button>
      </div>

    </div>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>
</div>

</div><!-- /track-root -->


<!-- ══════════════════════════════════════
     MODAL INSCRIPTION
     ══════════════════════════════════════ -->
<div class="mo-overlay" id="mo-overlay" onclick="closeModalOutside(event)">
  <div class="mo" id="mo">

    <!-- Formulaire -->
    <div id="mo-form">
      <div class="mo-head">
        <div>
          <div class="mo-title" id="mo-title">S'inscrire</div>
          <div class="mo-sub" id="mo-sub">Session · JB EMERIC</div>
        </div>
        <button class="mo-close" onclick="closeModal()">✕</button>
      </div>

      <div class="mo-body">
        <div id="mo-alert" style="display:none"></div>

        <!-- Infos pilote -->
        <div>
          <div class="mo-step">01 — Vos coordonnées</div>
        </div>
        <?php if ($user): ?>
        <div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:5px;padding:10px 14px;font-size:12px;color:#86efac;font-family:'DM Mono';letter-spacing:.5px">
          ✓ Connecté en tant que
          <strong><?= e($user['prenom'] . ' ' . $user['nom']) ?></strong>
          — <?= e($user['email']) ?>
        </div>
        <?php else: ?>
        <div class="mo-grid2">
          <div class="mo-field">
            <label class="mo-label">Prénom *</label>
            <input class="mo-input" type="text" id="mo-prenom" placeholder="Jean" required>
          </div>
          <div class="mo-field">
            <label class="mo-label">Nom *</label>
            <input class="mo-input" type="text" id="mo-nom" placeholder="Dupont" required>
          </div>
        </div>
        <div class="mo-field">
          <label class="mo-label">Email *</label>
          <input class="mo-input" type="email" id="mo-email" placeholder="pilote@email.com" required>
        </div>
        <div class="mo-field">
          <label class="mo-label">Téléphone</label>
          <input class="mo-input" type="tel" id="mo-tel" placeholder="06 XX XX XX XX">
        </div>
        <?php endif; ?>

        <!-- Véhicule -->
        <div>
          <div class="mo-step">02 — Votre véhicule</div>
        </div>
        <div class="mo-veh-grid">
          <div class="mo-veh sel" onclick="selectVeh(this,0)" id="veh-perso">
            <div class="mo-veh-icon">🏎️</div>
            <div class="mo-veh-name">Ma propre voiture</div>
            <div class="mo-veh-sub">Inclus dans le tarif</div>
          </div>
          <div class="mo-veh" onclick="selectVeh(this,1)" id="veh-location"
               style="<?= ''; // masqué si prix_location = 0 — géré en JS ?>">
            <div class="mo-veh-icon">⭐</div>
            <div class="mo-veh-name">Location JB EMERIC</div>
            <div class="mo-veh-sub" id="loc-price">+ X €</div>
          </div>
        </div>

        <!-- Checklist obligatoire -->
        <div>
          <div class="mo-step">03 — Check-list équipements</div>
        </div>
        <div class="mo-checklist">
          <div class="mo-check" onclick="toggleCheck(this,'check_assurance')">
            <div class="mo-checkbox"></div>
            <div class="mo-check-text">J'ai mon assurance Responsabilité Civile Sport Auto</div>
            <span class="mo-check-icon">🛡️</span>
            <span class="mo-required">REQUIS</span>
            <input type="checkbox" name="check_assurance" style="display:none">
          </div>
          <div class="mo-check" onclick="toggleCheck(this,'check_casque')">
            <div class="mo-checkbox"></div>
            <div class="mo-check-text">J'ai mon casque homologué (ou je souhaite en louer un)</div>
            <span class="mo-check-icon">⛑️</span>
            <input type="checkbox" name="check_casque" style="display:none">
          </div>
          <div class="mo-check" onclick="toggleCheck(this,'check_crochet')">
            <div class="mo-checkbox"></div>
            <div class="mo-check-text">Mon véhicule est équipé d'un crochet de remorquage</div>
            <span class="mo-check-icon">🔗</span>
            <input type="checkbox" name="check_crochet" style="display:none">
          </div>
          <div class="mo-check" onclick="toggleCheck(this,'check_reglement')">
            <div class="mo-checkbox"></div>
            <div class="mo-check-text">J'ai lu et j'accepte le règlement intérieur JB EMERIC</div>
            <span class="mo-check-icon">📋</span>
            <input type="checkbox" name="check_reglement" style="display:none">
          </div>
        </div>

        <!-- Option coaching -->
        <div>
          <div class="mo-step">04 — Options</div>
        </div>
        <div class="mo-coaching" id="mo-coaching" onclick="toggleCoaching()">
          <div class="mo-tog"></div>
          <div class="mo-coaching-txt">
            <div class="name">Coaching personnalisé JB Emeric sur place</div>
            <div class="sub" id="coaching-price-sub">+ X € · Suivi individuel journée complète</div>
          </div>
        </div>

        <!-- Récap -->
        <div class="mo-recap">
          <div class="mo-recap-row">
            <span class="mo-recap-lbl">Session</span>
            <span class="mo-recap-val" id="recap-base">— €</span>
          </div>
          <div class="mo-recap-row" id="recap-veh-row" style="display:none">
            <span class="mo-recap-lbl">Location véhicule</span>
            <span class="mo-recap-val" id="recap-veh-val">+ 0 €</span>
          </div>
          <div class="mo-recap-row" id="recap-coach-row" style="display:none">
            <span class="mo-recap-lbl">Coaching JB</span>
            <span class="mo-recap-val" id="recap-coach-val">+ 0 €</span>
          </div>
          <div class="mo-recap-row mo-recap-total">
            <span class="mo-recap-lbl">Total</span>
            <span class="mo-recap-val" id="recap-total">— €</span>
          </div>
        </div>

      </div><!-- /mo-body -->

      <div class="mo-foot">
        <button class="mo-btn-cancel" onclick="closeModal()">Annuler</button>
        <button class="mo-btn-confirm" id="mo-submit" onclick="submitInscription()">
          Confirmer l'inscription →
        </button>
      </div>
    </div><!-- /mo-form -->

    <!-- Écran confirmation -->
    <div class="mo-confirm-screen" id="mo-confirm">
      <div class="mo-confirm-icon">✓</div>
      <div class="mo-confirm-title">Inscription envoyée !</div>
      <p class="mo-confirm-sub">
        JB vous contactera dans les 24h pour confirmer votre place<br>
        et vous transmettre les informations pratiques.
      </p>
      <div class="mo-confirm-ref" id="mo-ref"></div>
      <p class="mo-confirm-sub" style="margin-top:8px">
        <strong style="color:#fff">jbemeric@jbemeric.com</strong><br>
        06 60 18 87 87
      </p>
      <button class="ev-btn ev-btn-inscr" style="margin-top:8px;padding:12px 28px;border:none"
        onclick="closeModal()">Fermer</button>
    </div>

  </div><!-- /mo -->
</div><!-- /overlay -->

<!-- Toast -->
<div id="tr-toast"></div>

<script>
const CSRF   = <?= json_encode($csrf) ?>;
const IS_AUTH = <?= json_encode((bool) $user) ?>;
<?php if ($user): ?>
const USER = <?= json_encode(['id'=>$user['id'],'nom'=>$user['nom'],'prenom'=>$user['prenom'],'email'=>$user['email']]) ?>;
<?php else: ?>
const USER = null;
<?php endif; ?>

// ── Toast ─────────────────────────────────────────────────────────
function toast(msg, type = 'ok') {
  const t = document.getElementById('tr-toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._to);
  t._to = setTimeout(() => t.className = '', 3500);
}

// ── Tabs ──────────────────────────────────────────────────────────
function switchTab(filter, btn) {
  document.querySelectorAll('.sr-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['open','vote'].forEach(s => {
    const el = document.getElementById('section-' + s);
    if (!el) return;
    el.style.display = (filter === 'all' || filter === s) ? 'block' : 'none';
  });
}

// ── Vote ──────────────────────────────────────────────────────────
async function doVote(eventId, btn) {
  btn.disabled = true;
  btn.textContent = '…';

  const fd = new FormData();
  fd.append('action', 'vote');
  fd.append('event_id', eventId);
  fd.append('csrf_token', CSRF);

  try {
    const res  = await fetch('vote.php', { method:'POST', body: fd });
    const data = await res.json();

    if (data.already) {
      btn.classList.add('voted');
      btn.textContent = '✓ Déjà voté';
      toast('Vous avez déjà voté pour cette date.', 'err');
      return;
    }
    if (!data.ok) {
      btn.disabled = false;
      btn.textContent = '✋ Voter pour cette date';
      toast(data.error || 'Erreur', 'err');
      return;
    }

    // Mise à jour UI
    const nb   = data.nb_votes;
    const pct  = data.pct;
    const fill = document.getElementById('vfill-' + eventId);
    const num  = document.getElementById('vnum-'  + eventId);
    const hint = document.getElementById('vhint-' + eventId);
    const badge= document.getElementById('badge-' + eventId);

    if (num)  num.textContent  = nb;
    if (fill) {
      fill.style.width = pct + '%';
      if (pct >= 100) fill.className = 'ev-vote-fill done';
      else if (pct >= 60) fill.className = 'ev-vote-fill almost';
    }
    if (hint) {
      if (pct >= 100) {
        hint.className   = 'ev-vote-hint done';
        hint.textContent = '✅ Seuil atteint — validation en cours';
        if (badge) { badge.className = 'ev-badge open'; badge.textContent = 'Proche validation'; }
      } else if (pct >= 60) {
        hint.className   = 'ev-vote-hint almost';
        hint.textContent = '⚡ Proche — encore ' + (data.seuil - nb) + ' vote' + (data.seuil - nb > 1 ? 's' : '');
      } else {
        hint.textContent = (data.seuil - nb) + ' votes pour valider la sortie';
      }
    }

    btn.classList.add('voted');
    btn.textContent = '✓ Votre vote est enregistré';
    toast('Vote enregistré ! Merci 🏁');

  } catch(e) {
    btn.disabled = false;
    btn.textContent = '✋ Voter pour cette date';
    toast('Erreur réseau', 'err');
  }
}

// ── Modal Inscription ─────────────────────────────────────────────
let _modal = { eventId: null, base: 0, coaching: 0, location: 0, hasVeh: false, hasCoach: false };

function openModal(eventId, meta) {
  _modal = { eventId, base: meta.prix, coaching: meta.prix_coaching, location: meta.prix_location, hasVeh: false, hasCoach: false };

  document.getElementById('mo-title').textContent = meta.titre || 'Inscription';
  document.getElementById('mo-sub').textContent   = meta.type + ' · JB EMERIC';
  document.getElementById('recap-base').textContent = fmt(meta.prix);
  document.getElementById('mo-alert').style.display = 'none';

  // Prix location
  const locEl = document.getElementById('veh-location');
  const locPrice = document.getElementById('loc-price');
  if (meta.prix_location) {
    locEl.style.display = '';
    locPrice.textContent = '+' + fmt(meta.prix_location);
  } else {
    locEl.style.display = 'none';
  }

  // Prix coaching
  const coachSub = document.getElementById('coaching-price-sub');
  if (meta.prix_coaching) {
    coachSub.textContent = '+' + fmt(meta.prix_coaching) + ' · Suivi individuel journée complète';
    document.getElementById('recap-coach-val').textContent = '+' + fmt(meta.prix_coaching);
  }
  document.getElementById('recap-veh-val').textContent = '+' + fmt(meta.prix_location);

  // Reset checks
  document.querySelectorAll('.mo-check').forEach(c => {
    c.classList.remove('checked');
    const cb = c.querySelector('input[type=checkbox]');
    if (cb) cb.checked = false;
    const box = c.querySelector('.mo-checkbox');
    if (box) box.textContent = '';
  });
  // Reset véhicule
  document.getElementById('veh-perso')?.classList.add('sel');
  document.getElementById('veh-location')?.classList.remove('sel');
  // Reset coaching
  document.getElementById('mo-coaching').classList.remove('sel');
  // Reset form/confirm
  document.getElementById('mo-form').style.display = '';
  document.getElementById('mo-confirm').style.display = 'none';

  updateTotal();

  document.getElementById('mo-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('mo-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function closeModalOutside(e) {
  if (e.target === document.getElementById('mo-overlay')) closeModal();
}

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' €' }

function updateTotal() {
  const total = _modal.base + (_modal.hasVeh ? _modal.location : 0) + (_modal.hasCoach ? _modal.coaching : 0);
  document.getElementById('recap-total').textContent = fmt(total);
  document.getElementById('recap-veh-row').style.display   = (_modal.hasVeh   && _modal.location) ? '' : 'none';
  document.getElementById('recap-coach-row').style.display = (_modal.hasCoach && _modal.coaching) ? '' : 'none';
}

function selectVeh(el, isLoc) {
  document.querySelectorAll('.mo-veh').forEach(v => v.classList.remove('sel'));
  el.classList.add('sel');
  _modal.hasVeh = !!isLoc;
  updateTotal();
}

function toggleCheck(el, name) {
  el.classList.toggle('checked');
  const cb  = el.querySelector('input[type=checkbox]');
  const box = el.querySelector('.mo-checkbox');
  const checked = el.classList.contains('checked');
  if (cb)  cb.checked = checked;
  if (box) box.textContent = checked ? '✓' : '';
}

function toggleCoaching() {
  const opt = document.getElementById('mo-coaching');
  opt.classList.toggle('sel');
  _modal.hasCoach = opt.classList.contains('sel');
  updateTotal();
}

async function submitInscription() {
  const btn = document.getElementById('mo-submit');
  const alert = document.getElementById('mo-alert');
  alert.style.display = 'none';

  // Validation assurance (obligatoire)
  const assuranceCheck = document.querySelector('.mo-check[onclick*="check_assurance"]');
  if (!assuranceCheck?.classList.contains('checked')) {
    alert.className = 'mo-alert mo-alert-err';
    alert.textContent = '⚠ L\'assurance Responsabilité Civile est obligatoire.';
    alert.style.display = 'block';
    alert.scrollIntoView({ behavior:'smooth', block:'nearest' });
    return;
  }

  btn.disabled = true;
  btn.textContent = '…';

  const fd = new FormData();
  fd.append('action',     'inscription');
  fd.append('csrf_token', CSRF);
  fd.append('event_id',   _modal.eventId);

  if (IS_AUTH) {
    fd.append('nom',    USER.nom);
    fd.append('prenom', USER.prenom);
    fd.append('email',  USER.email);
  } else {
    fd.append('nom',    document.getElementById('mo-nom')?.value    || '');
    fd.append('prenom', document.getElementById('mo-prenom')?.value || '');
    fd.append('email',  document.getElementById('mo-email')?.value  || '');
    fd.append('tel',    document.getElementById('mo-tel')?.value    || '');
  }

  document.querySelectorAll('.mo-check').forEach(ch => {
    const cb = ch.querySelector('input[type=checkbox]');
    if (cb) fd.append(cb.name, ch.classList.contains('checked') ? '1' : '');
  });

  if (_modal.hasCoach) fd.append('option_coaching', '1');
  if (_modal.hasVeh)   fd.append('option_location', '1');

  try {
    const res  = await fetch('vote.php', { method:'POST', body: fd });
    const data = await res.json();

    if (data.ok) {
      document.getElementById('mo-form').style.display    = 'none';
      const conf = document.getElementById('mo-confirm');
      conf.style.display = 'flex';
      document.getElementById('mo-ref').textContent = 'Référence : ' + (data.ref || '');
      toast('Inscription confirmée ! 🏁');

      // Mettre à jour les points places dans la carte
      const dots = document.getElementById('dots-' + _modal.eventId);
      if (dots) {
        const free = dots.querySelectorAll('.ev-dot:not(.taken)');
        if (free.length) free[0].classList.add('taken');
      }
    } else {
      alert.className = 'mo-alert mo-alert-err';
      alert.textContent = '⚠ ' + (data.error || 'Erreur inconnue.');
      alert.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Confirmer l\'inscription →';
    }
  } catch(e) {
    alert.className = 'mo-alert mo-alert-err';
    alert.textContent = '⚠ Erreur réseau. Réessayez ou contactez JB directement.';
    alert.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Confirmer l\'inscription →';
  }
}

// ── Partage ───────────────────────────────────────────────────────
function shareEvent(name) {
  if (navigator.share) {
    navigator.share({ title: name + ' — JB EMERIC', url: location.href });
  } else {
    navigator.clipboard?.writeText(location.href);
    toast('Lien copié !');
  }
}
</script>

</body>
</html>
