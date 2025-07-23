"use server";

import { z } from "zod";

export async function fetchNetWorthAction(): Promise<{ success: boolean; rawResponse?: string; error?: string; }> {
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

    return { success: true, rawResponse: responseText };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("fetchNetWorthAction error:", error);
    return { success: false, error: `Failed to fetch net worth data: ${errorMessage}` };
  }
}
