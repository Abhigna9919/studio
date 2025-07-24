
"use server";

import { fetchStockTransactionsAction } from '../stock-transactions/actions';
import { analyzeISINList, type AnalyzeISINListOutput } from '@/ai/flows/analyze-isin-list';

export async function getIsinAnalysisAction(): Promise<{
  success: boolean;
  data?: AnalyzeISINListOutput;
  error?: string;
}> {
  try {
    // 1. Fetch transactions to get unique ISINs
    const transactionsResult = await fetchStockTransactionsAction();
    if (!transactionsResult.success || !transactionsResult.data) {
      throw new Error(transactionsResult.error || "Failed to fetch stock transactions for analysis.");
    }

    const uniqueIsins = [...new Set(transactionsResult.data.transactions.map(t => t.isin))];

    if (uniqueIsins.length === 0) {
      return { success: true, data: { analysis: [] } };
    }

    // 2. Call the analysis flow
    const analysisResult = await analyzeISINList({
      isins: uniqueIsins,
    });

    return { success: true, data: analysisResult };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("getIsinAnalysisAction error:", errorMessage);
    return { success: false, error: `Failed to get ISIN analysis: ${errorMessage}` };
  }
}
