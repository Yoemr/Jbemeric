// ═══════════════════════════════════════════════════════════════════
//  auth.js — JB EMERIC
//  Gestion Login + Signup côté client (remplace login.php)
//  À inclure dans login.html et signup.html
// ═══════════════════════════════════════════════════════════════════

import { login, signup, resetPassword, getUser, supabase } from './assets/js/supabase.js'

// ── Rediriger si déjà connecté ──────────────────────────────────────
;(async () => {
  const user = await getUser()
  if (user) window.location.href = 'index.html'
})()

// ═══════════════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════════════
const loginForm = document.getElementById('login-form')
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email    = document.getElementById('login-email').value.trim()
    const password = document.getElementById('login-password').value
    const btn      = loginForm.querySelector('button[type=submit]')
    const alertEl  = document.getElementById('login-alert')

    clearAlert(alertEl)
    btn.disabled = true
    btn.textContent = '…'

    try {
      await login(email, password)
      // Rediriger selon le rôle
      const { data: { user } } = await supabase.auth.getUser()
      const role = user?.user_metadata?.role ?? 'client'
      window.location.href = (role === 'admin' || role === 'moderateur')
        ? 'admin-dashboard.html'
        : 'index.html'
    } catch (err) {
      showAlert(alertEl, err.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect.'
        : err.message, 'error')
      btn.disabled = false
      btn.textContent = 'Accéder au back-office'
    }
  })
}

// ═══════════════════════════════════════════════════════════════════
//  SIGNUP
// ═══════════════════════════════════════════════════════════════════
const signupForm = document.getElementById('signup-form')
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const prenom   = document.getElementById('signup-prenom').value.trim()
    const nom      = document.getElementById('signup-nom').value.trim()
    const email    = document.getElementById('signup-email').value.trim()
    const tel      = document.getElementById('signup-tel')?.value.trim() ?? ''
    const password = document.getElementById('signup-password').value
    const confirm  = document.getElementById('signup-confirm').value
    const alertEl  = document.getElementById('signup-alert')
    const btn      = signupForm.querySelector('button[type=submit]')

    clearAlert(alertEl)

    // Validation côté client
    if (!prenom || !nom || !email || !password) {
      return showAlert(alertEl, 'Tous les champs marqués * sont obligatoires.', 'error')
    }
    if (password.length < 8) {
      return showAlert(alertEl, 'Le mot de passe doit contenir au moins 8 caractères.', 'error')
    }
    if (password !== confirm) {
      return showAlert(alertEl, 'Les mots de passe ne correspondent pas.', 'error')
    }

    btn.disabled = true
    btn.textContent = '…'

    try {
      await signup({ email, password, nom, prenom, telephone: tel })
      showAlert(alertEl,
        'Compte créé ! Vérifiez votre email pour confirmer votre inscription.',
        'success')
      signupForm.reset()
    } catch (err) {
      showAlert(alertEl,
        err.message.includes('already registered')
          ? 'Un compte existe déjà avec cet email.'
          : err.message,
        'error')
    } finally {
      btn.disabled = false
      btn.textContent = 'Créer mon compte pilote'
    }
  })
}

// ═══════════════════════════════════════════════════════════════════
//  RESET MOT DE PASSE
// ═══════════════════════════════════════════════════════════════════
const resetForm = document.getElementById('reset-form')
if (resetForm) {
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email   = document.getElementById('reset-email').value.trim()
    const alertEl = document.getElementById('reset-alert')
    const btn     = resetForm.querySelector('button[type=submit]')

    btn.disabled = true
    try {
      await resetPassword(email)
      showAlert(alertEl,
        'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.',
        'success')
    } catch (err) {
      showAlert(alertEl, err.message, 'error')
    } finally {
      btn.disabled = false
    }
  })
}

// ═══════════════════════════════════════════════════════════════════
//  TOGGLE PASSWORD
// ═══════════════════════════════════════════════════════════════════
document.querySelectorAll('[data-toggle-pwd]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.togglePwd)
    if (!target) return
    target.type = target.type === 'password' ? 'text' : 'password'
    btn.textContent = target.type === 'password' ? '👁' : '🙈'
  })
})

// ═══════════════════════════════════════════════════════════════════
//  HELPERS UI
// ═══════════════════════════════════════════════════════════════════
function showAlert(el, msg, type) {
  if (!el) return
  el.textContent = msg
  el.className = `alert alert-${type}`
  el.style.display = 'block'
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}
function clearAlert(el) {
  if (!el) return
  el.style.display = 'none'
  el.textContent = ''
}

// ─── Modal reset (si présent) ────────────────────────────────────
const modalOverlay = document.getElementById('modal-reset')
document.querySelector('[data-open-reset]')?.addEventListener('click', () => {
  modalOverlay?.classList.add('open')
})
document.querySelector('[data-close-reset]')?.addEventListener('click', () => {
  modalOverlay?.classList.remove('open')
})
modalOverlay?.addEventListener('click', (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.remove('open')
})
