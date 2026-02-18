import { useAnggaranSeksi, useUpdateAnggaran, useSyncTargetDonasi } from "@/hooks/useAnggaranSeksi";
import { TransaksiRow } from "@/hooks/useTransaksi";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { ChevronDown, ChevronUp, ClipboardList, Search, Filter, X, FileText, Pencil, Check, RefreshCw } from "lucide-react";
import { useState } from "react";
import { printSeksiPdf } from "@/lib/exportUtils";
import { toast } from "sonner";

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
  const { data: settings } = useAppSettings();
  const { user } = useAuth();
  const updateAnggaran = useUpdateAnggaran();
  const syncTarget = useSyncTargetDonasi();

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

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

  const currentTarget = Number(settings?.target_donasi || 0);
  const isOutOfSync = totalAnggaran !== currentTarget;

  const handleStartEdit = (seksi: { id: string; anggaran: number }) => {
    setEditingId(seksi.id);
    setEditValue(String(seksi.anggaran));
  };

  const handleSaveEdit = async (id: string) => {
    const val = Number(editValue.replace(/\D/g, ""));
    if (isNaN(val) || val < 0) {
      toast.error("Nominal tidak valid");
      return;
    }
    try {
      await updateAnggaran.mutateAsync({ id, anggaran: val });
      toast.success("Anggaran berhasil diperbarui");
      setEditingId(null);
    } catch {
      toast.error("Gagal menyimpan anggaran");
    }
  };

  const handleSyncTarget = async () => {
    try {
      await syncTarget.mutateAsync(totalAnggaran);
      toast.success(`Target donasi disinkronkan: ${formatRupiah(totalAnggaran)}`);
    } catch {
      toast.error("Gagal menyinkronkan target donasi");
    }
  };

  // Filter logic
  const filteredSeksi = anggaranSeksi.filter((seksi) => {
    if (searchQuery && !seksi.nama_seksi.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
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
          <div className="flex items-center gap-1.5">
            {user && (
              <button
                onClick={() => {
                  const items = anggaranSeksi.map((seksi) => ({
                    nama_seksi: seksi.nama_seksi,
                    anggaran: seksi.anggaran,
                    realisasi: realisasiMap[seksi.nama_seksi] || 0,
                  }));
                  printSeksiPdf(items);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] sm:text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}
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
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-muted-foreground">
          <span>Total Anggaran: <strong className="text-foreground">{formatRupiah(totalAnggaran)}</strong></span>
          <span className="hidden sm:inline">·</span>
          <span>Realisasi: <strong className="text-foreground">{formatRupiah(totalRealisasi)}</strong></span>
        </div>

        {/* Sync target donasi indicator */}
        {user && isOutOfSync && (
          <div className="mt-2 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-2.5 py-1.5">
            <span className="text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-400 flex-1">
              Target Donasi (<strong>{formatRupiah(currentTarget)}</strong>) tidak sinkron dengan Total Anggaran (<strong>{formatRupiah(totalAnggaran)}</strong>)
            </span>
            <button
              onClick={handleSyncTarget}
              disabled={syncTarget.isPending}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${syncTarget.isPending ? "animate-spin" : ""}`} />
              Sinkronkan
            </button>
          </div>
        )}
      </div>

      {/* Filter Section */}
      {showFilters && (
        <div className="p-2.5 sm:p-3 border-b border-border bg-muted/30 space-y-2">
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
          const isEditing = editingId === seksi.id;

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
                  <div className="flex items-center gap-1">
                    {user && !isLainnya && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(seksi);
                        }}
                        className="inline-flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </span>
                    )}
                    {detailTransaksi.length > 0 && (
                      isCollapsed
                        ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                  </div>
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

              {/* Inline edit anggaran */}
              {isEditing && (
                <div className="border-t border-border bg-muted/30 px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Edit Anggaran</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ""))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(seksi.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1 h-7 px-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Nominal anggaran"
                    />
                    <button
                      onClick={() => handleSaveEdit(seksi.id)}
                      disabled={updateAnggaran.isPending}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {editValue && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatRupiah(Number(editValue) || 0)}
                    </p>
                  )}
                </div>
              )}

              {/* Detail items */}
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
              {detailTransaksi.length === 0 && !isEditing && (
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
