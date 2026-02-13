import { useAnggaranSeksi } from "@/hooks/useAnggaranSeksi";
import { TransaksiRow } from "@/hooks/useTransaksi";
import { ChevronDown, ChevronUp, ClipboardList, Search, Filter, X } from "lucide-react";
import { useState } from "react";

interface AnggaranSeksiCardProps {
  transaksi: TransaksiRow[];
}

type StatusFilter = "semua" | "aman" | "peringatan" | "over";

const STATUS_OPTIONS: { value: StatusFilter; label: string; color: string; activeColor: string }[] = [
  { value: "semua", label: "Semua", color: "text-muted-foreground border-border", activeColor: "bg-primary text-primary-foreground border-primary" },
  { value: "aman", label: "< 75%", color: "text-muted-foreground border-border", activeColor: "bg-primary text-primary-foreground border-primary" },
  { value: "peringatan", label: "75–100%", color: "text-muted-foreground border-border", activeColor: "bg-[hsl(38,92%,50%)] text-white border-[hsl(38,92%,50%)]" },
  { value: "over", label: "Over", color: "text-muted-foreground border-border", activeColor: "bg-destructive text-destructive-foreground border-destructive" },
];

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const AnggaranSeksiCard = ({ transaksi }: AnggaranSeksiCardProps) => {
  const { data: anggaranSeksi = [], isLoading } = useAnggaranSeksi();
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [showFilters, setShowFilters] = useState(false);

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
    const totalRealisasi = transaksi
      .filter((t) => t.jenis === "keluar")
      .reduce((s, t) => s + t.nominal, 0);

  // Filter logic
  const filteredSeksi = anggaranSeksi.filter((seksi) => {
    // Search filter
    if (searchQuery && !seksi.nama_seksi.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Status filter
    if (statusFilter !== "semua") {
      const realisasi = realisasiMap[seksi.nama_seksi] || 0;
      const isLainnya = seksi.nama_seksi === "Lainnya" && seksi.anggaran === 0;
      const persen = seksi.anggaran > 0 ? Math.round((realisasi / seksi.anggaran) * 100) : (realisasi > 0 ? 100 : 0);
      const isOver = !isLainnya && realisasi > seksi.anggaran;
      if (statusFilter === "aman" && (persen >= 75 || isOver)) return false;
      if (statusFilter === "peringatan" && (persen < 75 || isOver)) return false;
      if (statusFilter === "over" && !isOver) return false;
    }
    return true;
  });

  const hasActiveFilter = searchQuery !== "" || statusFilter !== "semua";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("semua");
  };

    return (
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-primary shrink-0" />
              <h2 className="text-sm sm:text-base font-semibold">Ringkasan Anggaran per Seksi</h2>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-1 px-2 py-1 rounded-md text-[11px] sm:text-xs font-medium transition-colors ${
                showFilters || hasActiveFilter
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Filter</span>
              {hasActiveFilter && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-muted-foreground">
            <span>Total Anggaran: <strong className="text-foreground">{formatRupiah(totalAnggaran)}</strong></span>
            <span className="hidden sm:inline">·</span>
            <span>Realisasi: <strong className="text-foreground">{formatRupiah(totalRealisasi)}</strong></span>
          </div>
        </div>

        {/* Filter Section */}
        {showFilters && (
          <div className="p-2.5 sm:p-3 border-b border-border bg-muted/30 space-y-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama seksi..."
                className="w-full h-8 pl-8 pr-8 rounded-md border border-border bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] sm:text-[11px] text-muted-foreground mr-0.5">Status:</span>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-2 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-medium transition-colors ${
                    statusFilter === opt.value ? opt.activeColor : opt.color + " hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Active filter summary */}
            {hasActiveFilter && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                  Menampilkan {filteredSeksi.length} dari {anggaranSeksi.length} seksi
                </span>
                <button
                  onClick={clearFilters}
                  className="text-[10px] sm:text-[11px] text-primary hover:underline font-medium"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-border">
          {filteredSeksi.length === 0 && (
            <div className="col-span-full bg-card p-6 flex flex-col items-center justify-center gap-1 text-center">
              <Search className="h-5 w-5 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">Tidak ada seksi yang sesuai filter</p>
              <button onClick={clearFilters} className="text-[11px] text-primary hover:underline font-medium mt-1">
                Reset Filter
              </button>
            </div>
          )}
            {filteredSeksi.map((seksi) => {
              const realisasi = realisasiMap[seksi.nama_seksi] || 0;
              const isLainnya = seksi.nama_seksi === "Lainnya" && seksi.anggaran === 0;
              const persen = seksi.anggaran > 0 ? Math.round((realisasi / seksi.anggaran) * 100) : (realisasi > 0 ? 100 : 0);
              const isOver = !isLainnya && realisasi > seksi.anggaran;
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
                    {isLainnya ? (
                      <div className="flex flex-col text-[10px] text-muted-foreground leading-tight">
                        <span>Total: <strong className="text-foreground">{formatRupiah(realisasi)}</strong></span>
                        <span className="text-muted-foreground/60 italic">Tanpa batas anggaran</span>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
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
