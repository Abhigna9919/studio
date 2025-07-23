
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const compareMFPortfolioAndSpendingPrompt = ai.definePrompt({
  name: 'compareMFPortfolioAndSpendingPrompt',
  input: {
    schema: z.object({
      current_mf_portfolio: z.string().describe('List of current mutual funds: name, amount, category, risk, and returns'),
      projected_mf_plan: z.string().describe('Projected mutual fund plan based on goal: fund names, amounts, duration, risk level'),
      bank_transactions: z.string().describe('JSON or list of monthly bank transactions, categorized by expense type or merchant'),
      epf_details: z.string().optional().describe('Optional: EPF contribution details (if available)'),
      stock_data: z.string().optional().describe('Optional: Equity/stock transactions or holdings'),
      credit_report: z.string().optional().describe('Optional: Credit history, loans, EMIs, cards'),
    }),
  },
  output: {
    schema: z.object({
      portfolioComparison: z.string().describe('Summary comparing current MFs vs projected MFs with insights'),
      incomeSummary: z.string().describe('Estimated monthly income, spending, and savings from bank data'),
      recommendations: z.array(z.string()).describe('Specific fund and expense recommendations'),
      finalActionPlan: z.string().describe('Concise plan with fund switches, SIP changes, and savings suggestions'),
    }),
  },
  config: {
    response: {
      format: 'json',
    },
  },
  prompt: `
You are an intelligent financial planning assistant for Indian users.

The user has provided:
- Their current mutual fund portfolio.
- A projected mutual fund plan aligned with a financial goal.
- Their full bank transaction history over the last 6–12 months.

Optionally, you also have EPF, stock, and credit data.

---

🔍 Step-by-step, do the following:

1. **Mutual Fund Comparison**
   - Compare the user's current mutual funds with the projected goal plan.
   - Highlight any overlaps, gaps, or misalignments in fund types, risk, or categories.
   - Identify poor-performing funds that can be replaced.

2. **Spending Behavior Analysis**
   - From bank transactions, infer:
     - Monthly average income (from credits)
     - Spending categories (food, shopping, rent, EMI, subscriptions)
     - Monthly saving potential
   - Group into essentials and non-essentials

3. **Intelligent Recommendations**
   - Suggest SIP changes or fund switches with clear reasoning.
   - Recommend expense reduction ideas based on user's spending.
   - If EPF, stocks, or loans are provided — consider them in risk analysis.

4. **Final Action Plan**
   - State what the user should do next month:
     - Which funds to switch to?
     - How much more to invest or save?
     - Where to cut expenses?
     - How to better align their portfolio with the goal.

---

🧠 Tone: Friendly, smart, and clear — like a Gen Z financial coach.
Use analogies or quips where helpful, but ensure advice is grounded in realistic numbers.

Return your output in the required JSON schema only.
  `,
});
