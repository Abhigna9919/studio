import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GoalFormValues } from "@/lib/schemas";
import { DollarSign, Target, Calendar, BarChart } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "./ui/separator";

interface FinancialPlanDisplayProps {
  plan: string | null;
  goal: GoalFormValues | null;
}

export function FinancialPlanDisplay({ plan, goal }: FinancialPlanDisplayProps) {
  if (!plan || !goal) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[500px] border-dashed">
        <div className="text-center p-8">
          <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium font-headline">Your Plan Awaits</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill out the form to generate your personalized financial plan and see it here.
          </p>
        </div>
      </Card>
    );
  }

  const currentSavings = goal.currentSavings ? Number(goal.currentSavings) : 0;
  const progress = goal.goalAmount > 0 ? (currentSavings / goal.goalAmount) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Your Path to Success</CardTitle>
        <CardDescription>Here is your personalized plan to achieve your financial goal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-accent"/>
                    <span className="font-semibold">Goal: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(goal.goalAmount)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent"/>
                    <span className="font-semibold">Deadline: {format(goal.deadline, "MMMM dd, yyyy")}</span>
                </div>
            </div>
             <div>
                <div className="mb-2 flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Current Progress</span>
                    <span className="text-sm font-bold text-primary">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                <div className="mt-2 text-right text-xs text-muted-foreground">
                    Saved {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentSavings)}
                </div>
            </div>
        </div>

        <Separator />
        
        <div>
          <h4 className="text-lg font-semibold mb-2 font-headline">Actionable Plan</h4>
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap p-4 bg-secondary/50 rounded-md">
            {plan}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
