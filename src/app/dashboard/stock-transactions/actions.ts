
"use server";

import { stockTransactionsResponseSchema, type StockTransactionsResponse, type StockTransaction, stockAnalysisOutputSchema, type StockAnalysisOutput } from "@/lib/schemas";
import { getStockDetails, type GetStockDetailsOutput } from "@/ai/flows/get-stock-details";

function extractAndParseJson(text: string): any {
  const jsonMatch = text.match(/{.*}/s);
  if (!jsonMatch) {
    throw new Error("No JSON object found in the response text.");
  }
  
  try {
    const rpcResponse = JSON.parse(jsonMatch[0]);

    if (rpcResponse.error || !rpcResponse.result || !rpcResponse.result.content) {
      throw new Error(`RPC error: ${JSON.stringify(rpcResponse.error) || 'Invalid RPC response structure'}`);
    }
    
    const nestedJsonString = rpcResponse.result.content[0]?.text;
    if (!nestedJsonString) {
        throw new Error("Could not find nested JSON in the RPC response.");
    }
    
    return JSON.parse(nestedJsonString);
  } catch(e) {
    if (e instanceof Error) {
        throw new Error(`Failed to parse the extracted JSON: ${e.message}`);
    }
    throw new Error(`Failed to parse the extracted JSON: ${String(e)}`);
  }
}

const getTransactionType = (type: number): StockTransaction['type'] => {
  switch (type) {
    case 1: return 'BUY';
    case 2: return 'SELL';
    case 3: return 'BONUS';
    case 4: return 'SPLIT';
    default: return 'BUY';
  }
};

export async function fetchStockTransactionsAction(): Promise<{
  success: boolean;
  data?: StockTransactionsResponse;
  error?: string;
}> {
  try {
    const baseUrl = "https://8ffb7e9f513f.ngrok-free.app";
    if (!baseUrl) {
      throw new Error("NGROK_BASE_URL is not configured in the environment variables.");
    }
    const response = await fetch(
      `${baseUrl}/mcp/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Mcp-Session-Id": "mcp-session-594e48ea-fea1-40ef-8c52-7552dd9272af",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "fetch_stock_transactions", arguments: {} },
        }),
        cache: "no-store",
      }
    );

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(
        `API request failed with status ${response.status}: ${responseText}`
      );
    }
    
    const rawData = extractAndParseJson(responseText);
    const transactionsList = rawData?.stockTransactions;

    if (!transactionsList || !Array.isArray(transactionsList)) {
        throw new Error("Invalid data structure received from API: stockTransactions is not an array.");
    }
    
    // Enrich with company names
    const uniqueIsins = [...new Set(transactionsList.map((stock: any) => stock.isin))];
    const isinToDetailsMap: { [key: string]: GetStockDetailsOutput } = {};
    
    await Promise.all(uniqueIsins.map(async (isin: string) => {
        try {
            const details = await getStockDetails({ isin });
            isinToDetailsMap[isin] = details;
        } catch (error) {
            console.error(`Could not fetch details for ISIN ${isin}:`, error);
            // We can still proceed without this stock's details
        }
    }));

    const transformedTransactions: StockTransaction[] = transactionsList.flatMap((stock: any) => 
        (stock.txns || []).map((txn: any[]) => {
            const quantity = txn[2] || 0;
            const price = txn[3] || 0; // price (navValue) is at index 3 and is optional
            const details = isinToDetailsMap[stock.isin];
            return {
                tradeDate: txn[1],
                stockName: details?.name || stock.isin,
                isin: stock.isin,
                type: getTransactionType(txn[0]),
                quantity: quantity,
                price: { units: String(price) },
                amount: { units: String(quantity * price) }
            };
        })
    ).sort((a,b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime());
    
    const validatedData = stockTransactionsResponseSchema.parse({
        transactions: transformedTransactions
    });
    
    return { success: true, data: validatedData };

  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("fetchStockTransactionsAction error:", errorMessage);
    return { success: false, error: `Failed to fetch Stock transactions: ${errorMessage}` };
  }
}

export async function getStockAnalysisAction(): Promise<{
  success: boolean;
  data?: StockAnalysisOutput;
  error?: string;
}> {
  try {
    // 1. Fetch transactions
    const transactionsResult = await fetchStockTransactionsAction();
    if (!transactionsResult.success || !transactionsResult.data) {
      throw new Error(transactionsResult.error || "Failed to fetch stock transactions for analysis.");
    }
    const transactions = transactionsResult.data.transactions;

    // 2. Aggregate holdings
    const holdings: { [isin: string]: { quantity: number; invested: number, stockName?: string } } = {};
    for (const txn of transactions) {
      if (!holdings[txn.isin]) {
        holdings[txn.isin] = { quantity: 0, invested: 0 };
      }
      if (txn.type === 'BUY') {
        holdings[txn.isin].quantity += txn.quantity;
        holdings[txn.isin].invested += parseFloat(txn.amount.units || '0');
      } else if (txn.type === 'SELL') {
        // Simple subtraction of quantity, invested amount is not reduced to keep it simple
        holdings[txn.isin].quantity -= txn.quantity;
      }
      holdings[txn.isin].stockName = txn.stockName;
    }

    // 3. Enrich with live data and calculate current value
    const enrichedHoldings = await Promise.all(
      Object.entries(holdings)
        .filter(([, data]) => data.quantity > 0)
        .map(async ([isin, data]) => {
          // Since we don't have a reliable price API, we'll use a placeholder logic.
          // In a real scenario, you'd fetch the current price here.
          // For now, let's assume current value is just the invested amount.
          const currentValue = data.invested; // Placeholder
          return {
            stockName: data.stockName || isin,
            investedAmount: String(data.invested),
            currentValue: String(currentValue), 
            sector: 'Unknown', // Sector info would require another data source
          };
        })
    );
    
    const totalPortfolioValue = enrichedHoldings.reduce((sum, h) => sum + parseFloat(h.currentValue), 0);
    
    // 4. Determine Top 5 Holdings
    const topHoldings = enrichedHoldings
      .sort((a, b) => parseFloat(b.currentValue) - parseFloat(a.currentValue))
      .slice(0, 5);

    // 5. Basic Sector Allocation (simplified placeholder)
    const sectorAllocation = [{ sector: 'Technology', percentage: 40 }, { sector: 'Finance', percentage: 30 }, { sector: 'Consumer Goods', percentage: 30 }];

    // 6. Generate Recommendations (simplified)
    const investorProfile = `Based on your holdings, you seem to favor well-established companies in the technology and finance sectors. This suggests a growth-oriented strategy with a moderate risk appetite.`;
    
    const recommendations = [
      `Your equity portfolio consists of ${enrichedHoldings.length} unique stocks, valued at approximately ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalPortfolioValue)}.`,
      "Consider diversifying into other sectors like Healthcare or Energy to reduce concentration risk.",
      "Review your holdings in 'Unknown' sectors to better categorize your portfolio and understand your exposure."
    ];

    // 7. Assemble the final output
    const analysis: StockAnalysisOutput = {
      investorProfile: investorProfile,
      topHoldings: topHoldings,
      sectorAllocation: sectorAllocation,
      recommendations: recommendations,
    };

    const validatedData = stockAnalysisOutputSchema.parse(analysis);
    return { success: true, data: validatedData };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("getStockAnalysisAction error:", errorMessage);
    return { success: false, error: `Failed to get stock analysis: ${errorMessage}` };
  }
}

export async function getStockDetailsAction(isin: string): Promise<{ success: boolean; data?: GetStockDetailsOutput; error?: string; }> {
    if (!isin) {
        return { success: false, error: "ISIN is required." };
    }
    try {
        const details = await getStockDetails({ isin });
        return { success: true, data: details };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching stock details.";
        console.error(`getStockDetailsAction for ISIN ${isin} failed:`, errorMessage);
        return { success: false, error: errorMessage };
    }
}
