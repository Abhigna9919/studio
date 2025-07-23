import { Header } from "@/components/Header";
import { EpfDetails } from "@/components/EpfDetails";

export default function EpfPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <EpfDetails />
      </main>
    </div>
  );
}
