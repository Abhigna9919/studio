import { Header } from "@/components/Header";
import { StockAnalysis } from "@/components/StockAnalysis";

export default function AnalysisPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <StockAnalysis />
      </main>
    </div>
  );
}
