export { folders } from './folders';
import { applyAiSdk7DocUpdates } from './eidentic-ai-sdk-7';
import { generatedCategories, generatedArticles } from './generated/eidentic';

export const categories = generatedCategories;
export const articles = applyAiSdk7DocUpdates(generatedArticles);
