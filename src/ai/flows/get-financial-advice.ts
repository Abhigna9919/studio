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
  prompt: `
    Analyze all the data and return ONLY a valid JSON object with these keys:

    {
      "recommendations": ["Smart investment ideas tailored to the user"],
      "idealAssetTypes": ["Types like SIPs, Gold, Stocks, EPF, FD"],
      "humor": "A sharp Gen-Z-style roast or motivation line"
    }
  `,
});

// Helper function to find and parse JSON from a raw text response
function extractAndParseJson(text: string): any {
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in the response text.");
  }
  
  // Use the first captured group that is not undefined.
  const jsonString = jsonMatch[1] || jsonMatch[2];

  try {
    return JSON.parse(jsonString);
  } catch(e) {
    console.error("Failed to parse the extracted JSON:", jsonString);
    throw new Error(`Failed to parse the extracted JSON: ${e}`);
  }
}

const getFinancialAdviceFlow = ai.defineFlow(
  {
    name: 'getFinancialAdviceFlow',
    inputSchema: FinancialAdviceInputSchema,
    outputSchema: FinancialAdviceOutputSchema,
  },
  async () => {
    const response = await financialAdvicePrompt({});
    const adviceText = response.text;
    if (!adviceText) {
      throw new Error("Failed to generate financial advice text.");
    }

    try {
        // First, try to use the structured output if available and valid.
        if (response.output) {
            const validationResult = FinancialAdviceOutputSchema.safeParse(response.output);
            if (validationResult.success) {
                return validationResult.data;
            }
        }

        // If structured output fails, fall back to manually parsing the text.
        const parsedJson = extractAndParseJson(adviceText);
        return FinancialAdviceOutputSchema.parse(parsedJson);

    } catch (error) {
        console.error("Error processing financial advice:", error);
        console.error("Raw AI response text:", adviceText);
        throw new Error("An error occurred while processing the financial advice response.");
    }
  }
);
