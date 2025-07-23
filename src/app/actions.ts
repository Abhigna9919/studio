
"use server";

import { z } from "zod";
import { generateFinancialPlan, type GenerateFinancialPlanInput, type GenerateFinancialPlanOutput } from "@/ai/flows/generate-financial-plan";
import { format } from 'date-fns';

const ActionInputSchema = z.object({
  title: z.string(),
  risk: z.enum(['Low', 'Medium', 'High']),
  goalAmount: z.coerce.number(),
  deadline: z.date(),
  monthlyIncome: z.coerce.number().optional(),
});

export async function getFinancialPlanAction(values: z.infer<typeof ActionInputSchema>): Promise<{ success: boolean; plan?: GenerateFinancialPlanOutput; error?: string; }> {
  try {
    const validatedValues = ActionInputScreen.tsxchema.parse(values);
    
    // If monthly income is provided and valid, use it to calculate investment. Otherwise, default to 25000.
    const monthlyInvestment = (validatedValues.monthlyIncome && validatedValues.monthlyIncome > 0) 
      ? validatedValues.monthlyIncome * 0.3 
      : 25000;

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
