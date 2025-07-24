
"use client";

import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from './ui/skeleton';
import { AlertCircle, Target, KeyRound } from 'lucide-react';
import { Badge } from './ui/badge';
import { getIsinAnalysisAction } from '@/app/dashboard/analysis/actions';
import type { AnalyzeISINListOutput } from '@/ai/flows/analyze-isin-list';
import { Button } from './ui/button';

const formatCurrency = (value: string) => {
  const number = parseFloat(value);
  if (isNaN(number)) {
    return "N/A";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(number);
};

const getRsiBadgeVariant = (rsi: string): "default" | "secondary" | "destructive" => {
    const rsiValue = parseFloat(rsi);
    if (rsiValue > 70) return "destructive"; // Overbought
    if (rsiValue < 30) return "default"; // Oversold (opportunity)
    return "secondary"; // Neutral
}

export function StockAnalysis() {
  const { toast } = useToast();
  const [analysisData, setAnalysisData] = useState<AnalyzeISINListOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getIsinAnalysisAction();
      if (result.success && result.data) {
        setAnalysisData(result.data);
      } else {
        setError(result.error || "An unknown error occurred.");
      }
      setIsLoading(false);
    };

    fetchData();
  }, [toast]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && error.includes("Alpha Vantage API key is not configured")) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[300px] text-center border-dashed">
        <CardHeader>
           <div className="mx-auto bg-amber-500/10 p-3 rounded-full">
            <KeyRound className="h-8 w-8 text-amber-500" />
          </div>
          <CardTitle className="mt-4">Configure Stock Analysis</CardTitle>
          <CardDescription>
            To see technical analysis, please add your Alpha Vantage API key to the `.env` file.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer">
             <Button>Get a Free API Key</Button>
           </a>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysisData || analysisData.analysis.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] text-center border-dashed">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4">No Analysis Available</CardTitle>
          <CardDescription>
            { error ? error : "Could not retrieve analysis for your stock holdings. You may not have any stocks or the API service could be down."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
            <Target className='h-6 w-6 text-primary' />
            <CardTitle>Stock Technical Analysis</CardTitle>
        </div>
        <CardDescription>A technical look at your current stock holdings. Data from Alpha Vantage.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stock</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Current Price</TableHead>
              <TableHead className="text-right">20-Day SMA</TableHead>
              <TableHead className="text-right">RSI (14-Day)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analysisData.analysis.map(stock => (
              <TableRow key={stock.isin}>
                <TableCell className="font-medium">{stock.name}</TableCell>
                <TableCell>{stock.symbol}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(stock.currentPrice)}</TableCell>
                <TableCell className="text-right">{formatCurrency(stock.sma)}</TableCell>
                <TableCell className="text-right">
                    <Badge variant={getRsiBadgeVariant(stock.rsi)}>
                        {parseFloat(stock.rsi).toFixed(2)}
                    </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
