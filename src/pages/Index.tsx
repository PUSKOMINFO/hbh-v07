import { useRef, useState } from "react";
import SummaryCards from "@/components/SummaryCards";
import SumberDanaTable from "@/components/SumberDanaTable";
import TransaksiList from "@/components/TransaksiList";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useSumberDana } from "@/hooks/useSumberDana";
import { useTransaksi } from "@/hooks/useTransaksi";
import { useAppSettings } from "@/hooks/useAppSettings";
import { BookOpen, LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: sumberDana = [], isLoading: sdLoading } = useSumberDana();
  const { data: transaksi = [], isLoading: trLoading } = useTransaksi();
  const { data: settings, isLoading: settingsLoading } = useAppSettings();
  const navigate = useNavigate();

  const targetDonasi = Number(settings?.target_donasi || 101050000);
  const tahunHbh = settings?.tahun_hbh || "2026";

  const realisasi = sumberDana.reduce((s, d) => s + d.nominal, 0);
  const [activeSection, setActiveSection] = useState("rekap");

  const rekapRef = useRef<HTMLDivElement>(null);
  const donasiRef = useRef<HTMLDivElement>(null);
  const transaksiRef = useRef<HTMLDivElement>(null);

  const handleNav = (section: string) => {
    setActiveSection(section);
    const ref = section === "rekap" ? rekapRef : section === "donasi" ? donasiRef : transaksiRef;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="container max-w-3xl py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-foreground/15 p-2">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold leading-tight">Halal Bi Halal {tahunHbh}</h1>
              <p className="text-xs opacity-80">Majelis Dzikir Tasbih Indonesia</p>
            </div>
            {!authLoading && (
              user ? (
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 text-xs bg-primary-foreground/15 hover:bg-primary-foreground/25 rounded-lg px-3 py-2 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Keluar
                </button>
              ) : (
                <button
                  onClick={() => navigate("/auth")}
                  className="flex items-center gap-1.5 text-xs bg-primary-foreground/15 hover:bg-primary-foreground/25 rounded-lg px-3 py-2 transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl py-4 space-y-4 pb-24 sm:pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div ref={rekapRef} className="scroll-mt-4">
              <SummaryCards targetDonasi={targetDonasi} realisasi={realisasi} />
            </div>
            <div ref={donasiRef} className="scroll-mt-4">
              <SumberDanaTable data={mappedSumberDana} />
            </div>
            <div ref={transaksiRef} className="scroll-mt-4">
              <TransaksiList data={mappedTransaksi} />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 hidden sm:block">
        <p className="text-center text-xs text-muted-foreground">
          © {tahunHbh} Panitia Halal Bi Halal — Majelis Dzikir Tasbih Indonesia
        </p>
      </footer>

      {/* Mobile Bottom Nav */}
      <BottomNav active={activeSection} onChange={handleNav} />
    </div>
  );
};

export default Index;
