"use server";

import { mfTransactionsResponseSchema, type MfTransactionsResponse } from "@/lib/schemas";

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

export async function fetchMfTransactionsAction(): Promise<{
  success: boolean;
  data?: MfTransactionsResponse;
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
    
    const rpcResponse = extractAndParseJson(responseText);

    if (rpcResponse.error || !rpcResponse.result || !rpcResponse.result.content) {
      throw new Error(`RPC error: ${JSON.stringify(rpcResponse.error) || 'Invalid RPC response structure'}`);
    }
    
    const nestedJsonString = rpcResponse.result.content[0]?.text;
    if (!nestedJsonString) {
        throw new Error("Could not find nested JSON in the RPC response.");
    }
    
    const rawData = JSON.parse(nestedJsonString);
    
    // The API response seems to be the data itself, so we can validate it directly.
    const validatedData = mfTransactionsResponseSchema.parse(rawData);
    
    return { success: true, data: validatedData };

  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("fetchMfTransactionsAction error:", errorMessage);
    return { success: false, error: `Failed to fetch MF transactions: ${errorMessage}` };
  }
}
