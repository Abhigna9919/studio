'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized financial plans based on user input.
 *
 * - generateFinancialPlan - A function that takes user goals and market data to return a personalized investment plan.
 * - GenerateFinancialPlanInput - The input type for the generateFinancialPlan function.
 * - GenerateFinancialPlanOutput - The return type for the generateFinancialPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GoalSchema = z.object({
  title: z.string().describe('The title of the financial goal (e.g., "Buy a car")'),
  deadline: z.string().describe('The deadline for achieving the goal (YYYY-MM-DD).'),
  risk: z.enum(['Low', 'Medium', 'High']).describe('The user\'s risk appetite.'),
  monthlyInvestment: z.number().describe('The user\'s monthly investment budget.'),
  targetAmount: z.number().describe('The total target amount for the goal.'),
});

const GenerateFinancialPlanInputSchema = z.object({
  goal: GoalSchema,
  mcp_summary: z.string().optional().describe('Optional summary of the user\'s existing investments.'),
  top_mf_data: z.string().describe('Data on top mutual funds (e.g., "Mirae Asset Large Cap: 12% CAGR, moderate risk").'),
  top_fd_data: z.string().describe('Data on top fixed deposits (e.g., "SBI FD: 7.25%, safe").'),
  gold_price: z.string().describe('Current price of gold per gram.'),
  top_stock_data: z.string().describe('Data on top equity stocks (e.g., "Tata Consumer: 11% CAGR, mid-cap").'),
});
export type GenerateFinancialPlanInput = z.infer<typeof GenerateFinancialPlanInputSchema>;


const GenerateFinancialPlanOutputSchema = z.object({
  assetAllocation: z.record(z.string()).describe('A map of asset classes to the allocated monthly amount in rupees (e.g., {"Mutual Funds": "₹7,000"}).'),
  projectedReturns: z.string().describe('The projected value of the investment by the goal deadline (e.g., "₹11.2 Lakhs").'),
  summary: z.string().describe('A short, witty, and friendly summary of the investment strategy.'),
});
export type GenerateFinancialPlanOutput = z.infer<typeof GenerateFinancialPlanOutputSchema>;

export async function generateFinancialPlan(input: GenerateFinancialPlanInput): Promise<GenerateFinancialPlanOutput> {
  return generateFinancialPlanFlow(input);
}

const generateFinancialPlanPrompt = ai.definePrompt({
  name: 'generateFinancialPlanPrompt',
  input: {schema: GenerateFinancialPlanInputSchema},
  output: {
    schema: GenerateFinancialPlanOutputSchema,
  },
  prompt: `You are a money-wise best friend, helping a user with their financial goals. Your tone should be smart, witty, helpful, and use desi relatable language. Keep it short and Gen Z-friendly.

User Inputs:
- Goal: {{{goal.title}}}
- Deadline: {{{goal.deadline}}}
- Risk Appetite: {{{goal.risk}}}
- Monthly Budget: ₹{{goal.monthlyInvestment}}
- Total Target: ₹{{goal.targetAmount}}
- Existing Investments: {{{mcp_summary}}}

Available Investment Options in India:
1. Mutual Funds:
  - {{{top_mf_data}}}
2. Fixed Deposits:
  - {{{top_fd_data}}}
3. Gold:
  - ₹{{gold_price}}/gram (average return ~7%)
4. Equity Stocks:
  - {{{top_stock_data}}}

Please suggest:
- An asset allocation plan for the user's ₹{{goal.monthlyInvestment}}/month
- Projected value by {{goal.deadline}} (₹)
- Reasoning for each allocation
- Risk management explanation
- Inflation protection
- Tax implications (brief, if relevant)

Based on the above, provide a structured JSON output with the asset allocation, projected returns, and a summary.
`,
});

const generateFinancialPlanFlow = ai.defineFlow(
  {
    name: 'generateFinancialPlanFlow',
    inputSchema: GenerateFinancialPlanInputSchema,
    outputSchema: GenerateFinancialPlanOutputSchema,
  },
  async input => {
    const {output} = await generateFinancialPlanPrompt(input, {
      config: {
        response: {
          format: 'json',
        }
      }
    });
    return output!;
  }
);
