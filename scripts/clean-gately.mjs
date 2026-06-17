/**
 * clean-gately.mjs
 * Removes all Gately-specific files and references from the Helio project.
 * Run with: node scripts/clean-gately.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ─── Files to delete entirely ────────────────────────────────────────────────
const filesToDelete = [
  // Gately-specific debug/test pages
  'src/pages/debug.astro',
  'src/pages/api/debug-resolution.ts',
  'src/pages/api/test-subdomain.ts',
  'src/pages/api/[...path].ts',       // Gately API proxy — not needed in local mode
  // Gately domain resolution (no longer used)
  'src/lib/domain.ts',
  'src/lib/projectContext.ts',
  // Gately-branded footer
  'src/components/HelpCenterFooter.astro',
  // Root-level Gately deployment scripts
  'deploy-fix.sh',
  'DOMAIN_MIGRATION.sql',
  'check-deployment.js',
  // Old index backup
  'src/pages/index.astro.backup',
  // Gately logo assets
  'public/gately-logo.png',
  'public/supasync-logo-icon-outline.png',
];

// ─── String replacements in files ────────────────────────────────────────────
const replacements = [
  // robots.txt — remove /_gately/ disallow
  {
    file: 'src/pages/robots.txt.ts',
    from: "Disallow: /_gately/\n",
    to:   "Disallow: /_helio/\n",
  },
  // utils.ts — remove Gately subdomain logic, simplify getBasePath
  {
    file: 'src/lib/utils.ts',
    from: /\/\/ Check if we're on a Gately subdomain[\s\S]*?\/\/ On custom domains[\s\S]*?\/\/ use sub-path if configured/,
    to:   '// use sub-path if configured',
  },
  // BaseLayout — remove X-Gately-Sub-Path header reference
  {
    file: 'src/layouts/BaseLayout.astro',
    from: "const subPath = config.sub_path || Astro.request.headers.get('X-Gately-Sub-Path') || '';",
    to:   "const subPath = config.sub_path || '';",
  },
  // BaseLayout — remove X-Gately-Sub-Path comment
  {
    file: 'src/layouts/BaseLayout.astro',
    from: "// Also read X-Gately-Sub-Path header sent by the worker as a reliable fallback.\n",
    to:   '',
  },
];

let deleted = 0;
let replaced = 0;
let skipped = 0;

// ─── Delete files ─────────────────────────────────────────────────────────────
console.log('\n🗑️  Deleting Gately files...\n');
for (const rel of filesToDelete) {
  const abs = path.join(root, rel);
  if (fs.existsSync(abs)) {
    fs.rmSync(abs, { force: true });
    console.log(`  ✅ Deleted: ${rel}`);
    deleted++;
  } else {
    console.log(`  ⏭️  Skipped (not found): ${rel}`);
    skipped++;
  }
}

// ─── Apply string replacements ────────────────────────────────────────────────
console.log('\n✏️  Applying replacements...\n');
for (const { file, from, to } of replacements) {
  const abs = path.join(root, file);
  if (!fs.existsSync(abs)) {
    console.log(`  ⏭️  Skipped (not found): ${file}`);
    skipped++;
    continue;
  }
  const original = fs.readFileSync(abs, 'utf8');
  const updated = original.replace(from, to);
  if (updated !== original) {
    fs.writeFileSync(abs, updated, 'utf8');
    console.log(`  ✅ Updated: ${file}`);
    replaced++;
  } else {
    console.log(`  ⏭️  No match: ${file}`);
    skipped++;
  }
}

console.log(`\n✨ Done — ${deleted} deleted, ${replaced} updated, ${skipped} skipped.\n`);
