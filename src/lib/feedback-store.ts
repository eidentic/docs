import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

type VoteValue = 'helpful' | 'not_helpful';

type FeedbackStatsRow = {
  helpful_count: number;
  not_helpful_count: number;
  view_count: number;
};

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'feedback.sqlite');
const FEEDBACK_DB_PATH = process.env.FEEDBACK_DB_PATH || DEFAULT_DB_PATH;

let database: DatabaseSync | null = null;

function getDatabase() {
  if (database) {
    return database;
  }

  mkdirSync(path.dirname(FEEDBACK_DB_PATH), { recursive: true });
  database = new DatabaseSync(FEEDBACK_DB_PATH);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS article_feedback_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      article_id TEXT NOT NULL,
      session_key TEXT NOT NULL,
      viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, article_id, session_key)
    );

    CREATE TABLE IF NOT EXISTS article_feedback_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      article_id TEXT NOT NULL,
      session_key TEXT NOT NULL,
      vote TEXT NOT NULL CHECK (vote IN ('helpful', 'not_helpful')),
      voted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, article_id, session_key)
    );
  `);

  return database;
}

function extractClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') || 'unknown';
}

export function getFeedbackSessionKey(request: Request) {
  const seed = [
    extractClientIp(request),
    request.headers.get('user-agent') || 'unknown',
    request.headers.get('accept-language') || 'unknown',
  ].join('|');

  return createHash('sha256').update(seed).digest('hex');
}

export function recordArticleView(projectId: string, articleId: string, sessionKey: string) {
  const db = getDatabase();
  db.prepare(`
    INSERT OR IGNORE INTO article_feedback_views (project_id, article_id, session_key)
    VALUES (?, ?, ?)
  `).run(projectId, articleId, sessionKey);
}

export function recordArticleVote(projectId: string, articleId: string, sessionKey: string, vote: VoteValue) {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO article_feedback_votes (project_id, article_id, session_key, vote)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(project_id, article_id, session_key)
    DO UPDATE SET vote = excluded.vote, voted_at = CURRENT_TIMESTAMP
  `).run(projectId, articleId, sessionKey, vote);
}

export function getArticleFeedbackStats(projectId: string, articleId: string) {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN vote = 'helpful' THEN 1 ELSE 0 END), 0) AS helpful_count,
      COALESCE(SUM(CASE WHEN vote = 'not_helpful' THEN 1 ELSE 0 END), 0) AS not_helpful_count,
      (
        SELECT COUNT(*)
        FROM article_feedback_views
        WHERE project_id = ? AND article_id = ?
      ) AS view_count
    FROM article_feedback_votes
    WHERE project_id = ? AND article_id = ?
  `).get(projectId, articleId, projectId, articleId) as FeedbackStatsRow | undefined;

  return {
    helpfulCount: row?.helpful_count ?? 0,
    notHelpfulCount: row?.not_helpful_count ?? 0,
    viewCount: row?.view_count ?? 0,
  };
}
