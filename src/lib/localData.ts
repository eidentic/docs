/**
 * Local data layer for bundled docs content.
 * Exports the same function signatures as `src/lib/api.ts`
 * so pages can swap imports without changing anything else.
 */

import { articles as rawArticles, categories as rawCategories, folders as rawFolders } from '@/data/index';
import { faqs as rawFaqs } from '@/data/faqs';
import { helpCenterConfig } from '@/data/config';

export type { Article, Category, Faq } from './api';

export type HelpCenterConfig = typeof helpCenterConfig;

export async function getArticles(_projectId?: string) {
  return rawArticles.filter((article) => article.is_published);
}

export async function getCategories(_projectId?: string) {
  return [...rawCategories].sort(
    (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999),
  );
}

export async function getArticleBySlug(_projectId: string, slug: string) {
  return rawArticles.find((article) => article.slug === slug && article.is_published) ?? null;
}

export async function getHelpCenterConfig(_projectId?: string) {
  return helpCenterConfig;
}

export async function getFaqs(_projectId?: string) {
  return rawFaqs.filter((faq) => faq.is_published);
}

export async function getFolders(_projectId?: string) {
  return [...rawFolders].sort(
    (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999),
  );
}

export async function getOpenApiSpec(_projectId?: string) {
  return null;
}
