
"use client";

import React, { useEffect, useState } from 'react';
import { fetchStockTransactionsAction } from '@/app/dashboard/stock-transactions/actions';
import { useToast } from '@/hooks/use-toast';
import type { StockTransactionsResponse } from '@/lib/schemas';
import { analyzeStockPortfolio, type StockAnalysisOutput } from '@/ai/flows/analyze-stock-portfolio';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from './ui/skeleton';
import { AlertCircle, ArrowRightLeft, Sparkles, Lightbulb } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

const formatCurrency = (value?: { units?: string | null; nanos?: number | null } | string, fallback: string = "N/A") => {
    let numStr: string | undefined | null;
    if (typeof value === 'string') {
        numStr = value;
    } else {
        numStr = value?.units;
    }
    
    if (typeof numStr === 'undefined' || numStr === null) {
        return fallback;
    }
    
    const number = parseFloat(numStr);
    if (isNaN(number)) {
        return fallback;
    }
    
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
    }).format(number);
};

const AnalysisCard = ({ analysis }: { analysis: StockAnalysisOutput }) => {
    return (
        <Card className="mb-6 bg-secondary/30 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-6 w-6" />
                    AI Portfolio Analysis
                </CardTitle>
                <CardDescription>{analysis.portfolioSummary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <h4 className="font-semibold mb-2">Top 5 Holdings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        {analysis.topHoldings.map(h => (
                            <div key={h.stockName} className="p-2 bg-background rounded-md">
                                <p className="font-medium truncate">{h.stockName}</p>
                                <p className="text-muted-foreground">Value: {formatCurrency(h.currentValue)}</p>
                            </div>
                        ))}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold mb-2">Sector Allocation</h4>
                    <div className="flex flex-wrap items-center gap-2">
                         {analysis.sectorAllocation.map((a, i) => (
                            <Badge key={a.sector + i} variant="secondary">{a.sector}: {a.percentage}%</Badge>
                         ))}
                    </div>
                </div>
                <div>
                     <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertTitle>Recommendations</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc list-inside">
                                {analysis.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                            </ul>
                        </AlertDescription>
                    </Alert>
                </div>
            </CardContent>
        </Card>
    );
}

export function StockTransactions() {
  const { toast } = useToast();
  const [transactionsData, setTransactionsData] = useState<StockTransactionsResponse | null>(null);
  const [analysisData, setAnalysisData] = useState<StockAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const transactionsResult = await fetchStockTransactionsAction();
      
      if (transactionsResult.success && transactionsResult.data) {
        setTransactionsData(transactionsResult.data);
        
        try {
          const analysisResult = await analyzeStockPortfolio(transactionsResult.data);
          setAnalysisData(analysisResult);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
          console.error("Failed to load stock analysis:", errorMessage);
          toast({
            variant: "destructive",
            title: "AI Analysis Failed",
            description: "Could not generate AI-powered analysis for your stock portfolio.",
          });
          setAnalysisData(null);
        }
      } else if (transactionsResult.error) {
        toast({
          variant: "destructive",
          title: "Failed to load Stock transactions",
          description: transactionsResult.error,
        });
        setTransactionsData(null);
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, [toast]);

  if (isLoading) {
    return (
       <div className="space-y-6">
        <Card>
            <CardHeader><Skeleton className="h-8 w-64" /></CardHeader>
            <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!transactionsData || transactionsData.transactions.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] text-center border-dashed">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4">No Stock Transactions Found</CardTitle>
          <CardDescription>
            Could not retrieve any stock transactions. <br />
            Please try refreshing the page or check back later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {analysisData && <AnalysisCard analysis={analysisData} />}
      <Card>
        <CardHeader>
            <div className='flex items-center gap-2'>
                <ArrowRightLeft className='h-6 w-6 text-primary' />
                <CardTitle>Stock Transactions</CardTitle>
            </div>
            <CardDescription>A list of your recent stock market transactions.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>ISIN</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactionsData.transactions.map((txn, index) => (
                <TableRow key={index}>
                    <TableCell>{format(new Date(txn.tradeDate), 'PP')}</TableCell>
                    <TableCell className="font-medium">{txn.isin}</TableCell>
                    <TableCell>
                    <Badge variant={txn.type === 'BUY' ? 'default' : 'destructive'}>
                        {txn.type}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right">{txn.quantity.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(txn.price)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(txn.amount)}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
