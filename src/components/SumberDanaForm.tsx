import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  nama_cabang: z.string().trim().min(1, "Sumber donasi wajib diisi").max(200),
  skg: z.number().int().min(0).max(99999),
});

interface SumberDanaFormProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: { id: string; nama_cabang: string; skg: number } | null;
}

const SumberDanaForm = ({ isOpen, onClose, editData }: SumberDanaFormProps) => {
  const [namaCabang, setNamaCabang] = useState(editData?.nama_cabang || "");
  const [skg, setSkg] = useState(editData?.skg?.toString() || "0");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setNamaCabang(editData?.nama_cabang || "");
      setSkg(editData?.skg?.toString() || "0");
      setErrors({});
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = schema.safeParse({
      nama_cabang: namaCabang,
      skg: parseInt(skg) || 0,
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
    <div className="border-t border-border bg-muted/30 animate-fade-in">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold">{editData ? "Edit Sumber Donasi" : "Tambah Sumber Donasi"}</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Sumber Donasi *</label>
            <input value={namaCabang} onChange={(e) => setNamaCabang(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" maxLength={200} required />
            {errors.nama_cabang && <p className="text-xs text-destructive">{errors.nama_cabang}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">SKG</label>
            <input type="number" value={skg} onChange={(e) => setSkg(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" min={0} />
            {errors.skg && <p className="text-xs text-destructive">{errors.skg}</p>}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs rounded-lg border border-border hover:bg-muted transition-colors">Batal</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Menyimpan..." : editData ? "Simpan" : "Tambah"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SumberDanaForm;
