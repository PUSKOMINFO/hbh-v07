import { useState, useMemo } from "react";
import { SumberDana } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, DatabaseBackup } from "lucide-react";
import { seedDataSumberDana } from "@/lib/seedSumberDana";
import SumberDanaForm from "./SumberDanaForm";

interface SumberDanaTableProps {
  data: SumberDana[];
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const SumberDanaTable = ({ data }: SumberDanaTableProps) => {
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);
  const [seeding, setSeeding] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await supabase.from("sumber_dana").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error } = await supabase.from("sumber_dana").insert(seedDataSumberDana);
      if (error) throw error;
      toast({ title: "Berhasil", description: "Data donasi berhasil di-seed" });
      queryClient.invalidateQueries({ queryKey: ["sumber_dana"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const filtered = useMemo(() => {
    let result = data.filter((d) => {
      const q = search.toLowerCase();
      return d.namaCabang.toLowerCase().includes(q);
    });
    if (sortDir) {
      result = [...result].sort((a, b) =>
        sortDir === "asc" ? a.nominal - b.nominal : b.nominal - a.nominal
      );
    }
    return result;
  }, [data, search, sortDir]);

  const totalSKG = filtered.reduce((s, d) => s + d.skg, 0);
  const totalNominal = filtered.reduce((s, d) => s + d.nominal, 0);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("sumber_dana").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Data dihapus" });
      queryClient.invalidateQueries({ queryKey: ["sumber_dana"] });
    }
    setDeleteId(null);
  };

  const openEdit = (d: SumberDana) => {
    setEditItem({ id: d.id, nama_cabang: d.namaCabang, skg: d.skg });
    setFormOpen(true);
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "240ms" }}>
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Sumber Dana Donasi</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Kontribusi per sumber donasi</p>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <button onClick={handleSeed} disabled={seeding} className="flex items-center gap-1.5 text-xs bg-accent text-accent-foreground rounded-lg px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                <DatabaseBackup className="h-3.5 w-3.5" /> {seeding ? "Seeding..." : "Seed Data"}
              </button>
              <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:opacity-90 transition-opacity">
                <Plus className="h-3.5 w-3.5" /> Tambah
              </button>
            </div>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari sumber donasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Inline Form */}
      <SumberDanaForm isOpen={formOpen} onClose={() => { setFormOpen(false); setEditItem(null); }} editData={editItem} />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="py-2.5 px-3 text-left font-medium w-10">No</th>
              <th className="py-2.5 px-3 text-left font-medium">Sumber Donasi</th>
              <th className="py-2.5 px-3 text-center font-medium w-16">SKG</th>
              <th className="py-2.5 px-3 text-right font-medium">
                <button
                  onClick={() => setSortDir((prev) => prev === null ? "asc" : prev === "asc" ? "desc" : null)}
                  className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  Nominal
                  {sortDir === null && <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />}
                  {sortDir === "asc" && <ArrowUp className="h-3.5 w-3.5" />}
                  {sortDir === "desc" && <ArrowDown className="h-3.5 w-3.5" />}
                </button>
              </th>
              {user && <th className="py-2.5 px-3 text-center font-medium w-20">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <td className="py-2.5 px-3 text-muted-foreground">{i + 1}</td>
                <td className="py-2.5 px-3 font-medium text-foreground">{d.namaCabang}</td>
                <td className="py-2.5 px-3 text-center">{d.skg || '-'}</td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap">{formatRupiah(d.nominal)}</td>
                {user && (
                  <td className="py-2.5 px-3 text-center">
                    {deleteId === d.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleDelete(d.id)} className="px-2 py-1 text-[11px] rounded bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">Hapus</button>
                        <button onClick={() => setDeleteId(null)} className="px-2 py-1 text-[11px] rounded border border-border hover:bg-muted transition-colors">Batal</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-primary/10 rounded-md transition-colors" title="Edit">
                          <Pencil className="h-3.5 w-3.5 text-primary" />
                        </button>
                        <button onClick={() => setDeleteId(d.id)} className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors" title="Hapus">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-primary/5 font-semibold">
              <td className="py-2.5 px-3" colSpan={2}>Total</td>
              <td className="py-2.5 px-3 text-center">{totalSKG}</td>
              <td className="py-2.5 px-3 text-right whitespace-nowrap">{formatRupiah(totalNominal)}</td>
              {user && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default SumberDanaTable;
