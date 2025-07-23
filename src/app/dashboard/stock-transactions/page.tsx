import { Header } from "@/components/Header";
import { StockTransactions } from "@/components/StockTransactions";

export default function StockTransactionsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <StockTransactions />
      </main>
    </div>
  );
}
