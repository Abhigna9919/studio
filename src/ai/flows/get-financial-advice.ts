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

const FinancialAdviceOutputSchema = z.object({
  recommendations: z.array(z.string()).describe("Actionable financial recommendations for the user."),
  idealAssetTypes: z.array(z.string()).describe("The ideal asset classes for the user's investment portfolio."),
  humor: z.string().describe("A witty, Gen-Z friendly, and relatable humorous comment about the user's financial habits.")
});
export type FinancialAdviceOutput = z.infer<typeof FinancialAdviceOutputSchema>;

export async function getFinancialAdvice(input: FinancialAdviceInput): Promise<FinancialAdviceOutput> {
  return getFinancialAdviceFlow(input);
}

const financialAdvicePrompt = ai.definePrompt({
  name: 'financialAdvicePrompt',
  input: { schema: FinancialAdviceInputSchema },
  output: { schema: FinancialAdviceOutputSchema },
  tools: [
    fetchNetWorthTool,
    fetchBankTransactionsTool,
    fetchStockTransactionsTool,
    fetchMfTransactionsTool,
    fetchEpfDetailsTool,
    fetchCreditReportTool,
  ],
  config: {
    response: {
        format: 'json',
    }
  },
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
    const response = await financialAdvicePrompt({});
    const advice = response.output;
    if (!advice) {
      throw new Error("Failed to generate financial advice.");
    }
    return advice;
  }
);
