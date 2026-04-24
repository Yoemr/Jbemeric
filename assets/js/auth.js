// auth.js — JB EMERIC
// Module partagé pour login, signup, reset password, signOut.
// Utilise le même client Supabase que live-editor.js (mêmes credentials).
//
// Convention "retour à la page précédente" :
//   - Avant de cliquer sur "Se connecter" ou "S'inscrire", la page courante
//     est stockée dans sessionStorage ('jbe_return_url').
//   - Après login/signup réussi, on y redirige ; fallback = '/'.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

var SB_URL  = 'https://fyaybxamuabawerqzuud.supabase.co'
var SB_ANON = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'

export var sb = createClient(SB_URL, SB_ANON)

var RETURN_KEY = 'jbe_return_url'

// ── Gestion URL retour ────────────────────────────────────────────
export function storeReturnUrl(url) {
  try { sessionStorage.setItem(RETURN_KEY, url || location.href) } catch (e) {}
}

export function consumeReturnUrl() {
  var fallback = '/'
  try {
    var v = sessionStorage.getItem(RETURN_KEY)
    sessionStorage.removeItem(RETURN_KEY)
    if (!v) return fallback
    // Ne pas revenir vers les pages d'auth elles-mêmes
    if (/\/admin\/(login|signup|mot-de-passe-oublie)\.html/.test(v)) return fallback
    return v
  } catch (e) { return fallback }
}

// ── Login email/password ──────────────────────────────────────────
export async function signIn(email, password) {
  var res = await sb.auth.signInWithPassword({ email: email, password: password })
  if (res.error) throw res.error
  return res.data
}

// ── Signup ────────────────────────────────────────────────────────
export async function signUp(email, password, metadata) {
  var res = await sb.auth.signUp({
    email: email,
    password: password,
    options: { data: metadata || {} }
  })
  if (res.error) throw res.error
  return res.data
}

// ── Reset password (magic link par mail) ──────────────────────────
export async function resetPassword(email) {
  var redirectTo = location.origin + '/admin/login.html'
  var res = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirectTo })
  if (res.error) throw res.error
  return res.data
}

// ── Logout ────────────────────────────────────────────────────────
export async function signOut() {
  var res = await sb.auth.signOut()
  if (res.error) throw res.error
  location.href = '/'
}

// ── Traduction des messages d'erreur Supabase en FR ───────────────
export function humanError(err) {
  var msg = (err && err.message) || String(err)
  if (/Invalid login credentials/i.test(msg)) return 'Email ou mot de passe incorrect.'
  if (/Email not confirmed/i.test(msg))      return 'Email non confirmé. Vérifiez votre boîte mail.'
  if (/User already registered/i.test(msg))  return 'Un compte existe déjà avec cet email.'
  if (/Password should be/i.test(msg))       return 'Mot de passe trop court (8 caractères minimum).'
  if (/rate limit/i.test(msg))               return 'Trop de tentatives. Réessayez dans quelques minutes.'
  return msg
}
