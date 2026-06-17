import fs from 'node:fs';
import path from 'node:path';

export const paths = {
  oldDocsRoot: '/Users/baran/projects/eidentic/docs/docs',
  importerPath: '/Users/baran/projects/eidentic/newdocs/scripts/import-eidentic-docs.mjs',
  generatedTsImportUrl: 'file:///Users/baran/projects/eidentic/newdocs/src/data/generated/eidentic.ts',
  generatedSearchPath: '/Users/baran/projects/eidentic/newdocs/src/data/generated/eidentic-search.json',
};

function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) {
    return { data: {}, body: raw.trim() };
  }

  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) {
    return { data: {}, body: raw.trim() };
  }

  const block = raw.slice(4, end);
  const body = raw.slice(end + 5).trim();
  const data = {};

  for (const line of block.split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    data[key] = value.replace(/^['"]|['"]$/g, '');
  }

  return { data, body };
}

function readOldDocs(root) {
  return fs
    .readdirSync(root, { recursive: true })
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const oldPath = file.replace(/\\/g, '/').replace(/\.md$/, '');
      const oldFile = path.join(root, file);
      const raw = fs.readFileSync(oldFile, 'utf8');
      const { data, body } = parseFrontmatter(raw);

      return {
        oldPath,
        oldFile,
        oldTitle: data.title || oldPath.split('/').at(-1),
        body,
      };
    })
    .sort((a, b) => a.oldPath.localeCompare(b.oldPath));
}

function parseImporter(importerFile) {
  const source = fs.readFileSync(importerFile, 'utf8');
  const mappedDocs = [];

  for (const match of source.matchAll(/docs:\s*\[(.*?)\]/gs)) {
    for (const doc of match[1].matchAll(/'([^']+)'/g)) {
      mappedDocs.push(doc[1]);
    }
  }

  const categoryBlock = source.match(/const categorySpecs = \[(.*?)\];\s*const highlighter/s);
  if (!categoryBlock) {
    throw new Error('Could not parse categorySpecs from importer.');
  }

  const categoryMap = new Map();
  for (const spec of categoryBlock[1].matchAll(/\{\s*id:\s*'([^']+)'.*?name:\s*'([^']+)'.*?docs:\s*\[(.*?)\]/gs)) {
    const [, categoryId, categoryName, docsBlock] = spec;
    for (const doc of docsBlock.matchAll(/'([^']+)'/g)) {
      categoryMap.set(doc[1], { categoryId, categoryName });
    }
  }

  return {
    mappedDocs: mappedDocs.sort(),
    categoryMap,
  };
}

function mapDocHref(currentRelativePath, href, docsByPath) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }

  if (/^[a-z]+:/i.test(href)) {
    return href;
  }

  if (href.startsWith('/img/') || href.startsWith('/.well-known/')) {
    return href;
  }

  if (href === '/') {
    return '/';
  }

  let pathname = href;
  let hash = '';
  const hashIndex = href.indexOf('#');

  if (hashIndex >= 0) {
    pathname = href.slice(0, hashIndex);
    hash = href.slice(hashIndex);
  }

  let normalizedPath;
  if (pathname.startsWith('/')) {
    normalizedPath = pathname.slice(1);
  } else {
    const currentDir = path.posix.dirname(currentRelativePath);
    normalizedPath = path.posix.normalize(path.posix.join(currentDir, pathname));
  }

  normalizedPath = normalizedPath.replace(/^\.\//, '').replace(/\.md$/, '');
  const linkedDoc = docsByPath.get(normalizedPath);

  if (linkedDoc) {
    return `/article/${linkedDoc.slug}${hash}`;
  }

  if (pathname.startsWith('/')) {
    return `${pathname}${hash}`;
  }

  return href;
}

function extractMarkdownHrefs(markdown) {
  const hrefs = [];
  for (const match of markdown.matchAll(/!?\[[^\]]*]\(([^)\s]+)(?:[^)]*)\)/g)) {
    hrefs.push(match[1]);
  }
  return hrefs;
}

function extractHtmlHrefs(html) {
  const hrefs = [];
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    hrefs.push(match[1]);
  }
  return hrefs;
}

function normalizeForSet(href) {
  return href.replace(/&amp;/g, '&');
}

export async function runAudit() {
  const oldDocs = readOldDocs(paths.oldDocsRoot);
  const docsByPath = new Map(
    oldDocs.map((doc) => [
      doc.oldPath,
      {
        relativePath: doc.oldPath,
        slug: doc.oldPath.replace(/\//g, '-'),
      },
    ]),
  );

  const { mappedDocs, categoryMap } = parseImporter(paths.importerPath);
  const generatedModule = await import(paths.generatedTsImportUrl);
  const { generatedArticles, generatedCategories } = generatedModule;
  const generatedSearchEntries = JSON.parse(fs.readFileSync(paths.generatedSearchPath, 'utf8'));

  const generatedById = new Map(generatedArticles.map((article) => [article.id, article]));
  const generatedBySlug = new Map(generatedArticles.map((article) => [article.slug, article]));
  const categoryNameById = new Map(generatedCategories.map((category) => [category.id, category.name]));

  const rows = oldDocs.map((doc) => {
    const expectedId = doc.oldPath.replace(/\//g, '-');
    const generated = generatedById.get(expectedId) || null;
    const expectedCategory = categoryMap.get(doc.oldPath) || null;

    const expectedLinks = extractMarkdownHrefs(doc.body)
      .map((href) => mapDocHref(doc.oldPath, href, docsByPath))
      .filter((href) => href && !href.startsWith('#'));

    const generatedLinks = generated ? extractHtmlHrefs(generated.content) : [];
    const expectedSet = new Set(expectedLinks.map(normalizeForSet));
    const generatedSet = new Set(generatedLinks.map(normalizeForSet));

    const missingLinks = [...expectedSet].filter((href) => !generatedSet.has(href));
    const brokenGeneratedArticleLinks = [...generatedSet].filter((href) => {
      if (!href.startsWith('/article/')) return false;
      const slug = href.slice('/article/'.length).split('#')[0];
      return !generatedBySlug.has(slug);
    });

    return {
      status: generated ? 'ok' : 'missing',
      oldPath: doc.oldPath,
      oldTitle: doc.oldTitle,
      oldFile: doc.oldFile,
      expectedId,
      expectedSlug: expectedId,
      expectedCategoryId: expectedCategory?.categoryId || null,
      expectedCategoryName: expectedCategory?.categoryName || null,
      newId: generated?.id || null,
      newSlug: generated?.slug || null,
      newTitle: generated?.title || null,
      newCategoryId: generated?.category_id || null,
      newCategoryName: generated?.category_id ? categoryNameById.get(generated.category_id) || null : null,
      titleMatches: generated ? generated.title === doc.oldTitle : false,
      categoryMatches: generated ? generated.category_id === expectedCategory?.categoryId : false,
      expectedLinkCount: expectedSet.size,
      generatedLinkCount: generatedSet.size,
      missingLinks,
      brokenGeneratedArticleLinks,
      newUrl: generated?.slug ? `/article/${generated.slug}` : null,
    };
  });

  const summary = {
    totalOldDocs: oldDocs.length,
    totalGeneratedArticles: generatedArticles.length,
    totalGeneratedCategories: generatedCategories.length,
    totalSearchEntries: generatedSearchEntries.length,
    mappedDocs: mappedDocs.length,
    matchedDocs: rows.filter((row) => row.status === 'ok').length,
    missingDocs: rows.filter((row) => row.status === 'missing').length,
    titleMismatches: rows.filter((row) => row.status === 'ok' && !row.titleMatches).length,
    categoryMismatches: rows.filter((row) => row.status === 'ok' && !row.categoryMatches).length,
    docsWithMissingLinks: rows.filter((row) => row.missingLinks.length > 0).length,
    docsWithBrokenGeneratedArticleLinks: rows.filter((row) => row.brokenGeneratedArticleLinks.length > 0).length,
  };

  return {
    summary,
    rows,
    missingFromImporter: oldDocs.map((doc) => doc.oldPath).filter((doc) => !mappedDocs.includes(doc)),
    extraInImporter: mappedDocs.filter((doc) => !docsByPath.has(doc)),
    missingFromGenerated: rows.filter((row) => row.status === 'missing').map((row) => row.oldPath),
  };
}
