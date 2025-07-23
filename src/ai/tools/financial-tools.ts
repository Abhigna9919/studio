
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
    description: 'Fetches the latest closing stock price for a given Indian stock ISIN from the exchange.',
    inputSchema: z.object({
      isin: z.string().describe('The ISIN of the stock.'),
    }),
    outputSchema: z.object({
      price: z.number(),
      currency: z.string().default('INR'),
    }),
  },
  async ({ isin }) => {
    const apiKey = process.env.EODHD_API_KEY;
    if (!apiKey) {
      throw new Error("EODHD API key is not configured.");
    }
    
    // As the user is likely from India, we prioritize Indian exchanges.
    const exchanges = ['NSE', 'BSE']; 

    try {
      for (const exchange of exchanges) {
        const tickerListUrl = `https://eodhd.com/api/exchange-symbol-list/${exchange}?api_token=${apiKey}&fmt=json`;
        const tickerResponse = await fetch(tickerListUrl);
        
        if (!tickerResponse.ok) {
            console.warn(`Could not fetch symbol list for exchange ${exchange}. Status: ${tickerResponse.status}`);
            continue; // Try next exchange
        }

        const tickers = await tickerResponse.json();
        const matchedTicker = tickers.find((t: any) => t.Isin === isin);

        if (matchedTicker) {
            const fundamentalsUrl = `https://eodhd.com/api/fundamentals/${matchedTicker.Code}.${exchange}?api_token=${apiKey}&fmt=json&filter=General`;
            const fundamentalsResponse = await fetch(fundamentalsUrl);
            
            if (!fundamentalsResponse.ok) {
                 console.warn(`Could not fetch fundamentals for ${isin} on exchange ${exchange}. Status: ${fundamentalsResponse.status}`);
                 continue;
            }

            const fundamentals = await fundamentalsResponse.json();
            const price = fundamentals?.MarketCapitalizationMln > 0 ? fundamentals?.Valuation?.TrailingPE * fundamentals?.Earnings?.History?.yearly?.[Object.keys(fundamentals.Earnings.History.yearly)[0]]?.epsActual : fundamentals?.Technicals?.previousClose;


            if (typeof price === 'number' && price > 0) {
              return { price };
            }
        }
      }
      
      // Fallback to the search API if not found in the primary exchanges
      const searchUrl = `https://eodhistoricaldata.com/api/search/${isin}?api_token=${apiKey}&fmt=json`;
      const searchResponse = await fetch(searchUrl);
      if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const firstResult = searchData?.[0];
          const price = firstResult?.previousClose;
           if (typeof price === 'number') {
            return { price };
          }
      }

      console.warn(`Could not find price for ISIN ${isin} on any supported exchange or via search.`);
      return { price: 0 };

    } catch (error) {
        console.error(`Error in getStockPriceTool for ${isin}:`, error);
        // Silently fail to avoid breaking the whole analysis if one stock fails
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
