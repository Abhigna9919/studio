'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  netWorthResponseSchema,
  bankTransactionsResponseSchema,
  stockTransactionsResponseSchema,
  mfTransactionsResponseSchema,
  epfDetailsResponseSchema,
  creditReportResponseSchema
} from '@/lib/schemas';
import {fetchNetWorthAction} from '@/app/dashboard/actions';
import {fetchBankTransactionsAction} from '@/app/dashboard/transactions/actions';
import {fetchStockTransactionsAction} from '@/app/dashboard/stock-transactions/actions';
import {fetchMfTransactionsAction} from '@/app/dashboard/mf-transactions/actions';
import {fetchEpfDetailsAction} from '@/app/dashboard/epf/actions';
import {fetchCreditReportAction} from '@/app/dashboard/credit-report/actions';

export const fetchNetWorthTool = ai.defineTool(
  {
    name: 'fetchNetWorth',
    description: 'Fetches the user\'s total net worth, asset and liability breakdown, and detailed investment holdings.',
    inputSchema: z.object({}),
    outputSchema: netWorthResponseSchema,
  },
  async () => {
    const result = await fetchNetWorthAction();
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data!;
  }
);

export const fetchBankTransactionsTool = ai.defineTool(
  {
    name: 'fetchBankTransactions',
    description: 'Fetches the user\'s recent bank transactions from all linked accounts.',
    inputSchema: z.object({}),
    outputSchema: bankTransactionsResponseSchema,
  },
  async () => {
    const result = await fetchBankTransactionsAction();
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data!;
  }
);

export const fetchStockTransactionsTool = ai.defineTool(
  {
    name: 'fetchStockTransactions',
    description: 'Fetches the user\'s recent stock market transaction history.',
    inputSchema: z.object({}),
    outputSchema: stockTransactionsResponseSchema,
  },
  async () => {
    const result = await fetchStockTransactionsAction();
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data!;
  }
);

export const fetchMfTransactionsTool = ai.defineTool(
  {
    name: 'fetchMfTransactions',
    description: 'Fetches the user\'s recent mutual fund transaction history.',
    inputSchema: z.object({}),
    outputSchema: mfTransactionsResponseSchema,
  },
  async () => {
    const result = await fetchMfTransactionsAction();
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data!;
  }
);

export const fetchEpfDetailsTool = ai.defineTool(
  {
    name: 'fetchEpfDetails',
    description: 'Fetches the user\'s Employee Provident Fund (EPF) details, including balances and account information.',
    inputSchema: z.object({}),
    outputSchema: epfDetailsResponseSchema,
  },
  async () => {
    const result = await fetchEpfDetailsAction();
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data!;
  }
);

export const fetchCreditReportTool = ai.defineTool(
  {
    name: 'fetchCreditReport',
    description: 'Fetches the user\'s credit report, including credit score, history, and details of open and closed accounts.',
    inputSchema: z.object({}),
    outputSchema: creditReportResponseSchema,
  },
  async () => {
    const result = await fetchCreditReportAction();
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data!;
  }
);
