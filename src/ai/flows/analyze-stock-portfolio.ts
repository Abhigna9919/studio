
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a user's stock portfolio.
 *
 * - analyzeStockPortfolio - A function that fetches and analyzes stock transactions to provide insights.
 * - StockAnalysisOutput - The return type, containing portfolio summary, top holdings, sector allocation, and recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { type StockTransactionsResponse, stockTransactionsResponseSchema } from '@/lib/schemas';
import { getStockPriceTool } from '../tools/financial-tools';

const StockAnalysisOutputSchema = z.object({
    portfolioSummary: z.string().describe("A brief, one-sentence summary of the user's stock portfolio concentration and potential risk."),
    topHoldings: z.array(z.object({
        stockName: z.string().describe("The full name of the stock."),
        investedAmount: z.string().describe("The total estimated amount invested in this stock."),
        currentValue: z.string().describe("The estimated current value of this holding."),
    })).describe("A list of the top 5 stock holdings by current value."),
    sectorAllocation: z.array(z.object({
        sector: z.string().describe("The industry sector (e.g., Technology, Banking, FMCG)."),
        percentage: z.number().describe("The percentage of the portfolio in this sector."),
    })).describe("A breakdown of the portfolio by industry sector."),
    recommendations: z.array(z.string()).describe("A list of 2-3 actionable recommendations for the user (e.g., 'Consider diversifying away from the banking sector' or 'Your portfolio seems heavily weighted in small-caps, consider adding some large-cap stability.').")
});
export type StockAnalysisOutput = z.infer<typeof StockAnalysisOutputSchema>;

export async function analyzeStockPortfolio(transactions: StockTransactionsResponse): Promise<StockAnalysisOutput> {
  return analyzeStockPortfolioFlow(transactions);
}

const analyzeStockPortfolioPrompt = ai.definePrompt({
  name: 'analyzeStockPortfolioPrompt',
  input: { schema: stockTransactionsResponseSchema },
  output: { schema: StockAnalysisOutputSchema },
  tools: [getStockPriceTool],
  prompt: `
    You are an expert stock market analyst. Your task is to analyze the provided JSON data of a user's stock transactions and return a clear, concise analysis. The user is likely from India.

    USER'S STOCK TRANSACTIONS:
    {{{json transactions}}}

    ## TASKS:

    1. **Analyze and Summarize:** Based on the fetched transactions, perform the following analysis:
        *   **Calculate Holdings:** For each unique stock (by ISIN), calculate the net quantity of shares held (total BUYs - total SELLs). Then, estimate the total invested amount.
        *   **Fetch Live Prices and Names:** Use the getStockPriceTool to fetch the current market price and full name for each stock held by its ISIN.
        *   **Calculate Current Value:** Use the live price to calculate the current market value of each holding.
        *   **Identify Top 5 Holdings:** Based on the calculated current value, determine the top 5 largest stock holdings. Use the full stock name returned by the tool.
        *   **Estimate Sector Allocation:** Infer the sector for each stock based on its name or common knowledge (e.g., 'RELIANCE' is 'Energy/Conglomerate', 'HDFCBANK' is 'Banking'). Estimate the portfolio's allocation across these sectors.
        *   **Generate Recommendations:** Based on the allocation and holdings, provide 2-3 actionable recommendations. For example, if the portfolio is 90% in technology stocks, suggest diversification. If it contains many high-risk penny stocks, suggest caution.
        *   **Write a Summary:** Provide a single-sentence summary of the portfolio's overall state, focusing on diversification and risk.

    2. **Format Output:** Return the analysis as a single JSON object matching the StockAnalysisOutputSchema. Ensure all fields are populated correctly.
  `,
});

const analyzeStockPortfolioFlow = ai.defineFlow(
  {
    name: 'analyzeStockPortfolioFlow',
    inputSchema: stockTransactionsResponseSchema,
    outputSchema: StockAnalysisOutputSchema,
  },
  async (transactions) => {
    const response = await analyzeStockPortfolioPrompt(transactions);
    
    const analysis = response.output;
    if (!analysis) {
        throw new Error("Failed to generate stock portfolio analysis from the AI.");
    }
    return analysis;
  }
);
