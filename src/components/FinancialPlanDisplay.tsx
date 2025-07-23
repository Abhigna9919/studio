
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { GoalFormValues, FinancialPlan } from "@/lib/schemas";
import { DollarSign, Target, Calendar, TrendingUp, Sparkles, CheckCircle, XCircle, ArrowDownCircle, Info, GitCompareArrows } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";

interface FinancialPlanDisplayProps {
  plan: FinancialPlan | null;
  goal: GoalFormValues | null;
}

const formatCurrency = (value: number | string) => {
    if (typeof value === 'string') {
         const amount = Number(value.replace(/[^0-9.-]+/g,""));
         if (!isNaN(amount)) {
            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
        }
        return value; // Return as is if it doesn't contain a parsable number
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

const InfoCard = ({ title, value, subtext }: {title: string, value: string, subtext?: string}) => (
    <Card className="bg-background/30 border-border/50">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-2xl font-bold">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </CardContent>
    </Card>
);

const SIPPlanTable = ({ plan }: { plan: FinancialPlan }) => {
    if (!plan.sipPlan || plan.sipPlan.length === 0) return null;

    return (
     <Card className="bg-background/30 border-border/50">
        <CardHeader>
            <CardTitle>Your Monthly SIP Plan</CardTitle>
            <CardDescription>A tailored investment plan to meet your goals based on your risk profile.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fund Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.sipPlan.map((sip) => (
                  <TableRow key={sip.fundName}>
                    <TableCell className="font-semibold">{sip.fundName}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(sip.amount)}</TableCell>
                    <TableCell>{sip.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
    </Card>
    );
};


const AdjustmentsCard = ({ plan }: { plan: FinancialPlan }) => {
    if (!plan.transactionAdjustments || plan.transactionAdjustments.length === 0) return null;

    return (
    <Card className="bg-background/30 border-border/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowDownCircle className="h-5 w-5 text-yellow-500" />Smart Adjustments</CardTitle>
            <CardDescription>A few tweaks to your spending can fast-track your goal.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc list-inside space-y-1">
                {plan.transactionAdjustments.map((cut, index) => <li key={index}>{cut}</li>)}
            </ul>
        </CardContent>
    </Card>
    );
}

const PlanComparisonCard = ({ plan }: { plan: FinancialPlan }) => {
    if (!plan.currentVsSuggestedPlanComparison) return null;

    return (
        <Card className="bg-background/30 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <GitCompareArrows className="h-5 w-5 text-blue-400" />
                    Plan Comparison
                </CardTitle>
                <CardDescription>How the new plan stacks up against your current strategy.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm italic text-muted-foreground">{plan.currentVsSuggestedPlanComparison}</p>
            </CardContent>
        </Card>
    );
};



export function FinancialPlanDisplay({ plan, goal }: FinancialPlanDisplayProps) {
  if (!plan || !goal) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[500px] border-2 border-dashed border-border/30 bg-transparent">
        <div className="text-center p-8">
          <Sparkles className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h3 className="mt-4 text-2xl font-bold font-headline">Your Plan is Loading...</h3>
          <p className="mt-1 text-md text-muted-foreground">
            Get ready for the financial glow up. The AI is doing its magic.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-gradient-to-br from-card to-secondary/30 border-border/50">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-3xl font-black tracking-tighter">Your Financial Glow Up for {goal.title}</CardTitle>
                <CardDescription className="text-lg">This is the way. Your personalized path to the bag.</CardDescription>
            </div>
            <Badge variant={plan.goalType === 'Short-term' ? 'secondary' : 'default'}>{plan.goalType} Goal</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoCard title="Original Goal" value={formatCurrency(goal.goalAmount)} subtext={`by ${format(goal.deadline, "MMM yyyy")}`} />
            <InfoCard title="Inflation-Adjusted Target" value={plan.inflationAdjustedTarget} subtext="at 6.5% annual inflation" />
            <InfoCard title="Required Monthly SIP" value={plan.requiredMonthlyInvestment} subtext="to reach your adjusted target" />
        </div>
        
        <Alert variant={plan.isUserBudgetSufficient ? "default" : "destructive"} className="bg-background/30 border-border/50">
            {plan.isUserBudgetSufficient ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertTitle>{plan.isUserBudgetSufficient ? "Your Budget is on Track!" : "Budget Adjustment Needed"}</AlertTitle>
            <AlertDescription>
                {plan.isUserBudgetSufficient ? `Your planned monthly investment of ${formatCurrency(goal.monthlyIncome || 0)} is enough.` : `Your budget of ${formatCurrency(goal.monthlyIncome || 0)} is less than the required ${plan.requiredMonthlyInvestment}. Consider the adjustments below.`}
            </AlertDescription>
        </Alert>

        <div className="space-y-6">
           <SIPPlanTable plan={plan} />
           <PlanComparisonCard plan={plan} />
           <AdjustmentsCard plan={plan} />
            {plan.projectedCorpus && (
            <Card className="bg-background/30 border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Projected Corpus</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold text-primary">{plan.projectedCorpus}</p>
                    <p className="text-sm text-muted-foreground">Based on your investment plan and market estimates.</p>
                </CardContent>
            </Card>
            )}
        </div>
        
        <Alert className="bg-background/30 border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle>AI Summary</AlertTitle>
            <AlertDescription className="italic">
            "{plan.summary}"
            </AlertDescription>
        </Alert>

      </CardContent>
    </Card>
  );
}
