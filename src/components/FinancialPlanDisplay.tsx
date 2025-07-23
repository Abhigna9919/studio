import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GoalFormValues, FinancialPlan } from "@/lib/schemas";
import { DollarSign, Target, Calendar, BarChart, Lightbulb, TrendingUp, ShieldCheck, ReceiptText } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "./ui/separator";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { Badge } from "./ui/badge";

interface FinancialPlanDisplayProps {
  plan: FinancialPlan | null;
  goal: GoalFormValues | null;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const categoryIcons: { [key: string]: React.ElementType } = {
  'Savings': DollarSign,
  'Investment': TrendingUp,
  'Expense Management': ReceiptText,
  'Debt Management': ShieldCheck,
};

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

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
  
  const allocationData = plan.assetAllocationStrategy.map(a => ({
      name: a.assetClass.replace(/_/g, " "),
      value: a.recommendedAllocationPercentage,
      current: a.currentAllocationPercentage,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Your Path to Success</CardTitle>
        <CardDescription>A personalized, actionable plan to achieve your financial goal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Goal Summary */}
        <div className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-accent"/>
                    <span className="font-semibold">Goal: {formatCurrency(goal.goalAmount)}</span>
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
                    Saved {formatCurrency(currentSavings)}
                </div>
            </div>
        </div>
        
        <Separator />
        
        {/* Monthly Target & Allocation */}
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><DollarSign className="h-5 w-5" />Monthly Savings Target</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(plan.monthlySavingsTarget)}</p>
                    <p className="text-sm text-muted-foreground">This is your target to stay on track.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="h-5 w-5" />Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                     <ChartContainer config={{}} className="min-h-[150px] w-full max-w-[250px]">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                            <Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} strokeWidth={2}>
                                {allocationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>

        {/* Actionable Steps */}
        <div>
          <h3 className="text-xl font-semibold mb-3 font-headline flex items-center gap-2"><Lightbulb className="text-accent" />Actionable Steps</h3>
          <div className="space-y-4">
            {plan.actionableSteps.map((step, index) => {
              const Icon = categoryIcons[step.category] || Lightbulb;
              return (
                <Card key={index} className="bg-secondary/30">
                  <CardHeader className="p-4">
                    <CardTitle className="flex items-center gap-3 text-base">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-primary/10`}>
                            <Icon className="h-5 w-5 text-primary" />
                        </span>
                        {step.title}
                        <Badge variant="secondary" className="ml-auto">{step.category.replace(/([A-Z])/g, ' $1').trim()}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
