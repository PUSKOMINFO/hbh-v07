import { useAnggaranSeksi } from "@/hooks/useAnggaranSeksi";
import { TransaksiRow } from "@/hooks/useTransaksi";
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { useState } from "react";

interface AnggaranSeksiCardProps {
  transaksi: TransaksiRow[];
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const AnggaranSeksiCard = ({ transaksi }: AnggaranSeksiCardProps) => {
  const { data: anggaranSeksi = [], isLoading } = useAnggaranSeksi();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return null;

  // Calculate realisasi per seksi from transaksi keluar
  const realisasiMap: Record<string, number> = {};
  transaksi
    .filter((t) => t.jenis === "keluar")
    .forEach((t) => {
      realisasiMap[t.kategori] = (realisasiMap[t.kategori] || 0) + t.nominal;
    });

  const totalAnggaran = anggaranSeksi.reduce((s, a) => s + a.anggaran, 0);
  const totalRealisasi = Object.values(realisasiMap).reduce((s, v) => s + v, 0);

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "400ms" }}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4.5 w-4.5 text-primary" />
          <h2 className="text-base font-semibold">Ringkasan Anggaran per Seksi</h2>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span>Total Anggaran: <strong className="text-foreground">{formatRupiah(totalAnggaran)}</strong></span>
          <span>·</span>
          <span>Realisasi: <strong className="text-foreground">{formatRupiah(totalRealisasi)}</strong></span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {anggaranSeksi.map((seksi) => {
          const realisasi = realisasiMap[seksi.nama_seksi] || 0;
          const persen = seksi.anggaran > 0 ? Math.round((realisasi / seksi.anggaran) * 100) : 0;
          const isOver = realisasi > seksi.anggaran;
          const isExpanded = expandedId === seksi.id;

          // Get detail transactions for this seksi
          const detailTransaksi = transaksi.filter(
            (t) => t.jenis === "keluar" && t.kategori === seksi.nama_seksi
          );

          return (
            <div key={seksi.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : seksi.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{seksi.nama_seksi}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver
                            ? "bg-destructive"
                            : persen >= 75
                            ? "bg-[hsl(38,92%,50%)]"
                            : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(persen, 100)}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-semibold whitespace-nowrap ${isOver ? "text-destructive" : "text-muted-foreground"}`}>
                      {persen}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{formatRupiah(realisasi)}</span>
                    <span className="text-muted-foreground/50">/</span>
                    <span>{formatRupiah(seksi.anggaran)}</span>
                    {isOver && (
                      <span className="text-destructive font-semibold ml-1">
                        (+{formatRupiah(realisasi - seksi.anggaran)})
                      </span>
                    )}
                  </div>
                </div>
                {detailTransaksi.length > 0 && (
                  isExpanded
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Expanded detail */}
              {isExpanded && detailTransaksi.length > 0 && (
                <div className="bg-muted/30 border-t border-border px-4 py-2 space-y-1.5">
                  {detailTransaksi.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="text-foreground">{t.keterangan}</span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <span className="text-destructive font-medium whitespace-nowrap ml-2">
                        -{formatRupiah(t.nominal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnggaranSeksiCard;
