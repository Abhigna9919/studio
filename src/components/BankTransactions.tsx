"use client";

import React, { useEffect, useState } from 'react';
import { fetchBankTransactionsAction } from '@/app/dashboard/transactions/actions';
import { useToast } from '@/hooks/use-toast';
import type { BankTransactionsResponse, Transaction } from '@/lib/schemas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from './ui/skeleton';
import { AlertCircle, ArrowLeftRight, ArrowDownToDot, ArrowUpFromDot } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

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

export function BankTransactions() {
  const { toast } = useToast();
  const [transactionsData, setTransactionsData] = useState<BankTransactionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const result = await fetchBankTransactionsAction();
      if (result.success && result.data) {
        setTransactionsData(result.data);
      } else if (result.error) {
        toast({
          variant: "destructive",
          title: "Failed to load transactions",
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
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactionsData || transactionsData.accountTransactions.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] text-center border-dashed">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4">No Transactions Found</CardTitle>
          <CardDescription>
            Could not retrieve any bank transactions. <br />
            Please try refreshing the page or check back later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const allTransactions: (Transaction & { account: string })[] = transactionsData.accountTransactions.flatMap(acc => 
    acc.transactions.map(t => ({...t, account: acc.maskedAccountNumber}))
  ).sort((a, b) => new Date(b.transactionTimestamp).getTime() - new Date(a.transactionTimestamp).getTime());


  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
            <ArrowLeftRight className='h-6 w-6 text-primary' />
            <CardTitle>Bank Transactions</CardTitle>
        </div>
        <CardDescription>A list of your recent bank transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allTransactions.map(transaction => (
              <TableRow key={transaction.transactionId}>
                <TableCell>{format(new Date(transaction.transactionTimestamp), 'PP')}</TableCell>
                <TableCell>{transaction.account}</TableCell>
                <TableCell className="max-w-xs truncate">{transaction.narration}</TableCell>
                <TableCell>
                  <Badge variant={transaction.transactionType === 'TRANSACTION_TYPE_CREDIT' ? 'default' : 'secondary'} className="capitalize">
                     {transaction.transactionType === 'TRANSACTION_TYPE_CREDIT' ? 
                        <ArrowUpFromDot className='mr-1 h-3 w-3 text-green-400' /> : 
                        <ArrowDownToDot className='mr-1 h-3 w-3 text-red-400' />}
                    {transaction.transactionType.replace('TRANSACTION_TYPE_', '').toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(transaction.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}