import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Phone, Copy, Check, ExternalLink, Download, HandCoins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const TARGET_DATE = new Date("2026-03-28T16:00:00+07:00");

const SuratEdaran = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const diff = TARGET_DATE.getTime() - now.getTime();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setCountdown(calc());
    const interval = setInterval(() => setCountdown(calc()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText("5895-01-02-9201-53-8");
    setCopied(true);
    toast({ title: "Nomor rekening disalin!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleaned}`, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Hero Section */}
      <div className="rounded-xl bg-[hsl(152,30%,25%)] text-white py-8 px-4 text-center space-y-3">
        <p className="text-amber-300 text-sm font-arabic">بسم الله الرحمن الرحيم</p>
        <p className="text-sm opacity-90">Assalaamu'alaikum Wr. Wb.</p>
        <h2 className="text-2xl sm:text-3xl font-bold">Halal Bihalal</h2>
        <p className="text-2xl sm:text-3xl font-bold text-amber-400">1447 H / 2026 M</p>
        <p className="text-sm opacity-80">Majelis Dzikir Tasbih Indonesia</p>
        
        {/* Divider */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="h-px w-16 bg-white/30" />
          <div className="w-2 h-2 bg-amber-400 rotate-45" />
          <div className="h-px w-16 bg-white/30" />
        </div>

        <div className="max-w-md mx-auto">
          <p className="text-xs italic opacity-70">
            "Tidaklah dua orang Muslim yang bertemu lalu berjabat tangan, melainkan keduanya diampuni sebelum berpisah."
          </p>
          <p className="text-xs opacity-60 mt-1">— HR. Abu Daud</p>
        </div>
      </div>

      {/* Countdown */}
      <Card>
        <CardContent className="py-5 px-4">
          <p className="text-[11px] font-semibold text-muted-foreground tracking-widest text-center mb-3 uppercase">
            Hitung Mundur Menuju Hari H
          </p>
          <div className="flex items-center justify-center gap-1">
            {[
              { val: countdown.days, label: "Hari" },
              { val: countdown.hours, label: "Jam" },
              { val: countdown.minutes, label: "Menit" },
              { val: countdown.seconds, label: "Detik" },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center gap-1">
                {i > 0 && <span className="text-xl font-bold text-muted-foreground/50">:</span>}
                <div className="text-center min-w-[52px]">
                  <p className="text-3xl sm:text-4xl font-bold tabular-nums">{String(item.val).padStart(2, "0")}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Details */}
      <Card>
        <CardContent className="py-4 px-4 space-y-0 divide-y divide-border">
          <div className="flex items-start gap-3 pb-4">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Hari / Tanggal</p>
              <p className="font-semibold text-sm">Sabtu (Malam Ahad)</p>
              <p className="text-xs text-muted-foreground">28 Maret 2026 / 08 Syawwal 1447 H</p>
            </div>
          </div>
          <div className="flex items-start gap-3 py-4">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Waktu</p>
              <p className="font-semibold text-sm">16:00 – 24:00 WIB</p>
            </div>
          </div>
          <div className="flex items-start gap-3 pt-4">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Tempat</p>
              <p className="font-semibold text-sm">PPTQ Cahaya Tasbih</p>
              <p className="text-xs text-muted-foreground">Jl. Raya Demak–Kudus KM. 14, Desa Sari, Kec. Gajah, Kab. Demak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partisipasi & Donasi */}
      <Card>
        <CardContent className="py-4 px-4 space-y-3">
          <h3 className="font-bold text-base">Partisipasi & Donasi</h3>
          <p className="text-sm text-muted-foreground">
            Bagi yang ingin berpartisipasi, silakan transfer ke rekening berikut:
          </p>
          <div className="bg-muted/50 rounded-lg p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground">Bank BRI</p>
            <p className="text-lg font-mono font-bold tracking-wider">5895-01-02-9201-53-8</p>
            <p className="text-xs text-muted-foreground">a/n <span className="font-semibold text-foreground">Muqorrobin</span></p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {copied ? "Tersalin!" : "Salin Nomor Rekening"}
          </Button>
          <Button
            size="lg"
            className="w-full gap-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => navigate("/donasi")}
          >
            <HandCoins className="h-4 w-4" />
            Bayar Donasi
            <span className="ml-auto">Klik Bayar Donasi →</span>
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Konfirmasi transfer via WhatsApp ke bendahara di bawah ini.
          </p>
        </CardContent>
      </Card>

      {/* Hubungi Panitia */}
      <Card>
        <CardContent className="py-4 px-4 space-y-3">
          <h3 className="font-bold text-base">Hubungi Panitia</h3>
          <div className="space-y-3">
            {[
              { name: "H. Khairudin", role: "Ketua", phone: "0813-2914-2616" },
              { name: "Muqorrobin", role: "Bendahara", phone: "0823-1396-2850" },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.role} · {p.phone}</p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5"
                  onClick={() => handleWhatsApp(p.phone)}
                >
                  <Phone className="h-3.5 w-3.5" />
                  WhatsApp
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Surat Edaran Asli */}
      <Card>
        <CardContent className="py-4 px-4 space-y-3">
          <h3 className="font-bold text-base">Surat Edaran Asli</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => window.open("https://surat-edaran-hbh-mdti-2026.vercel.app/surat-edaran-halal-bihalal-2026.pdf", "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Lihat Surat
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              asChild
            >
              <a href="https://surat-edaran-hbh-mdti-2026.vercel.app/surat-edaran-halal-bihalal-2026.pdf" download>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Unduh PDF
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuratEdaran;
