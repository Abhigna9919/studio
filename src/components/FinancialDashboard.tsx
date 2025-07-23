"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowDown, ArrowUp, Banknote } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import type { NetWorthResponse } from "@/lib/schemas";

interface FinancialDashboardProps {
  fetchNetWorthAction: () => Promise<{
    success: boolean;
    data?: NetWorthResponse;
    error?: string;
  }>;
  onDataError: (error: string) => void;
}

const formatAttributeName = (name: string) => {
  return name
    .replace(/^(ASSET_TYPE_|LIABILITY_TYPE_)/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatCurrency = (value?: { units?: string | null; nanos?: number | null }, fallback: string = "$0.00") => {
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


export function FinancialDashboard({
  fetchNetWorthAction,
  onDataError,
}: FinancialDashboardProps) {
  const [dashboardData, setDashboardData] = useState<NetWorthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const result = await fetchNetWorthAction();
      if (result.success && result.data) {
        setDashboardData(result.data.netWorthResponse);
      } else if (result.error) {
        onDataError(result.error);
        setDashboardData(null);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [fetchNetWorthAction, onDataError]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
         <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
         <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] text-center border-dashed">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4">Failed to Load Data</CardTitle>
          <CardDescription>
            There was an error fetching your financial information. <br />
            Please try refreshing the page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { assetValues, liabilityValues, totalNetWorthValue } = dashboardData;

  const totalAssets = assetValues.reduce((acc, asset) => acc + parseFloat(asset.value.units || "0"), 0);
  const totalLiabilities = liabilityValues.reduce((acc, liability) => acc + parseFloat(liability.value.units || "0"), 0);

  const assetsChartData = assetValues.map(asset => ({ name: formatAttributeName(asset.netWorthAttribute), value: parseFloat(asset.value.units || '0')}));
  const liabilitiesChartData = liabilityValues.map(liability => ({ name: formatAttributeName(liability.netWorthAttribute), value: parseFloat(liability.value.units || '0')}));

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];


  return (
    <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Net Worth</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalNetWorthValue)}</div>
                    <p className="text-xs text-muted-foreground">Your total financial value</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                    <ArrowUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency({ units: String(totalAssets) })}</div>
                     <p className="text-xs text-muted-foreground">Sum of all your assets</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
                    <ArrowDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency({ units: String(totalLiabilities) })}</div>
                    <p className="text-xs text-muted-foreground">Sum of all your debts</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Asset Distribution</CardTitle>
                    <CardDescription>How your assets are allocated.</CardDescription>
                </CardHeader>
                <CardContent>
                   <ChartContainer config={{}} className="min-h-[250px] w-full">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                            <Pie data={assetsChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} strokeWidth={2}>
                                {assetsChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Liability Breakdown</CardTitle>
                    <CardDescription>A look at your outstanding debts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="min-h-[250px] w-full">
                        <BarChart data={liabilitiesChartData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={120} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" hideLabel />} />
                            <Bar dataKey="value" radius={4} fill="var(--color-liabilities)">
                                {liabilitiesChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}