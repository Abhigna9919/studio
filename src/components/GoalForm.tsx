"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Sparkles } from "lucide-react";

import { goalFormSchema, type GoalFormValues, type FinancialPlan } from "@/lib/schemas";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "./ui/skeleton";
import { GenerateFinancialPlanOutput } from "@/ai/flows/generate-financial-plan";

interface GoalFormProps {
  onPlanGenerated: (plan: GenerateFinancialPlanOutput, values: GoalFormValues) => void;
  onPlanError: (error: string) => void;
  getFinancialPlanAction: (values: Omit<GoalFormValues, 'currentSavings' | 'monthlyIncome' | 'monthlyExpenses'> & { currentSavings?: number; monthlyIncome?: number; monthlyExpenses?: number; }) => Promise<{ success: boolean; plan?: GenerateFinancialPlanOutput; error?: string }>;
}

export function GoalForm({ onPlanGenerated, onPlanError, getFinancialPlanAction }: GoalFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
  });

  React.useEffect(() => {
    setIsMounted(true);
    const defaultDeadline = new Date();
    defaultDeadline.setMonth(defaultDeadline.getMonth() + 12);
    form.reset({
      goalAmount: 25000,
      deadline: defaultDeadline,
      currentSavings: 5000,
      monthlyIncome: 6000,
      monthlyExpenses: 2500,
    });
  }, [form]);

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

  if (!isMounted) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-12 w-full" />
        </CardFooter>
      </Card>
    );
  }


  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-accent" />
            <CardTitle className="font-headline text-2xl">Define Your Vibe</CardTitle>
        </div>
        <CardDescription>Drop your goal details and let our AI cook up a fire financial plan for you.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="goalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>The Goal ($)</FormLabel>
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
                    <FormLabel>Current Stash ($)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="1000" {...field} />
                    </FormControl>
                    <FormDescription>Optional, but helps</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="monthlyIncome"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Monthly Flow ($)</FormLabel>
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
                  <FormLabel>Monthly Burn ($)</FormLabel>
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
            <Button type="submit" disabled={isLoading} size="lg" className="w-full font-bold text-lg bg-primary hover:bg-primary/90">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cooking...
                </>
              ) : (
                "Generate My Plan"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
