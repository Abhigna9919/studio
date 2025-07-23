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

const ActionableStepSchema = z.object({
  title: z.string().describe('A short, clear title for the action.'),
  description: z.string().describe('A detailed explanation of the action to be taken.'),
  category: z.enum(['Savings', 'Investment', 'Expense Management', 'Debt Management']).describe('The category of the action.'),
});

const AssetAllocationSchema = z.object({
  assetClass: z.enum(['Equity', 'Debt', 'Gold', 'Real Estate', 'Other']).describe('The asset class.'),
  currentAllocationPercentage: z.number().describe('The current percentage allocation in this asset class.'),
  recommendedAllocationPercentage: z.number().describe('The recommended percentage allocation for this asset class to meet the goal.'),
  justification: z.string().describe('The justification for the recommended allocation.')
});

const GenerateFinancialPlanOutputSchema = z.object({
  monthlySavingsTarget: z.number().describe('The calculated monthly amount the user needs to save to reach their goal.'),
  assetAllocationStrategy: z.array(AssetAllocationSchema).describe('A breakdown of recommended asset allocation.'),
  actionableSteps: z.array(ActionableStepSchema).describe('A list of specific, actionable steps for the user to take.'),
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
  prompt: `You are a financial advisor. Your task is to generate a personalized and actionable financial plan for a user to achieve their financial goal by a specific deadline.

First, analyze the user's goal and deadline to determine if it's a short-term or long-term goal.

Next, use the available tools to fetch the user's complete financial data, including their net worth, bank transactions, stock and mutual fund investments, EPF details, and credit report. This will give you a holistic view of their financial situation.

Based on your comprehensive analysis of their goals and financial data, create a detailed and actionable financial plan. The plan MUST be returned in the specified JSON format and include:
1.  **Monthly Savings Target:** Calculate a realistic monthly amount the user needs to save. This should be a single number.
2.  **Smart Asset Allocation:** Recommend how to allocate their savings and existing investments. Analyze their current asset allocation based on the fetched data (stocks, MFs, EPF, etc.) and recommend a new allocation suitable for their goal. Provide justification for your recommendations.
3.  **Actionable Steps:** Provide a clear, step-by-step guide of what the user should do. These steps should be categorized and directly derived from the user's financial data. For example:
    -   (Expense Management) Suggest reducing specific expenses based on their transaction history.
    -   (Debt Management) Recommend consolidating debt based on their credit report.
    -   (Investment) Suggest specific actions like increasing a SIP in a particular mutual fund they own, or selling an underperforming stock from their portfolio.

User's Goal:
Goal Amount: {{{goalAmount}}}
Deadline: {{{deadline}}}
Current Savings: {{{currentSavings}}}
Monthly Income: {{{monthlyIncome}}}
Monthly Expenses: {{{monthlyExpenses}}}

Generate a comprehensive, structured plan that is easy to follow and empowers the user to reach their financial target. Ensure the output strictly adheres to the 'GenerateFinancialPlanOutputSchema' JSON schema.
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
