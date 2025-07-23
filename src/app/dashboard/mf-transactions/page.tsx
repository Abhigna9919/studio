import { Header } from "@/components/Header";
import { MfTransactions } from "@/components/MfTransactions";

export default function MfTransactionsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <MfTransactions />
      </main>
    </div>
  );
}
