'use server';

/**
 * @fileOverview This file defines a Genkit flow for optimizing a financial plan.
 *
 * - optimizeFinancialPlan - A function that refines an AI-generated financial plan based on user preferences.
 * - OptimizeFinancialPlanInput - The input type for the optimizeFinancialPlan function.
 * - OptimizeFinancialPlanOutput - The return type for the optimizeFinancialPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeFinancialPlanInputSchema = z.object({
  initialPlan: z
    .string()
    .describe('The initial AI-generated financial plan.'),
  userPreferences: z
    .string()
    .describe('The user provided preferences for refining the plan.'),
});
export type OptimizeFinancialPlanInput = z.infer<typeof OptimizeFinancialPlanInputSchema>;

const OptimizeFinancialPlanOutputSchema = z.object({
  optimizedPlan: z
    .string()
    .describe('The refined financial plan based on user preferences.'),
});
export type OptimizeFinancialPlanOutput = z.infer<typeof OptimizeFinancialPlanOutputSchema>;

export async function optimizeFinancialPlan(
  input: OptimizeFinancialPlanInput
): Promise<OptimizeFinancialPlanOutput> {
  return optimizeFinancialPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeFinancialPlanPrompt',
  input: {schema: OptimizeFinancialPlanInputSchema},
  output: {schema: OptimizeFinancialPlanOutputSchema},
  prompt: `You are a financial planning expert. Refine the given financial plan based on the user preferences.

Initial Plan: {{{initialPlan}}}

User Preferences: {{{userPreferences}}}

Refined Plan:`,
});

const optimizeFinancialPlanFlow = ai.defineFlow(
  {
    name: 'optimizeFinancialPlanFlow',
    inputSchema: OptimizeFinancialPlanInputSchema,
    outputSchema: OptimizeFinancialPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {optimizedPlan: output!.optimizedPlan};
  }
);
