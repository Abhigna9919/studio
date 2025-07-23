"use client";

import React, { useEffect, useState } from 'react';
import { fetchCreditReportAction } from '@/app/dashboard/credit-report/actions';
import { useToast } from '@/hooks/use-toast';
import type { CreditReportResponse, CreditAccount, ScoreHistory, CreditScore } from '@/lib/schemas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from './ui/skeleton';
import { AlertCircle, Gauge, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format } from 'date-fns';

const formatCurrency = (value?: { units?: string | null; nanos?: number | null }, fallback: string = "N/A") => {
    if (!value || typeof value.units === 'undefined' || value.units === null) {
        return fallback;
    }
    const number = parseFloat(value.units);
    if (isNaN(number)) {
        return fallback;
    }
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(number);
};

const CreditScoreGauge = ({ score, rating }: { score: number, rating: string }) => {
    const getScoreColor = (s: number) => {
        if (s < 580) return "text-red-500";
        if (s < 670) return "text-yellow-500";
        if (s < 740) return "text-blue-500";
        if (s < 800) return "text-green-500";
        return "text-emerald-500";
    }

    const scoreColor = getScoreColor(score);
    const percentage = (score - 300) / (850 - 300) * 100;

    return (
        <div className="relative flex flex-col items-center justify-center gap-2">
            <Gauge className={`h-24 w-24 ${scoreColor}`} />
            <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
                <Badge variant="secondary" className="mt-1">{rating}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Your primary credit score.</p>
        </div>
    );
};

const AccountTable = ({ title, accounts }: { title: string, accounts: CreditAccount[] }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                {title === 'Open Accounts' ? <CheckCircle className="text-green-500" /> : <XCircle className="text-destructive" />}
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Lender</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Sanctioned</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {accounts.map((acc, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{acc.lender}</TableCell>
                            <TableCell>{acc.accountType.replace(/_/g, ' ')}</TableCell>
                            <TableCell className="text-right">{formatCurrency(acc.totalBalance)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(acc.sanctionedAmount)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

export function CreditReport() {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<CreditReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const result = await fetchCreditReportAction();
      if (result.success && result.data) {
        setReportData(result.data);
      } else if (result.error) {
        toast({
          variant: "destructive",
          title: "Failed to load credit report",
          description: result.error,
        });
        setReportData(null);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [toast]);

  if (isLoading) {
    return (
        <div className="grid gap-6">
            <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
    );
  }

  if (!reportData) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] text-center border-dashed">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4">Could Not Load Credit Report</CardTitle>
          <CardDescription>
            There was an error fetching your credit information. <br />
            Please try refreshing the page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const primaryScore = reportData.scores[0];
  const chartData = reportData.scoreHistory.map(h => ({...h, date: format(new Date(h.month), 'MMM yy')}));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Credit Score</CardTitle>
          <CardDescription>An overview of your credit health from {primaryScore.bureau}.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex items-center justify-center">
                <CreditScoreGauge score={primaryScore.score} rating={primaryScore.rating} />
            </div>
            <div className="md:col-span-2">
                <h3 className="font-semibold mb-2">Key Factors</h3>
                <ul className="space-y-2 text-sm">
                    {primaryScore.factors.map((factor, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                            <span>{factor}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp />Score History</CardTitle>
              <CardDescription>Your credit score trend over the last few months.</CardDescription>
          </CardHeader>
          <CardContent>
              <ChartContainer config={{}} className="min-h-[200px] w-full">
                  <AreaChart data={chartData}>
                      <CartesianGrid vertical={false} />
                       <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                       <YAxis domain={[600, 850]} hide />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                      <Area dataKey="score" type="natural" fill="var(--color-primary)" fillOpacity={0.4} stroke="var(--color-primary)" />
                  </AreaChart>
              </ChartContainer>
          </CardContent>
      </Card>
        
      {reportData.openAccounts.length > 0 && <AccountTable title="Open Accounts" accounts={reportData.openAccounts} />}
      {reportData.closedAccounts.length > 0 && <AccountTable title="Closed Accounts" accounts={reportData.closedAccounts} />}
    </div>
  );
}
