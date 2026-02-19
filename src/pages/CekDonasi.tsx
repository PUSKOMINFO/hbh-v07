import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface DonasiResult {
  kode_tracking: string;
  nama_donatur: string;
  sumber_donasi: string;
  nominal: number;
  status: string;
  alasan_tolak: string | null;
  bukti_url: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  diterima: { label: "Diterima", variant: "default" },
  ditolak: { label: "Ditolak", variant: "destructive" },
};

const CekDonasi = () => {
  const navigate = useNavigate();
  const [kode, setKode] = useState("");
  const [result, setResult] = useState<DonasiResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode.trim()) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);

    const { data, error } = await supabase
      .from("donasi_publik" as any)
      .select("kode_tracking, nama_donatur, sumber_donasi, nominal, status, alasan_tolak, bukti_url, created_at")
      .eq("kode_tracking", kode.trim().toUpperCase())
      .maybeSingle();

    setLoading(false);
    if (error || !data) {
      setNotFound(true);
    } else {
      setResult(data as unknown as DonasiResult);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="container max-w-lg py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="rounded-lg bg-primary-foreground/15 hover:bg-primary-foreground/25 p-2 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold">Cek Status Donasi</h1>
              <p className="text-[11px] opacity-80">Majelis Dzikir Tasbih Indonesia</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-lg py-6 px-4 space-y-4">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={kode}
                onChange={(e) => setKode(e.target.value.toUpperCase())}
                placeholder="Masukkan kode tracking"
                className="font-mono tracking-wider"
                maxLength={8}
              />
              <Button type="submit" disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {notFound && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Donasi dengan kode tersebut tidak ditemukan.</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Detail Donasi</CardTitle>
                <Badge variant={statusConfig[result.status]?.variant || "outline"}>
                  {statusConfig[result.status]?.label || result.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-muted-foreground">Kode</span>
                <span className="font-mono font-bold">{result.kode_tracking}</span>
                <span className="text-muted-foreground">Nama</span>
                <span>{result.nama_donatur}</span>
                <span className="text-muted-foreground">Sumber</span>
                <span>{result.sumber_donasi === "Belum Konfirmasi" ? "Umum" : result.sumber_donasi}</span>
                <span className="text-muted-foreground">Nominal</span>
                <span className="font-semibold">Rp {fmt(result.nominal)}</span>
                <span className="text-muted-foreground">Tanggal</span>
                <span>{fmtDate(result.created_at)}</span>
              </div>

              {result.status === "ditolak" && result.alasan_tolak && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  <p className="font-medium">Alasan Penolakan:</p>
                  <p>{result.alasan_tolak}</p>
                </div>
              )}

              {result.bukti_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bukti Bayar:</p>
                  <img src={result.bukti_url} alt="Bukti" className="rounded-lg max-h-48 w-auto" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Belum donasi? <Link to="/donasi" className="text-primary underline">Donasi di sini</Link>
        </p>
      </main>
    </div>
  );
};

export default CekDonasi;
