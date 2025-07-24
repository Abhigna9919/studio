
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a user's stock portfolio.
 *
 * - analyzeStockPortfolio - A function that fetches and analyzes stock transactions to provide insights.
 * - StockAnalysisOutput - The return type, containing investor profile, top holdings, sector allocation, and recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchStockTransactionsAction } from '@/app/dashboard/stock-transactions/actions';
import { type StockTransactionsResponse, stockTransactionsResponseSchema } from '@/lib/schemas';

const StockAnalysisOutputSchema = z.object({
    investorProfile: z.string().describe("A brief, one-sentence summary of the user's investment style based on their holdings (e.g., 'Favors large-cap tech stocks, suggesting a growth-oriented strategy.')."),
    topHoldings: z.array(z.object({
        stockName: z.string().describe("The name of the stock."),
        investedAmount: z.string().describe("The total estimated amount invested in this stock."),
        currentValue: z.string().describe("The estimated current value of this holding."),
        sector: z.string().describe("The industry sector (e.g., Technology, Banking, FMCG)."),
    })).describe("A list of the top 5 stock holdings by current value."),
    sectorAllocation: z.array(z.object({
        sector: z.string().describe("The industry sector (e.g., Technology, Banking, FMCG)."),
        percentage: z.number().describe("The percentage of the portfolio in this sector."),
    })).describe("A breakdown of the portfolio by industry sector."),
    recommendations: z.array(z.string()).describe("A list of 2-3 actionable recommendations for the user (e.g., 'Consider diversifying away from the banking sector' or 'Your portfolio seems heavily weighted in small-caps, consider adding some large-cap stability.').")
});
export type StockAnalysisOutput = z.infer<typeof StockAnalysisOutputSchema>;

export async function analyzeStockPortfolio(): Promise<StockAnalysisOutput> {
  const transactionsResult = await fetchStockTransactionsAction();
  if (!transactionsResult.success || !transactionsResult.data) {
      throw new Error(transactionsResult.error || "Failed to fetch stock transactions for analysis.");
  }
  
  return analyzeStockPortfolioFlow(transactionsResult.data);
}

const StockAnalysisInputSchema = z.object({
    transactions: z.string().describe("A JSON string of the user's stock transactions.")
});

const analyzeStockPortfolioPrompt = ai.definePrompt({
  name: 'analyzeStockPortfolioPrompt',
  input: { schema: StockAnalysisInputSchema },
  output: { schema: StockAnalysisOutputSchema },
  prompt: `
    You are an expert equity analyst. Your task is to analyze the provided JSON data of a user's stock transactions and return a clear, concise analysis. You must infer sector and current value based on your internal knowledge of the stock names.

    USER'S STOCK TRANSACTIONS:
    {{{transactions}}}

    ## TASKS:

    1. **Analyze and Summarize:** Based on the fetched transactions, perform the following analysis:
        *   **Determine Investor Profile:** Based on the types of stocks held, write a one-sentence summary of the user's likely investment style (e.g., growth-focused, value investor, etc.).
        *   **Calculate Top Holdings:** Identify the top 5 stocks where the user has invested the most money. Sum up all 'BUY' transactions for each unique stock to estimate the total investment. Estimate the current value based on your knowledge.
        *   **Estimate Sector Allocation:** Based on the companies, determine the portfolio's allocation across major industry sectors (e.g., Technology, Finance, FMCG, etc.).
        *   **Generate Recommendations:** Based on the allocation and holdings, provide 2-3 actionable recommendations.
    
    2. **Format Output:** Return the analysis as a single JSON object matching the StockAnalysisOutput schema. Ensure all fields are populated correctly.
  `,
});

const analyzeStockPortfolioFlow = ai.defineFlow(
  {
    name: 'analyzeStockPortfolioFlow',
    inputSchema: stockTransactionsResponseSchema,
    outputSchema: StockAnalysisOutputSchema,
  },
  async (transactions) => {
    const response = await analyzeStockPortfolioPrompt({
        transactions: JSON.stringify(transactions)
    });
    
    const analysis = response.output;
    if (!analysis) {
        throw new Error("Failed to generate stock portfolio analysis from the AI.");
    }
    return analysis;
  }
);
