
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating ultra-intelligent, personalized financial plans.
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


const SIPPlanEntrySchema = z.object({
    fundName: z.string().describe("The specific name of the mutual fund, e.g., 'Axis Bluechip Fund - Direct Growth'"),
    amount: z.string().describe("The monthly SIP amount for this fund, e.g., '₹3,000'"),
    reason: z.string().describe("The justification for choosing this fund, e.g., 'Large cap, 12.3% CAGR, ideal for medium-risk.'")
});

const GenerateFinancialPlanOutputSchema = z.object({
    goalType: z.enum(["Short-term", "Long-term"]).describe("The type of goal based on duration and amount."),
    inflationAdjustedTarget: z.string().describe("The inflation-adjusted target amount, e.g., '₹13.5 Lakhs'"),
    requiredMonthlyInvestment: z.string().describe("The calculated monthly investment needed to reach the goal."),
    isUserBudgetSufficient: z.boolean().describe("Whether the user's provided monthly investment budget is sufficient."),
    sipPlan: z.array(SIPPlanEntrySchema).describe("A detailed breakdown of the suggested SIPs across different funds."),
    projectedCorpus: z.string().describe("The total projected corpus amount by the goal's deadline."),
    transactionAdjustments: z.array(z.string()).describe("A list of suggested lifestyle spending cuts based on transaction history."),
    summary: z.string().describe("A witty, helpful, and motivating summary of the plan for the user."),
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
    You are an AI financial advisor helping an Indian Gen-Z user build an actionable, smart financial plan. Your role is to understand their goal, adjust for inflation, analyze their financial data, and suggest a real-world monthly investment strategy with specific fund names and justifications — all tailored to their risk appetite.

    (You may assume inflation rate of 6.5%)

    TASKS:
    1. Classify the goal: Use time and amount to classify: < 2 years or < ₹2L → "Short-term" Else → "Long-term"
    2. Adjust for Inflation: Use 6.5% annual inflation to calculate inflation-adjusted target. Show this clearly (e.g., “₹10L today → ₹13.5L by 2030”).
    3. Determine Monthly Target: Calculate required monthly investment using standard FV formula. If monthlyInvestment is already given, say if it's enough. If not, suggest one.
    4. Build SIP Plan Based on Risk:
        - Low: 60% FD/Liquid MF, 30% Large Cap MF, 10% Gold
        - Medium: 50% Multi-Cap MF, 20% FD, 20% Gold, 10% Midcap
        - High: 60% Equity MF (Midcap/Smallcap), 30% Stocks, 10% Gold
    5. Pick Specific Funds: Use market data to choose top-rated funds (real names from AMFI data). For each fund, show the SIP Amount and why this fund was chosen (e.g., “Consistent 12% CAGR, Large Cap, aligns with medium risk.”)
    6. Projection: Show corpus amount expected by the deadline (based on CAGR). State if it is enough. If not, suggest adjustments (increase monthly investment, extend deadline, or reduce target).
    7. Smart Adjustments: Check transaction history. If high discretionary spend (e.g., Swiggy, Blinkit), suggest lifestyle tweaks to divert money e.g., “Cut ₹1,500 on Zomato, invest instead”
    8. Output Summary: Make it funny, witty, smart. User should feel motivated.

    USER GOAL:
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
