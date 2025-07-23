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
import {
  fetchNetWorthTool,
  fetchBankTransactionsTool,
  fetchStockTransactionsTool,
  fetchMfTransactionsTool,
  fetchEpfDetailsTool,
  fetchCreditReportTool,
} from '@/ai/tools/financial-tools';

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
  tools: [
    fetchNetWorthTool,
    fetchBankTransactionsTool,
    fetchStockTransactionsTool,
    fetchMfTransactionsTool,
    fetchEpfDetailsTool,
    fetchCreditReportTool,
  ],
  prompt: `You are a financial advisor. Your task is to generate a personalized financial plan for a user to achieve their financial goal by a specific deadline.

First, analyze the user's goal and deadline to determine if it's a short-term or long-term goal.

Next, use the available tools to fetch the user's complete financial data, including their net worth, bank transactions, stock and mutual fund investments, EPF details, and credit report. This will give you a holistic view of their financial situation.

Based on your comprehensive analysis of their goals and financial data, create a detailed and actionable financial plan. The plan MUST include:
1.  **Monthly Savings Targets:** Calculate a realistic monthly amount the user needs to save.
2.  **Smart Asset Allocation:** Recommend how to allocate their savings and existing investments.
    - For short-term goals, prioritize low-risk investments (e.g., high-yield savings, short-term bonds).
    - For long-term goals, suggest a diversified portfolio with a mix of equities and other growth assets, considering their existing holdings.
3.  **Actionable Steps:** Provide a clear, step-by-step guide on what the user should do. This could include specific advice on reducing expenses (based on transaction history), consolidating debt (based on credit report), or rebalancing their investment portfolio.

User's Goal:
Goal Amount: {{{goalAmount}}}
Deadline: {{{deadline}}}
Current Savings: {{{currentSavings}}}
Monthly Income: {{{monthlyIncome}}}
Monthly Expenses: {{{monthlyExpenses}}}

Generate a comprehensive plan that is easy to follow and empowers the user to reach their financial target.
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
