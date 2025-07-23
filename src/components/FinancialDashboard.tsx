"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { NetWorthData } from "@/app/dashboard/actions";
import { BarChart, PieChart, TrendingUp, TrendingDown, Wallet, IndianRupee } from 'lucide-react';
import { Pie, Cell, ResponsiveContainer, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface FinancialDashboardProps {
  fetchNetWorthAction: () => Promise<{ success: boolean; data?: NetWorthData; error?: string }>;
  onDataError: (error: string) => void;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const formatAttributeName = (name: string) => {
    return name.split('_').slice(2).join(' ').replace(/\b\w/g, l => l.toUpperCase());
}

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
      }
      setIsLoading(false);
    };

    fetchData();
  }, [fetchNetWorthAction, onDataError]);

  const totalAssets = data?.assetValues.reduce((sum, asset) => sum + parseFloat(asset.value.units), 0) || 0;
  const totalLiabilities = data?.liabilityValues.reduce((sum, liability) => sum + parseFloat(liability.value.units), 0) || 0;

  const assetsChartData = data?.assetValues.map(asset => ({
    name: formatAttributeName(asset.netWorthAttribute),
    value: parseFloat(asset.value.units)
  })) || [];

  const liabilitiesChartData = data?.liabilityValues.map(liability => ({
    name: formatAttributeName(liability.netWorthAttribute),
    value: parseFloat(liability.value.units)
  })) || [];

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
        <Card className="h-full flex items-center justify-center min-h-[500px] border-dashed">
            <div className="text-center p-8">
                <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium font-headline">No Data Available</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    We couldn't fetch your financial data. Please try again later.
                </p>
            </div>
        </Card>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Net Worth</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold">{formatCurrency(parseFloat(data.totalNetWorthValue.units))}</div>
                <p className="text-xs text-muted-foreground">Your financial standing as of today</p>
            </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalAssets)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalLiabilities)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Asset to Liability Ratio</CardTitle>
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(totalAssets / (totalLiabilities || 1)).toFixed(2)}</div>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Assets Breakdown</CardTitle>
                    <CardDescription>How your assets are distributed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={assetsChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {assetsChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Liabilities Breakdown</CardTitle>
                    <CardDescription>How your liabilities are distributed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={liabilitiesChartData}>
                            <XAxis dataKey="name" tickFormatter={value => value.length > 10 ? `${value.substring(0, 10)}...` : value} />
                            <YAxis tickFormatter={(value: number) => formatCurrency(value)}/>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Bar dataKey="value" fill="#FF8042" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
