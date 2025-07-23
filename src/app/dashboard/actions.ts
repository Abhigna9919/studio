"use server";

export async function fetchNetWorthAction(): Promise<{ success: boolean; data?: string; error?: string; }> {
  try {
    const response = await fetch("https://add852513a89.ngrok-free.app/mcp/stream", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Using the hardcoded session ID as requested for debugging.
            'Mcp-Session-Id': 'mcp-session-594e48ea-fea1-40ef-8c52-7552dd9272af',
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

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }

    // Return the raw text for debugging
    return { success: true, data: responseText };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("fetchNetWorthAction error:", errorMessage);
    return { success: false, error: `Failed to fetch net worth data: ${errorMessage}` };
  }
}
