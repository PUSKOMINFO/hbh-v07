import { useState } from "react";
import { SumberDana, Transaksi } from "@/lib/data";
import { ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import ProofModal from "./ProofModal";

interface TransaksiListProps {
  data: Transaksi[];
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const TransaksiList = ({ data }: TransaksiListProps) => {
  const [selectedProof, setSelectedProof] = useState<{
    bukti?: any;
    keterangan: string;
  } | null>(null);
  const sorted = [...data].sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  );
  const totalMasuk = data
    .filter((t) => t.jenis === "masuk")
    .reduce((s, t) => s + t.nominal, 0);
  const totalKeluar = data
    .filter((t) => t.jenis === "keluar")
    .reduce((s, t) => s + t.nominal, 0);

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "320ms" }}>
      <div className="p-4 border-b border-border space-y-3">
        <h2 className="text-base font-semibold">Laporan Dana Masuk & Keluar</h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-success/10 p-3 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Dana Masuk</p>
            <p className="text-xs sm:text-sm font-bold text-success whitespace-nowrap">{formatRupiah(totalMasuk)}</p>
          </div>
          <div className="rounded-lg bg-destructive/10 p-3 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Dana Keluar</p>
            <p className="text-xs sm:text-sm font-bold text-destructive whitespace-nowrap">{formatRupiah(totalKeluar)}</p>
          </div>
          <div className={`rounded-lg p-3 text-center ${(totalMasuk - totalKeluar) >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">{(totalMasuk - totalKeluar) >= 0 ? 'Surplus' : 'Defisit'}</p>
            <p className={`text-xs sm:text-sm font-bold whitespace-nowrap ${(totalMasuk - totalKeluar) >= 0 ? 'text-success' : 'text-destructive'}`}>{formatRupiah(Math.abs(totalMasuk - totalKeluar))}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-border">
        {sorted.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
          >
            <div
              className={`rounded-full p-2 shrink-0 ${
                t.jenis === "masuk" ? "bg-success/10" : "bg-destructive/10"
              }`}
            >
              {t.jenis === "masuk" ? (
                <ArrowDownLeft className="h-4 w-4 text-success" />
              ) : (
                <ArrowUpRight className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{t.keterangan}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(t.tanggal).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {" · "}
                {t.kategori}
              </p>
            </div>
            {t.jenis === "keluar" && t.bukti && (
              <button
                onClick={() =>
                  setSelectedProof({ bukti: t.bukti, keterangan: t.keterangan })
                }
                className="shrink-0 p-2 hover:bg-primary/10 rounded-lg transition-colors group"
                title="Lihat bukti pengeluaran"
              >
                <FileText className="h-4 w-4 text-primary group-hover:text-primary/80" />
              </button>
            )}
            <p
              className={`text-sm font-semibold whitespace-nowrap ${
                t.jenis === "masuk" ? "text-success" : "text-destructive"
              }`}
            >
              {t.jenis === "masuk" ? "+" : "-"}
              {formatRupiah(t.nominal)}
            </p>
          </div>
        ))}
      </div>

      <ProofModal
        isOpen={!!selectedProof}
        onClose={() => setSelectedProof(null)}
        bukti={selectedProof?.bukti}
        transaksiKeterangan={selectedProof?.keterangan || ""}
      />
    </div>
  );
};

export default TransaksiList;
