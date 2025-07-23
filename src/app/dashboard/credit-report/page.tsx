import { Header } from "@/components/Header";
import { CreditReport } from "@/components/CreditReport";

export default function CreditReportPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <CreditReport />
      </main>
    </div>
  );
}
