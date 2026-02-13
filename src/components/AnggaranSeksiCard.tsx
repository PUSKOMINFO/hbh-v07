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
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-primary shrink-0" />
            <h2 className="text-sm sm:text-base font-semibold">Ringkasan Anggaran per Seksi</h2>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-muted-foreground">
            <span>Total Anggaran: <strong className="text-foreground">{formatRupiah(totalAnggaran)}</strong></span>
            <span className="hidden sm:inline">·</span>
            <span>Realisasi: <strong className="text-foreground">{formatRupiah(totalRealisasi)}</strong></span>
          </div>
        </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-border">
          {anggaranSeksi.map((seksi) => {
            const realisasi = realisasiMap[seksi.nama_seksi] || 0;
            const persen = seksi.anggaran > 0 ? Math.round((realisasi / seksi.anggaran) * 100) : 0;
            const isOver = realisasi > seksi.anggaran;
            const isCollapsed = collapsedIds.has(seksi.id);

            // Get detail transactions for this seksi
            const detailTransaksi = transaksi.filter(
              (t) => t.jenis === "keluar" && t.kategori === seksi.nama_seksi
            );

            return (
              <div key={seksi.id} className="bg-card flex flex-col">
                <button
                  onClick={() => toggleCollapse(seksi.id)}
                  className="w-full flex flex-col gap-1.5 p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between w-full">
                    <p className="text-xs font-medium truncate">{seksi.nama_seksi}</p>
                    {detailTransaksi.length > 0 && (
                      isCollapsed
                        ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  <div className="w-full flex items-center gap-1.5">
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
                    <span className={`text-[10px] font-semibold whitespace-nowrap ${isOver ? "text-destructive" : "text-muted-foreground"}`}>
                      {persen}%
                    </span>
                  </div>
                  <div className="flex flex-col text-[10px] text-muted-foreground leading-tight">
                    <span>{formatRupiah(realisasi)}</span>
                    <span className="text-muted-foreground/60">/ {formatRupiah(seksi.anggaran)}</span>
                    {isOver && (
                      <span className="text-destructive font-semibold">
                        +{formatRupiah(realisasi - seksi.anggaran)}
                      </span>
                    )}
                  </div>
                </button>

                {/* Detail items - shown by default, collapsible */}
                {!isCollapsed && detailTransaksi.length > 0 && (
                  <div className="bg-muted/30 border-t border-border px-3 py-2 space-y-1.5 flex-1">
                    {detailTransaksi.map((t) => (
                      <div key={t.id} className="text-[10px]">
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-foreground leading-tight">{t.keterangan}</span>
                          <span className="text-destructive font-medium whitespace-nowrap">
                            -{formatRupiah(t.nominal)}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {detailTransaksi.length === 0 && (
                  <div className="bg-muted/20 border-t border-border px-3 py-2 flex-1 flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground/50 italic">Belum ada transaksi</span>
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
