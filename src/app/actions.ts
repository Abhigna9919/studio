
"use server";

import { z } from "zod";
import { generateFinancialPlan, type GenerateFinancialPlanInput, type GenerateFinancialPlanOutput } from "@/ai/flows/generate-financial-plan";
import { format } from 'date-fns';
import { goalFormSchema } from "@/lib/schemas";

export async function getFinancialPlanAction(values: z.infer<typeof goalFormSchema>): Promise<{ success: boolean; plan?: GenerateFinancialPlanOutput; error?: string; }> {
  try {
    const validatedValues = goalFormSchema.parse(values);
    
    // Ensure monthlyIncome is a number, providing a default if it's not present or invalid
    const monthlyInvestment = (validatedValues.monthlyIncome && typeof validatedValues.monthlyIncome === 'number' && validatedValues.monthlyIncome > 0) 
      ? validatedValues.monthlyIncome
      : 25000; // Default to 25000 if not provided or invalid

    const planInput: GenerateFinancialPlanInput = {
      goal: {
        title: validatedValues.title,
        deadline: format(validatedValues.deadline, 'yyyy-MM-dd'),
        risk: validatedValues.risk,
        monthlyInvestment: monthlyInvestment,
        targetAmount: validatedValues.goalAmount,
      },
    };

    const result = await generateFinancialPlan(planInput);
    return { success: true, plan: result };
  } catch (error) {
    console.error("Error in getFinancialPlanAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to generate financial plan: ${errorMessage}` };
  }
}
