"use server";

import { z } from "zod";

const NetWorthResponseSchema = z.object({
  netWorth: z.number(),
  assets: z.array(z.object({ name: z.string(), value: z.number() })),
  liabilities: z.array(z.object({ name: z.string(), value: z.number() })),
});

export type NetWorthData = z.infer<typeof NetWorthResponseSchema>;

// This function is designed to find a JSON object within a larger string, which is common in streaming responses.
function findAndParseJson(text: string): any {
    // The server sends data chunks prefixed with "data: ". We need to find the JSON that follows.
    const jsonRpcMarker = 'data: ';
    const startIndex = text.indexOf(jsonRpcMarker);
    if (startIndex === -1) {
        // If we can't find the marker, we can't parse the data.
        throw new Error("Failed to find the JSON data marker in the API response.");
    }

    // Extract the string that should be a JSON object.
    const potentialJsonString = text.substring(startIndex + jsonRpcMarker.length);
    
    try {
        const parsedData = JSON.parse(potentialJsonString);
        
        // The actual financial data is nested inside a string within the 'result.result' property.
        if (parsedData.result && typeof parsedData.result.result === 'string') {
             // We need to parse this nested string to get the final JSON object.
             return JSON.parse(parsedData.result.result);
        }
        // If the expected structure isn't there, we throw an error.
        throw new Error("The API response did not contain the expected nested JSON data.");
    } catch (e: any) {
        // This will catch errors from either JSON.parse call.
        console.error("JSON parsing failed.", { error: e.message, text: potentialJsonString });
        throw new Error(`Failed to parse the data from the server: ${e.message}`);
    }
}

export async function fetchNetWorthAction(): Promise<{ success: boolean; data?: NetWorthData; error?: string; }> {
  try {
    const response = await fetch("https://add852513a89.ngrok-free.app/mcp/stream", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Using a consistent session ID as per the curl example.
            'Mcp-Session-Id': `mcp-session-${crypto.randomUUID()}`,
            // Adding a standard User-Agent header can help avoid being blocked by services like ngrok.
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        body: JSON.stringify({
            "jsonrpc":"2.0",
            "id":1,
            "method":"tools/call",
            "params":{"name":"fetch_net_worth","arguments":{}}
        }),
        // We should not cache this request as it's for dynamic data.
        cache: 'no-store'
    });

    const responseText = await response.text();

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }

    // Use our robust function to find and parse the JSON from the response text.
    const jsonData = findAndParseJson(responseText);

    // Validate the final JSON data against our schema.
    const validatedData = NetWorthResponseSchema.parse(jsonData);

    return { success: true, data: validatedData };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("fetchNetWorthAction error:", errorMessage);
    // Return a structured error to the client.
    return { success: false, error: `Failed to fetch net worth data: ${errorMessage}` };
  }
}
