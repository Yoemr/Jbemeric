// visiteur.js : ce que voit un visiteur, contenu de la base compris.
//
// POUR QUOI. Dans le bac à sable des sessions cloud, jsdelivr et Supabase sont
// bloqués : live-editor.js ne se charge jamais, et une page locale montre son
// HTML brut. Or en ligne, les textes saisis par JB remplacent ce HTML. Le
// 9 octobre 2026, ce banc a montré trois textes de base affichés au mauvais
// endroit depuis des semaines, invisibles pour les quatre autres outils.
// Voir docs/07-acquis.md section 2.17.
//
// COMMENT. Playwright (préinstallé dans le bac à sable) ouvre les pages du
// serveur local et :
//   - remplace le module supabase-js de jsdelivr par un faux client qui rend
//     l'instantané tel quel, sans filtrer (docs/07 2.8bis) : live-editor.js
//     tourne pour de vrai ;
//   - répond aux requêtes REST (faq.js, avis.js, index-sb.js, sync-mirror.js)
//     en appliquant les filtres de l'URL, comme Supabase ;
//   - sert les médias du stockage Supabase depuis assets/images quand un
//     fichier local porte le même nom, et signale les autres.
// Puis il compare chaque élément à son data-orig et liste ce que la base a
// remplacé, les liens visibles, le h1, le débordement horizontal, la console.
//
// L'INSTANTANÉ. Supabase ne répond qu'à l'outil MCP dans le bac à sable. La
// session écrit l'instantané avec cette requête, puis le passe en --base :
//   select json_build_object(
//     'site_content', (select json_agg(json_build_object('id',id,'content',content,'media_type',media_type)) from site_content),
//     'faq', (select json_agg(f) from faq f), 'avis', (select json_agg(a) from avis a),
//     'events', (select coalesce(json_agg(e),'[]') from events e), 'forum_threads', '[]'::json)
//
// Usage :
//   node outil-dev/visiteur.js --base=<instantane.json> [page ...] [--sortie=dir] [--no-shots] [--vp=desk|tab|mob|both|all]
// Sans page : celles du périmètre (audit/perimetre.js). Serveur local requis.
// Limites du bac à sable, qui ne sont pas des bugs : les vidéos H.264 ne jouent
// pas dans ce Chromium, YouTube et les médias Supabase sans copie locale ne
// chargent pas.
const { chromium } = require('playwright')
const path = require('path'), fs = require('fs'), os = require('os')
const ROOT = path.resolve(__dirname, '..')
const args = process.argv.slice(2)
const opts = args.filter(a => a.startsWith('--'))
const opt = n => { const o = opts.find(x => x.startsWith('--' + n + '=')); return o ? o.slice(n.length + 3) : null }
const pagesNommees = args.filter(a => !a.startsWith('--'))
const pages = pagesNommees.length ? pagesNommees : require('./audit/perimetre').PAGES
const out = opt('sortie') || fs.mkdtempSync(path.join(os.tmpdir(), 'visiteur-sortie-'))
if (!opt('base')) { console.error('Il manque --base=<instantane.json>, voir l en-tete du fichier.'); process.exit(2) }
const SHOTS = !opts.includes('--no-shots')
const VP = opt('vp') || 'both'
const DB = JSON.parse(fs.readFileSync(path.resolve(opt('base')), 'utf8'))
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy
fs.mkdirSync(out, { recursive: true })

const STUB = `
const DB = ${JSON.stringify(DB)};
function q(table) {
  let rows = (DB[table] || []).slice()
  const b = {
    select() { return b }, order() { return b }, range() { return b },
    eq(c, v) { rows = rows.filter(r => r[c] == v); return b },
    neq(c, v) { rows = rows.filter(r => r[c] != v); return b },
    in(c, a) { rows = rows.filter(r => a.includes(r[c])); return b },
    limit(n) { rows = rows.slice(0, n); return b },
    single() { rows = rows[0] || null; return b }, maybeSingle() { rows = rows[0] || null; return b },
    upsert() { window.__ecritures = (window.__ecritures || 0) + 1; return b },
    insert() { window.__ecritures = (window.__ecritures || 0) + 1; return b },
    update() { window.__ecritures = (window.__ecritures || 0) + 1; return b },
    delete() { window.__ecritures = (window.__ecritures || 0) + 1; return b },
    then(res, rej) { return Promise.resolve({ data: rows, error: null }).then(res, rej) },
    catch(f) { return Promise.resolve({ data: rows, error: null }).catch(f) },
  }
  return b
}
export function createClient() {
  return {
    from: q,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: () => Promise.resolve({ error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'banc' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'banc' } }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
      updateUser: () => Promise.resolve({ data: { user: {} }, error: null }),
    },
    storage: { from: () => ({ upload: () => Promise.resolve({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
    channel: () => ({ on() { return this }, subscribe() { return this } }),
    rpc: () => Promise.resolve({ data: null, error: null }),
  }
}
export default { createClient }
`

function postgrest(url) {
  const u = new URL(url)
  const table = u.pathname.split('/rest/v1/')[1].split('?')[0]
  let rows = (DB[table] || []).slice()
  let limit = null, order = null, select = null
  for (const [k, v] of u.searchParams) {
    if (k === 'limit') { limit = +v; continue }
    if (k === 'order') { order = v; continue }
    if (k === 'select') { select = v; continue }
    if (k === 'offset') continue
    const i = v.indexOf('.'); const op = v.slice(0, i), val = v.slice(i + 1)
    const list = s => s.replace(/^[{(]|[})]$/g, '').split(',').map(x => decodeURIComponent(x).replace(/^"|"$/g, ''))
    rows = rows.filter(r => {
      const x = r[k]
      switch (op) {
        case 'eq': return String(x) === val
        case 'neq': return String(x) !== val
        case 'is': return val === 'null' ? x == null : String(x) === val
        case 'in': return list(val).includes(String(x))
        case 'ov': return Array.isArray(x) && list(val).some(t => x.includes(t))
        case 'cs': return Array.isArray(x) && list(val).every(t => x.includes(t))
        case 'gte': return x >= val
        case 'lte': return x <= val
        case 'gt': return x > val
        case 'lt': return x < val
        default: return true
      }
    })
  }
  if (order) {
    const keys = order.split(',').map(o => { const [c, d] = o.split('.'); return { c, d: d === 'desc' ? -1 : 1 } })
    rows.sort((a, b) => { for (const { c, d } of keys) { if (a[c] < b[c]) return -d; if (a[c] > b[c]) return d } return 0 })
  }
  if (limit != null) rows = rows.slice(0, limit)
  if (select && select !== '*') { const cols = select.split(','); rows = rows.map(r => Object.fromEntries(cols.map(c => [c, r[c]]))) }
  return rows
}

const LOCAL_MEDIA = fs.readdirSync(path.join(ROOT, 'assets/images'))
const norm = s => s.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]/g, '')
function mediaLocal(url) {
  const base = decodeURIComponent(url.split('/').pop()).replace(/^\d{10,}-/, '')
  const n = norm(base); const ext = base.split('.').pop().toLowerCase()
  return LOCAL_MEDIA.find(f => norm(f) === n && f.toLowerCase().endsWith(ext)) || null
}

;(async () => {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'visiteur-'))
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: proxy ? ['--proxy-server=' + proxy, '--proxy-bypass-list=localhost;127.0.0.1'] : ['--no-proxy-server'] })
  const report = {}
  const vps = [{ n: 'desk', w: 1440, h: 900 }, { n: 'tab', w: 768, h: 1024, mobile: true }, { n: 'mob', w: 390, h: 844, mobile: true }].filter(v => VP === 'all' || (VP === 'both' && v.n !== 'tab') || VP === v.n)
  for (const vp of vps) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, ignoreHTTPSErrors: true, isMobile: !!vp.mobile, hasTouch: !!vp.mobile,
      userAgent: vp.mobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' : undefined })
    await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: STUB }))
    await ctx.route(/supabase\.co\/rest\/v1\//, r => {
      if (r.request().method() !== 'GET') return r.fulfill({ status: 201, contentType: 'application/json', body: '[]' })
      r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(postgrest(r.request().url())) })
    })
    const mediaManquants = new Set()
    await ctx.route(/supabase\.co\/storage\//, r => {
      const f = mediaLocal(r.request().url())
      if (f) return r.fulfill({ status: 200, path: path.join(ROOT, 'assets/images', f) })
      mediaManquants.add(decodeURIComponent(r.request().url().split('/').pop())); r.fulfill({ status: 404, body: '' })
    })
    for (const p of pages) {
      const page = await ctx.newPage()
      const cdp = await ctx.newCDPSession(page); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
      const logs = []
      page.on('console', m => { const t = m.text(); if (m.type() === 'error' || m.type() === 'warning' || /JBE|mirror|faq|avis/i.test(t)) logs.push(m.type() + ': ' + t) })
      page.on('pageerror', e => logs.push('EXCEPTION: ' + e.message))
      page.on('requestfailed', r => { const u = r.url(); if (!/youtube|ytimg|\.mp4/.test(u)) logs.push('FAIL ' + u + ' ' + (r.failure() || {}).errorText) })
      page.on('response', r => { if (r.status() >= 400 && r.url().includes('localhost')) logs.push('HTTP ' + r.status() + ' ' + r.url()) })
      await page.goto('http://localhost:3000/' + p, { waitUntil: 'load', timeout: 45000 }).catch(e => logs.push('GOTO ' + e.message))
      await page.waitForTimeout(3000)
      const etat = await page.evaluate(() => {
        const vis = el => !!(el.getClientRects().length) && getComputedStyle(el).visibility !== 'hidden'
        const remplaces = []
        document.querySelectorAll('[data-legacy-id]').forEach(el => {
          const orig = el.getAttribute('data-orig'); const now = el.textContent.trim()
          if (orig != null && orig.replace(/\s+/g, ' ') !== now.replace(/\s+/g, ' ')) remplaces.push({ id: el.id, legacy: el.getAttribute('data-legacy-id'), visible: vis(el), html: orig.slice(0, 120), base: now.slice(0, 160) })
          const os = el.getAttribute('data-orig-src'); if (os) { const src = el.currentSrc || el.src || (el.querySelector && el.querySelector('source') && el.querySelector('source').src) || ''; if (src && !src.endsWith(encodeURI(os)) && !src.endsWith(os)) remplaces.push({ id: el.id, legacy: el.getAttribute('data-legacy-id'), visible: vis(el), html: os, base: src }) }
        })
        const liensVisibles = [...document.querySelectorAll('a[href]')].filter(vis).map(a => a.getAttribute('href'))
        const h1 = [...document.querySelectorAll('h1')].filter(vis).map(h => h.textContent.trim())
        const texte = document.body.innerText
        return { remplaces, liensVisibles, h1, ecritures: window.__ecritures || 0, debordementX: document.documentElement.scrollWidth - window.innerWidth, texte }
      })
      fs.writeFileSync(path.join(out, p.replace(/[\/.]/g, '_') + '-' + vp.n + '.txt'), etat.texte)
      delete etat.texte
      if (SHOTS) {
        await page.addStyleTag({ content: 'html,body{height:auto!important;overflow:visible!important;scroll-snap-type:none!important}body{opacity:1!important}.reveal{opacity:1!important;transform:none!important}' }).catch(() => {})
        await page.waitForTimeout(400)
        await page.screenshot({ path: path.join(out, p.replace(/[\/.]/g, '_') + '-' + vp.n + '.png'), fullPage: true }).catch(e => logs.push('SHOT ' + e.message))
      }
      report[p + ' ' + vp.n] = { ...etat, logs, mediaManquants: [...mediaManquants] }
      await page.close()
    }
    await ctx.close()
  }
  await browser.close()
  fs.writeFileSync(path.join(out, 'rapport.json'), JSON.stringify(report, null, 1))
  for (const [k, v] of Object.entries(report)) {
    console.log('\n' + k + '   h1 : ' + JSON.stringify(v.h1) + '   debordement : ' + v.debordementX + ' px')
    v.remplaces.forEach(x => console.log('  remplace ' + x.legacy + (x.visible ? '' : ' (cache)') + ' : « ' + x.html.slice(0, 60) + ' » devient « ' + x.base.slice(0, 80) + ' »'))
    v.logs.filter(l => /^(error|EXCEPTION|HTTP|FAIL)/.test(l) && !/Failed to load resource/.test(l)).forEach(l => console.log('  ' + l.slice(0, 200)))
    if (v.mediaManquants.length) console.log('  medias sans copie locale : ' + v.mediaManquants.join(', '))
  }
  console.log('\nCaptures, textes et rapport complet : ' + out)
})()
