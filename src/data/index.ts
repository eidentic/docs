export { folders } from './folders';
import { applyAiSdk7DocUpdates } from './eidentic-ai-sdk-7';
import { applyV0312DocUpdates } from './eidentic-v0-3-12';
import { generatedCategories, generatedArticles } from './generated/eidentic';

export const categories = generatedCategories;
export const articles = applyV0312DocUpdates(applyAiSdk7DocUpdates(generatedArticles));
