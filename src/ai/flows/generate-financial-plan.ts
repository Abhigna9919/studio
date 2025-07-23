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
  prompt: `
    You are a financial planning expert for a user in India.
    Your tone should be smart, witty, helpful, and use Gen Z-friendly, relatable language.

    Based on the user's financial goal, risk appetite, and the provided market data, generate a personalized investment plan.

    **User Goal:**
    - Title: {{{goal.title}}}
    - Target Amount: ₹{{goal.targetAmount}}
    - Deadline: {{{goal.deadline}}}
    - Monthly Investment: ₹{{goal.monthlyInvestment}}
    - Risk Appetite: {{{goal.risk}}}
    - Existing Investments: {{{mcp_summary}}}

    **Market Data:**
    - Top Mutual Funds: {{{top_mf_data}}}
    - Top Fixed Deposits: {{{top_fd_data}}}
    - Gold Price: ₹{{gold_price}}/gram
    - Top Stocks: {{{top_stock_data}}}

    **Your Task:**
    Create a structured JSON output with the following:
    1.  **assetAllocation**: An object detailing how to allocate the user's monthly investment (₹{{goal.monthlyInvestment}}) across different asset classes (e.g., Mutual Funds, Gold, Fixed Deposit).
    2.  **projectedReturns**: A string representing the estimated value of the portfolio by the deadline (e.g., "₹11.2 Lakhs").
    3.  **summary**: A short, witty, and friendly summary of the investment strategy. For example: "Mutual Funds bring growth, Gold hedges inflation, and FD stabilizes things. You’re investing like a pro!"

    Provide only the JSON object as the output.
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
