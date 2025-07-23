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
        const rawData = JSON.parse(jsonString);
        const validatedData = ApiResponseSchema.parse(rawData);
        return { success: true, data: validatedData.netWorthResponse };
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
