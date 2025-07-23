
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
import { fetchAmfiNavDataTool, fetchBankTransactionsTool, fetchMfTransactionsTool, fetchNetWorthTool } from '../tools/financial-tools';

const GoalSchema = z.object({
  title: z.string().describe('The title of the financial goal (e.g., "Buy a car")'),
  deadline: z.string().describe('The deadline for achieving the goal (YYYY-MM-DD).'),
  risk: z.enum(['Low', 'Medium', 'High']).describe('The user\'s risk appetite.'),
  monthlyInvestment: z.number().describe('The user\'s monthly investment budget.'),
  targetAmount: z.number().describe('The total target amount for the goal.'),
});

const GenerateFinancialPlanInputSchema = z.object({
  goal: GoalSchema,
});
export type GenerateFinancialPlanInput = z.infer<typeof GenerateFinancialPlanInputSchema>;


const GenerateFinancialPlanOutputSchema = z.object({
  plan: z.record(z.string()).describe('A complete breakdown of the investment plan with monthly amounts and specific instrument examples. e.g. {"Mutual Funds": "₹6,000 in Mirae Asset Bluechip (12% CAGR)"}'),
  projectedReturns: z.string().describe('The projected value of the investment by the goal deadline including the target date (e.g., "₹13.4 Lakhs by July 2030").'),
  summary: z.string().describe('A short, witty, and friendly summary of the investment strategy.'),
});
export type GenerateFinancialPlanOutput = z.infer<typeof GenerateFinancialPlanOutputSchema>;

export async function generateFinancialPlan(input: GenerateFinancialPlanInput): Promise<GenerateFinancialPlanOutput> {
  return generateFinancialPlanFlow(input);
}

const generateAllocationPrompt = ai.definePrompt({
  name: 'generateAllocationPrompt',
  tools: [fetchAmfiNavDataTool, fetchNetWorthTool, fetchMfTransactionsTool, fetchBankTransactionsTool],
  input: {schema: GenerateFinancialPlanInputSchema},
  output: {
    schema: GenerateFinancialPlanOutputSchema,
  },
  prompt: `
    You are a smart financial assistant for Gen Z users in India. Your goal is to create a highly personalized investment plan.

    **Instructions:**
    1.  Start by calling all available tools to get the user's full financial picture:
        - \`fetchNetWorthTool\`: To understand assets and liabilities.
        - \`fetchMfTransactionsTool\`: To see existing mutual fund investments.
        - \`fetchBankTransactionsTool\`: To analyze cash flow.
        - \`fetchAmfiNavDataTool\`: To get the latest performance of various mutual funds.
    2.  Analyze the data from the tools along with the user's goal.
    3.  Based on the user's risk appetite, select top-performing mutual funds. For 'Low' risk, prefer Large Cap and ELSS funds. For 'High' risk, you can include Mid-Cap, Small-Cap, and some stocks.
    4.  Create a monthly investment allocation across Mutual Funds, Gold, and Fixed Deposits (FDs). Only include Stocks for 'High' risk users.
    5.  Calculate the projected returns based on the allocation and the goal deadline.
    6.  Write a fun, encouraging, and easy-to-understand summary of the strategy.

    **User Goal:**
    - Title: {{{goal.title}}}
    - Target Amount: ₹{{{goal.targetAmount}}}
    - Deadline: {{{goal.deadline}}}
    - Monthly Investment Budget: ₹{{{goal.monthlyInvestment}}}
    - Risk Appetite: {{{goal.risk}}}

    Now, use the tool data and the user's goal to generate the plan and return it in the required JSON format.
  `,
});


function calculateProjectedReturns(monthlyInvestment: number, deadline: string): string {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const months = (deadlineDate.getFullYear() - now.getFullYear()) * 12 + (deadlineDate.getMonth() - now.getMonth());
    
    // Simplified projection logic. A real app would use more complex calculations.
    const annualGrowthRate = 0.12; // Assume average 12% annual growth
    const monthlyGrowthRate = Math.pow(1 + annualGrowthRate, 1/12) - 1;

    let futureValue = 0;
    for (let i = 0; i < months; i++) {
        futureValue = (futureValue + monthlyInvestment) * (1 + monthlyGrowthRate);
    }
    
    const formattedDate = deadlineDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (futureValue >= 100000) {
      return `₹${(futureValue / 100000).toFixed(1)} Lakhs by ${formattedDate}`;
    }
    return `₹${Math.round(futureValue).toLocaleString('en-IN')} by ${formattedDate}`;
}


const generateFinancialPlanFlow = ai.defineFlow(
  {
    name: 'generateFinancialPlanFlow',
    inputSchema: GenerateFinancialPlanInputSchema,
    outputSchema: GenerateFinancialPlanOutputSchema,
  },
  async input => {
    // Step 1: Get the AI-generated plan which now uses tools.
    const response = await generateAllocationPrompt(input);
    const planOutput = response.output;

    if (!planOutput) {
        throw new Error("Failed to generate a financial plan from the AI.");
    }
    
    // Step 2: Recalculate projected returns for consistency, as the AI's calculation can be unreliable.
    const projectedReturns = calculateProjectedReturns(input.goal.monthlyInvestment, input.goal.deadline);

    return {
        plan: planOutput.plan,
        projectedReturns: projectedReturns,
        summary: planOutput.summary,
    };
  }
);
