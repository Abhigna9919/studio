
"use server";

import { stockTransactionsResponseSchema, type StockTransactionsResponse, type StockTransaction } from "@/lib/schemas";

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
    throw new Error(`Failed to parse the extracted JSON: ${e}`);
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
    const response = await fetch(
      "https://add852513a89.ngrok-free.app/mcp/stream",
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

    const transformedTransactions: StockTransaction[] = rawData.stockTransactions.flatMap((stock: any) => 
        stock.txns.map((txn: any[]) => {
            const quantity = txn[2] || 0;
            const price = txn[3] || 0;
            return {
                tradeDate: txn[1],
                stockName: stock.isin, // Stock name not available, using ISIN
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
