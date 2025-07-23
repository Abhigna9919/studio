
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a user's mutual fund portfolio.
 *
 * - analyzeMutualFundPortfolio - A function that fetches and analyzes MF transactions to provide insights.
 * - MfAnalysisOutput - The return type, containing portfolio summary, top holdings, allocation, and recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchMfTransactionsTool } from '@/ai/tools/financial-tools';

const MfAnalysisOutputSchema = z.object({
    portfolioSummary: z.string().describe("A brief, one-sentence summary of the user's MF portfolio health and diversification."),
    topHoldings: z.array(z.object({
        fundName: z.string().describe("The name of the mutual fund."),
        investedAmount: z.string().describe("The total estimated amount invested in this fund."),
    })).describe("A list of the top 5 mutual fund holdings by invested amount."),
    assetAllocation: z.array(z.object({
        assetClass: z.string().describe("The asset class (e.g., Equity, Debt, Hybrid)."),
        percentage: z.number().describe("The percentage of the portfolio in this asset class."),
    })).describe("A breakdown of the portfolio by asset class."),
    recommendations: z.array(z.string()).describe("A list of 2-3 actionable recommendations for the user (e.g., 'Consider diversifying into a large-cap fund' or 'Your portfolio is well-balanced for your risk profile.').")
});
export type MfAnalysisOutput = z.infer<typeof MfAnalysisOutputSchema>;

export async function analyzeMutualFundPortfolio(): Promise<MfAnalysisOutput> {
  return analyzeMfPortfolioFlow();
}

const analyzeMfPortfolioPrompt = ai.definePrompt({
  name: 'analyzeMfPortfolioPrompt',
  tools: [fetchMfTransactionsTool],
  output: { schema: MfAnalysisOutputSchema },
  prompt: `
    You are an expert financial analyst. Your task is to analyze a user's mutual fund transactions and provide a clear, concise analysis.

    1. **Fetch Data:** Use the \`fetchMfTransactionsTool\` to get the user's complete mutual fund transaction history.

    2. **Analyze and Summarize:** Based on the fetched transactions, perform the following analysis:
        *   **Calculate Top Holdings:** Identify the top 5 funds where the user has invested the most money. Sum up all 'PURCHASE' transactions for each unique fund to estimate the total investment.
        *   **Estimate Asset Allocation:** Based on the fund names (e.g., "Equity," "Debt," "Liquid," "Multi Cap"), estimate the portfolio's allocation across major asset classes (Equity, Debt, Hybrid, Other).
        *   **Generate Recommendations:** Based on the allocation and holdings, provide 2-3 actionable recommendations. For example, if the portfolio is 100% in small-cap equity, suggest diversification. If it looks balanced, commend the user.
        *   **Write a Summary:** Provide a single-sentence summary of the portfolio's overall state.

    3. **Format Output:** Return the analysis as a single JSON object matching the MfAnalysisOutput schema. Ensure all fields are populated correctly.
  `,
});

const analyzeMfPortfolioFlow = ai.defineFlow(
  {
    name: 'analyzeMfPortfolioFlow',
    inputSchema: z.void(),
    outputSchema: MfAnalysisOutputSchema,
  },
  async () => {
    const response = await analyzeMfPortfolioPrompt({});
    const analysis = response.output;
    if (!analysis) {
        throw new Error("Failed to generate mutual fund portfolio analysis from the AI.");
    }
    return analysis;
  }
);
