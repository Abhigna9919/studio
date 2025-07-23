
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
    goalType: z.enum(["Short-term", "Long-term"]).describe("The type of goal based on duration and amount."),
    monthlyTarget: z.string().describe("The suggested monthly amount to be saved or invested."),
    suggestedCuts: z.array(z.string()).describe("A list of suggested lifestyle spending cuts, e.g., 'Reduce Swiggy spends by ?1,500'"),
    shortTermTips: z.string().optional().describe("For short-term goals, where to park money, e.g., 'Set up a Liquid Mutual Fund SIP.'"),
    longTermPlan: z.object({
        "Mutual Funds": z.string().optional(),
        "FD": z.string().optional(),
        "Gold": z.string().optional(),
        "Stocks": z.string().optional(),
        "Projection": z.string(),
    }).optional().describe("For long-term goals, the detailed investment breakdown and projection."),
    isGoalAchievable: z.boolean().describe("Whether the goal is achievable with the current plan."),
    summary: z.string().describe("A witty, helpful paragraph that motivates the user."),
});
export type GenerateFinancialPlanOutput = z.infer<typeof GenerateFinancialPlanOutputSchema>;

export async function generateFinancialPlan(input: GenerateFinancialPlanInput): Promise<GenerateFinancialPlanOutput> {
  return generateFinancialPlanFlow(input);
}

const generateFinancialPlanPrompt = ai.definePrompt({
  name: 'generateFinancialPlanPrompt',
  tools: [fetchAmfiNavDataTool, fetchNetWorthTool, fetchMfTransactionsTool, fetchBankTransactionsTool],
  input: {schema: GenerateFinancialPlanInputSchema},
  output: {
    schema: GenerateFinancialPlanOutputSchema,
  },
  prompt: `
    You are an intelligent financial agent for an Indian user. Your job is to deeply understand their goal, analyze their financial data, and suggest a clear, friendly, and strategic plan to help them reach it.
    
    Start by calling all available tools to get the user's full financial picture.
    
    Then, perform these tasks:
    1.  **Classify the goal**: If the deadline is less than 2 years away OR the target amount is less than ?2,00,000, classify it as "Short-term". Otherwise, it's "Long-term".
    2.  **Estimate monthly target**: Based on the target amount and deadline, calculate the required monthly savings.
    3.  **Create a strategy based on goal type**:
        *   **For Short-term goals**: Analyze bank transactions to find the biggest lifestyle spends (e.g., Swiggy, Zomato, Uber). Suggest specific, actionable cuts (e.g., "Reduce Swiggy spends by 50%"). Recommend where to park savings (e.g., Liquid Mutual Funds, FDs). The 'longTermPlan' field should be omitted for short-term goals.
        *   **For Long-term goals**: Create an exhaustive investment plan. Allocate funds across Mutual Funds, Gold, FDs, and Stocks (only for 'High' risk) based on the user's risk profile. Use the AMFI data to pick top-performing instruments with their CAGR. Show the SIP breakdown. The 'shortTermTips' field should be omitted for long-term goals.
    4.  **Projection**: Project the final corpus based on the plan.
    5.  **Achievability**: State if the goal is achievable. If not, suggest what to adjust (e.g., increase monthly contribution, extend deadline).
    6.  **Summary**: Write a witty, fun, and motivating summary to encourage the user.

    **User Goal:**
    - Title: {{{goal.title}}}
    - Target Amount: ?{{{goal.targetAmount}}}
    - Deadline: {{{goal.deadline}}}
    - Monthly Investment Budget: ?{{{goal.monthlyInvestment}}}
    - Risk Appetite: {{{goal.risk}}}

    Now, use the tool data and the user's goal to generate the complete plan and return it in the required JSON format.
  `,
});


const generateFinancialPlanFlow = ai.defineFlow(
  {
    name: 'generateFinancialPlanFlow',
    inputSchema: GenerateFinancialPlanInputSchema,
    outputSchema: GenerateFinancialPlanOutputSchema,
  },
  async input => {
    const response = await generateFinancialPlanPrompt(input);
    const planOutput = response.output;

    if (!planOutput) {
        throw new Error("Failed to generate a financial plan from the AI.");
    }
    
    return planOutput;
  }
);
