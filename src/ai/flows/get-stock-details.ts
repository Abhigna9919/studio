
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
    name: z.string().describe("The name of the company."),
    ticker: z.string().describe("The stock ticker symbol."),
    exchange: z.string().describe("The stock exchange the company is listed on."),
    marketCapitalization: z.number().describe("The market capitalization of the company."),
    ipo: z.string().describe("The IPO date of the company in YYYY-MM-DD format."),
    weburl: z.string().url().describe("The company's official website URL.")
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
    You are a financial data service. For the company associated with the ISIN "{{isin}}", provide its stock profile.

    Based on your knowledge, please provide the following information:
    - name: The full company name.
    - ticker: Its primary stock ticker symbol.
    - exchange: The primary stock exchange it trades on.
    - marketCapitalization: The company's market capitalization as a number.
    - ipo: The IPO date in YYYY-MM-DD format.
    - weburl: The official company website.

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
