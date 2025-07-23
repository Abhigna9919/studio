"use server";

import { bankTransactionsResponseSchema, type BankTransactionsResponse, type BankTransaction, type Transaction } from "@/lib/schemas";

// Helper function to find and parse JSON from a streaming text response
function extractAndParseJson(text: string): any {
  const jsonMatch = text.match(/{.*}/s);
  if (!jsonMatch) {
    throw new Error("No JSON object found in the response text.");
  }
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch(e) {
    throw new Error(`Failed to parse the extracted JSON: ${e}`);
  }
}

// Transaction type mapping from number to a readable string
const getTransactionType = (type: number): Transaction['transactionType'] => {
  switch (type) {
    case 1: return 'TRANSACTION_TYPE_CREDIT';
    case 2: return 'TRANSACTION_TYPE_DEBIT';
    default: return 'TRANSACTION_TYPE_OTHER';
  }
};


export async function fetchBankTransactionsAction(): Promise<{
  success: boolean;
  data?: BankTransactionsResponse;
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
          params: { name: "fetch_bank_transactions", arguments: {} },
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
    
    const rpcResponse = extractAndParseJson(responseText);

    if (rpcResponse.error || !rpcResponse.result || !rpcResponse.result.content) {
      throw new Error(`RPC error: ${JSON.stringify(rpcResponse.error) || 'Invalid RPC response structure'}`);
    }
    
    const nestedJsonString = rpcResponse.result.content[0]?.text;
    if (!nestedJsonString) {
        throw new Error("Could not find nested JSON in the RPC response.");
    }
    
    // The actual data is a JSON string within the 'text' field
    const rawData = JSON.parse(nestedJsonString);
    
    // Now, transform the raw array-based data into the structured format our components expect
    const transformedData: BankTransactionsResponse = {
      accountTransactions: rawData.bankTransactions.map((bankAcc: any, index: number) => {
        const transactions: Transaction[] = bankAcc.txns.map((txn: any[], txnIndex: number) => ({
          transactionId: `${bankAcc.bank}-${index}-${txnIndex}`, // Create a unique ID
          amount: { units: txn[0] },
          narration: txn[1],
          transactionTimestamp: txn[2],
          transactionType: getTransactionType(txn[3]),
          transactionMode: txn[4],
          currentBalance: { units: txn[5] },
        }));
        
        return {
          maskedAccountNumber: bankAcc.bank,
          transactions: transactions,
        };
      })
    };

    // Validate the transformed data with our schema
    const validatedData = bankTransactionsResponseSchema.parse(transformedData);
    
    return { success: true, data: validatedData };

  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("fetchBankTransactionsAction error:", errorMessage);
    return { success: false, error: `Failed to fetch bank transactions: ${errorMessage}` };
  }
}
