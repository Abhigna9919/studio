"use client";

import React, { useEffect, useState } from 'react';
import { fetchEpfDetailsAction } from '@/app/dashboard/epf/actions';
import { useToast } from '@/hooks/use-toast';
import type { EpfDetailsResponse, EpfAccount, EpfContribution } from '@/lib/schemas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from './ui/skeleton';
import { AlertCircle, PiggyBank, Building, User, Calendar, Briefcase, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

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

export function EpfDetails() {
  const { toast } = useToast();
  const [epfData, setEpfData] = useState<EpfDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const result = await fetchEpfDetailsAction();
      if (result.success && result.data) {
        setEpfData(result.data);
      } else if (result.error) {
        toast({
          variant: "destructive",
          title: "Failed to load EPF details",
          description: result.error,
        });
        setEpfData(null);
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
        </div>
    );
  }

  if (!epfData) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] text-center border-dashed">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4">Could Not Load EPF Details</CardTitle>
          <CardDescription>
            There was an error fetching your EPF information. <br />
            Please try refreshing the page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <PiggyBank className='h-6 w-6 text-primary' />
            <CardTitle>Employee Provident Fund (EPF)</CardTitle>
          </div>
          <CardDescription>An overview of your EPF accounts and balances.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-semibold">{epfData.name}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-muted-foreground">UAN</p>
                    <p className="font-semibold">{epfData.uan}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-muted-foreground">Date of Birth</p>
                    <p className="font-semibold">{format(new Date(epfData.dateOfBirth), 'dd MMMM, yyyy')}</p>
                </div>
            </div>
        </CardContent>
      </Card>
        
      <Accordion type="multiple" defaultValue={epfData.accounts.map(acc => acc.memberId)}>
          {epfData.accounts.map(account => (
             <AccordionItem key={account.memberId} value={account.memberId}>
                <AccordionTrigger>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full pr-4">
                        <div className="flex items-center gap-2">
                           <Building className="h-5 w-5 text-primary" />
                           <span className="font-semibold text-lg">{account.establishmentName}</span>
                        </div>
                         <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 md:mt-0">
                           <span className="font-mono bg-muted px-2 py-1 rounded">{account.memberId}</span>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <Card>
                                <CardHeader><CardTitle>Total Balance</CardTitle></CardHeader>
                                <CardContent><p className="text-2xl font-bold text-primary">{formatCurrency(account.totalBalance)}</p></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Employee Share</CardTitle></CardHeader>
                                <CardContent><p className="text-2xl font-bold">{formatCurrency(account.employeeShare)}</p></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Employer Share</CardTitle></CardHeader>
                                <CardContent><p className="text-2xl font-bold">{formatCurrency(account.employerShare)}</p></CardContent>
                            </Card>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Contribution History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Month</TableHead>
                                            <TableHead>Transaction Date</TableHead>
                                            <TableHead className="text-right">Employee</TableHead>
                                            <TableHead className="text-right">Employer</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {account.contributions.map((c, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{c.month}</TableCell>
                                                <TableCell>{format(new Date(c.transactionDate), 'dd-MMM-yyyy')}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(c.employeeContribution)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(c.employerContribution)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </AccordionContent>
             </AccordionItem>
          ))}
      </Accordion>
    </div>
  );
}
