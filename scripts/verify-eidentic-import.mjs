import { runAudit } from './lib/eidentic-migration-audit.mjs';

const audit = await runAudit();
const { summary, missingFromImporter, extraInImporter, missingFromGenerated, rows } = audit;

const checks = [
  ['old docs discovered', summary.totalOldDocs > 0, `${summary.totalOldDocs} found`],
  ['importer mapping count', summary.mappedDocs === summary.totalOldDocs, `${summary.mappedDocs} mapped`],
  ['importer missing docs', missingFromImporter.length === 0, `${missingFromImporter.length} missing`],
  ['importer extra docs', extraInImporter.length === 0, `${extraInImporter.length} extra`],
  ['generated article count', summary.totalGeneratedArticles === summary.totalOldDocs, `${summary.totalGeneratedArticles} generated`],
  ['generated missing docs', missingFromGenerated.length === 0, `${missingFromGenerated.length} missing`],
  ['search index count', summary.totalSearchEntries === summary.totalOldDocs, `${summary.totalSearchEntries} indexed`],
  ['title mismatches', summary.titleMismatches === 0, `${summary.titleMismatches} mismatched`],
  ['category mismatches', summary.categoryMismatches === 0, `${summary.categoryMismatches} mismatched`],
  ['docs with missing links', summary.docsWithMissingLinks === 0, `${summary.docsWithMissingLinks} affected`],
  [
    'docs with broken generated article links',
    summary.docsWithBrokenGeneratedArticleLinks === 0,
    `${summary.docsWithBrokenGeneratedArticleLinks} affected`,
  ],
];

let failed = false;

for (const [label, pass, detail] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${detail}`);
  if (!pass) failed = true;
}

function printList(title, values) {
  if (!values.length) return;
  console.log(`\n${title}:`);
  for (const value of values) {
    console.log(`- ${value}`);
  }
}

printList('Missing from importer', missingFromImporter);
printList('Extra in importer', extraInImporter);
printList('Missing from generated', missingFromGenerated);
printList(
  'Title mismatches',
  rows.filter((row) => row.status === 'ok' && !row.titleMatches).map((row) => `${row.oldPath} -> ${row.newTitle}`),
);
printList(
  'Category mismatches',
  rows
    .filter((row) => row.status === 'ok' && !row.categoryMatches)
    .map((row) => `${row.oldPath} -> ${row.newCategoryName || row.newCategoryId || 'unknown'}`),
);

const missingLinkRows = rows.filter((row) => row.missingLinks.length > 0);
if (missingLinkRows.length) {
  console.log('\nMissing links by doc:');
  for (const row of missingLinkRows) {
    console.log(`- ${row.oldPath}`);
    for (const href of row.missingLinks) {
      console.log(`  - ${href}`);
    }
  }
}

const brokenLinkRows = rows.filter((row) => row.brokenGeneratedArticleLinks.length > 0);
if (brokenLinkRows.length) {
  console.log('\nBroken generated article links by doc:');
  for (const row of brokenLinkRows) {
    console.log(`- ${row.oldPath}`);
    for (const href of row.brokenGeneratedArticleLinks) {
      console.log(`  - ${href}`);
    }
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log('\nEidentic docs migration looks complete.');
}
