import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSumberDana } from "@/hooks/useSumberDana";
import { useAnggaranSeksi } from "@/hooks/useAnggaranSeksi";
import { X, Upload, FileImage, Trash2 } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  keterangan: z.string().trim().min(1, "Keterangan wajib diisi").max(300),
  jenis: z.enum(["masuk", "keluar"]),
  nominal: z.number().int().min(1, "Nominal harus > 0").max(999999999999),
  kategori: z.string().max(100).optional(),
  bukti_url: z.string().max(500).optional().or(z.literal("")),
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setSelectedFile(null);
      setFilePreview(editData?.bukti_url || null);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({ title: "Error", description: "Ukuran file maksimal 5MB", variant: "destructive" });
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Error", description: "Format file: JPG, PNG, WebP, atau PDF", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
      setBuktiTipe("image");
    } else {
      setFilePreview(null);
      setBuktiTipe("document");
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setBuktiUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const { error } = await supabase.storage.from("bukti").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast({ title: "Upload gagal", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("bukti").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const nominalValue = parseInt(parseRibuan(nominalDisplay)) || 0;

    // Upload file first if selected
    let finalBuktiUrl = buktiUrl;
    if (selectedFile) {
      setUploading(true);
      const url = await uploadFile(selectedFile);
      setUploading(false);
      if (!url) return;
      finalBuktiUrl = url;
    }

    const parsed = schema.safeParse({
      tanggal,
      keterangan,
      jenis,
      nominal: nominalValue,
      kategori: kategori || undefined,
      bukti_url: finalBuktiUrl || undefined,
      bukti_tipe: finalBuktiUrl ? buktiTipe : undefined,
      bukti_keterangan: finalBuktiUrl ? buktiKeterangan : undefined,
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
      bukti_url: finalBuktiUrl || null,
      bukti_tipe: finalBuktiUrl ? (parsed.data.bukti_tipe || "image") : null,
      bukti_keterangan: finalBuktiUrl ? (parsed.data.bukti_keterangan || null) : null,
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
                  {anggaranSeksi
                    .filter((s) => s.nama_seksi !== "Lainnya")
                    .map((s) => (
                      <option key={s.id} value={s.nama_seksi}>{s.nama_seksi}</option>
                    ))}
                  {anggaranSeksi.some((s) => s.nama_seksi === "Lainnya") && (
                    <option value="Lainnya">Lainnya</option>
                  )}
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
          
          {/* File preview or existing URL */}
          {(filePreview || selectedFile) && (
            <div className="relative inline-block">
              {filePreview && (
                <img src={filePreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover border border-border" />
              )}
              {selectedFile && !filePreview && (
                <div className="h-20 w-20 rounded-lg border border-border bg-muted flex flex-col items-center justify-center gap-1">
                  <FileImage className="h-6 w-6 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground truncate max-w-[72px]">{selectedFile.name}</span>
                </div>
              )}
              <button type="button" onClick={handleRemoveFile} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Existing bukti URL (from edit) without new file selected */}
          {!selectedFile && buktiUrl && !filePreview && (
            <div className="flex items-center gap-2">
              <a href={buktiUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline truncate max-w-[200px]">Lihat bukti sebelumnya</a>
              <button type="button" onClick={handleRemoveFile} className="text-destructive hover:text-destructive/80">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Upload button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-xs border border-dashed border-border rounded-lg hover:bg-muted transition-colors w-full justify-center"
            >
              <Upload className="h-4 w-4" />
              {selectedFile ? "Ganti File" : "Upload Bukti (JPG, PNG, WebP, PDF - maks 5MB)"}
            </button>
          </div>

          {(selectedFile || buktiUrl) && (
            <input value={buktiKeterangan} onChange={(e) => setBuktiKeterangan(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" maxLength={300} placeholder="Keterangan bukti" />
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs rounded-lg border border-border hover:bg-muted transition-colors">Batal</button>
          <button type="submit" disabled={loading || uploading} className="px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {uploading ? "Mengupload..." : loading ? "Menyimpan..." : editData ? "Simpan" : "Tambah"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransaksiForm;
