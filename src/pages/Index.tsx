import { useRef, useState } from "react";
import SummaryCards from "@/components/SummaryCards";
import SumberDanaTable from "@/components/SumberDanaTable";
import TransaksiList from "@/components/TransaksiList";
import BottomNav from "@/components/BottomNav";
import { initialSumberDana, initialTransaksi, TARGET_DONASI } from "@/lib/data";
import { BookOpen } from "lucide-react";

const Index = () => {
  const realisasi = initialSumberDana.reduce((s, d) => s + d.nominal, 0);
  const [activeSection, setActiveSection] = useState("rekap");

  const rekapRef = useRef<HTMLDivElement>(null);
  const donasiRef = useRef<HTMLDivElement>(null);
  const transaksiRef = useRef<HTMLDivElement>(null);

  const handleNav = (section: string) => {
    setActiveSection(section);
    const ref = section === "rekap" ? rekapRef : section === "donasi" ? donasiRef : transaksiRef;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="container max-w-3xl py-5">
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
      <main className="container max-w-3xl py-4 space-y-4 pb-24 sm:pb-8">
        <div ref={rekapRef} className="scroll-mt-4">
          <SummaryCards targetDonasi={TARGET_DONASI} realisasi={realisasi} />
        </div>
        <div ref={donasiRef} className="scroll-mt-4">
          <SumberDanaTable data={initialSumberDana} />
        </div>
        <div ref={transaksiRef} className="scroll-mt-4">
          <TransaksiList data={initialTransaksi} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 hidden sm:block">
        <p className="text-center text-xs text-muted-foreground">
          © 2025 Panitia Halal Bi Halal — Majelis Dzikir Tasbih Indonesia
        </p>
      </footer>

      {/* Mobile Bottom Nav */}
      <BottomNav active={activeSection} onChange={handleNav} />
    </div>
  );
};

export default Index;
