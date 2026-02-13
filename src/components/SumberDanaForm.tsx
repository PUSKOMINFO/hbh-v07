import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  nama_cabang: z.string().trim().min(1, "Sumber donasi wajib diisi").max(200),
  skg: z.number().int().min(0).max(99999),
  nominal: z.number().int().min(0).max(999999999999),
});

interface SumberDanaFormProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: { id: string; nama_cabang: string; skg: number; nominal: number } | null;
}

const SumberDanaForm = ({ isOpen, onClose, editData }: SumberDanaFormProps) => {
  const [namaCabang, setNamaCabang] = useState(editData?.nama_cabang || "");
  const [skg, setSkg] = useState(editData?.skg?.toString() || "0");
  const [nominal, setNominal] = useState(editData?.nominal?.toString() || "0");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = schema.safeParse({
      nama_cabang: namaCabang,
      skg: parseInt(skg) || 0,
      nominal: parseInt(nominal) || 0,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const payload = {
      nama_cabang: parsed.data.nama_cabang,
      skg: parsed.data.skg,
      nominal: parsed.data.nominal,
    };

    const { error } = editData
      ? await supabase.from("sumber_dana").update(payload).eq("id", editData.id)
      : await supabase.from("sumber_dana").insert([payload]);

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: editData ? "Data diperbarui" : "Data ditambahkan" });
      queryClient.invalidateQueries({ queryKey: ["sumber_dana"] });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-lg border border-border shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">{editData ? "Edit Sumber Donasi" : "Tambah Sumber Donasi"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Sumber Donasi *</label>
            <input value={namaCabang} onChange={(e) => setNamaCabang(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" maxLength={200} required />
            {errors.nama_cabang && <p className="text-xs text-destructive">{errors.nama_cabang}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">SKG</label>
              <input type="number" value={skg} onChange={(e) => setSkg(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" min={0} />
              {errors.skg && <p className="text-xs text-destructive">{errors.skg}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Nominal (Rp)</label>
              <input type="number" value={nominal} onChange={(e) => setNominal(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" min={0} />
              {errors.nominal && <p className="text-xs text-destructive">{errors.nominal}</p>}
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Menyimpan..." : editData ? "Simpan Perubahan" : "Tambah"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SumberDanaForm;
