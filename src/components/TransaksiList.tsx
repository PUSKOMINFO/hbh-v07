import { useState } from "react";
import { Transaksi } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownLeft, ArrowUpRight, FileText, Wallet, Plus, Pencil, Trash2, X, Image, ChevronLeft, ChevronRight } from "lucide-react";
import TransaksiForm from "./TransaksiForm";

interface TransaksiListProps {
  data: Transaksi[];
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const TransaksiList = ({ data }: TransaksiListProps) => {
  const { user } = useAuth();
  const [selectedProof, setSelectedProof] = useState<{ bukti?: any; keterangan: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const sorted = [...data].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  const totalMasuk = data.filter((t) => t.jenis === "masuk").reduce((s, t) => s + t.nominal, 0);
  const totalKeluar = data.filter((t) => t.jenis === "keluar").reduce((s, t) => s + t.nominal, 0);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = sorted.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transaksi").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Transaksi dihapus" });
      queryClient.invalidateQueries({ queryKey: ["transaksi"] });
    }
    setDeleteId(null);
  };

  const openEdit = (t: Transaksi) => {
    setEditItem({
      id: t.id,
      tanggal: t.tanggal,
      keterangan: t.keterangan,
      jenis: t.jenis,
      nominal: t.nominal,
      kategori: t.kategori,
      bukti_url: t.bukti?.url || null,
      bukti_tipe: t.bukti?.tipe || null,
      bukti_keterangan: t.bukti?.keterangan || null,
    });
    setFormOpen(true);
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "320ms" }}>
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Laporan Dana Masuk & Keluar</h2>
          {user && (
            <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Tambah
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-xl bg-gradient-to-br from-[hsl(152,60%,45%)] to-[hsl(152,65%,30%)] p-4 shadow-md flex items-center gap-3">
            <div className="rounded-lg p-2.5 bg-white/20 backdrop-blur-sm"><ArrowDownLeft className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">Dana Masuk</p>
              <p className="text-lg sm:text-sm font-bold text-white whitespace-nowrap">{formatRupiah(totalMasuk)}</p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-destructive/90 to-destructive p-4 shadow-md flex items-center gap-3">
            <div className="rounded-lg p-2.5 bg-white/20 backdrop-blur-sm"><ArrowUpRight className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">Dana Keluar</p>
              <p className="text-lg sm:text-sm font-bold text-white whitespace-nowrap">{formatRupiah(totalKeluar)}</p>
            </div>
          </div>
          <div className={`rounded-xl p-4 shadow-md flex items-center gap-3 ${(totalMasuk - totalKeluar) > 0 ? 'bg-gradient-to-br from-[hsl(210,75%,55%)] to-[hsl(210,70%,40%)]' : (totalMasuk - totalKeluar) < 0 ? 'bg-gradient-to-br from-[hsl(0,72%,55%)] to-[hsl(0,72%,42%)]' : 'bg-gradient-to-br from-[hsl(220,15%,50%)] to-[hsl(220,15%,38%)]'}`}>
            <div className="rounded-lg p-2.5 bg-white/20 backdrop-blur-sm"><Wallet className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">Status Saldo</p>
              <p className="text-lg sm:text-sm font-bold text-white whitespace-nowrap">{formatRupiah(totalMasuk - totalKeluar)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Form */}
      <TransaksiForm isOpen={formOpen} onClose={() => { setFormOpen(false); setEditItem(null); }} editData={editItem} />

    {/* Modal Proof Viewer */}
        {selectedProof && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProof(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
            <div
              className="relative z-10 w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold">Bukti Transaksi</h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{selectedProof.keterangan}</p>
                </div>
                <button
                  onClick={() => setSelectedProof(null)}
                  className="p-2 hover:bg-muted rounded-xl transition-colors shrink-0 ml-3"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* Content */}
              <div className="p-4">
                {selectedProof.bukti ? (
                  <div className="space-y-3">
                    {selectedProof.bukti.tipe === "image" ? (
                      <img
                        src={selectedProof.bukti.url}
                        alt="Bukti transaksi"
                        className="w-full max-h-[60vh] object-contain rounded-xl border border-border bg-muted/30"
                      />
                    ) : (
                      <a
                        href={selectedProof.bukti.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center bg-muted rounded-xl p-8 border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="text-center">
                          <FileText className="h-12 w-12 text-primary mx-auto mb-2" />
                          <p className="text-sm font-medium">Buka Dokumen</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{selectedProof.bukti.url.split("/").pop()}</p>
                        </div>
                      </a>
                    )}
                    {selectedProof.bukti.keterangan && (
                      <div className="bg-muted rounded-xl p-3">
                        <p className="text-[11px] font-medium text-muted-foreground mb-0.5">Keterangan</p>
                        <p className="text-sm">{selectedProof.bukti.keterangan}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Image className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">Tidak ada bukti transaksi</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-border">
          {paginatedData.map((t, idx) => {
            const rowNum = (safeCurrentPage - 1) * pageSize + idx + 1;
            return (
              <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                <div className={`rounded-full h-8 w-8 flex items-center justify-center shrink-0 text-xs font-bold ${t.jenis === "masuk" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {rowNum}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.keterangan}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}{t.kategori}
                  </p>
                </div>
                {/* Bukti Thumbnail */}
                <div className="shrink-0">
                  {t.bukti ? (
                    <button
                      onClick={() => setSelectedProof({ bukti: t.bukti, keterangan: t.keterangan })}
                      className="block rounded-lg overflow-hidden border border-border hover:border-primary/50 hover:shadow-md transition-all"
                      title="Lihat bukti"
                    >
                      {t.bukti.tipe === "image" ? (
                        <img
                          src={t.bukti.url}
                          alt="Bukti"
                          className="h-10 w-10 object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 flex items-center justify-center bg-muted">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </button>
                  ) : (
                    <div className="h-10 w-10 rounded-lg border border-dashed border-border flex items-center justify-center">
                      <Image className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                {user && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-primary/10 rounded-md transition-colors" title="Edit">
                      <Pencil className="h-3.5 w-3.5 text-primary" />
                    </button>
                    {deleteId === t.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(t.id)} className="px-2 py-1 text-[11px] rounded bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">Hapus</button>
                        <button onClick={() => setDeleteId(null)} className="px-2 py-1 text-[11px] rounded border border-border hover:bg-muted transition-colors">Batal</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteId(t.id)} className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors" title="Hapus">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    )}
                  </div>
                )}
                <p className={`text-sm font-semibold whitespace-nowrap ${t.jenis === "masuk" ? "text-success" : "text-destructive"}`}>
                  {t.jenis === "masuk" ? "+" : "-"}{formatRupiah(t.nominal)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs border border-border rounded-md px-2 py-1 bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {(safeCurrentPage - 1) * pageSize + 1}-{Math.min(safeCurrentPage * pageSize, sorted.length)} dari {sorted.length}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
    </div>
  );
};

export default TransaksiList;
