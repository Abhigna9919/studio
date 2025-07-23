"use client";

import { Header } from "@/components/Header";
import { GoalForm } from "@/components/GoalForm";
import { FinancialPlanDisplay } from "@/components/FinancialPlanDisplay";
import { useState } from "react";
import type { GoalFormValues, FinancialPlan } from "@/lib/schemas";
import { getFinancialPlanAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { GenerateFinancialPlanOutput } from "@/ai/flows/generate-financial-plan";

export default function Home() {
  const [plan, setPlan] = useState<GenerateFinancialPlanOutput | null>(null);
  const [goal, setGoal] = useState<GoalFormValues | null>(null);
  const { toast } = useToast();

  const handlePlanGenerated = (newPlan: GenerateFinancialPlanOutput, formValues: GoalFormValues) => {
    setPlan(newPlan);
    setGoal(formValues);
    toast({
      title: "Plan Generated!",
      description: "Your personalized financial plan is ready.",
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
