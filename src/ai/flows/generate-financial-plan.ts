
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
import { fetchAmfiNavDataTool, fetchBankTransactionsTool, fetchEpfDetailsTool, fetchNetWorthTool } from '../tools/financial-tools';
import { analyzeMutualFundPortfolio } from './analyze-mf-portfolio';
import { analyzeStockPortfolio } from './analyze-stock-portfolio';

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
stockPortfolioAnalysis: z.string().describe("JSON string from the analyzeStockPortfolio() tool output."),
epfDetails: z.string().describe("JSON string of the user's EPF details from the fetchEpfDetailsTool.")
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

export async function generateFinancialPlan(input: Omit<GenerateFinancialPlanInput, 'mfPortfolioAnalysis' | 'stockPortfolioAnalysis' | 'epfDetails'>): Promise<GenerateFinancialPlanOutput> {
    let mfAnalysis = "User has no existing mutual fund investments.";
    try {
        const analysis = await analyzeMutualFundPortfolio();
        mfAnalysis = JSON.stringify(analysis);
    } catch (error) {
        console.error("Could not analyze MF portfolio, proceeding without it.", error);
    }

    let stockAnalysis = "User has no existing stock investments.";
    try {
        const analysis = await analyzeStockPortfolio();
        stockAnalysis = JSON.stringify(analysis);
    } catch (error) {
        console.error("Could not analyze stock portfolio, proceeding without it.", error);
    }
    
    let epfDetails = "User has no EPF details available.";
     try {
        const result = await fetchEpfDetailsTool();
        epfDetails = JSON.stringify(result);
    } catch (error) {
        console.error("Could not fetch EPF details, proceeding without it.", error);
    }


    return generateFinancialPlanFlow({ ...input, mfPortfolioAnalysis: mfAnalysis, stockPortfolioAnalysis: stockAnalysis, epfDetails });
}

const generateFinancialPlanPrompt = ai.definePrompt({
name: 'generateFinancialPlanPrompt',
model: 'googleai/gemini-1.5-flash',
tools: [fetchAmfiNavDataTool, fetchNetWorthTool, fetchBankTransactionsTool, fetchEpfDetailsTool],
input: { schema: GenerateFinancialPlanInputSchema },
output: { schema: GenerateFinancialPlanOutputSchema },
prompt: `
You are a witty, highly intelligent financial advisor built for Indian Gen Z users via the Paisa Vasool app. Your job is to analyze their goals, understand their spending behavior, and offer a sharply personalized yet realistic plan.

## DATA PROVIDED:
- User Goal: {{{goal}}}
- Mutual Fund Analysis: {{{mfPortfolioAnalysis}}}
- Stock Portfolio Analysis: {{{stockPortfolioAnalysis}}}
- EPF Details: {{{epfDetails}}}

## INSTRUCTIONS:

1.  **CLASSIFY THE GOAL:**
    *   Short-term if deadline < 2 years OR target < ₹2L.
    *   Otherwise, Long-term.

2.  **IF SHORT-TERM:**
    *   Use \`fetchBankTransactionsTool\` to find the top 3 spending categories.
    *   Suggest precise savings targets (e.g., "Cut Zomato spending by ₹1,000/month").
    *   Do NOT create a SIP plan. Just show how monthly savings can meet the goal.
    *   Focus the summary on achieving the goal through savings.

3.  **IF LONG-TERM:**
    *   Adjust the goal for 6.5% annual inflation -> \`inflationAdjustedTarget\`.
    *   Calculate the monthly SIP needed -> \`requiredMonthlyInvestment\`.
    *   Check if the user's monthly investment budget is sufficient -> \`isUserBudgetSufficient\`.
    *   Use the provided MF/Stock/EPF analysis to assess the current portfolio's health, risk, and diversification.
    *   Build a new, optimized SIP plan using \`fetchAmfiNavDataTool\` for live fund data. Justify each fund choice.
        *   **Low Risk:** Suggest FDs (especially if EPF is low or risk is low), Liquid funds, or Large-cap funds.
        *   **Medium Risk:** Multi-cap, Gold, Mid-cap funds.
        *   **High Risk:** Small/Mid-cap, Thematic funds.
    *   If the user's budget is insufficient, suggest specific spending cuts based on their transaction history (use \`fetchBankTransactionsTool\`).
    *   Write a concise comparison of their current strategy vs. your new, improved plan -> \`currentVsSuggestedPlanComparison\`.
    *   Project the expected total corpus by the goal's deadline -> \`projectedCorpus\`.
    *   Write a funny but motivating summary of the entire plan -> \`summary\`.
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
