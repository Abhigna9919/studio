"use server";

import { z } from "zod";

const NetWorthResponseSchema = z.object({
  netWorth: z.number(),
  assets: z.array(z.object({ name: z.string(), value: z.number() })),
  liabilities: z.array(z.object({ name: z.string(), value: z.number() })),
});

export type NetWorthData = z.infer<typeof NetWorthResponseSchema>;

function findAndParseJson(text: string): any {
    const jsonRpcMarker = 'data: {"jsonrpc":"2.0",';
    const startIndex = text.indexOf(jsonRpcMarker);
    if (startIndex === -1) {
        throw new Error("Failed to find JSON-RPC data in response.");
    }
    
    // Find the full JSON object
    let openBraces = 0;
    let endIndex = -1;
    for (let i = startIndex + 5; i < text.length; i++) {
        if (text[i] === '{') {
            openBraces++;
        } else if (text[i] === '}') {
            openBraces--;
        }
        if (openBraces === 0) {
            endIndex = i + 1;
            break;
        }
    }

    if (endIndex === -1) {
        throw new Error("Could not find the end of the JSON object.");
    }

    const jsonString = text.substring(startIndex + 5, endIndex);
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        throw new Error("Failed to parse JSON object from stream.");
    }
}


export async function fetchNetWorthAction(): Promise<{ success: boolean; data?: NetWorthData; error?: string; }> {
  try {
    console.log("Attempting to fetch net worth data...");
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

    const rawData = findAndParseJson(responseText);

    if (!rawData || !rawData.result || !rawData.result.result) {
        console.error("Invalid API response structure:", rawData);
        throw new Error("Failed to parse the RPC response structure. The 'result.result' field is missing or invalid.");
    }

    const nestedJson = JSON.parse(rawData.result.result);
    const validatedData = NetWorthResponseSchema.parse(nestedJson);

    return { success: true, data: validatedData };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("fetchNetWorthAction error:", error);
    return { success: false, error: `Failed to fetch and parse net worth data: ${errorMessage}` };
  }
}