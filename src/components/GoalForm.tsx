"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Target } from "lucide-react";

import { goalFormSchema, type GoalFormValues } from "@/lib/schemas";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface GoalFormProps {
  onPlanGenerated: (plan: string, values: GoalFormValues) => void;
  onPlanError: (error: string) => void;
  getFinancialPlanAction: (values: Omit<GoalFormValues, 'currentSavings' | 'monthlyIncome' | 'monthlyExpenses'> & { currentSavings?: number; monthlyIncome?: number; monthlyExpenses?: number; }) => Promise<{ success: boolean; plan?: string; error?: string }>;
}

export function GoalForm({ onPlanGenerated, onPlanError, getFinancialPlanAction }: GoalFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      goalAmount: 10000,
      deadline: (() => {
        const date = new Date();
        date.setMonth(date.getMonth() + 6);
        return date;
      })(),
      currentSavings: 1000,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
    },
  });

  async function onSubmit(values: GoalFormValues) {
    setIsLoading(true);
    const submissionValues = {
        ...values,
        currentSavings: values.currentSavings ? Number(values.currentSavings) : undefined,
        monthlyIncome: values.monthlyIncome ? Number(values.monthlyIncome) : undefined,
        monthlyExpenses: values.monthlyExpenses ? Number(values.monthlyExpenses) : undefined,
    }
    const result = await getFinancialPlanAction(submissionValues);
    if (result.success && result.plan) {
      onPlanGenerated(result.plan, values);
    } else if (result.error) {
        onPlanError(result.error);
    }
    setIsLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline">Set Your Financial Goal</CardTitle>
        </div>
        <CardDescription>Tell us your goal and we'll generate a plan for you.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="goalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="10000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Deadline</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                control={form.control}
                name="currentSavings"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Current Savings ($)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="1000" {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="monthlyIncome"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Monthly Income ($)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="5000" {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
              control={form.control}
              name="monthlyExpenses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Expenses ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="3000" {...field} />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                "Generate Plan"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
