import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Upload, CheckCircle2, Copy, Check, ArrowLeft } from "lucide-react";
import { compressImage } from "@/lib/imageCompress";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

function generateTrackingCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function formatRibuan(val: string) {
  const num = val.replace(/\D/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

interface SumberOption {
  nama_cabang: string;
  label: string;
}

const DonasiPublik = () => {
  const { toast } = useToast();
  const [copiedRek, setCopiedRek] = useState(false);
  const navigate = useNavigate();
  const [sumberList, setSumberList] = useState<SumberOption[]>([]);
  const [sumberDonasi, setSumberDonasi] = useState("");
  const [namaDonatur, setNamaDonatur] = useState("");
  const [noWa, setNoWa] = useState("");
  const [nominal, setNominal] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("sumber_dana")
      .select("nama_cabang")
      .order("nama_cabang")
      .then(({ data }) => {
        if (!data) return;
        const filtered = data
          .filter((d) => !d.nama_cabang.toLowerCase().includes("kanjeng guru") && d.nama_cabang !== "DANA PENGURUS PUSAT")
          .map((d) => ({
            nama_cabang: d.nama_cabang,
            label: d.nama_cabang === "Belum Konfirmasi" ? "Umum" : d.nama_cabang,
          }));
        setSumberList(filtered);
      });
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const compressed = await compressImage(f);
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      toast({ title: "Gagal memproses gambar", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sumberDonasi || !namaDonatur.trim() || !nominal) {
      toast({ title: "Lengkapi semua field", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let buktiUrl: string | null = null;

      if (file) {
        const filePath = `${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("donasi-bukti").upload(filePath, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("donasi-bukti").getPublicUrl(filePath);
        buktiUrl = urlData.publicUrl;
      }

      const kode = generateTrackingCode();
      const nominalNum = parseInt(nominal.replace(/\D/g, ""), 10);

      const { error } = await supabase.from("donasi_publik" as any).insert({
        kode_tracking: kode,
        nama_donatur: namaDonatur.trim(),
        sumber_donasi: sumberDonasi,
        nominal: nominalNum,
        bukti_url: buktiUrl,
        no_wa: noWa.trim() || null,
      } as any);

      if (error) throw error;
      setTrackingCode(kode);
    } catch (err: any) {
      toast({ title: "Gagal mengirim donasi", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode);
      toast({ title: "Kode disalin!" });
    }
  };

  if (trackingCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">Donasi Terkirim!</h2>
            <p className="text-muted-foreground text-sm">Simpan kode tracking ini untuk mengecek status donasi Anda:</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-mono font-bold tracking-widest bg-muted px-4 py-2 rounded-lg">{trackingCode}</span>
              <Button variant="outline" size="icon" onClick={copyCode}><Copy className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/cek-donasi">
                <Button variant="outline" className="w-full">Cek Status Donasi</Button>
              </Link>
              <Link to="/donasi">
                <Button variant="ghost" className="w-full" onClick={() => {
                  setTrackingCode(null);
                  setNamaDonatur("");
                  setNominal("");
                  setNoWa("");
                  setSumberDonasi("");
                  setFile(null);
                  setPreview(null);
                }}>Donasi Lagi</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
           <div className="container max-w-lg py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="rounded-lg bg-primary-foreground/15 hover:bg-primary-foreground/25 p-2 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold">Form Donasi HBH</h1>
              <p className="text-[11px] opacity-80">Majelis Dzikir Tasbih Indonesia</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-lg py-6 px-4 space-y-4">
        {/* Info Rekening */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4 px-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transfer ke Rekening</p>
            <div className="bg-background rounded-lg p-3 text-center space-y-1">
              <p className="text-xs text-muted-foreground">Bank BRI</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-lg font-mono font-bold tracking-wider">5895-01-02-9201-53-8</p>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    navigator.clipboard.writeText("5895-01-02-9201-53-8");
                    setCopiedRek(true);
                    toast({ title: "Nomor rekening disalin!" });
                    setTimeout(() => setCopiedRek(false), 2000);
                  }}
                >
                  {copiedRek ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">a/n <span className="font-semibold text-foreground">Muqorrobin</span></p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kirim Donasi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Sumber Donasi Cabang MDTI</Label>
                <Select value={sumberDonasi} onValueChange={setSumberDonasi}>
                  <SelectTrigger><SelectValue placeholder="Pilih sumber donasi cabang MDTI" /></SelectTrigger>
                  <SelectContent>
                    {sumberList.map((s) => (
                      <SelectItem key={s.nama_cabang} value={s.nama_cabang}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nama Donatur ( wajib diisi )</Label>
                <Input value={namaDonatur} onChange={(e) => setNamaDonatur(e.target.value)} placeholder="Masukkan nama Anda" />
              </div>

              <div className="space-y-2">
                <Label>No. WhatsApp <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                <Input value={noWa} onChange={(e) => setNoWa(e.target.value.replace(/[^0-9+\-\s]/g, ""))} placeholder="08xxxxxxxxxx" inputMode="tel" />
              </div>

              <div className="space-y-2">
                <Label>Nominal Donasi ( wajib diisi )</Label>
                <Input
                  value={nominal}
                  onChange={(e) => setNominal(formatRibuan(e.target.value))}
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-2">
                <Label>Bukti Bayar (Pastikan bukti bayar sesuai isian di nominal)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  {preview ? (
                    <div className="space-y-2">
                      <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setFile(null); setPreview(null); }}>Hapus</Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span className="text-sm">Tap untuk upload foto bukti</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                    </label>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Mengirim..." : "Kirim Donasi"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Sudah donasi? <Link to="/cek-donasi" className="text-primary underline">Cek status di sini</Link>
        </p>
      </main>
    </div>
  );
};

export default DonasiPublik;
