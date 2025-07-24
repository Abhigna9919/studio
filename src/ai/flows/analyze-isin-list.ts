
'use server';

/**
 * @fileOverview This file defines a Genkit flow for performing technical analysis on a list of ISINs using the model's knowledge.
 * 
 * - analyzeISINList - A function that takes a list of ISINs and returns technical analysis data.
 * - AnalyzeISINListInput - The input type for the analyzeISINList function.
 * - AnalyzeISINListOutput - The return type for the analyzeISINList function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeISINListInputSchema = z.object({
  isins: z.array(z.string()).describe("An array of ISIN strings."),
});
export type AnalyzeISINListInput = z.infer<typeof AnalyzeISINListInputSchema>;

const StockAnalysisResultSchema = z.object({
  isin: z.string(),
  symbol: z.string().describe("The stock ticker symbol."),
  name: z.string().describe("The full name of the company."),
  currentPrice: z.string().describe("The latest known trading price of the stock."),
  rsi: z.string().describe("The 14-day Relative Strength Index (RSI)."),
  sma: z.string().describe("The 20-day Simple Moving Average (SMA)."),
});

const AnalyzeISINListOutputSchema = z.object({
  analysis: z.array(StockAnalysisResultSchema),
});
export type AnalyzeISINListOutput = z.infer<typeof AnalyzeISINListOutputSchema>;


const stockAnalysisPrompt = ai.definePrompt({
    name: 'stockAnalysisPrompt',
    input: { schema: z.object({ isin: z.string() }) },
    output: { schema: StockAnalysisResultSchema },
    prompt: `
        You are a financial data analyst. For the stock with ISIN "{{isin}}", provide the following technical details based on your most recent knowledge:
        - ISIN
        - The primary stock ticker symbol.
        - The full company name.
        - The current or most recent stock price.
        - The 14-day Relative Strength Index (RSI).
        - The 20-day Simple Moving Average (SMA).

        Return the data in the specified JSON format. If you cannot find a specific value, provide a reasonable estimate or a placeholder like "N/A".
    `
});


export const analyzeISINList = ai.defineFlow(
  {
    name: 'analyzeISINList',
    inputSchema: AnalyzeISINListInputSchema,
    outputSchema: AnalyzeISINListOutputSchema,
  },
  async ({ isins }) => {
    
    if (!isins || isins.length === 0) {
        throw new Error("Missing 'isins'");
    }

    const analysisPromises = isins.map(async (isin) => {
      try {
        const result = await stockAnalysisPrompt({ isin });
        return result.output;
      } catch (error) {
        console.error(`Failed to analyze ISIN ${isin}:`, error);
        return null; // Return null for failed analyses
      }
    });

    const results = await Promise.all(analysisPromises);
    const validResults = results.filter((r): r is z.infer<typeof StockAnalysisResultSchema> => r !== null);
    
    return { analysis: validResults };
  }
);
