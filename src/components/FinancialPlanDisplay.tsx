import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GoalFormValues, FinancialPlan } from "@/lib/schemas";
import { DollarSign, Target, Calendar, Lightbulb, TrendingUp, ShieldCheck, ReceiptText, Bot, Sparkles, PieChartIcon } from "lucide-react";
import { format } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

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
        return value; // return string as is if it's not a currency
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

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

  const allocationData = Object.entries(plan.plan || {}).map(([name, value]) => {
      const amountMatch = value.match(/₹([\d,]+)/);
      return {
        name,
        value: amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : 0,
      };
  });
  
  const totalMonthlyInvestment = allocationData.reduce((acc, item) => acc + item.value, 0);

  return (
    <Card className="h-full bg-gradient-to-br from-card to-secondary/30 border-border/50">
      <CardHeader>
        <CardTitle className="font-headline text-3xl font-black tracking-tighter">Your Financial Glow Up for {goal.title}</CardTitle>
        <CardDescription className="text-lg">This is the way. Your personalized path to the bag.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Goal Summary */}
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
             <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-accent"/>
                <span className="font-semibold text-lg">Monthly Investment: {formatCurrency(totalMonthlyInvestment)}</span>
            </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-background/30 border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><PieChartIcon className="h-5 w-5" />Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                     <ChartContainer config={{}} className="min-h-[150px] w-full max-w-[250px]">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="name" formatter={(value) => formatCurrency(value as number)} />} />
                            <Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} strokeWidth={2}>
                                {allocationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
             <Card className="bg-background/30 border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="h-5 w-5" />Projected Returns</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold text-primary">{plan.projectedReturns}</p>
                    <p className="text-sm text-muted-foreground">Vibes are good, returns looking solid.</p>
                </CardContent>
            </Card>
        </div>

        {/* Actionable Steps */}
        <div>
          <h3 className="text-2xl font-bold mb-4 font-headline flex items-center gap-3"><Lightbulb className="text-accent" />The Game Plan</h3>
            <Card className="bg-background/30 border-border/50 hover:border-primary/50 transition-colors duration-300">
                <CardHeader className="p-4">
                    <CardTitle className="flex items-center gap-3 text-base">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-primary/10`}>
                            <Bot className="h-5 w-5 text-primary" />
                        </span>
                        AI Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground italic mb-4">"{plan.summary}"</p>
                   <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset</TableHead>
                          <TableHead>Recommendation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(plan.plan || {}).map(([asset, recommendation]) => (
                          <TableRow key={asset}>
                            <TableCell className="font-semibold">{asset}</TableCell>
                            <TableCell>{recommendation}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </CardContent>
    </Card>
  );
}
