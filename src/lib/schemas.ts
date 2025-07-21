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
