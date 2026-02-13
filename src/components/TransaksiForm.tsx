import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSumberDana } from "@/hooks/useSumberDana";
import { useAnggaranSeksi } from "@/hooks/useAnggaranSeksi";
import { X } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  keterangan: z.string().trim().min(1, "Keterangan wajib diisi").max(300),
  jenis: z.enum(["masuk", "keluar"]),
  nominal: z.number().int().min(1, "Nominal harus > 0").max(999999999999),
  kategori: z.string().max(100).optional(),
  bukti_url: z.string().url("URL tidak valid").max(500).optional().or(z.literal("")),
  bukti_tipe: z.string().max(50).optional(),
  bukti_keterangan: z.string().max(300).optional(),
});

interface TransaksiFormProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: {
    id: string;
    tanggal: string;
    keterangan: string;
    jenis: string;
    nominal: number;
    kategori: string;
    bukti_url?: string | null;
    bukti_tipe?: string | null;
    bukti_keterangan?: string | null;
  } | null;
}

const formatRibuan = (value: string) => {
  const num = value.replace(/\D/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseRibuan = (value: string) => {
  return value.replace(/\./g, "");
};

const TransaksiForm = ({ isOpen, onClose, editData }: TransaksiFormProps) => {
  const [tanggal, setTanggal] = useState(editData?.tanggal || new Date().toISOString().split("T")[0]);
  const [keterangan, setKeterangan] = useState(editData?.keterangan || "");
  const [jenis, setJenis] = useState<"masuk" | "keluar">((editData?.jenis as "masuk" | "keluar") || "masuk");
  const [nominalDisplay, setNominalDisplay] = useState(editData?.nominal ? formatRibuan(editData.nominal.toString()) : "");
  const [kategori, setKategori] = useState(editData?.kategori || "");
  const [buktiUrl, setBuktiUrl] = useState(editData?.bukti_url || "");
  const [buktiTipe, setBuktiTipe] = useState(editData?.bukti_tipe || "image");
  const [buktiKeterangan, setBuktiKeterangan] = useState(editData?.bukti_keterangan || "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: sumberDana = [] } = useSumberDana();
  const { data: anggaranSeksi = [] } = useAnggaranSeksi();
  const [selectedSeksi, setSelectedSeksi] = useState(editData?.kategori || "");

  useEffect(() => {
    if (isOpen) {
      setTanggal(editData?.tanggal || new Date().toISOString().split("T")[0]);
      setKeterangan(editData?.keterangan || "");
      setJenis((editData?.jenis as "masuk" | "keluar") || "masuk");
      setNominalDisplay(editData?.nominal ? formatRibuan(editData.nominal.toString()) : "");
      setKategori(editData?.kategori || "");
      setBuktiUrl(editData?.bukti_url || "");
      setBuktiTipe(editData?.bukti_tipe || "image");
      setBuktiKeterangan(editData?.bukti_keterangan || "");
      setSelectedSeksi(editData?.kategori || "");
      setErrors({});
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const sumberDonasiOptions = sumberDana
    .map((s) => s.nama_cabang)
    .filter((name) => name.trim() !== "")
    .sort();

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseRibuan(e.target.value);
    if (/^\d*$/.test(raw)) {
      setNominalDisplay(raw ? formatRibuan(raw) : "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const nominalValue = parseInt(parseRibuan(nominalDisplay)) || 0;

    const parsed = schema.safeParse({
      tanggal,
      keterangan,
      jenis,
      nominal: nominalValue,
      kategori: kategori || undefined,
      bukti_url: buktiUrl || undefined,
      bukti_tipe: buktiUrl ? buktiTipe : undefined,
      bukti_keterangan: buktiUrl ? buktiKeterangan : undefined,
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
      tanggal: parsed.data.tanggal,
      keterangan: parsed.data.keterangan,
      jenis: parsed.data.jenis,
      nominal: parsed.data.nominal,
      kategori: parsed.data.kategori || "",
      bukti_url: parsed.data.bukti_url || null,
      bukti_tipe: parsed.data.bukti_url ? (parsed.data.bukti_tipe || "image") : null,
      bukti_keterangan: parsed.data.bukti_url ? (parsed.data.bukti_keterangan || null) : null,
    };

    const { error } = editData
      ? await supabase.from("transaksi").update(payload).eq("id", editData.id)
      : await supabase.from("transaksi").insert(payload);

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: editData ? "Transaksi diperbarui" : "Transaksi ditambahkan" });
      queryClient.invalidateQueries({ queryKey: ["transaksi"] });
      queryClient.invalidateQueries({ queryKey: ["sumber_dana"] });
      onClose();
    }
  };

  return (
    <div className="border-t border-border bg-muted/30 animate-fade-in">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold">{editData ? "Edit Transaksi" : "Tambah Transaksi"}</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Tanggal */}
          <div className="space-y-1">
            <label className="text-xs font-medium">Tanggal *</label>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required />
            {errors.tanggal && <p className="text-xs text-destructive">{errors.tanggal}</p>}
          </div>

          {/* Jenis */}
          <div className="space-y-1">
            <label className="text-xs font-medium">Jenis *</label>
            <select value={jenis} onChange={(e) => setJenis(e.target.value as "masuk" | "keluar")} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="masuk">Dana Masuk</option>
              <option value="keluar">Dana Keluar</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Sumber Donasi / Kategori */}
          <div className="space-y-1">
            <label className="text-xs font-medium">{jenis === "masuk" ? "Sumber Donasi *" : "Seksi *"}</label>
            {jenis === "masuk" ? (
              <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required>
                <option value="">-- Pilih Sumber Donasi --</option>
                {sumberDonasiOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            ) : (
              <select value={selectedSeksi} onChange={(e) => { setSelectedSeksi(e.target.value); setKategori(e.target.value); setKeterangan(""); }} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required>
                <option value="">-- Pilih Seksi --</option>
                {anggaranSeksi.map((s) => (
                  <option key={s.id} value={s.nama_seksi}>{s.nama_seksi}</option>
                ))}
              </select>
            )}
          </div>

          {/* Nominal */}
          <div className="space-y-1">
            <label className="text-xs font-medium">Nominal (Rp) *</label>
            <input type="text" inputMode="numeric" value={nominalDisplay} onChange={handleNominalChange} placeholder="0" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required />
            {errors.nominal && <p className="text-xs text-destructive">{errors.nominal}</p>}
          </div>
        </div>

        {/* Item Pengeluaran for Dana Keluar */}
        {jenis === "keluar" && selectedSeksi && (() => {
          const seksi = anggaranSeksi.find((s) => s.nama_seksi === selectedSeksi);
          if (!seksi || seksi.items.length === 0) return null;
          return (
            <div className="space-y-1">
              <label className="text-xs font-medium">Item Pengeluaran</label>
              <select value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">-- Pilih Item atau tulis manual --</option>
                {seksi.items.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          );
        })()}

        {/* Keterangan */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Keterangan *</label>
          <input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" maxLength={300} required />
          {errors.keterangan && <p className="text-xs text-destructive">{errors.keterangan}</p>}
        </div>

        {/* Bukti Transfer (optional) */}
        <div className="space-y-2 border-t border-border pt-2">
          <p className="text-xs font-medium text-muted-foreground">Bukti Transfer (opsional)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1 sm:col-span-2">
              <input value={buktiUrl} onChange={(e) => setBuktiUrl(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" maxLength={500} placeholder="URL Bukti (https://...)" />
              {errors.bukti_url && <p className="text-xs text-destructive">{errors.bukti_url}</p>}
            </div>
            {buktiUrl && (
              <>
                <div className="space-y-1">
                  <select value={buktiTipe} onChange={(e) => setBuktiTipe(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="image">Gambar</option>
                    <option value="document">Dokumen</option>
                  </select>
                </div>
              </>
            )}
          </div>
          {buktiUrl && (
            <input value={buktiKeterangan} onChange={(e) => setBuktiKeterangan(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" maxLength={300} placeholder="Keterangan bukti" />
          )}
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

export default TransaksiForm;
