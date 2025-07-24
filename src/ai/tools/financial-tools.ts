
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  netWorthResponseSchema,
  bankTransactionsResponseSchema,
  stockTransactionsResponseSchema,
  mfTransactionsResponseSchema,
  epfDetailsResponseSchema,
  creditReportResponseSchema
} from '@/lib/schemas';
import {fetchNetWorthAction} from '@/app/dashboard/actions';
import {fetchBankTransactionsAction} from '@/app/dashboard/transactions/actions';
import {fetchStockTransactionsAction} from '@/app/dashboard/stock-transactions/actions';
import {fetchMfTransactionsAction} from '@/app/dashboard/mf-transactions/actions';
import {fetchEpfDetailsAction} from '@/app/dashboard/epf/actions';
import {fetchCreditReportAction} from '@/app/dashboard/credit-report/actions';


export const getStockPriceTool = ai.defineTool(
  {
    name: 'getStockPrice',
    description: 'Fetches the latest stock price and details for a given Indian stock ISIN from the exchange.',
    inputSchema: z.object({
      isin: z.string().describe('The ISIN of the stock.'),
    }),
    outputSchema: z.object({
      price: z.number(),
      name: z.string().optional(),
      symbol: z.string().optional(),
      currency: z.string().optional(),
      region: z.string().optional(),
    }),
  },
  async ({ isin }) => {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      throw new Error("ALPHA_VANTAGE_API_KEY is not configured.");
    }
    
    try {
      // Step 1: Search for the symbol using the ISIN
      const searchUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${isin}&apikey=${apiKey}`;
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        console.warn(`Alpha Vantage search API failed for ISIN ${isin}. Status: ${searchResponse.status}`);
        return { price: 0 };
      }
      
      const searchData = await searchResponse.json();
      const bestMatch = searchData.bestMatches?.[0];

      if (!bestMatch || !bestMatch['1. symbol']) {
        console.warn(`No symbol found for ISIN ${isin} on Alpha Vantage.`);
        return { price: 0 };
      }
      
      const symbol = bestMatch['1. symbol'];
      const name = bestMatch['2. name'];
      const region = bestMatch['4. region'];
      const currency = bestMatch['8. currency'];

      // Step 2: Get the global quote for the found symbol
      const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      const quoteResponse = await fetch(quoteUrl);
      if (!quoteResponse.ok) {
         console.warn(`Alpha Vantage quote API failed for symbol ${symbol}. Status: ${quoteResponse.status}`);
         return { price: 0 };
      }

      const quoteData = await quoteResponse.json();
      const priceString = quoteData?.['Global Quote']?.['05. price'];
      
      if (priceString) {
        const price = parseFloat(priceString);
        if (!isNaN(price)) {
          return { price, name, symbol, currency, region };
        }
      }
      
      console.warn(`Could not parse price from Alpha Vantage for symbol ${symbol}.`);
      return { price: 0, name, symbol, currency, region };

    } catch (error) {
        console.error(`Error in getStockPriceTool for ISIN ${isin}:`, error);
        return { price: 0 };
    }
  }
);


export const fetchAmfiNavDataTool = ai.defineTool(
  {
    name: 'fetchAmfiNavData',
    description: 'Fetches a summary of the latest Net Asset Value (NAV) for top Indian mutual funds from AMFI.',
    inputSchema: z.object({}),
    outputSchema: z.string(),
  },
  async () => {
    try {
      const response = await fetch('https://www.amfiindia.com/spages/NAVAll.txt');
      if (!response.ok) {
        throw new Error(`Failed to fetch AMFI data: ${response.statusText}`);
      }
      const textData = await response.text();
      const lines = textData.split('\n');
      
      // Filter for relevant lines (equity funds, etc.) and skip header/footer
      const relevantLines = lines.filter(line => 
        line.includes('Equity') && !line.startsWith('Scheme Code')
      );

      // Get a sample of the data to pass to the model (e.g., first 20 relevant funds)
      const dataSummary = relevantLines.slice(0, 20).map(line => {
        const parts = line.split(';');
        // Scheme Name; Net Asset Value
        return `${parts[3]}: ${parts[4]}`;
      }).join(', ');
      
      return `Top Mutual Funds Summary: ${dataSummary}`;
    } catch (error) {
      console.error("Error fetching or parsing AMFI NAV data:", error);
      return "Could not retrieve mutual fund data at this time.";
    }
  }
);


export const fetchNetWorthTool = ai.defineTool(
  {
    name: 'fetchNetWorth',
    description: 'Fetches the user\'s total net worth, asset and liability breakdown, and detailed investment holdings.',
    inputSchema: z.object({}),
    outputSchema: netWorthResponseSchema,
  },
  async () => {
    const result = await fetchNetWorthAction();
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data!;
  }
);

export const fetchBankTransactionsTool = ai.defineTool(
  {
    name: 'fetchBankTransactions',
    description: 'Fetches the user\'s recent bank transactions from all linked accounts.',
    inputSchema: z.object({}),
    outputSchema: bankTransactionsResponseSchema,
  },
  async () => {
    const result = await fetchBankTransactionsAction();
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data!;
  }
);

export const fetchStockTransactionsTool = ai.defineTool(
  {
    name: 'fetchStockTransactions',
    description: 'Fetches the user\'s recent stock market transaction history.',
    inputSchema: z.object({}),
    outputSchema: stockTransactionsResponseSchema,
  },
  async () => {
    const result = await fetchStockTransactionsAction();
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data!;
  }
);

export const fetchMfTransactionsTool = ai.defineTool(
  {
    name: 'fetchMfTransactions',
    description: 'Fetches the user\'s recent mutual fund transaction history.',
    inputSchema: z.object({}),
    outputSchema: mfTransactionsResponseSchema,
  },
  async () => {
    const result = await fetchMfTransactionsAction();
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data!;
  }
);

export const fetchEpfDetailsTool = ai.defineTool(
  {
    name: 'fetchEpfDetails',
    description: 'Fetches the user\'s Employee Provident Fund (EPF) details, including balances and account information.',
    inputSchema: z.object({}),
    outputSchema: epfDetailsResponseSchema,
  },
  async () => {
    const result = await fetchEpfDetailsAction();
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data!;
  }
);

export const fetchCreditReportTool = ai.defineTool(
  {
    name: 'fetchCreditReport',
    description: 'Fetches the user\'s credit report, including credit score, history, and details of open and closed accounts.',
    inputSchema: z.object({}),
    outputSchema: creditReportResponseSchema,
  },
  async () => {
    const result = await fetchCreditReportAction();
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data!;
  }
);
