
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { GoalFormValues, FinancialPlan } from "@/lib/schemas";
import { DollarSign, Target, Calendar, Lightbulb, TrendingUp, Sparkles, PieChartIcon, CheckCircle, XCircle, ArrowDownCircle } from "lucide-react";
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
        const amountMatch = value.match(/₹[0-9,.]+/);
        if (amountMatch) {
            const amount = Number(amountMatch[0].replace(/[^0-9.-]+/g,""));
             if (!isNaN(amount)) {
                return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
            }
        }
        return value;
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

const GoalInfoCard = ({ goal }: { goal: GoalFormValues }) => (
    <div className="space-y-4 rounded-lg border border-border/50 p-4 bg-background/30">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-accent"/>
                <span className="font-semibold text-lg">The Goal: {formatCurrency(goal.goalAmount)}</span>
            </div>
            <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-accent"/>
                <span className="font-semibold text-lg">The Deadline: {format(goal.deadline, "MMMM dd, yyyy")}</span>
            </div>
        </div>
    </div>
);

const ShortTermPlanView = ({ plan }: { plan: FinancialPlan }) => (
    <div className="space-y-6">
        {plan.suggestedCuts && plan.suggestedCuts.length > 0 && (
            <Card className="bg-background/30 border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ArrowDownCircle className="h-5 w-5 text-yellow-500" />Suggested Cuts</CardTitle>
                    <CardDescription>A few small changes can make a big difference.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                        {plan.suggestedCuts.map((cut, index) => <li key={index}>{cut}</li>)}
                    </ul>
                </CardContent>
            </Card>
        )}
        {plan.shortTermTips && (
             <Card className="bg-background/30 border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-blue-500" />Short-Term Tips</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{plan.shortTermTips}</p>
                </CardContent>
            </Card>
        )}
    </div>
);


const LongTermPlanView = ({ plan }: { plan: FinancialPlan }) => {
    const planDetails = plan.longTermPlan ? Object.entries(plan.longTermPlan).filter(([key]) => key !== 'Projection') : [];
    
    return (
        <div className="space-y-6">
            <Card className="bg-background/30 border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" />Investment Plan</CardTitle>
                     <CardDescription>Your personalized asset allocation to reach your goal.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset</TableHead>
                          <TableHead>Recommendation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {planDetails.map(([asset, recommendation]) => (
                          <TableRow key={asset}>
                            <TableCell className="font-semibold">{asset}</TableCell>
                            <TableCell>{recommendation}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </CardContent>
            </Card>
             <Card className="bg-background/30 border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="h-5 w-5" />Projected Returns</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold text-primary">{plan.longTermPlan?.Projection}</p>
                    <p className="text-sm text-muted-foreground">Based on your investment plan and market estimates.</p>
                </CardContent>
            </Card>
        </div>
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
      <CardContent className="space-y-8">
        
        <GoalInfoCard goal={goal} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
           <div className="flex flex-col gap-6">
                <Card className="bg-background/30 border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-500" />Monthly Target</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{formatCurrency(plan.monthlyTarget)}</p>
                        <p className="text-sm text-muted-foreground">Is what you need to invest/save per month.</p>
                    </CardContent>
                </Card>
                 <Alert variant={plan.isGoalAchievable ? "default" : "destructive"} className="bg-background/30 border-border/50">
                    {plan.isGoalAchievable ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <AlertTitle>{plan.isGoalAchievable ? "Goal is Achievable!" : "Goal May Be at Risk"}</AlertTitle>
                    <AlertDescription>
                        {plan.isGoalAchievable ? "You're on track to hit your goal. Keep it up!" : "Based on the current plan, you might fall short. Consider increasing your monthly contribution or extending the deadline."}
                    </AlertDescription>
                </Alert>
           </div>
           
            {plan.goalType === 'Short-term' ? <ShortTermPlanView plan={plan} /> : <LongTermPlanView plan={plan} />}
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
