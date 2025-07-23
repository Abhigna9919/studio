"use client";

import React, { useEffect, useState } from 'react';
import { fetchStockTransactionsAction } from '@/app/dashboard/stock-transactions/actions';
import { useToast } from '@/hooks/use-toast';
import type { StockTransactionsResponse } from '@/lib/schemas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from './ui/skeleton';
import { AlertCircle, ArrowRightLeft } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

const formatCurrency = (value?: { units?: string | null; nanos?: number | null }, fallback: string = "N/A") => {
    if (!value || typeof value.units === 'undefined' || value.units === null) {
        return fallback;
    }
    const number = parseFloat(value.units);
    if (isNaN(number)) {
        return fallback;
    }
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
    }).format(number);
};

export function StockTransactions() {
  const { toast } = useToast();
  const [transactionsData, setTransactionsData] = useState<StockTransactionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const result = await fetchStockTransactionsAction();
      if (result.success && result.data) {
        setTransactionsData(result.data);
      } else if (result.error) {
        toast({
          variant: "destructive",
          title: "Failed to load Stock transactions",
          description: result.error,
        });
        setTransactionsData(null);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [toast]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
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
              <TableHead>Stock</TableHead>
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
                <TableCell className="font-medium">{txn.stockName}</TableCell>
                <TableCell>{txn.isin}</TableCell>
                <TableCell>
                  <Badge variant={txn.type === 'BUY' ? 'default' : 'destructive'}>
                    {txn.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{txn.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(txn.price)}</TableCell>
                <TableCell className="text-right">{formatCurrency(txn.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
