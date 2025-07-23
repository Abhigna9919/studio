import { z } from 'zod';

export const goalFormSchema = z.object({
  goalAmount: z.coerce.number().positive({ message: "Goal amount must be a positive number." }),
  deadline: z.date({
    required_error: "A deadline is required.",
  }),
  currentSavings: z.coerce.number().nonnegative({message: "Current savings must be a positive number."}).optional().or(z.literal('')),
  monthlyIncome: z.coerce.number().nonnegative({message: "Monthly income must be a positive number."}).optional().or(z.literal('')),
  monthlyExpenses: z.coerce.number().nonnegative({message: "Monthly expenses must be a positive number."}).optional().or(z.literal('')),
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;


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
  units: z.number(),
  lastTradedPrice: currencyValueSchema,
});

const equitySummarySchema = z.object({
    currentValue: currencyValueSchema,
    holdingsInfo: z.array(equityHoldingInfoSchema),
});

const depositSummarySchema = z.object({
    currentBalance: currencyValueSchema,
    depositAccountType: z.string(),
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


const accountDetailsSchema = z.object({
  fipId: z.string(),
  maskedAccountNumber: z.string(),
  accInstrumentType: z.string(),
  equitySummary: equitySummarySchema.optional(),
  depositSummary: depositSummarySchema.optional(),
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
