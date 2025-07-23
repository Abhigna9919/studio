"use server";

import { netWorthResponseSchema, type NetWorthResponse } from "@/lib/schemas";

// Helper function to find and parse JSON from a streaming text response
function extractAndParseJson(text: string): any {
  // This regex finds JSON content that might be embedded in a streaming response.
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

export async function fetchNetWorthAction(): Promise<{
  success: boolean;
  data?: NetWorthResponse;
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
          params: { name: "fetch_net_worth", arguments: {} },
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

    const netWorthData = JSON.parse(nestedJsonString);
    const validatedData = netWorthResponseSchema.parse(netWorthData);

    return { success: true, data: validatedData };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("fetchNetWorthAction error:", errorMessage);
    return { success: false, error: `Failed to fetch net worth data: ${errorMessage}` };
  }
}