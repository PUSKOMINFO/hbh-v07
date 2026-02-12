import { useState } from "react";
import { SumberDana } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const totalSKG = data.reduce((s, d) => s + d.skg, 0);
  const totalNominal = data.reduce((s, d) => s + d.nominal, 0);

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
    setEditItem({ id: d.id, nama_cabang: d.namaCabang, sumber_lain: d.sumberLain, skg: d.skg, nominal: d.nominal });
    setFormOpen(true);
  };

  return (
    <>
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "240ms" }}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Sumber Dana Donasi</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Kontribusi per cabang</p>
          </div>
          {user && (
            <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Tambah
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="py-2.5 px-3 text-left font-medium w-10">No</th>
                <th className="py-2.5 px-3 text-left font-medium">Nama Cabang</th>
                <th className="py-2.5 px-3 text-center font-medium w-16">SKG</th>
                <th className="py-2.5 px-3 text-right font-medium">Nominal</th>
                {user && <th className="py-2.5 px-3 text-center font-medium w-20">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-2.5 px-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-2.5 px-3 font-medium text-foreground">{d.namaCabang}</td>
                  <td className="py-2.5 px-3 text-center">{d.skg || '-'}</td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">{formatRupiah(d.nominal)}</td>
                  {user && (
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-primary/10 rounded-md transition-colors" title="Edit">
                          <Pencil className="h-3.5 w-3.5 text-primary" />
                        </button>
                        <button onClick={() => setDeleteId(d.id)} className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors" title="Hapus">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </div>
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

      <SumberDanaForm isOpen={formOpen} onClose={() => { setFormOpen(false); setEditItem(null); }} editData={editItem} />

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setDeleteId(null)}>
          <div className="bg-card rounded-lg border border-border shadow-xl p-6 max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold">Hapus Data?</h3>
            <p className="text-sm text-muted-foreground">Data yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">Batal</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SumberDanaTable;
