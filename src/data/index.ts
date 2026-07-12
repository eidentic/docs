export { folders } from './folders';
import { applyAiSdk7DocUpdates } from './eidentic-ai-sdk-7';
import { applyV0312DocUpdates } from './eidentic-v0-3-12';
import { applyV21DocUpdates } from './eidentic-v2-1';
import { applyV22DocUpdates } from './eidentic-v2-2';
import { generatedCategories, generatedArticles } from './generated/eidentic';

export const categories = generatedCategories;
export const articles = applyV22DocUpdates(applyV21DocUpdates(applyV0312DocUpdates(applyAiSdk7DocUpdates(generatedArticles))));
