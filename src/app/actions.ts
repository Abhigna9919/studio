"use server";

import { z } from "zod";
import { generateFinancialPlan, type GenerateFinancialPlanInput } from "@/ai/flows/generate-financial-plan";
import { format } from 'date-fns';

const ActionInputSchema = z.object({
  goalAmount: z.number(),
  deadline: z.date(),
  currentSavings: z.number().optional(),
  monthlyIncome: z.number().optional(),
  monthlyExpenses: z.number().optional(),
});

export async function getFinancialPlanAction(values: z.infer<typeof ActionInputSchema>) {
  try {
    const validatedValues = ActionInputSchema.parse(values);
    
    const planInput: GenerateFinancialPlanInput = {
      ...validatedValues,
      deadline: format(validatedValues.deadline, 'yyyy-MM-dd'),
    };

    const result = await generateFinancialPlan(planInput);
    return { success: true, plan: result.plan };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to generate financial plan: ${errorMessage}` };
  }
}
