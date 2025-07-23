'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating financial advice based on a user's comprehensive financial data.
 *
 * - getFinancialAdvice - A function that leverages multiple financial tools to analyze a user's situation and provide actionable recommendations.
 * - FinancialAdviceOutput - The return type for the getFinancialAdvice function, including recommendations, ideal asset types, and a touch of humor.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  fetchNetWorthTool,
  fetchBankTransactionsTool,
  fetchStockTransactionsTool,
  fetchMfTransactionsTool,
  fetchEpfDetailsTool,
  fetchCreditReportTool,
} from '@/ai/tools/financial-tools';

// No input schema is needed as the prompt will use tools to fetch all required data.
const FinancialAdviceInputSchema = z.object({});
export type FinancialAdviceInput = z.infer<typeof FinancialAdviceInputSchema>;

const FinancialAdviceOutputSchema = z.string();
export type FinancialAdviceOutput = z.infer<typeof FinancialAdviceOutputSchema>;

export async function getFinancialAdvice(input: FinancialAdviceInput): Promise<FinancialAdviceOutput> {
  return getFinancialAdviceFlow(input);
}

const financialAdvicePrompt = ai.definePrompt({
  name: 'financialAdvicePrompt',
  input: { schema: FinancialAdviceInputSchema },
  tools: [
    fetchNetWorthTool,
    fetchBankTransactionsTool,
    fetchStockTransactionsTool,
    fetchMfTransactionsTool,
    fetchEpfDetailsTool,
    fetchCreditReportTool,
  ],
  prompt: `
    Analyze all the data and return ONLY a valid JSON object with these keys:

    {
      "recommendations": ["Smart investment ideas tailored to the user"],
      "idealAssetTypes": ["Types like SIPs, Gold, Stocks, EPF, FD"],
      "humor": "A sharp Gen-Z-style roast or motivation line"
    }
  `,
});

const getFinancialAdviceFlow = ai.defineFlow(
  {
    name: 'getFinancialAdviceFlow',
    inputSchema: FinancialAdviceInputSchema,
    outputSchema: FinancialAdviceOutputSchema,
  },
  async () => {
    try {
      const response = await financialAdvicePrompt({});
      return response.text;
    } catch (error) {
        console.error("Error in getFinancialAdviceFlow:", error);
        if (error instanceof Error) {
            return `An error occurred while generating financial advice: ${error.message}`;
        }
        return "An unknown error occurred while generating financial advice.";
    }
  }
);
