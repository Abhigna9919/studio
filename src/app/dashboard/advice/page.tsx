import { Header } from "@/components/Header";
import { FinancialAdvice } from "@/components/FinancialAdvice";

export default function AdvicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <FinancialAdvice />
      </main>
    </div>
  );
}
