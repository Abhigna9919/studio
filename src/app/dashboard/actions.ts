"use server";

import { z } from "zod";

const NetWorthValueSchema = z.object({
  currencyCode: z.string(),
  units: z.string(),
});

const NetWorthAttributeValueSchema = z.object({
  netWorthAttribute: z.string(),
  value: NetWorthValueSchema,
});

const NetWorthResponseSchema = z.object({
  assetValues: z.array(NetWorthAttributeValueSchema),
  liabilityValues: z.array(NetWorthAttributeValueSchema),
  totalNetWorthValue: NetWorthValueSchema,
});

const ApiResponseSchema = z.object({
  netWorthResponse: NetWorthResponseSchema,
});

export type NetWorthData = z.infer<typeof NetWorthResponseSchema>;

// This schema is for the outer JSON-RPC response
const RpcResponseSchema = z.object({
    result: z.string() // The result is an escaped JSON string
});

export async function fetchNetWorthAction(): Promise<{ success: boolean; data?: NetWorthData; error?: string; }> {
  try {
    const response = await fetch("https://add852513a89.ngrok-free.app/mcp/stream", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Mcp-Session-Id': `mcp-session-${crypto.randomUUID()}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        body: JSON.stringify({
            "jsonrpc":"2.0",
            "id":1,
            "method":"tools/call",
            "params":{"name":"fetch_net_worth","arguments":{}}
        }),
        cache: 'no-store'
    });

    const responseText = await response.text();
    console.log("Raw API Response Text:", responseText);

    if (!response.ok) {
        console.error("API Error Response:", responseText);
        throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }

    let rpcResponse;
    try {
        rpcResponse = JSON.parse(responseText);
    } catch (e) {
        console.error("Failed to parse response text as JSON:", e);
        throw new Error(`Invalid JSON received from server: ${responseText}`);
    }

    const validatedRpc = RpcResponseSchema.safeParse(rpcResponse);

    if (!validatedRpc.success) {
      console.error("Invalid RPC response structure:", validatedRpc.error.flatten());
      throw new Error("Failed to parse the RPC response structure.");
    }

    // The 'result' field contains the actual application data as a JSON string.
    // We need to parse this string to get the final data object.
    let nestedData;
    try {
        nestedData = JSON.parse(validatedRpc.data.result);
    } catch (e) {
        console.error("Failed to parse nested JSON from 'result' field:", e);
        throw new Error(`Invalid nested JSON in result: ${validatedRpc.data.result}`);
    }
    
    const validatedData = ApiResponseSchema.safeParse(nestedData);
    
    if (!validatedData.success) {
      console.error("Invalid nested API response structure:", validatedData.error.flatten());
      throw new Error("Failed to parse the nested API data.");
    }

    return { success: true, data: validatedData.data.netWorthResponse };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("fetchNetWorthAction error:", error);
    return { success: false, error: `Failed to fetch net worth data: ${errorMessage}` };
  }
}
