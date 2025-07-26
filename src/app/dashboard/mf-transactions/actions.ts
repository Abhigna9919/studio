
"use server";

import { mfTransactionsResponseSchema, type MfTransactionsResponse, type MfTransaction } from "@/lib/schemas";
import { analyzeMutualFundPortfolio, type MfAnalysisOutput } from "@/ai/flows/analyze-mf-portfolio";


function extractAndParseJson(text: string): any {
  const jsonMatch = text.match(/{.*}/s);
  if (!jsonMatch) {
    throw new Error("No JSON object found in the response text.");
  }
  
  try {
    // The top-level response is JSON, but the actual data is a string inside.
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

const getTransactionType = (type: number): MfTransaction['type'] => {
  return type === 1 ? 'PURCHASE' : 'SELL';
};

export async function fetchMfTransactionsAction(): Promise<{
  success: boolean;
  data?: MfTransactionsResponse;
  error?: string;
}> {
  try {
    const baseUrl = "https://d291436c9c3e.ngrok-free.app";
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
          params: { name: "fetch_mf_transactions", arguments: {} },
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
    const transactionsList = rawData?.mfTransactions;

    if (!transactionsList || !Array.isArray(transactionsList)) {
        throw new Error("Invalid data structure received from API: mfTransactions is not an array.");
    }

    const transformedTransactions: MfTransaction[] = transactionsList.flatMap((fund: any) => 
        (fund.txns || []).map((txn: any[]) => ({
            date: txn[1],
            schemeName: fund.schemeName,
            folioNumber: fund.folioId,
            type: getTransactionType(txn[0]),
            amount: { units: String(txn[4]) },
            units: String(txn[3]),
            nav: { units: String(txn[2]) }
        }))
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const validatedData = mfTransactionsResponseSchema.parse({
        transactions: transformedTransactions
    });
    
    return { success: true, data: validatedData };

  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("fetchMfTransactionsAction error:", errorMessage);
    return { success: false, error: `Failed to fetch MF transactions: ${errorMessage}` };
  }
}

export async function getMfAnalysisAction(): Promise<{
    success: boolean;
    data?: MfAnalysisOutput;
    error?: string;
}> {
    try {
        const result = await analyzeMutualFundPortfolio();
        return { success: true, data: result };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("getMfAnalysisAction error:", errorMessage);
        return { success: false, error: `Failed to get MF analysis: ${errorMessage}` };
    }
}
