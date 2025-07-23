
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
    sipPlan: z.array(SIPPlanEntrySchema).describe("A detailed breakdown of the suggested SIPs across different funds.").optional(),
    projectedCorpus: z.string().describe("The total projected corpus amount by the goal's deadline.").optional(),
    transactionAdjustments: z.array(z.string()).describe("A list of suggested lifestyle spending cuts based on transaction history."),
    currentVsSuggestedPlanComparison: z.string().describe("A brief comparison of the user's current investment strategy versus the suggested one.").optional(),
    summary: z.string().describe("A witty, helpful, and motivating summary of the plan for the user."),
});
export type GenerateFinancialPlanOutput = z.infer<typeof GenerateFinancialPlanOutputSchema>;

export async function generateFinancialPlan(input: GenerateFinancialPlanInput): Promise<GenerateFinancialPlanOutput> {
  return generateFinancialPlanFlow(input);
}

const generateFinancialPlanPrompt = ai.definePrompt({
  name: 'generateFinancialPlanPrompt',
  model: 'googleai/gemini-pro',
  tools: [fetchAmfiNavDataTool, fetchNetWorthTool, fetchMfTransactionsTool, fetchBankTransactionsTool],
  input: {schema: GenerateFinancialPlanInputSchema},
  output: {
    schema: GenerateFinancialPlanOutputSchema,
  },
  prompt: `
    You are an AI financial advisor helping an Indian Gen-Z user build an actionable, smart financial plan. Your role is to understand their goal, analyze their financial data, and suggest a clear, friendly, and strategic plan to help them reach it.

    (You may assume an inflation rate of 6.5%)

    USER GOAL:
    - Title: {{{goal.title}}}
    - Target Amount: ₹{{{goal.targetAmount}}}
    - Deadline: {{{goal.deadline}}}
    - Monthly Investment Budget: ₹{{{goal.monthlyInvestment}}}
    - Risk Appetite: {{{goal.risk}}}

    ## TASKS:

    1.  **CLASSIFY THE GOAL:** First, determine if the goal is "Short-term" or "Long-term".
        *   A goal is "Short-term" if the deadline is less than 2 years away OR the target amount is less than ₹2,00,000.
        *   Otherwise, it is "Long-term".
        *   Set the "goalType" field in the output JSON accordingly.

    2.  **ANALYZE AND CREATE A PLAN:** Based on the goal classification, follow the appropriate path below.

    ---

    ### **IF THE GOAL IS SHORT-TERM:**

    Your focus is on simple savings and spending adjustments. DO NOT create a complex investment plan (sipPlan and projectedCorpus should be omitted).

    *   **Analyze Transactions:** Use the bank transaction data to find the user's biggest discretionary spending categories (e.g., Swiggy, Zomato, Uber, Blinkit, Amazon).
    *   **Suggest Spending Cuts:** Create a list of specific, actionable spending cuts. For example: "Reduce Swiggy orders by ₹1,500/month." Populate the \`transactionAdjustments\` array with these suggestions.
    *   **Create a Simple Savings Plan:** Calculate how quickly the user can reach their goal by making these cuts. Your summary should be very direct and motivational. Example: "Cut ₹1,500 from Zomato and ₹1,000 from Blinkit, and you'll have your new PlayStation in just 4 months. It's that easy! 🚀"
    *   Keep the overall plan simple and focused on hitting the immediate target through savings.

    ---

    ### **IF THE GOAL IS LONG-TERM:**

    Your focus is on building a robust, diversified investment portfolio.

    *   **Inflation Adjustment:** Calculate the goal's future value using a 6.5% annual inflation rate. Populate \`inflationAdjustedTarget\` with this value (e.g., "₹10 Lakhs today will be ₹13.5 Lakhs in 2030").
    *   **Monthly Target:** Calculate the required monthly SIP to reach the inflation-adjusted target. Populate \`requiredMonthlyInvestment\`. Compare this with the user's provided \`monthlyInvestment\` and set \`isUserBudgetSufficient\` to true or false.
    *   **Portfolio Comparison & Recommendation:**
        *   Analyze the user's existing investments from the financial data (net worth, MFs, stocks).
        *   Create a new, diversified asset allocation plan based on their risk appetite:
            *   **Low Risk:** 60% FD/Liquid MF, 30% Large-Cap MF, 10% Gold.
            *   **Medium Risk:** 50% Multi-Cap MF, 20% FD, 20% Gold, 10% Mid-Cap MF.
            *   **High Risk:** 60% Equity MF (Mid/Small-Cap), 30% Stocks, 10% Gold.
    *   **Build the SIP Plan:** Use the live AMFI data to pick specific, top-rated funds that fit the new allocation. For each fund in your recommended \`sipPlan\`, provide the \`fundName\`, monthly SIP \`amount\`, and a sharp \`reason\` (e.g., "Large-cap fund with consistent 14% CAGR, fits your medium-risk profile.").
    *   **Compare Portfolios:** In the \`currentVsSuggestedPlanComparison\` field, briefly compare their existing portfolio to your suggestion. Example: "Your current portfolio is a bit heavy on risky stocks. My plan balances it out with stable Large-Cap MFs and Gold to better protect your capital while still aiming for solid growth."
    *   **Projection:** Calculate the final projected corpus based on your recommended plan. Populate \`projectedCorpus\`.
    *   **Smart Adjustments:** If the user's budget isn't sufficient, check their bank transactions for potential spending cuts and list them in \`transactionAdjustments\`.

    ---

    Now, generate the complete JSON output based on these instructions.
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
