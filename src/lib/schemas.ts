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

export const netWorthResponseSchema = z.object({
    netWorthResponse: netWorthDataSchema,
    // We are not using the other fields for now, but they are in the response
    // mfSchemeAnalytics: z.any(),
    // accountDetailsBulkResponse: z.any(),
});

export type NetWorthResponse = z.infer<typeof netWorthDataSchema>;