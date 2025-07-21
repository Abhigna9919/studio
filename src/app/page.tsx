"use client";

import { Header } from "@/components/Header";
import { GoalForm } from "@/components/GoalForm";
import { FinancialPlanDisplay } from "@/components/FinancialPlanDisplay";
import { useState } from "react";
import type { GoalFormValues } from "@/lib/schemas";
import { getFinancialPlanAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [plan, setPlan] = useState<string | null>(null);
  const [goal, setGoal] = useState<GoalFormValues | null>(null);
  const { toast } = useToast();

  const handlePlanGenerated = (newPlan: string, formValues: GoalFormValues) => {
    setPlan(newPlan);
    setGoal(formValues);
    toast({
      title: "Plan Generated!",
      description: "Your personalized financial plan is ready.",
    });
  };

  const handlePlanError = (error: string) => {
    toast({
      variant: "destructive",
      title: "Something went wrong",
      description: error,
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <GoalForm 
              onPlanGenerated={handlePlanGenerated} 
              onPlanError={handlePlanError}
              getFinancialPlanAction={getFinancialPlanAction} 
            />
          </div>
          <div className="lg:col-span-3">
            <FinancialPlanDisplay plan={plan} goal={goal} />
          </div>
        </div>
      </main>
    </div>
  );
}
