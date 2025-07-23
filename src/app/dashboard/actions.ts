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

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API request failed:", response.status, response.statusText, errorBody);
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    
    const textData = await response.text();
    
    try {
        // The response might be a stream with other text. Find the start of the JSON.
        const jsonStartIndex = textData.indexOf('{');
        if (jsonStartIndex === -1) {
          console.error("No JSON object found in the response:", textData);
          throw new Error("Invalid response format: No JSON object found.");
        }
        const jsonString = textData.substring(jsonStartIndex);
        
        // Sometimes the stream might cut off mid-JSON, so we need to find the last closing brace.
        const lastBraceIndex = jsonString.lastIndexOf('}');
        const finalJsonString = jsonString.substring(0, lastBraceIndex + 1);

        const rawData = JSON.parse(finalJsonString);
        
        // The actual API response is nested inside the 'result'
        if (rawData.result) {
            const nestedJson = JSON.parse(rawData.result);
            const validatedData = ApiResponseSchema.parse(nestedJson);
            return { success: true, data: validatedData.netWorthResponse };
        } else {
             throw new Error("Invalid API response structure: 'result' not found.");
        }
    } catch(e) {
        console.error("Failed to parse JSON response:", textData);
        if (e instanceof Error) {
            throw new Error(`JSON parsing error: ${e.message}`);
        }
        throw new Error("An unknown JSON parsing error occurred");
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("fetchNetWorthAction error:", errorMessage);
    return { success: false, error: `Failed to fetch net worth data: ${errorMessage}` };
  }
}
