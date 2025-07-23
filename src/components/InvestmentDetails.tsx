import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AccountDetailsBulkResponse, EquityHolding, DepositAccount, EtfHolding, ReitHolding, InvitHolding } from '@/lib/schemas';
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
    return type.replace(/^(ACC_INSTRUMENT_TYPE_|DEPOSIT_ACCOUNT_TYPE_|EQUITY_ACCOUNT_TYPE_|ETF_ACCOUNT_TYPE_|REIT_ACCOUNT_TYPE_|INVIT_ACCOUNT_TYPE_)/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function InvestmentDetails({ accountDetails }: InvestmentDetailsProps) {
    const accounts = accountDetails?.accountDetailsMap ? Object.values(accountDetails.accountDetailsMap) : [];

    const equityHoldings: EquityHolding[] = accounts.flatMap(acc => acc.equitySummary?.holdingsInfo.map(h => ({ ...h, account: acc.accountDetails.maskedAccountNumber })) || []);
    const deposits: DepositAccount[] = accounts.filter(acc => acc.depositSummary).map(acc => ({...acc.depositSummary!, account: acc.accountDetails.maskedAccountNumber, type: formatAccountType(acc.accountDetails.accInstrumentType)}));
    const etfHoldings: EtfHolding[] = accounts.flatMap(acc => acc.etfSummary?.holdingsInfo.map(h => ({ ...h, account: acc.accountDetails.maskedAccountNumber })) || []);
    const reitHoldings: ReitHolding[] = accounts.flatMap(acc => acc.reitSummary?.holdingsInfo.map(h => ({...h, account: acc.accountDetails.maskedAccountNumber})) || []);
    const invitHoldings: InvitHolding[] = accounts.flatMap(acc => acc.invitSummary?.holdingsInfo.map(h => ({...h, account: acc.accountDetails.maskedAccountNumber})) || []);
    
  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment & Account Details</CardTitle>
        <CardDescription>A detailed breakdown of your holdings and accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['equities', 'deposits', 'etfs', 'reits', 'invits']}>
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
                      <TableRow key={holding.isin + holding.account}>
                        <TableCell>
                          <div className="font-medium">{holding.issuerName}</div>
                          <div className="text-sm text-muted-foreground">{holding.isinDescription} ({holding.account})</div>
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
          
          {etfHoldings.length > 0 && (
            <AccordionItem value="etfs">
              <AccordionTrigger className="text-lg font-semibold">Exchange Traded Funds (ETFs)</AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instrument</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">NAV</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {etfHoldings.map((holding) => (
                      <TableRow key={holding.isin + holding.account}>
                        <TableCell>
                          <div className="font-medium">{holding.isinDescription}</div>
                          <div className="text-sm text-muted-foreground">{holding.isin} ({holding.account})</div>
                        </TableCell>
                        <TableCell className="text-right">{holding.units?.toFixed(2) ?? '0.00'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(holding.nav)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency({
                            units: String((holding.units || 0) * parseFloat(holding.nav?.units || '0'))
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          )}
          
          {reitHoldings.length > 0 && (
            <AccordionItem value="reits">
              <AccordionTrigger className="text-lg font-semibold">Real Estate Investment Trusts (REITs)</AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instrument</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Last Closing Rate</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reitHoldings.map((holding) => (
                      <TableRow key={holding.isin + holding.account}>
                        <TableCell>
                          <div className="font-medium">{holding.isinDescription}</div>
                          <div className="text-sm text-muted-foreground">{holding.isin} ({holding.account})</div>
                        </TableCell>
                        <TableCell className="text-right">{holding.totalNumberUnits?.toFixed(2) ?? '0.00'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(holding.lastClosingRate)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency({
                            units: String((holding.totalNumberUnits || 0) * parseFloat(holding.lastClosingRate?.units || '0'))
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          )}

          {invitHoldings.length > 0 && (
            <AccordionItem value="invits">
              <AccordionTrigger className="text-lg font-semibold">Infrastructure Investment Trusts (InvITs)</AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instrument</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitHoldings.map((holding) => (
                      <TableRow key={holding.isin + holding.account}>
                        <TableCell>
                          <div className="font-medium">{holding.isinDescription}</div>
                          <div className="text-sm text-muted-foreground">{holding.isin} ({holding.account})</div>
                        </TableCell>
                        <TableCell className="text-right">{holding.totalNumberUnits?.toFixed(2) ?? '0.00'}</TableCell>
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
