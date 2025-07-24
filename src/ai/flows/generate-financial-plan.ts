
'use server';

/**
* @fileOverview This file defines a Genkit flow for generating ultra-intelligent, personalized financial plans for Gen Z users of the Paisa Vasool app.
*
* It integrates:
* * Smart goal classification and inflation-adjusted planning
* * Rule-based vs. AI-based suggestion balance
* * Transaction-based lifestyle adjustments
* * SIP portfolio construction using live AMFI data
* * Quota-aware Gemini usage
    */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchAmfiNavDataTool, fetchBankTransactionsTool, fetchNetWorthTool } from '../tools/financial-tools';
import { analyzeMutualFundPortfolio } from './analyze-mf-portfolio';

const GoalSchema = z.object({
title: z.string(),
deadline: z.string(),
risk: z.enum(['Low', 'Medium', 'High']),
monthlyInvestment: z.number(),
targetAmount: z.number(),
});

const GenerateFinancialPlanInputSchema = z.object({
goal: GoalSchema,
mfPortfolioAnalysis: z.string().describe("JSON string from analyzeMutualFundPortfolio() tool output"),
});
export type GenerateFinancialPlanInput = z.infer<typeof GenerateFinancialPlanInputSchema>;

const SIPPlanEntrySchema = z.object({
fundName: z.string(),
amount: z.string(),
reason: z.string(),
});

const GenerateFinancialPlanOutputSchema = z.object({
goalType: z.enum(['Short-term', 'Long-term']),
inflationAdjustedTarget: z.string().optional(),
requiredMonthlyInvestment: z.string().optional(),
isUserBudgetSufficient: z.boolean().optional(),
sipPlan: z.array(SIPPlanEntrySchema).optional(),
projectedCorpus: z.string().optional(),
transactionAdjustments: z.array(z.string()).optional(),
currentVsSuggestedPlanComparison: z.string().optional(),
summary: z.string(),
});
export type GenerateFinancialPlanOutput = z.infer<typeof GenerateFinancialPlanOutputSchema>;

export async function generateFinancialPlan(input: Omit<GenerateFinancialPlanInput, 'mfPortfolioAnalysis'>): Promise<GenerateFinancialPlanOutput> {
let mfAnalysis = "User has no existing mutual fund investments.";
try {
const analysis = await analyzeMutualFundPortfolio();
mfAnalysis = JSON.stringify(analysis);
} catch (error) {
console.error("Could not analyze MF portfolio, proceeding without it.", error);
}

return generateFinancialPlanFlow({ ...input, mfPortfolioAnalysis: mfAnalysis });
}

const generateFinancialPlanPrompt = ai.definePrompt({
name: 'generateFinancialPlanPrompt',
model: 'googleai/gemini-1.5-flash',
tools: [fetchAmfiNavDataTool, fetchNetWorthTool, fetchBankTransactionsTool],
input: { schema: GenerateFinancialPlanInputSchema },
output: { schema: GenerateFinancialPlanOutputSchema },
prompt: `
You are a witty, highly intelligent financial advisor built for Indian Gen Z users via the Paisa Vasool app. Your job is to analyze their goals, understand their spending behavior, and offer a sharply personalized yet realistic plan.

1. CLASSIFY THE GOAL:

* Short-term if deadline < 2 years or target < ₹2L
* Otherwise, Long-term

2. IF SHORT-TERM:

* Use fetchBankTransactionsTool to find top 3 spend categories
* Suggest precise savings like "Cut Zomato ₹1,000/month"
* Do NOT use SIPs; just show how monthly savings can meet the goal

3. IF LONG-TERM:

* Adjust goal for 6.5% annual inflation → inflationAdjustedTarget

* Calculate monthly SIP needed → requiredMonthlyInvestment

* Check if user budget is sufficient → isUserBudgetSufficient

* Use net worth and existing MF analysis to assess current portfolio

* Build SIP plan using fetchAmfiNavDataTool with rationale per fund

  * Low Risk: FDs, Large-Cap, Liquid
  * Medium: Multi-Cap, Gold, Mid-Cap
  * High: Small/Mid-Cap, Stocks, Thematic funds

* Add transaction-based cuts if budget is insufficient

* Compare current vs suggested strategy in simple language

* Project expected corpus → projectedCorpus

* Write a funny but motivating summary → summary
  `,
  });

const generateFinancialPlanFlow = ai.defineFlow(
{
name: 'generateFinancialPlanFlow',
inputSchema: GenerateFinancialPlanInputSchema,
outputSchema: GenerateFinancialPlanOutputSchema,
},
async input => {
const response = await generateFinancialPlanPrompt(input);
if (!response.output) {
throw new Error("Failed to generate a financial plan from the AI.");
}
return response.output;
}
);
