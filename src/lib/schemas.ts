import { z } from 'zod';
import type { GenerateFinancialPlanOutput } from '@/ai/flows/generate-financial-plan';

export const goalFormSchema = z.object({
  title: z.string().min(3, { message: "Goal title must be at least 3 characters." }),
  goalAmount: z.coerce.number().positive({ message: "Goal amount must be a positive number." }),
  deadline: z.date({
    required_error: "A deadline is required.",
  }),
  risk: z.enum(['Low', 'Medium', 'High'], { required_error: "Please select your risk appetite." }),
  monthlyIncome: z.coerce.number().nonnegative({message: "Monthly income must be a positive number."}).optional().or(z.literal('')),
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;
export type FinancialPlan = GenerateFinancialPlanOutput;


// Schemas for the financial dashboard data from the API
const currencyValueSchema = z.object({
  currencyCode: z.string().optional().nullable(),
  units: z.string().optional().nullable(),
  nanos: z.number().optional().nullable(),
});

const netWorthAttributeValueSchema = z.object({
  netWorthAttribute: z.string(),
  value: currencyValueSchema,
});

const netWorthDataSchema = z.object({
  assetValues: z.array(netWorthAttributeValueSchema),
  liabilityValues: z.array(netWorthAttributeValueSchema),
  totalNetWorthValue: currencyValueSchema,
});

const equityHoldingInfoSchema = z.object({
  isin: z.string(),
  issuerName: z.string(),
  isinDescription: z.string(),
  units: z.number().optional().nullable(),
  lastTradedPrice: currencyValueSchema.optional().nullable(),
});
export type EquityHolding = z.infer<typeof equityHoldingInfoSchema> & { account: string };


const equitySummarySchema = z.object({
    currentValue: currencyValueSchema,
    holdingsInfo: z.array(equityHoldingInfoSchema),
});

const depositSummarySchema = z.object({
    currentBalance: currencyValueSchema,
    depositAccountType: z.string(),
});
export type DepositAccount = z.infer<typeof depositSummarySchema> & { account: string, type: string };


const etfHoldingInfoSchema = z.object({
  isin: z.string(),
  isinDescription: z.string(),
  units: z.number().optional().nullable(),
  nav: currencyValueSchema.optional().nullable(),
});
export type EtfHolding = z.infer<typeof etfHoldingInfoSchema> & { account: string };

const etfSummarySchema = z.object({
    currentValue: currencyValueSchema,
    holdingsInfo: z.array(etfHoldingInfoSchema),
});

const reitHoldingInfoSchema = z.object({
    isin: z.string(),
    isinDescription: z.string(),
    totalNumberUnits: z.number().optional().nullable(),
    lastClosingRate: currencyValueSchema.optional().nullable(),
});
export type ReitHolding = z.infer<typeof reitHoldingInfoSchema> & { account: string };

const reitSummarySchema = z.object({
    currentValue: currencyValueSchema,
    holdingsInfo: z.array(reitHoldingInfoSchema),
});

const invitHoldingInfoSchema = z.object({
    isin: z.string(),
    isinDescription: z.string(),
    totalNumberUnits: z.number().optional().nullable(),
});
export type InvitHolding = z.infer<typeof invitHoldingInfoSchema> & { account: string };

const invitSummarySchema = z.object({
    currentValue: currencyValueSchema,
    holdingsInfo: z.array(invitHoldingInfoSchema),
});


const mfSchemeDetailSchema = z.object({
    nameData: z.object({ longName: z.string() }),
    assetClass: z.string(),
});

const mfEnrichedAnalyticsSchema = z.object({
    analytics: z.object({
        schemeDetails: z.object({
            currentValue: currencyValueSchema,
            investedValue: currencyValueSchema.optional(),
            XIRR: z.number().optional(),
        }),
    }),
});

const mfSchemeAnalyticsSchema = z.object({
    schemeDetail: mfSchemeDetailSchema,
    enrichedAnalytics: mfEnrichedAnalyticsSchema.optional(),
});


const accountDetailsInnerSchema = z.object({
    fipId: z.string(),
    maskedAccountNumber: z.string(),
    accInstrumentType: z.string(),
});

const accountDetailsSchema = z.object({
  accountDetails: accountDetailsInnerSchema,
  equitySummary: equitySummarySchema.optional(),
  depositSummary: depositSummarySchema.optional(),
  etfSummary: etfSummarySchema.optional(),
  reitSummary: reitSummarySchema.optional(),
  invitSummary: invitSummarySchema.optional(),
});


const accountDetailsMapSchema = z.record(accountDetailsSchema);

const accountDetailsBulkResponseSchema = z.object({
    accountDetailsMap: accountDetailsMapSchema,
});

const mfAnalyticsSchema = z.object({
    schemeAnalytics: z.array(mfSchemeAnalyticsSchema)
});

export const netWorthResponseSchema = z.object({
    netWorthResponse: netWorthDataSchema,
    accountDetailsBulkResponse: accountDetailsBulkResponseSchema,
    mfSchemeAnalytics: mfAnalyticsSchema.optional(),
});

export type NetWorthResponse = z.infer<typeof netWorthResponseSchema>;
export type AccountDetailsBulkResponse = z.infer<typeof accountDetailsBulkResponseSchema>;

// Schemas for Bank Transactions
const transactionSchema = z.object({
  transactionId: z.string(),
  amount: currencyValueSchema.optional(),
  transactionType: z.enum(['TRANSACTION_TYPE_CREDIT', 'TRANSACTION_TYPE_DEBIT', 'TRANSACTION_TYPE_OTHER']),
  transactionMode: z.string().optional(),
  narration: z.string(),
  transactionTimestamp: z.string(),
  currentBalance: currencyValueSchema.optional(),
});
export type Transaction = z.infer<typeof transactionSchema>;

const accountTransactionSchema = z.object({
  maskedAccountNumber: z.string(),
  transactions: z.array(transactionSchema),
});
export type BankTransaction = z.infer<typeof accountTransactionSchema>;

export const bankTransactionsResponseSchema = z.object({
  accountTransactions: z.array(accountTransactionSchema),
});
export type BankTransactionsResponse = z.infer<typeof bankTransactionsResponseSchema>;


// Schemas for Credit Report
const creditScoreSchema = z.object({
  bureau: z.string(),
  score: z.number(),
  rank: z.number(),
  totalRanks: z.number(),
  rating: z.string(),
  factors: z.array(z.string()),
});
export type CreditScore = z.infer<typeof creditScoreSchema>;

const scoreHistorySchema = z.object({
  month: z.string(),
  score: z.number(),
});
export type ScoreHistory = z.infer<typeof scoreHistorySchema>;

const creditAccountSchema = z.object({
  accountType: z.string(),
  lender: z.string(),
  totalBalance: currencyValueSchema.optional().nullable(),
  sanctionedAmount: currencyValueSchema.optional().nullable(),
  paymentDueDate: z.string().optional().nullable(),
  accountStatus: z.string(),
});
export type CreditAccount = z.infer<typeof creditAccountSchema>;

// This schema is based on the new JSON structure
const experianCreditAccountDetailsSchema = z.object({
  subscriberName: z.string(),
  portfolioType: z.string(),
  accountType: z.string(),
  openDate: z.string(),
  highestCreditOrOriginalLoanAmount: z.string(),
  accountStatus: z.string(),
  paymentRating: z.string(),
  paymentHistoryProfile: z.string(),
  currentBalance: z.string(),
  amountPastDue: z.string(),
  dateReported: z.string(),
  occupationCode: z.string().optional(),
  rateOfInterest: z.string().optional(),
  repaymentTenure: z.string(),
  dateOfAddition: z.string(),
  currencyCode: z.string(),
  accountHolderTypeCode: z.string(),
  creditLimitAmount: z.string().optional()
});

const experianCreditReportDataSchema = z.object({
    creditAccount: z.object({
      creditAccountDetails: z.array(experianCreditAccountDetailsSchema),
    }),
    score: z.object({
      bureauScore: z.string(),
    }),
});

export const creditReportResponseSchema = z.object({
    scores: z.array(creditScoreSchema),
    scoreHistory: z.array(scoreHistorySchema),
    openAccounts: z.array(creditAccountSchema),
    closedAccounts: z.array(creditAccountSchema),
});
export type CreditReportResponse = z.infer<typeof creditReportResponseSchema>;


// Schemas for EPF Details
const epfContributionSchema = z.object({
    month: z.string(),
    employeeContribution: currencyValueSchema,
    employerContribution: currencyValueSchema,
    transactionDate: z.string(),
});
export type EpfContribution = z.infer<typeof epfContributionSchema>;

const epfAccountSchema = z.object({
    memberId: z.string(),
    establishmentName: z.string(),
    totalBalance: currencyValueSchema,
    employeeShare: currencyValueSchema,
    employerShare: currencyValueSchema,
    contributions: z.array(epfContributionSchema),
});
export type EpfAccount = z.infer<typeof epfAccountSchema>;

export const epfDetailsResponseSchema = z.object({
    uan: z.string(),
    name: z.string(),
    dateOfBirth: z.string(),
    accounts: z.array(epfAccountSchema),
});
export type EpfDetailsResponse = z.infer<typeof epfDetailsResponseSchema>;


// Schemas for Mutual Fund Transactions
const mfTransactionSchema = z.object({
    date: z.string(),
    schemeName: z.string(),
    folioNumber: z.string(),
    type: z.enum(['PURCHASE', 'SELL']),
    amount: currencyValueSchema,
    units: z.string(),
    nav: currencyValueSchema,
});
export type MfTransaction = z.infer<typeof mfTransactionSchema>;

export const mfTransactionsResponseSchema = z.object({
    transactions: z.array(mfTransactionSchema),
});
export type MfTransactionsResponse = z.infer<typeof mfTransactionsResponseSchema>;

// Schemas for Stock Transactions
const stockTransactionSchema = z.object({
    tradeDate: z.string(),
    stockName: z.string(),
    isin: z.string(),
    type: z.enum(['BUY', 'SELL', 'BONUS', 'SPLIT']),
    quantity: z.number(),
    price: currencyValueSchema,
    amount: currencyValueSchema,
});
export type StockTransaction = z.infer<typeof stockTransactionSchema>;

export const stockTransactionsResponseSchema = z.object({
    transactions: z.array(stockTransactionSchema),
});
export type StockTransactionsResponse = z.infer<typeof stockTransactionsResponseSchema>;


// Schemas for Market News
const marketNewsArticleSchema = z.object({
  id: z.number(),
  headline: z.string(),
  summary: z.string(),
  url: z.string().url(),
  image: z.string().url().optional().or(z.literal('')),
  source: z.string(),
  datetime: z.number(),
});
export type MarketNewsArticle = z.infer<typeof marketNewsArticleSchema>;

export const marketNewsResponseSchema = z.array(marketNewsArticleSchema);
