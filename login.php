<?php
/**
 * login.php — JB EMERIC
 * Authentification + gestion de session sécurisée
 */

declare(strict_types=1);
require_once __DIR__ . '/config.php';

session_start_secure();

// Déjà connecté → redirection selon rôle
if (is_logged()) {
    $user = current_user();
    redirect($user['role'] === 'client' ? 'index.html' : 'admin-dashboard.php');
}

$error   = '';
$success = '';

// ════════════════════════════════════════════════════════════════════
//  POST — Traitement formulaire
// ════════════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    csrf_check();

    $email    = trim($_POST['email']    ?? '');
    $password = trim($_POST['password'] ?? '');

    if (!$email || !$password) {
        $error = 'Veuillez remplir tous les champs.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Adresse e-mail invalide.';
    } else {
        $stmt = db()->prepare(
            'SELECT id, nom, prenom, email, password, role
               FROM users
              WHERE email = ?
              LIMIT 1'
        );
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            // Régénère l'ID de session contre la fixation
            session_regenerate_id(true);

            $_SESSION['user_id']   = $user['id'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['user_nom']  = $user['prenom'] . ' ' . $user['nom'];

            // Mise à jour dernière connexion (optionnel)
            db()->prepare('UPDATE users SET updated_at=NOW() WHERE id=?')
               ->execute([$user['id']]);

            // Redirection selon rôle
            $redirect = $_GET['redirect'] ?? '';
            if ($redirect && str_starts_with($redirect, '/')) {
                redirect($redirect);
            }
            match ($user['role']) {
                'admin', 'moderateur' => redirect('admin-dashboard.php'),
                default               => redirect('index.html'),
            };
        } else {
            // Délai anti-brute-force (500ms)
            usleep(500_000);
            $error = 'Identifiants incorrects. Vérifiez votre e-mail et mot de passe.';
        }
    }
}

// ── Réinitialisation mot de passe (POST) ──────────────────────────
if (isset($_POST['action']) && $_POST['action'] === 'reset_request') {
    csrf_check();
    $email = trim($_POST['reset_email'] ?? '');
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $token  = bin2hex(random_bytes(32));
        $expire = date('Y-m-d H:i:s', time() + 3600);
        $stmt   = db()->prepare(
            'UPDATE users SET token_reset=?, token_expire=? WHERE email=?'
        );
        $stmt->execute([$token, $expire, $email]);
        // En production : envoyer l'email ici (PHPMailer / wp_mail)
    }
    // Toujours afficher le même message (anti-énumération)
    $success = 'Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.';
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Connexion — JB EMERIC Back-Office</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
:root {
  --Y:#FFCF00; --Yd:#C8A000; --B2:#0A3D91; --B4:#1252C0;
  --BN:#040a1e; --NK:#08080f;
  --bg:#07080f; --card:#0d1120; --border:rgba(255,255,255,.08);
  --text:rgba(255,255,255,.9); --muted:rgba(255,255,255,.4);
}
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0 }
body {
  font-family:'Outfit',sans-serif; background:var(--bg);
  color:var(--text); min-height:100vh;
  display:flex; align-items:center; justify-content:center;
  padding:20px; -webkit-font-smoothing:antialiased;
}
/* Fond subtil */
body::before {
  content:''; position:fixed; inset:0; z-index:0;
  background:
    radial-gradient(ellipse at 20% 20%, rgba(10,61,145,.12) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(255,207,0,.04) 0%, transparent 50%);
  pointer-events:none;
}
.card {
  background:var(--card); border:1px solid var(--border);
  border-radius:10px; width:100%; max-width:420px;
  position:relative; z-index:1;
  box-shadow:0 32px 80px rgba(0,0,0,.8), 0 0 60px rgba(10,61,145,.08);
  overflow:hidden;
}
.card::before {
  content:''; position:absolute; top:0; left:0; right:0; height:3px;
  background:linear-gradient(90deg,#F5D061,#C8860A,rgba(200,134,10,0));
}
.card-head {
  padding:28px 28px 20px;
  border-bottom:1px solid var(--border);
  text-align:center;
}
.logo { font-family:'Bebas Neue'; font-size:28px; letter-spacing:2px; color:#fff }
.logo em {
  font-style:normal;
  background:linear-gradient(135deg,#F5D061,#C8860A);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  background-clip:text;
}
.subtitle {
  font-family:'DM Mono'; font-size:8px; letter-spacing:3px;
  text-transform:uppercase; color:var(--muted); margin-top:6px;
}
.card-body { padding:24px 28px; display:flex; flex-direction:column; gap:16px }

/* Alertes */
.alert {
  padding:10px 14px; border-radius:5px; font-size:13px; line-height:1.5;
  display:flex; align-items:flex-start; gap:8px;
}
.alert-error   { background:rgba(239,68,68,.1);  border:1px solid rgba(239,68,68,.25);  color:#fca5a5 }
.alert-success { background:rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.2);  color:#86efac }
.alert-icon { flex-shrink:0; margin-top:1px }

/* Champs */
.field { display:flex; flex-direction:column; gap:6px }
.label {
  font-family:'DM Mono'; font-size:8px; letter-spacing:2px;
  text-transform:uppercase; color:var(--muted);
}
.input {
  background:rgba(255,255,255,.05); border:1px solid var(--border);
  border-radius:5px; color:#fff;
  font-family:'DM Mono'; font-size:12px; letter-spacing:.5px;
  padding:11px 14px; outline:none; transition:border-color .15s;
  width:100%;
}
.input:focus { border-color:rgba(255,207,0,.45) }
.input::placeholder { color:rgba(255,255,255,.2) }
.input-wrap { position:relative }
.eye-toggle {
  position:absolute; right:12px; top:50%; transform:translateY(-50%);
  background:none; border:none; cursor:pointer; color:var(--muted);
  font-size:16px; padding:0; transition:color .15s;
}
.eye-toggle:hover { color:#fff }

/* Bouton principal */
.btn-login {
  background:linear-gradient(135deg,#F5D061,#C8860A); color:#000;
  font-family:'DM Mono'; font-size:10px; letter-spacing:2.5px;
  text-transform:uppercase; font-weight:700;
  padding:13px; border:none; border-radius:5px; cursor:pointer;
  width:100%; transition:filter .15s;
  box-shadow:0 4px 20px rgba(245,208,97,.2);
  display:flex; align-items:center; justify-content:center; gap:8px;
}
.btn-login:hover { filter:brightness(1.08) }
.btn-login svg { width:14px; height:14px }

/* Lien reset */
.reset-link {
  font-family:'DM Mono'; font-size:9px; letter-spacing:1px;
  color:var(--muted); text-align:center; text-decoration:none;
  transition:color .15s; cursor:pointer; background:none; border:none;
}
.reset-link:hover { color:var(--Y) }

/* Modal reset */
.modal-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,.7);
  backdrop-filter:blur(6px); z-index:100;
  display:none; align-items:center; justify-content:center; padding:20px;
}
.modal-overlay.open { display:flex }
.modal {
  background:var(--card); border:1px solid var(--border);
  border-radius:8px; width:100%; max-width:380px; padding:24px;
  display:flex; flex-direction:column; gap:14px;
}
.modal-title {
  font-family:'DM Mono'; font-size:10px; letter-spacing:2px;
  text-transform:uppercase; color:var(--Y);
}
.modal-actions { display:flex; gap:8px }
.btn-send {
  flex:1; padding:10px; background:var(--B2); color:#fff;
  font-family:'DM Mono'; font-size:9px; letter-spacing:2px;
  text-transform:uppercase; font-weight:700;
  border:none; border-radius:5px; cursor:pointer; transition:filter .15s;
}
.btn-send:hover { filter:brightness(1.15) }
.btn-cancel {
  padding:10px 14px; background:rgba(255,255,255,.05);
  border:1px solid var(--border); color:var(--muted);
  font-family:'DM Mono'; font-size:9px; letter-spacing:2px;
  text-transform:uppercase; border-radius:5px; cursor:pointer;
}

/* Footer card */
.card-foot {
  padding:14px 28px;
  border-top:1px solid var(--border);
  text-align:center;
  font-family:'DM Mono'; font-size:8px; letter-spacing:1.5px;
  text-transform:uppercase; color:var(--muted);
}
.card-foot a { color:rgba(255,207,0,.5); text-decoration:none }
.card-foot a:hover { color:var(--Y) }

/* Indicateur de force */
.strength-bar {
  height:3px; border-radius:2px; background:rgba(255,255,255,.08);
  overflow:hidden; margin-top:4px;
}
.strength-fill {
  height:100%; border-radius:2px; transition:width .3s, background .3s;
  width:0;
}
</style>
</head>
<body>

<div class="card">
  <div class="card-head">
    <div class="logo">JB <em>EMERIC</em></div>
    <div class="subtitle">Back-Office · Espace sécurisé</div>
  </div>

  <div class="card-body">

    <?php if ($error): ?>
    <div class="alert alert-error">
      <span class="alert-icon">⚠</span>
      <?= e($error) ?>
    </div>
    <?php endif; ?>

    <?php if ($success): ?>
    <div class="alert alert-success">
      <span class="alert-icon">✓</span>
      <?= e($success) ?>
    </div>
    <?php endif; ?>

    <form method="POST" action="" novalidate>
      <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">

      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="field">
          <label class="label" for="email">Adresse e-mail</label>
          <input
            class="input" type="email" id="email" name="email"
            value="<?= e($_POST['email'] ?? '') ?>"
            placeholder="pilote@jbemeric.com"
            autocomplete="email" required>
        </div>

        <div class="field">
          <label class="label" for="password">Mot de passe</label>
          <div class="input-wrap">
            <input
              class="input" type="password" id="password" name="password"
              placeholder="••••••••••••"
              autocomplete="current-password" required
              style="padding-right:42px">
            <button type="button" class="eye-toggle" onclick="togglePwd()">👁</button>
          </div>
        </div>

        <button type="submit" class="btn-login">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/></svg>
          Accéder au back-office
        </button>

        <button type="button" class="reset-link"
                onclick="document.getElementById('modal-reset').classList.add('open')">
          Mot de passe oublié ?
        </button>
      </div>
    </form>

  </div>

  <div class="card-foot">
    ← <a href="index.html">Retour au site public</a>
    &nbsp;·&nbsp;
    <a href="signup.html">Créer un compte pilote</a>
  </div>
</div>

<!-- Modal reset mot de passe -->
<div class="modal-overlay" id="modal-reset">
  <div class="modal">
    <div class="modal-title">Réinitialiser le mot de passe</div>
    <form method="POST" action="">
      <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
      <input type="hidden" name="action" value="reset_request">
      <div class="field" style="margin-bottom:12px">
        <label class="label" for="reset_email">Votre adresse e-mail</label>
        <input class="input" type="email" id="reset_email" name="reset_email"
               placeholder="votre@email.com">
      </div>
      <div class="modal-actions">
        <button type="submit" class="btn-send">Envoyer le lien</button>
        <button type="button" class="btn-cancel"
                onclick="document.getElementById('modal-reset').classList.remove('open')">
          Annuler
        </button>
      </div>
    </form>
  </div>
</div>

<script>
function togglePwd() {
  const inp = document.getElementById('password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}
// Fermer modal overlay au clic extérieur
document.getElementById('modal-reset').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('open');
});
</script>
</body>
</html>
