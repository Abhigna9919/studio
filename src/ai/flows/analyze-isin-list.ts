
'use server';

/**
 * @fileOverview This file defines a Genkit flow for performing technical analysis on a list of ISINs.
 * 
 * - analyzeISINList - A function that takes a list of ISINs and an Alpha Vantage API key to return technical analysis data.
 * - AnalyzeISINListInput - The input type for the analyzeISINList function.
 * - AnalyzeISINListOutput - The return type for the analyzeISINList function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeISINListInputSchema = z.object({
  isins: z.array(z.string()).describe("An array of ISIN strings."),
  av_api_key: z.string().describe("Alpha Vantage API key."),
});
export type AnalyzeISINListInput = z.infer<typeof AnalyzeISINListInputSchema>;

const StockAnalysisResultSchema = z.object({
  isin: z.string(),
  symbol: z.string(),
  name: z.string(),
  currentPrice: z.string(),
  rsi: z.string(),
  sma: z.string(),
});

const AnalyzeISINListOutputSchema = z.object({
  analysis: z.array(StockAnalysisResultSchema),
});
export type AnalyzeISINListOutput = z.infer<typeof AnalyzeISINListOutputSchema>;


const isinMap: Record<string, { symbol: string; name: string }> = {
    "US0378331005": { symbol: "AAPL", name: "Apple Inc." },
    "US5949181045": { symbol: "MSFT", name: "Microsoft Corporation" },
    "US88160R1014": { symbol: "TSLA", name: "Tesla Inc." },
    "INE0BWS23018": { symbol: "TCS", name: "Tata Consultancy Services" },
    "INE040A01034": { symbol: "RELIANCE", name: "Reliance Industries" },
    "INE916P01025": { symbol: "PAYTM", name: "One97 Communications" },
    "INE043D01016": { symbol: "BANDHANBNK", name: "Bandhan Bank" },
    "INE0CCU25019": { symbol: "MOTHERSON", name: "Samvardhana Motherson" },
    "INE0FDU25010": { symbol: "MOTHERSON", name: "Samvardhana Motherson" },
    "INE0GGX23010": { symbol: "IDEA", name: "Vodafone Idea" },
    "INF204KB14I2": { symbol: "AXISBANK", name: "Axis Bank" },
    "INF204KB14I5": { symbol: "ICICIBANK", name: "ICICI Bank" },
};

async function fetchJson(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data['Error Message'] || data['Information']) {
        throw new Error(data['Error Message'] || data['Information']);
    }
    return data;
}

export const analyzeISINList = ai.defineFlow(
  {
    name: 'analyzeISINList',
    inputSchema: AnalyzeISINListInputSchema,
    outputSchema: AnalyzeISINListOutputSchema,
  },
  async ({ isins, av_api_key }) => {
    
    if (!isins || isins.length === 0 || !av_api_key) {
        throw new Error("Missing 'isins' or 'av_api_key'");
    }

    const analysisResults: z.infer<typeof StockAnalysisResultSchema>[] = [];

    for (const isin of isins) {
      const stockInfo = isinMap[isin];
      if (!stockInfo) {
        console.warn(`ISIN ${isin} not found in map, skipping.`);
        continue;
      }

      const { symbol, name } = stockInfo;

      try {
        const priceUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${av_api_key}`;
        const rsiUrl = `https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${av_api_key}`;
        const smaUrl = `https://www.alphavantage.co/query?function=SMA&symbol=${symbol}&interval=daily&time_period=20&series_type=close&apikey=${av_api_key}`;

        const [priceData, rsiData, smaData] = await Promise.all([
          fetchJson(priceUrl),
          fetchJson(rsiUrl),
          fetchJson(smaUrl),
        ]);
        
        const latestDate = priceData["Meta Data"]["3. Last Refreshed"];
        const currentPrice = priceData["Time Series (Daily)"][latestDate]["4. close"];

        const rsiValues = rsiData["Technical Analysis: RSI"];
        const latestRsiDate = Object.keys(rsiValues)[0];
        const rsi = rsiValues[latestRsiDate]["RSI"];
        
        const smaValues = smaData["Technical Analysis: SMA"];
        const latestSmaDate = Object.keys(smaValues)[0];
        const sma = smaValues[latestSmaDate]["SMA"];

        analysisResults.push({
          isin,
          symbol,
          name,
          currentPrice: String(currentPrice),
          rsi: String(rsi),
          sma: String(sma),
        });

      } catch (error) {
        if (error instanceof Error) {
            console.error(`Failed to process ISIN ${isin} (${symbol}): ${error.message}`);
        } else {
            console.error(`Failed to process ISIN ${isin} (${symbol}): An unknown error occurred`);
        }
        // Skip this ISIN and continue with others
      }
    }

    return { analysis: analysisResults };
  }
);
