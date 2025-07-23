"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { NetWorthData } from "@/app/dashboard/actions";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface FinancialDashboardProps {
  fetchNetWorthAction: () => Promise<{ success: boolean; data?: NetWorthData; error?: string }>;
  onDataError: (error: string) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatAttributeName = (name: string) => {
    return name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
};

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function FinancialDashboard({ fetchNetWorthAction, onDataError }: FinancialDashboardProps) {
  const [data, setData] = useState<NetWorthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const result = await fetchNetWorthAction();
      if (result.success && result.data) {
        setData(result.data);
      } else if (result.error) {
        onDataError(result.error);
        setData(null); 
      }
      setIsLoading(false);
    };

    fetchData();
  }, [fetchNetWorthAction, onDataError]);

  const { chartData, totalAssets, totalLiabilities } = useMemo(() => {
    if (!data) return { chartData: [], totalAssets: 0, totalLiabilities: 0 };
    
    const totalAssets = data.assets.reduce((sum, asset) => sum + asset.value, 0);
    const totalLiabilities = data.liabilities.reduce((sum, liability) => sum + liability.value, 0);

    const chartData = [
      { name: 'Assets', value: totalAssets, fill: "hsl(var(--chart-2))" },
      { name: 'Liabilities', value: totalLiabilities, fill: "hsl(var(--chart-1))" },
    ];
    return { chartData, totalAssets, totalLiabilities };
  }, [data]);


  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
          <CardContent><Skeleton className="h-12 w-1/2" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
          <CardContent><Skeleton className="h-12 w-1/2" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
          <CardContent><Skeleton className="h-12 w-1/2" /></CardContent>
        </Card>
        <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
        <Card className="flex flex-col items-center justify-center min-h-[400px] text-center border-dashed">
             <CardHeader>
                <div className="mx-auto bg-destructive/10 p-3 rounded-full">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="mt-4">Failed to Load Data</CardTitle>
                <CardDescription>
                    There was an error fetching your financial information. <br/>
                    Please try refreshing the page or check the console for more details.
                </CardDescription>
            </CardHeader>
        </Card>
    )
  }

  return (
    <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Net Worth</CardTitle>
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-primary">{formatCurrency(data.netWorth)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Your current financial snapshot</p>
                </CardContent>
            </Card>
             <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(totalAssets)}</div>
                     <p className="text-xs text-muted-foreground mt-1">What you own</p>
                </CardContent>
            </Card>
             <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
                    <TrendingDown className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(totalLiabilities)}</div>
                     <p className="text-xs text-muted-foreground mt-1">What you owe</p>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Asset vs. Liability Breakdown</CardTitle>
                    <CardDescription>A comparison of what you own and owe.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" tickFormatter={formatCurrency} />
                                <YAxis type="category" dataKey="name" width={80} />
                                <ChartTooltip 
                                    cursor={{fill: 'hsl(var(--muted))'}}
                                    content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} 
                                />
                                <Bar dataKey="value" radius={[4, 4, 4, 4]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Asset Allocation</CardTitle>
                    <CardDescription>How your assets are distributed.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                     <ChartContainer config={{}} className="h-64 aspect-square">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <ChartTooltip 
                                    content={<ChartTooltipContent hideLabel nameKey="name" formatter={(value, name) => <div className="p-1"><p className="font-semibold">{formatAttributeName(name as string)}</p><p>{formatCurrency(value as number)}</p></div>} />}
                                />
                                <Pie
                                    data={data.assets}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    labelLine={false}
                                    label={({ name, percent }) => `${formatAttributeName(name)}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {data.assets.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>Assets Details</CardTitle></CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {data.assets.map(asset => (
                            <li key={asset.name} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                                <span className="font-medium">{formatAttributeName(asset.name)}</span>
                                <span className="text-green-600 font-mono">{formatCurrency(asset.value)}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Liabilities Details</CardTitle></CardHeader>
                <CardContent>
                     <ul className="space-y-2">
                        {data.liabilities.map(item => (
                            <li key={item.name} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                                <span className="font-medium">{formatAttributeName(item.name)}</span>
                                <span className="text-red-600 font-mono">{formatCurrency(item.value)}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
