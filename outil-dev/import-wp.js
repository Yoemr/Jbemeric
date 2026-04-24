#!/usr/bin/env node
'use strict';
/**
 * Import WordPress XML → Supabase docs table
 * Usage: node import-wp.js
 * One-shot script — can be re-run safely (upsert on slug)
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

// === CONFIG ===
const XML_PATH = path.resolve(__dirname, 'jbemericstagesdepilotage.WordPress.2026-03-31.xml');
const SB_HOST  = 'fyaybxamuabawerqzuud.supabase.co';
const SB_KEY   = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD';

// ── Helpers ───────────────────────────────────────────────────────────────

function cdata(block, tag) {
  const t = tag.replace(/:/g, '\\:');
  const re = new RegExp('<' + t + '><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/' + t + '>');
  const m = block.match(re);
  return m ? m[1].trim() : '';
}

function textTag(block, tag) {
  const t = tag.replace(/:/g, '\\:');
  const re = new RegExp('<' + t + '>([^<]*)<\\/' + t + '>');
  const m = block.match(re);
  return m ? m[1].trim() : '';
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Extrait le premier vrai paragraphe comme intro (max 220 chars) */
function makeIntro(html) {
  // Cherche le premier <p> avec du contenu réel
  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = pRe.exec(html)) !== null) {
    const text = stripHtml(m[1]).trim();
    if (text.length > 30) {
      return text.length > 220 ? text.slice(0, 217) + '…' : text;
    }
  }
  // Fallback : premier texte brut
  const text = stripHtml(html);
  return text.length > 220 ? text.slice(0, 217) + '…' : text;
}

/** Nettoie le HTML WordPress (supprime wrappers ChatGPT, liens relatifs) */
function cleanContent(html) {
  let c = html;
  // Supprime les blocs wrappers ChatGPT (react-scroll-to-bottom, dark:bg-gray…)
  c = c.replace(/<div[^>]*class="[^"]*(?:react-scroll|flex-1 overflow|dark:bg-gray|markdown prose)[^"]*"[\s\S]*?(?=<(?:h[1-6]|p|ul|ol|blockquote|figure|table|div class="wp-))/gi, '');
  // Corrige les liens relatifs WP
  c = c.replace(/href=["']\/category\//gi, 'href="https://jbemeric.com/category/');
  c = c.replace(/href=["']\/((?!http)[^"']+)/g, 'href="https://jbemeric.com/$1');
  // Supprime les iframes non-YouTube (widgets WP)
  c = c.replace(/<iframe(?![^>]*youtube)[^>]*>[\s\S]*?<\/iframe>/gi, '');
  return c.trim();
}

function getWpCategories(block) {
  const cats = [];
  const re = /<category domain="category"[^>]*><!\\?\[CDATA\[(.*?)\]\]><\/category>/g;
  // Fallback sans CDATA
  const re2 = /<category domain="category"[^>]*><!\[CDATA\[(.*?)\]\]><\/category>/g;
  let m;
  while ((m = re2.exec(block)) !== null) cats.push(m[1].trim());
  return cats;
}

function mapCategory(wpCats) {
  for (const c of wpCats) {
    const lc = c.toLowerCase();
    if (lc.includes('conseil') || lc.includes('pilotage')) return 'coaching';
    if (lc.includes('actua'))                               return 'actu';
  }
  return 'coaching';
}

// ── Parse XML ─────────────────────────────────────────────────────────────

console.log('📖 Lecture du XML WordPress…');
const xml = fs.readFileSync(XML_PATH, 'utf8');

// Découpage en blocs <item>
const itemBlocks = [];
let pos = 0;
while (true) {
  const s = xml.indexOf('<item>', pos);
  if (s === -1) break;
  const e = xml.indexOf('</item>', s);
  if (e === -1) break;
  itemBlocks.push(xml.slice(s, e + 7));
  pos = e + 7;
}
console.log(`📦 ${itemBlocks.length} blocs <item> trouvés`);

// Index des pièces jointes : wp:post_id → wp:attachment_url
const attachMap = {};
for (const block of itemBlocks) {
  if (cdata(block, 'wp:post_type') !== 'attachment') continue;
  const id  = textTag(block, 'wp:post_id');
  const url = cdata(block, 'wp:attachment_url');
  if (id && url) attachMap[id] = url;
}
console.log(`🖼  ${Object.keys(attachMap).length} pièces jointes indexées`);

// Extraction des posts publiés
const posts = [];
for (const block of itemBlocks) {
  if (cdata(block, 'wp:post_type') !== 'post') continue;
  if (cdata(block, 'wp:status')    !== 'publish') continue;

  const title       = cdata(block, 'title') || textTag(block, 'title');
  const slug        = cdata(block, 'wp:post_name');
  const pubDateRaw  = textTag(block, 'pubDate');
  const htmlRaw     = cdata(block, 'content:encoded');
  const wpCats      = getWpCategories(block);

  // Thumbnail via _thumbnail_id dans les postmeta
  let imageUrl = null;
  const thumbRe = /<wp:postmeta>[\s\S]*?<wp:meta_key><!\[CDATA\[_thumbnail_id\]\]><\/wp:meta_key>[\s\S]*?<wp:meta_value><!\[CDATA\[(\d+)\]\]><\/wp:meta_value>[\s\S]*?<\/wp:postmeta>/g;
  const mThumb = thumbRe.exec(block);
  if (mThumb) imageUrl = attachMap[mThumb[1]] || null;

  const intro       = makeIntro(htmlRaw);
  const content     = cleanContent(htmlRaw);
  const category    = mapCategory(wpCats);
  let publishedAt   = null;
  try { publishedAt = pubDateRaw ? new Date(pubDateRaw).toISOString() : null; } catch(e) {}

  posts.push({ title, slug, publishedAt, category, content, imageUrl, intro });
}

console.log(`\n📝 ${posts.length} articles publiés trouvés :\n`);
posts.forEach((p, i) => {
  const img = p.imageUrl ? '📷' : '❌';
  console.log(`  ${String(i+1).padStart(2)}. ${img} [${p.category}] ${p.slug}`);
});

// ── Upsert Supabase ───────────────────────────────────────────────────────

function sbPost(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const opts = {
      hostname: SB_HOST,
      path: '/rest/v1/' + path,
      method: 'POST',
      headers: {
        'apikey':          SB_KEY,
        'Authorization':   'Bearer ' + SB_KEY,
        'Content-Type':    'application/json',
        'Content-Length':  Buffer.byteLength(payload),
        'Prefer':          'resolution=merge-duplicates,return=minimal'
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
        else reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('\n🚀 Import vers Supabase…\n');
  let ok = 0, fail = 0;

  for (const p of posts) {
    try {
      await sbPost('docs?on_conflict=slug', [{
        slug:         p.slug,
        title:        p.title,
        category:     p.category,
        type:         'article',
        visible:      true,
        image_url:    p.imageUrl,
        intro:        p.intro,
        content:      p.content,
        published_at: p.publishedAt,
        keywords:     '',
        file_url:     null,
        file_size:    null
      }]);
      console.log(`  ✓ ${p.slug}`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${p.slug} → ${e.message}`);
      fail++;
    }
    await new Promise(r => setTimeout(r, 120)); // anti rate-limit
  }

  console.log(`\n✅ Terminé : ${ok} importés, ${fail} erreurs`);
  if (fail > 0) process.exit(1);
}

run().catch(e => { console.error(e); process.exit(1); });
