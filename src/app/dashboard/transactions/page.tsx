import { Header } from "@/components/Header";
import { BankTransactions } from "@/components/BankTransactions";

export default function TransactionsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <BankTransactions />
      </main>
    </div>
  );
}