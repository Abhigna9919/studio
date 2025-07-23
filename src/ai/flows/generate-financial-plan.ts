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


const AssetAllocationSchema = z.object({
    assetAllocation: z.record(z.number()).describe('A map of asset classes to the allocated monthly amount in rupees (e.g., {"Mutual Funds": 7000}).'),
});

const GenerateFinancialPlanOutputSchema = z.object({
  assetAllocation: z.record(z.string()).describe('A map of asset classes to the allocated monthly amount in rupees (e.g., {"Mutual Funds": "₹7,000"}).'),
  projectedReturns: z.string().describe('The projected value of the investment by the goal deadline (e.g., "₹11.2 Lakhs").'),
  summary: z.string().describe('A short, witty, and friendly summary of the investment strategy.'),
});
export type GenerateFinancialPlanOutput = z.infer<typeof GenerateFinancialPlanOutputSchema>;

export async function generateFinancialPlan(input: GenerateFinancialPlanInput): Promise<GenerateFinancialPlanOutput> {
  return generateFinancialPlanFlow(input);
}

const generateAllocationPrompt = ai.definePrompt({
  name: 'generateAllocationPrompt',
  input: { schema: GenerateFinancialPlanInputSchema },
  output: {
    schema: AssetAllocationSchema,
  },
  prompt: `
    You are a financial planning expert for a user in India.
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
    - Gold Price: ₹{{gold_price}}}/gram
    - Top Stocks: {{{top_stock_data}}}

    Your only task is to create a JSON object detailing how to allocate the user's monthly investment (₹{{goal.monthlyInvestment}}) across different asset classes (e.g., Mutual Funds, Gold, Fixed Deposit). The sum of allocations must equal the monthly investment.

    Provide only the JSON object as the output.
  `,
});


const generateSummaryPrompt = ai.definePrompt({
    name: 'generateSummaryPrompt',
    input: { schema: z.object({ allocation: z.string() }) },
    output: { schema: z.object({ summary: z.string() }) },
    prompt: `Based on this asset allocation: {{{allocation}}}, write a short, witty, and friendly summary of the investment strategy. For example: "Mutual Funds bring growth, Gold hedges inflation, and FD stabilizes things. You’re investing like a pro!"`,
});


function calculateProjectedReturns(allocation: Record<string, number>, months: number): string {
    // Simplified projection logic. A real app would use more complex calculations.
    const annualGrowthRate = 0.12; // Assume average 12% annual growth
    const monthlyGrowthRate = Math.pow(1 + annualGrowthRate, 1/12) - 1;

    const monthlyInvestment = Object.values(allocation).reduce((sum, val) => sum + val, 0);
    
    let futureValue = 0;
    for (let i = 0; i < months; i++) {
        futureValue = (futureValue + monthlyInvestment) * (1 + monthlyGrowthRate);
    }
    
    if (futureValue >= 100000) {
      return `₹${(futureValue / 100000).toFixed(1)} Lakhs`;
    }
    return `₹${Math.round(futureValue).toLocaleString('en-IN')}`;
}


const generateFinancialPlanFlow = ai.defineFlow(
  {
    name: 'generateFinancialPlanFlow',
    inputSchema: GenerateFinancialPlanInputSchema,
    outputSchema: GenerateFinancialPlanOutputSchema,
  },
  async input => {
    // Step 1: Get the structured asset allocation from the AI.
    const allocationResponse = await generateAllocationPrompt(input);
    console.log('Gemini Raw Response for Allocation:', JSON.stringify(allocationResponse, null, 2));

    const allocationOutput = allocationResponse.output;
    if (!allocationOutput) {
        throw new Error("Failed to generate asset allocation.");
    }
    const { assetAllocation } = allocationOutput;

    // Step 2: Calculate projected returns.
    const deadline = new Date(input.goal.deadline);
    const now = new Date();
    const months = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
    const projectedReturns = calculateProjectedReturns(assetAllocation, months);

    // Step 3: Generate the witty summary.
    const allocationString = JSON.stringify(assetAllocation);
    const { output: summaryOutput } = await generateSummaryPrompt({ allocation: allocationString });
    const summary = summaryOutput?.summary || "Your personalized investment plan is ready!";

    // Step 4: Format the final output
    const formattedAllocation = Object.fromEntries(
        Object.entries(assetAllocation).map(([key, value]) => [
            key,
            `₹${value.toLocaleString('en-IN')}`
        ])
    );

    return {
        assetAllocation: formattedAllocation,
        projectedReturns,
        summary,
    };
  }
);
