import { config } from 'dotenv';
config();

// The ordering of these imports is important to prevent circular dependency issues.
// Tools should be imported first, then flows that use them.
import '@/ai/tools/financial-tools.ts';
import '@/ai/prompts/comparison-prompt.ts';

import '@/ai/flows/generate-financial-plan.ts';
import '@/ai/flows/optimize-financial-plan.ts';
import '@/ai/flows/get-financial-advice.ts';
import '@/ai/flows/analyze-mf-portfolio.ts';
import '@/ai/flows/analyze-isin-list.ts';
import '@/ai/flows/get-stock-details.ts';
