import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const host = process.env.MEILISEARCH_HOST;
const apiKey = process.env.MEILISEARCH_ADMIN_API_KEY || process.env.MEILISEARCH_SEARCH_API_KEY;
const indexUid = process.env.MEILISEARCH_INDEX || 'eidentic_docs';
const documentsFile = path.resolve('src/data/generated/eidentic-search.json');

if (!host || !apiKey) {
  console.error('Missing MEILISEARCH_HOST or MEILISEARCH_ADMIN_API_KEY.');
  process.exit(1);
}

if (!fs.existsSync(documentsFile)) {
  console.error(`Search document file not found: ${documentsFile}`);
  console.error('Run `node scripts/import-eidentic-docs.mjs` first.');
  process.exit(1);
}

const documents = JSON.parse(fs.readFileSync(documentsFile, 'utf8'));

function meiliRequest(method, requestPath, body) {
  const args = [
    '-sS',
    '--max-time',
    '30',
    '-X',
    method,
    '-H',
    `Authorization: Bearer ${apiKey}`,
    '-H',
    'Content-Type: application/json',
    `${host}${requestPath}`,
  ];

  if (body !== undefined) {
    args.push('--data', JSON.stringify(body));
  }

  const output = execFileSync('curl', args, { encoding: 'utf8' });
  return output ? JSON.parse(output) : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForTask(taskUid) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 60_000) {
    const task = meiliRequest('GET', `/tasks/${taskUid}`);

    if (task.status === 'succeeded') return task;
    if (task.status === 'failed') {
      throw new Error(`Task ${taskUid} failed: ${JSON.stringify(task.error || task, null, 2)}`);
    }

    await sleep(500);
  }

  throw new Error(`Timed out waiting for task ${taskUid}`);
}

const existingIndexes = meiliRequest('GET', '/indexes');
const hasIndex = Array.isArray(existingIndexes?.results)
  && existingIndexes.results.some((index) => index.uid === indexUid);

if (!hasIndex) {
  const createTask = meiliRequest('POST', '/indexes', { uid: indexUid, primaryKey: 'id' });
  await waitForTask(createTask.taskUid);
}

const settingsTask = meiliRequest('PATCH', `/indexes/${indexUid}/settings`, {
  searchableAttributes: ['title', 'excerpt', 'category_name', 'content_text'],
  displayedAttributes: [
    'id',
    'title',
    'slug',
    'excerpt',
    'category_id',
    'category_name',
    'content_preview',
    'url',
  ],
  filterableAttributes: ['category_id', 'category_name'],
  typoTolerance: {
    enabled: true,
  },
});

await waitForTask(settingsTask.taskUid);

const documentsTask = meiliRequest('POST', `/indexes/${indexUid}/documents`, documents);
await waitForTask(documentsTask.taskUid);

console.log(`Synced ${documents.length} documents to Meilisearch index "${indexUid}".`);
