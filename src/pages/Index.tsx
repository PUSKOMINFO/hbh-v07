import { useState } from "react";
import SummaryCards from "@/components/SummaryCards";
import SumberDanaTable from "@/components/SumberDanaTable";
import TransaksiList from "@/components/TransaksiList";
import AnggaranSeksiCard from "@/components/AnggaranSeksiCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useSumberDana } from "@/hooks/useSumberDana";
import { useTransaksi } from "@/hooks/useTransaksi";
import { useAppSettings } from "@/hooks/useAppSettings";
import { BookOpen, LogIn, LogOut, List, ClipboardList, ArrowLeftRight, PieChart, Printer } from "lucide-react";
import DonutCharts from "@/components/DonutCharts";
import { useNavigate } from "react-router-dom";
import { useAnggaranSeksi } from "@/hooks/useAnggaranSeksi";
import { printAllPdf } from "@/lib/exportAllPdf";
import PWAInstallDialog from "@/components/PWAInstallDialog";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Index = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: sumberDana = [], isLoading: sdLoading } = useSumberDana();
  const { data: transaksi = [], isLoading: trLoading } = useTransaksi();
  const { data: settings, isLoading: settingsLoading } = useAppSettings();
  const { data: anggaranSeksi = [] } = useAnggaranSeksi();
  const navigate = useNavigate();
  const { showInstallDialog, install, dismiss, canInstall } = usePWAInstall();

  const targetDonasi = Number(settings?.target_donasi || 101050000);
  const tahunHbh = settings?.tahun_hbh || "2026";

  const realisasi = sumberDana.reduce((s, d) => s + d.nominal, 0);
  const [activeTab, setActiveTab] = useState("donasi");
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrintAll = async () => {
    setIsPrinting(true);
    try {
      // Build realisasi map for seksi
      const realisasiMap: Record<string, number> = {};
      transaksi.filter((t) => t.jenis === "keluar").forEach((t) => {
        realisasiMap[t.kategori || "Lainnya"] = (realisasiMap[t.kategori || "Lainnya"] || 0) + t.nominal;
      });

      const seksiItems = anggaranSeksi.map((s) => ({
        nama_seksi: s.nama_seksi,
        anggaran: s.anggaran,
        realisasi: realisasiMap[s.nama_seksi] || 0,
      }));

      const totalMasuk = transaksi.filter((t) => t.jenis === "masuk").reduce((s, t) => s + t.nominal, 0);
      const totalKeluar = transaksi.filter((t) => t.jenis === "keluar").reduce((s, t) => s + t.nominal, 0);

      const seksiData = Object.entries(
        transaksi.filter((t) => t.jenis === "keluar").reduce<Record<string, number>>((map, t) => {
          const key = t.kategori || "Lainnya";
          map[key] = (map[key] || 0) + t.nominal;
          return map;
        }, {})
      ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

      const sumberDataChart = sumberDana.filter((s) => s.nominal > 0).map((s) => ({ name: s.nama_cabang, value: s.nominal })).sort((a, b) => b.value - a.value);

      await printAllPdf({
        sumberDana: mappedSumberDana,
        transaksi: mappedTransaksi,
        seksiItems,
        grafik: { totalMasuk, totalKeluar, seksiData, sumberData: sumberDataChart },
        tahunHbh,
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // Map DB rows to component-expected shape
  const mappedSumberDana = sumberDana.map((d) => ({
    id: d.id,
    namaCabang: d.nama_cabang,
    skg: d.skg,
    nominal: d.nominal,
  }));

  const mappedTransaksi = transaksi.map((t) => ({
    id: t.id,
    tanggal: t.tanggal,
    keterangan: t.keterangan,
    jenis: t.jenis,
    nominal: t.nominal,
    kategori: t.kategori,
    bukti: t.bukti_url
      ? { url: t.bukti_url, tipe: t.bukti_tipe || "image", keterangan: t.bukti_keterangan || undefined }
      : undefined,
  }));

  const isLoading = sdLoading || trLoading || settingsLoading;

  const renderTabContent = () => {
    switch (activeTab) {
      case "donasi":
        return <SumberDanaTable data={mappedSumberDana} />;
      case "seksi":
        return <AnggaranSeksiCard transaksi={transaksi} />;
      case "transaksi":
        return <TransaksiList data={mappedTransaksi} />;
      case "grafik":
        return <DonutCharts transaksi={transaksi} sumberDana={sumberDana} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="container max-w-3xl py-4 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-foreground/15 p-2">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold leading-tight">Halal Bi Halal {tahunHbh}</h1>
              <p className="text-[11px] sm:text-xs opacity-80">Majelis Dzikir Tasbih Indonesia</p>
            </div>
            {!authLoading && (
              <>
                {user && (
                  <button
                    onClick={handlePrintAll}
                    disabled={isPrinting || isLoading}
                    className="flex items-center gap-1.5 text-xs bg-primary-foreground/15 hover:bg-primary-foreground/25 rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{isPrinting ? "Proses..." : "Print All"}</span>
                  </button>
                )}
                {user ? (
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-1.5 text-xs bg-primary-foreground/15 hover:bg-primary-foreground/25 rounded-lg px-3 py-2 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/auth")}
                    className="flex items-center gap-1.5 text-xs bg-primary-foreground/15 hover:bg-primary-foreground/25 rounded-lg px-3 py-2 transition-colors"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Login</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl py-3 sm:py-4 space-y-3 sm:space-y-4 pb-20 sm:pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <SummaryCards targetDonasi={targetDonasi} realisasi={realisasi} />

            {/* Desktop: inline tabs */}
            <div className="hidden sm:block">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full h-auto p-1 bg-muted/60 rounded-xl grid grid-cols-4 gap-1">
                  <TabsTrigger
                    value="donasi"
                    className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    <List className="h-4 w-4 shrink-0" />
                    <span>Donasi</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="seksi"
                    className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    <ClipboardList className="h-4 w-4 shrink-0" />
                    <span>Seksi</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="transaksi"
                    className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    <ArrowLeftRight className="h-4 w-4 shrink-0" />
                    <span>Transaksi</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="grafik"
                    className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    <PieChart className="h-4 w-4 shrink-0" />
                    <span>Grafik</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="donasi" className="mt-3 focus-visible:outline-none focus-visible:ring-0">
                  <SumberDanaTable data={mappedSumberDana} />
                </TabsContent>
                <TabsContent value="seksi" className="mt-3 focus-visible:outline-none focus-visible:ring-0">
                  <AnggaranSeksiCard transaksi={transaksi} />
                </TabsContent>
                <TabsContent value="transaksi" className="mt-3 focus-visible:outline-none focus-visible:ring-0">
                  <TransaksiList data={mappedTransaksi} />
                </TabsContent>
                <TabsContent value="grafik" className="mt-3 focus-visible:outline-none focus-visible:ring-0">
                  <DonutCharts transaksi={transaksi} sumberDana={sumberDana} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Mobile: content only (tabs via BottomNav) */}
            <div className="sm:hidden">
              {renderTabContent()}
            </div>
          </>
        )}
      </main>

      {/* Footer - hidden on mobile to avoid overlap with bottom nav */}
      <footer className="hidden sm:block border-t border-border py-4">
        <p className="text-center text-xs text-muted-foreground">
          &copy; {tahunHbh} Panitia Halal Bi Halal &mdash; Majelis Dzikir Tasbih Indonesia
        </p>
      </footer>

      {/* Mobile bottom navigation */}
      <BottomNav active={activeTab} onChange={setActiveTab} />

      {/* PWA Install Dialog */}
      <PWAInstallDialog
        open={showInstallDialog}
        onInstall={install}
        onDismiss={dismiss}
        canInstall={canInstall}
      />
    </div>
  );
};

export default Index;
