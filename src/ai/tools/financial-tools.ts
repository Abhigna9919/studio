
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
    description: 'Fetches the latest stock price for a given Indian stock ticker symbol from the exchange.',
    inputSchema: z.object({
      ticker: z.string().describe('The NSE or BSE ticker symbol of the stock.'),
    }),
    outputSchema: z.object({
      price: z.number(),
      currency: z.string().default('INR'),
    }),
  },
  async ({ ticker }) => {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      throw new Error("RapidAPI key is not configured.");
    }

    // IMPORTANT: Replace with the actual RapidAPI endpoint for Indian stocks
    const url = `https://rapidapi.com/api/indian-stock-price-placeholder/details?symbol=${ticker}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': new URL(url).hostname,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch stock price from RapidAPI: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      // IMPORTANT: Adjust the logic below to match the actual API response structure
      const price = data?.price || data?.latestPrice || data?.currentPrice;
      if (typeof price !== 'number') {
        throw new Error(`Could not find a valid price in the API response for ${ticker}.`);
      }

      return { price };
    } catch (error) {
        console.error(`Error in getStockPriceTool for ${ticker}:`, error);
        // Silently fail for now to avoid breaking the whole analysis if one stock fails
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
