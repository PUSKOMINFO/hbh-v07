import SummaryCards from "@/components/SummaryCards";
import SumberDanaTable from "@/components/SumberDanaTable";
import TransaksiList from "@/components/TransaksiList";
import { initialSumberDana, initialTransaksi, TARGET_DONASI } from "@/lib/data";
import { BookOpen } from "lucide-react";

const Index = () => {
  const realisasi = initialSumberDana.reduce((s, d) => s + d.nominal, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="container max-w-2xl py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-foreground/15 p-2">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Halal Bi Halal 2025</h1>
              <p className="text-xs opacity-80">Majelis Dzikir Tasbih Indonesia</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-2xl py-4 space-y-4 pb-8">
        <SummaryCards targetDonasi={TARGET_DONASI} realisasi={realisasi} />
        <SumberDanaTable data={initialSumberDana} />
        <TransaksiList data={initialTransaksi} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <p className="text-center text-xs text-muted-foreground">
          © 2025 Panitia Halal Bi Halal — Majelis Dzikir Tasbih Indonesia
        </p>
      </footer>
    </div>
  );
};

export default Index;
