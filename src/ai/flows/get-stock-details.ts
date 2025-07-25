
'use server';

/**
 * @fileOverview This file defines a Genkit flow for fetching generic details about a stock using its ISIN.
 * It now uses a dedicated tool to fetch live data from the Finnhub API.
 * 
 * - getStockDetails - A function that takes an ISIN and returns a descriptive summary of the company.
 * - GetStockDetailsInput - The input type for the getStockDetails function.
 * - GetStockDetailsOutput - The return type for the getStockDetails function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchStockProfileFromFinnhubTool } from '../tools/financial-tools';

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

const getStockDetailsFlow = ai.defineFlow(
  {
    name: 'getStockDetailsFlow',
    inputSchema: GetStockDetailsInputSchema,
    outputSchema: GetStockDetailsOutputSchema,
  },
  async ({ isin }) => {
    try {
        const details = await fetchStockProfileFromFinnhubTool({ isin });
        return details;
    } catch (error) {
        console.error(`Failed to get details for ISIN ${isin} via Finnhub tool:`, error);
        // Re-throwing the error to be handled by the caller (e.g., the stock transactions action)
        throw new Error(`Failed to retrieve stock details for ISIN ${isin}. The ISIN might be invalid or the API might be unavailable.`);
    }
  }
);
