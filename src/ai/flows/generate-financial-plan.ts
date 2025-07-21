'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized financial plans based on user input.
 *
 * - generateFinancialPlan - A function that takes the goal amount and deadline, and returns a personalized financial plan.
 * - GenerateFinancialPlanInput - The input type for the generateFinancialPlan function.
 * - GenerateFinancialPlanOutput - The return type for the generateFinancialPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFinancialPlanInputSchema = z.object({
  goalAmount: z
    .number()
    .describe('The total amount of money the user wants to save.'),
  deadline: z.string().describe('The deadline for achieving the goal (YYYY-MM-DD).'),
  currentSavings: z
    .number()
    .optional()
    .describe('The current savings of the user.'),
  monthlyIncome: z.number().optional().describe('The monthly income of the user'),
  monthlyExpenses: z
    .number()
    .optional()
    .describe('The monthly expenses of the user'),
});
export type GenerateFinancialPlanInput = z.infer<typeof GenerateFinancialPlanInputSchema>;

const GenerateFinancialPlanOutputSchema = z.object({
  plan: z.string().describe('A personalized financial plan with actionable steps.'),
});
export type GenerateFinancialPlanOutput = z.infer<typeof GenerateFinancialPlanOutputSchema>;

export async function generateFinancialPlan(input: GenerateFinancialPlanInput): Promise<GenerateFinancialPlanOutput> {
  return generateFinancialPlanFlow(input);
}

const generateFinancialPlanPrompt = ai.definePrompt({
  name: 'generateFinancialPlanPrompt',
  input: {schema: GenerateFinancialPlanInputSchema},
  output: {schema: GenerateFinancialPlanOutputSchema},
  prompt: `You are a financial advisor. Generate a personalized financial plan for the user to achieve their goal by the deadline.

Goal Amount: {{{goalAmount}}}
Deadline: {{{deadline}}}
Current Savings: {{{currentSavings}}}
Monthly Income: {{{monthlyIncome}}}
Monthly Expenses: {{{monthlyExpenses}}}

Consider the user's current savings, monthly income, and monthly expenses when creating the plan. Provide actionable steps, a timeline, and estimated monthly savings targets.  The plan should be detailed and easy to follow.
`,
});

const generateFinancialPlanFlow = ai.defineFlow(
  {
    name: 'generateFinancialPlanFlow',
    inputSchema: GenerateFinancialPlanInputSchema,
    outputSchema: GenerateFinancialPlanOutputSchema,
  },
  async input => {
    const {output} = await generateFinancialPlanPrompt(input);
    return output!;
  }
);
