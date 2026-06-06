#!/usr/bin/env node
/**
 * Writes public/news-sitemap.xml at build time so static hosts/CDN can serve it
 * without relying on the Next.js route handler.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const outputPath = path.join(projectRoot, 'public', 'news-sitemap.xml');

const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

const SITE_NAME = 'WhistleBlower.ng';
const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://whistleblower.ng').replace(/\/$/, '');
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dvdhllhdbbybixwhtgnm.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function slugify(input) {
  if (!input) return '';
  return String(input)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/,/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getPostUrl(post) {
  const slug = post.slug || slugify(post.title);
  if (post.category === 'bounty' && post.bounty_id) {
    return `${SITE_URL}/bounties/${slug}`;
  }
  return `${SITE_URL}/news/post/${slug}`;
}

function buildNewsSitemapXml(posts) {
  const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const recentPosts = posts.filter((post) => {
    const published = new Date(post.created_at).getTime();
    return !Number.isNaN(published) && published >= twoDaysAgo;
  });
  const sourcePosts = recentPosts.length > 0 ? recentPosts : posts.slice(0, 100);

  const entries = sourcePosts
    .map((post) => {
      const loc = getPostUrl(post);
      const pubDate = new Date(post.created_at);
      const publicationDate = Number.isNaN(pubDate.getTime())
        ? new Date().toISOString()
        : pubDate.toISOString();

      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_NAME)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(publicationDate)}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries}
</urlset>`;
}

async function fetchPublishedNews() {
  if (!SUPABASE_KEY) {
    console.warn('[generate-news-sitemap] No Supabase key; writing empty sitemap');
    return [];
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('news')
    .select('id, title, category, status, featured_image, bounty_id, created_at, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

async function main() {
  try {
    const posts = await fetchPublishedNews();
    const xml = buildNewsSitemapXml(posts);
    fs.writeFileSync(outputPath, xml, 'utf8');
    const count = (xml.match(/<url>/g) || []).length;
    console.log(`[generate-news-sitemap] Wrote ${outputPath} (${count} URLs)`);
  } catch (error) {
    console.error('[generate-news-sitemap] Failed:', error.message);
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
</urlset>`;
    fs.writeFileSync(outputPath, fallback, 'utf8');
    console.log(`[generate-news-sitemap] Wrote empty fallback to ${outputPath}`);
  }
}

main();
