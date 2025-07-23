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
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    
    const textData = await response.text();
    
    try {
        const rawData = JSON.parse(textData);
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
