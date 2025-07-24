

"use client";

import React, { useEffect, useState } from 'react';
import { fetchStockTransactionsAction, getStockAnalysisAction, getStockDetailsAction } from '@/app/dashboard/stock-transactions/actions';
import { useToast } from '@/hooks/use-toast';
import type { StockTransactionsResponse, StockAnalysisOutput } from '@/lib/schemas';
import type { GetStockDetailsOutput } from '@/ai/flows/get-stock-details';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from './ui/skeleton';
import { AlertCircle, ArrowRightLeft, Sparkles, Lightbulb, Info } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

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
                    Portfolio Analysis
                </CardTitle>
                <CardDescription>{analysis.portfolioSummary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <h4 className="font-semibold mb-2">Top 5 Holdings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        {analysis.topHoldings.map((h, i) => (
                            <div key={`${h.stockName}-${i}`} className="p-2 bg-background rounded-md">
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
                            <Badge key={`${a.sector}-${i}`} variant="secondary">{a.sector}: {a.percentage}%</Badge>
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

const StockDetailsDialog = ({ isin }: { isin: string }) => {
    const [details, setDetails] = useState<GetStockDetailsOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleFetchDetails = async () => {
        if (details) return; // Don't re-fetch if we already have the data
        setIsLoading(true);
        const result = await getStockDetailsAction(isin);
        if (result.success && result.data) {
            setDetails(result.data);
        } else {
            toast({
                variant: 'destructive',
                title: 'Failed to fetch stock details',
                description: result.error,
            });
        }
        setIsLoading(false);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleFetchDetails}>
                    <span className="font-medium flex items-center gap-1 group">
                        {isin} 
                        <Info className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                {isLoading ? (
                    <div className="space-y-4 py-4">
                        <DialogHeader>
                            <DialogTitle>Loading Stock Details...</DialogTitle>
                        </DialogHeader>
                        <Skeleton className="h-4 w-1/2" />
                        <div className="space-y-2 pt-4">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-5/6" />
                        </div>
                        <div className="space-y-2 pt-4">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                ) : details ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{details.companyName} ({details.stockSymbol})</DialogTitle>
                             <DialogDescription>{details.isin}</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                            <div>
                                <h3 className="font-semibold mb-2">About the Company</h3>
                                <p className="text-sm text-muted-foreground">{details.description}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Key Executives</h3>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                    {details.keyExecutives.map(exec => <li key={exec}>{exec}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h3 className="font-semibold mb-2">Recent News</h3>
                                <p className="text-sm text-muted-foreground">{details.recentNews}</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <DialogHeader>
                           <DialogTitle className="text-center">Error</DialogTitle>
                           <DialogDescription className="text-center">Could not load stock details.</DialogDescription>
                        </DialogHeader>
                        <AlertCircle className="mx-auto h-12 w-12 text-destructive mt-4" />
                        <h3 className="mt-4 text-lg font-medium">Could not load details</h3>
                        <p className="text-sm text-muted-foreground">There was an error fetching information for this stock.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};


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
      } else {
         toast({
          variant: "destructive",
          title: "Failed to load Stock transactions",
          description: transactionsResult.error,
        });
        setTransactionsData(null);
      }

      // Fetch analysis only if transactions were loaded successfully
      if (transactionsResult.success) {
        try {
            const analysisResult = await getStockAnalysisAction();
            if (analysisResult.success && analysisResult.data) {
                setAnalysisData(analysisResult.data);
            } else if (analysisResult.error) {
                console.error("Failed to load stock analysis:", analysisResult.error);
                setAnalysisData(null); // Explicitly set to null on error
            }
        } catch (error) {
           const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
           console.error("Failed to load stock analysis:", errorMessage);
           toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "Could not generate analysis for your stock portfolio.",
          });
          setAnalysisData(null);
        }
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
            <CardDescription>A list of your recent stock market transactions. Click an ISIN for details.</CardDescription>
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
                <TableRow key={`${txn.isin}-${txn.tradeDate}-${index}`}>
                    <TableCell>{format(new Date(txn.tradeDate), 'PP')}</TableCell>
                    <TableCell>
                      <StockDetailsDialog isin={txn.isin} />
                    </TableCell>
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
