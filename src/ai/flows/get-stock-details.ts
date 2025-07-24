
'use server';

/**
 * @fileOverview This file defines a Genkit flow for fetching generic details about a stock using its ISIN.
 * 
 * - getStockDetails - A function that takes an ISIN and returns a descriptive summary of the company.
 * - GetStockDetailsInput - The input type for the getStockDetails function.
 * - GetStockDetailsOutput - The return type for the getStockDetails function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetStockDetailsInputSchema = z.object({
  isin: z.string().describe("The ISIN of the stock."),
});
export type GetStockDetailsInput = z.infer<typeof GetStockDetailsInputSchema>;


const GetStockDetailsOutputSchema = z.object({
    companyName: z.string().describe("The name of the company."),
    stockSymbol: z.string().describe("The stock ticker symbol."),
    description: z.string().describe("A detailed description of the company, its business, and market position."),
    keyExecutives: z.array(z.string()).describe("A list of key executives at the company."),
    recentNews: z.string().describe("A summary of recent news or developments related to the company.")
});
export type GetStockDetailsOutput = z.infer<typeof GetStockDetailsOutputSchema>;


export async function getStockDetails(input: GetStockDetailsInput): Promise<GetStockDetailsOutput> {
  return getStockDetailsFlow(input);
}


const getStockDetailsPrompt = ai.definePrompt({
  name: 'getStockDetailsPrompt',
  input: { schema: GetStockDetailsInputSchema },
  output: { schema: GetStockDetailsOutputSchema },
  prompt: `
    You are a senior financial analyst. For the company associated with the ISIN "{{isin}}", provide a detailed report.

    Based on your knowledge, please provide the following information:
    - The full company name.
    - Its primary stock ticker symbol.
    - A detailed description of the company's business, what it does, and its position in the market.
    - A list of its key executives (e.g., CEO, CFO).
    - A brief summary of any major news or developments related to the company in the last 6-12 months.

    Return the information in the specified JSON format.
  `,
});


const getStockDetailsFlow = ai.defineFlow(
  {
    name: 'getStockDetailsFlow',
    inputSchema: GetStockDetailsInputSchema,
    outputSchema: GetStockDetailsOutputSchema,
  },
  async (input) => {
    const response = await getStockDetailsPrompt(input);
    const details = response.output;

    if (!details) {
        throw new Error(`Failed to get details for ISIN ${input.isin}.`);
    }

    return details;
  }
);
