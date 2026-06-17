import fs from 'node:fs';
import { paths, runAudit } from './lib/eidentic-migration-audit.mjs';

const outputDir = '/Users/baran/projects/eidentic/newdocs/reports';
const markdownOutputPath = `${outputDir}/eidentic-migration-report.md`;
const jsonOutputPath = `${outputDir}/eidentic-migration-report.json`;

const audit = await runAudit();
const { summary, rows } = audit;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(jsonOutputPath, JSON.stringify(audit, null, 2));

const markdownLines = [
  '# Eidentic Migration Report',
  '',
  `- Old docs root: \`${paths.oldDocsRoot}\``,
  `- Old docs count: ${summary.totalOldDocs}`,
  `- Generated articles count: ${summary.totalGeneratedArticles}`,
  `- Search entries count: ${summary.totalSearchEntries}`,
  `- Matched docs: ${summary.matchedDocs}`,
  `- Missing docs: ${summary.missingDocs}`,
  `- Title mismatches: ${summary.titleMismatches}`,
  `- Category mismatches: ${summary.categoryMismatches}`,
  `- Docs with missing links: ${summary.docsWithMissingLinks}`,
  `- Docs with broken generated article links: ${summary.docsWithBrokenGeneratedArticleLinks}`,
  '',
  '| Status | Old Path | Old Title | Title OK | Category OK | Missing Links | Broken Links | New Slug | New Title | New Category | New URL |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map(
    (row) =>
      `| ${row.status} | \`${row.oldPath}\` | ${row.oldTitle} | ${row.titleMatches ? 'yes' : 'no'} | ${row.categoryMatches ? 'yes' : 'no'} | ${row.missingLinks.length} | ${row.brokenGeneratedArticleLinks.length} | ${row.newSlug || '-'} | ${row.newTitle || '-'} | ${row.newCategoryName || row.expectedCategoryName || '-'} | ${row.newUrl || '-'} |`,
  ),
  '',
];

const issueRows = rows.filter(
    (row) =>
      row.status !== 'ok' ||
      !row.titleMatches ||
      !row.categoryMatches ||
      row.missingLinks.length > 0 ||
      row.brokenGeneratedArticleLinks.length > 0,
  );

if (issueRows.length) {
  markdownLines.push('## Issues', '');
  for (const row of issueRows) {
    markdownLines.push(`### \`${row.oldPath}\``, '');
    if (row.status !== 'ok') {
      markdownLines.push(`- Missing generated article for expected slug \`${row.expectedSlug}\``);
    }
    if (row.status === 'ok' && !row.titleMatches) {
      markdownLines.push(`- Title mismatch: old="${row.oldTitle}" new="${row.newTitle}"`);
    }
    if (row.status === 'ok' && !row.categoryMatches) {
      markdownLines.push(`- Category mismatch: expected="${row.expectedCategoryName}" new="${row.newCategoryName}"`);
    }
    if (row.missingLinks.length) {
      markdownLines.push(
        `- Missing links in generated HTML: ${row.missingLinks.map((href) => `\`${href}\``).join(', ')}`,
      );
    }
    if (row.brokenGeneratedArticleLinks.length) {
      markdownLines.push(
        `- Broken generated article links: ${row.brokenGeneratedArticleLinks.map((href) => `\`${href}\``).join(', ')}`,
      );
    }
    markdownLines.push('');
  }
}

fs.writeFileSync(markdownOutputPath, markdownLines.join('\n'));

console.log(`Wrote ${markdownOutputPath}`);
console.log(`Wrote ${jsonOutputPath}`);
console.log(JSON.stringify(summary, null, 2));
