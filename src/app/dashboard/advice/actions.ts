"use server";

import { getFinancialAdvice } from "@/ai/flows/get-financial-advice";

export async function getFinancialAdviceAction(): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  try {
    const advice = await getFinancialAdvice({});
    
    // The flow itself might return an error string if the catch block is triggered.
    if (advice.startsWith("An error occurred")) {
        return { success: false, error: advice };
    }

    return { success: true, data: advice };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("getFinancialAdviceAction error:", errorMessage);
    return { success: false, error: `Failed to get financial advice: ${errorMessage}` };
  }
}
