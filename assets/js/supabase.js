// ═══════════════════════════════════════════════════════════════════
//  supabase.js — JB EMERIC
//  Client Supabase partagé + helpers Auth/DB
//  À inclure AVANT tout autre script qui utilise Supabase
// ═══════════════════════════════════════════════════════════════════

// ── Config — remplacer par tes vraies clés Supabase ────────────────
// Dashboard Supabase → Settings → API
const SUPABASE_URL  = 'https://XXXXX.supabase.co'       // ← ta project URL
const SUPABASE_ANON = 'eyJhXXXXXXXXXXXXXXXXXXXXXXXXX'  // ← ta anon/public key

// ── Initialisation du client ────────────────────────────────────────
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// ═══════════════════════════════════════════════════════════════════
//  AUTH HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Retourne l'utilisateur connecté ou null */
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** Connexion email/password */
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data.user
}

/** Inscription email/password */
export async function signup({ email, password, nom, prenom, telephone }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nom, prenom, telephone, role: 'client' }
    }
  })
  if (error) throw new Error(error.message)
  return data.user
}

/** Déconnexion */
export async function logout() {
  await supabase.auth.signOut()
  window.location.href = 'index.html'
}

/** Reset mot de passe */
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/login.html'
  })
  if (error) throw new Error(error.message)
}

// ═══════════════════════════════════════════════════════════════════
//  ÉVÉNEMENTS — Track-Days
// ═══════════════════════════════════════════════════════════════════

/** Sessions Open à venir */
export async function getOpenEvents() {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('events')
    .select(`
      id, date_event, heure_debut, heure_fin, type, prix,
      prix_coaching, prix_location, nb_places, nb_inscrits,
      circuits ( nom, region, ville, longueur_km, photo_url ),
      vehicules ( nom, type_vehicule )
    `)
    .eq('status', 'Open')
    .eq('visible_site', true)
    .gte('date_event', today)
    .order('date_event', { ascending: true })
    .limit(20)
  if (error) throw error
  return data
}

/** Sessions Potential (à voter) */
export async function getPotentialEvents() {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id, date_event, type, prix, nb_votes,
      circuits ( nom, region, ville, longueur_km ),
      vehicules ( nom, type_vehicule )
    `)
    .eq('status', 'Potential')
    .eq('visible_site', true)
    .order('nb_votes', { ascending: false })
    .limit(10)
  if (error) throw error
  return data
}

/** 3 prochaines sessions pour l'index */
export async function getNextSessions(limit = 3) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('events')
    .select(`
      id, date_event, type, prix, status, nb_places, nb_inscrits,
      circuits ( nom, region )
    `)
    .in('status', ['Open', 'Potential'])
    .eq('visible_site', true)
    .gte('date_event', today)
    .order('date_event', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data
}

// ═══════════════════════════════════════════════════════════════════
//  VOTES
// ═══════════════════════════════════════════════════════════════════

const VOTE_KEY = 'jbe_votes' // localStorage — votes anonymes

/** Voter pour une session Potential */
export async function voteForEvent(eventId) {
  const user = await getUser()

  // Anti-doublon localStorage (anonyme)
  const localVotes = JSON.parse(localStorage.getItem(VOTE_KEY) || '[]')
  if (!user && localVotes.includes(eventId)) {
    throw new Error('Vous avez déjà voté pour cette date.')
  }

  // Insérer dans la table votes
  const { error: voteError } = await supabase
    .from('votes')
    .insert({
      event_id: eventId,
      user_id:  user?.id ?? null,
      ip_hash:  null // géré côté Supabase Edge Function si besoin
    })

  if (voteError) {
    if (voteError.code === '23505') { // unique violation
      throw new Error('Vous avez déjà voté pour cette date.')
    }
    throw voteError
  }

  // Incrémenter nb_votes via RPC Supabase
  const { error: rpcError } = await supabase
    .rpc('increment_votes', { event_id: eventId })
  if (rpcError) throw rpcError

  // Sauvegarder en localStorage si anonyme
  if (!user) {
    localVotes.push(eventId)
    localStorage.setItem(VOTE_KEY, JSON.stringify(localVotes))
  }

  return true
}

/** Vérifier si l'utilisateur a déjà voté */
export async function hasVoted(eventId) {
  const user = await getUser()
  if (!user) {
    const localVotes = JSON.parse(localStorage.getItem(VOTE_KEY) || '[]')
    return localVotes.includes(eventId)
  }
  const { data } = await supabase
    .from('votes')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle()
  return !!data
}

// ═══════════════════════════════════════════════════════════════════
//  INSCRIPTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Créer une inscription
 * @param {object} payload - { eventId, nom, prenom, email, tel,
 *                             optCoaching, optLocation, vehiculePerso, checklist }
 */
export async function createInscription(payload) {
  const user = await getUser()
  
  // Si non connecté, récupérer ou créer via Auth
  let userId = user?.id
  if (!userId) {
    // Créer un compte minimal avec mot de passe aléatoire
    const tempPwd = crypto.randomUUID()
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: tempPwd,
      options: { data: { nom: payload.nom, prenom: payload.prenom } }
    })
    if (error && error.message !== 'User already registered') throw error
    // Si déjà existant, continuer sans userId (Supabase RLS gérera)
    userId = data?.user?.id ?? null
  }

  // Récupérer les prix de l'event
  const { data: ev } = await supabase
    .from('events')
    .select('prix, prix_coaching, prix_location, nb_places, nb_inscrits, status')
    .eq('id', payload.eventId)
    .single()

  if (!ev) throw new Error('Session introuvable.')
  if (ev.status !== 'Open') throw new Error('Cette session n\'est plus disponible.')
  if (ev.nb_inscrits >= ev.nb_places) throw new Error('Session complète.')

  const montant =
    parseFloat(ev.prix) +
    (payload.optCoaching ? parseFloat(ev.prix_coaching || 0) : 0) +
    (payload.optLocation  ? parseFloat(ev.prix_location  || 0) : 0)

  const { data: inscr, error: inscrErr } = await supabase
    .from('inscriptions')
    .insert({
      event_id:        payload.eventId,
      user_id:         userId,
      option_coaching: payload.optCoaching ?? false,
      option_location: payload.optLocation ?? false,
      vehicule_perso:  payload.vehiculePerso ?? '',
      checklist_json:  payload.checklist ?? {},
      montant_total:   montant,
      status:          'en_attente',
    })
    .select()
    .single()

  if (inscrErr) {
    if (inscrErr.code === '23505') throw new Error('Vous êtes déjà inscrit à cette session.')
    throw inscrErr
  }

  // Incrémenter nb_inscrits via RPC
  await supabase.rpc('increment_inscrits', { event_id: payload.eventId })

  const ref = `JBE-${new Date().getFullYear()}-${String(payload.eventId).padStart(4,'0')}`
  return { ...inscr, ref }
}

// ═══════════════════════════════════════════════════════════════════
//  UI HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Met à jour le nav selon l'état de connexion */
export async function updateNavAuth() {
  const user = await getUser()
  const btnLogin  = document.querySelector('.nav-btn-login, [href="login.html"]')
  const btnSignup = document.querySelector('.nav-btn-signup, [href="signup.html"]')

  if (user) {
    if (btnLogin)  { btnLogin.textContent  = user.user_metadata?.prenom || 'Mon compte'; btnLogin.href = '#' }
    if (btnSignup) { btnSignup.textContent = 'Déconnexion'; btnSignup.onclick = (e) => { e.preventDefault(); logout() } }
  }
}

/** Écouter les changements d'auth */
supabase.auth.onAuthStateChange((_event, _session) => {
  updateNavAuth()
})
