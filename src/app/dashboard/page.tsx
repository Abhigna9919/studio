
"use client";

import { FinancialDashboard } from "@/components/FinancialDashboard";
import { Header } from "@/components/Header";
import { fetchNetWorthAction } from "@/app/dashboard/actions";
import { useToast } from "@/hooks/use-toast";
import { GoalSummary } from "@/components/GoalSummary";

export default function DashboardPage() {
  const { toast } = useToast();

  const handleDataError = (error: string) => {
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
        <div className="space-y-6">
          <GoalSummary />
          <FinancialDashboard 
            fetchNetWorthAction={fetchNetWorthAction}
            onDataError={handleDataError}
          />
        </div>
      </main>
    </div>
  );
}
