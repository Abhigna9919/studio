import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AccountDetailsBulkResponse } from '@/lib/schemas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface InvestmentDetailsProps {
  accountDetails: AccountDetailsBulkResponse;
}

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

const formatAccountType = (type: string | undefined) => {
    if (!type) return "N/A";
    return type.replace(/^(ACC_INSTRUMENT_TYPE_|DEPOSIT_ACCOUNT_TYPE_)/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function InvestmentDetails({ accountDetails }: InvestmentDetailsProps) {
    const accounts = accountDetails?.accountDetailsMap ? Object.values(accountDetails.accountDetailsMap) : [];

    const equityHoldings = accounts.flatMap(acc => 
        acc.equitySummary?.holdingsInfo.map(h => ({ 
            ...h, 
            account: acc.accountDetails.maskedAccountNumber 
        })) || []
    );

    const deposits = accounts
        .filter(acc => acc.depositSummary)
        .map(acc => ({
            ...acc.depositSummary!, 
            account: acc.accountDetails.maskedAccountNumber, 
            type: formatAccountType(acc.accountDetails.accInstrumentType)
        }));
    
  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment & Account Details</CardTitle>
        <CardDescription>A detailed breakdown of your holdings and accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['equities', 'deposits']}>
          {equityHoldings.length > 0 && (
            <AccordionItem value="equities">
              <AccordionTrigger className="text-lg font-semibold">Stocks & Equities</AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instrument</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Last Price</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equityHoldings.map((holding) => (
                      <TableRow key={holding.isin}>
                        <TableCell>
                          <div className="font-medium">{holding.issuerName}</div>
                          <div className="text-sm text-muted-foreground">{holding.isinDescription}</div>
                        </TableCell>
                        <TableCell className="text-right">{holding.units?.toFixed(2) ?? '0.00'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(holding.lastTradedPrice)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency({
                            units: String((holding.units || 0) * parseFloat(holding.lastTradedPrice?.units || '0'))
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          )}

          {deposits.length > 0 && (
             <AccordionItem value="deposits">
              <AccordionTrigger className="text-lg font-semibold">Bank Deposits</AccordionTrigger>
              <AccordionContent>
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deposits.map((deposit) => (
                      <TableRow key={deposit.account}>
                        <TableCell>
                          <div className="font-medium">{deposit.account}</div>
                        </TableCell>
                        <TableCell>{formatAccountType(deposit.depositAccountType)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(deposit.currentBalance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          )}

        </Accordion>
      </CardContent>
    </Card>
  );
}
