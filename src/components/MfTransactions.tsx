
"use client";

import React, { useEffect, useState } from 'react';
import { fetchMfTransactionsAction, getMfAnalysisAction } from '@/app/dashboard/mf-transactions/actions';
import { useToast } from '@/hooks/use-toast';
import type { MfTransactionsResponse, MfTransaction } from '@/lib/schemas';
import type { MfAnalysisOutput } from '@/ai/flows/analyze-mf-portfolio';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from './ui/skeleton';
import { AlertCircle, CandlestickChart, Sparkles, Lightbulb } from 'lucide-react';
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
        maximumFractionDigits: 0,
    }).format(number);
};

const AnalysisCard = ({ analysis }: { analysis: MfAnalysisOutput }) => {
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
                            <div key={h.fundName} className="p-2 bg-background rounded-md">
                                <p className="font-medium truncate">{h.fundName}</p>
                                <p className="text-muted-foreground">{formatCurrency(h.investedAmount)}</p>
                            </div>
                        ))}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold mb-2">Asset Allocation</h4>
                    <div className="flex items-center gap-2">
                         {analysis.assetAllocation.map(a => (
                            <Badge key={a.assetClass} variant="secondary">{a.assetClass}: {a.percentage}%</Badge>
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

export function MfTransactions() {
  const { toast } = useToast();
  const [transactionsData, setTransactionsData] = useState<MfTransactionsResponse | null>(null);
  const [analysisData, setAnalysisData] = useState<MfAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const [transactionsResult, analysisResult] = await Promise.all([
        fetchMfTransactionsAction(),
        getMfAnalysisAction()
      ]);

      if (transactionsResult.success && transactionsResult.data) {
        setTransactionsData(transactionsResult.data);
      } else if (transactionsResult.error) {
        toast({
          variant: "destructive",
          title: "Failed to load MF transactions",
          description: transactionsResult.error,
        });
        setTransactionsData(null);
      }

       if (analysisResult.success && analysisResult.data) {
        setAnalysisData(analysisResult.data);
      } else if (analysisResult.error) {
        // Not showing a toast for analysis failure, as it's a non-critical enhancement
        console.error("Failed to load MF analysis:", analysisResult.error);
        setAnalysisData(null);
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
          <CardTitle className="mt-4">No Mutual Fund Transactions Found</CardTitle>
          <CardDescription>
            Could not retrieve any MF transactions. <br />
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
                <CandlestickChart className='h-6 w-6 text-primary' />
                <CardTitle>Mutual Fund Transaction History</CardTitle>
            </div>
            <CardDescription>A complete log of your mutual fund buy and sell orders.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Scheme</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Folio</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">NAV</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactionsData.transactions.map((txn, index) => (
                <TableRow key={index}>
                    <TableCell>{format(new Date(txn.date), 'PP')}</TableCell>
                    <TableCell className="font-medium">{txn.schemeName}</TableCell>
                    <TableCell>
                    <Badge variant={txn.type === 'PURCHASE' ? 'default' : 'destructive'}>
                        {txn.type}
                    </Badge>
                    </TableCell>
                    <TableCell>{txn.folioNumber}</TableCell>
                    <TableCell className="text-right">{formatCurrency(txn.amount)}</TableCell>
                    <TableCell className="text-right">{txn.units}</TableCell>
                    <TableCell className="text-right">{formatCurrency(txn.nav)}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
