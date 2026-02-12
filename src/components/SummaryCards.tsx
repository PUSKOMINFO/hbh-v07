import { Target, TrendingUp, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

interface SummaryCardsProps {
  targetDonasi: number;
  realisasi: number;
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const SummaryCards = ({ targetDonasi, realisasi }: SummaryCardsProps) => {
  const persen = Math.min(100, Math.round((realisasi / targetDonasi) * 100));
  const status = persen >= 100 ? "Tercapai" : persen >= 50 ? "Berjalan Baik" : "Perlu Perhatian";

  // Dynamic styling based on progress
  const realisasiBg =
    persen >= 100
      ? "bg-gradient-to-br from-[hsl(152,60%,45%)] to-[hsl(152,65%,30%)]"
      : persen >= 50
      ? "bg-gradient-to-br from-[hsl(210,75%,55%)] to-[hsl(210,70%,40%)]"
      : "bg-gradient-to-br from-[hsl(0,72%,55%)] to-[hsl(0,72%,42%)]";

  const statusBg =
    persen >= 100
      ? "bg-gradient-to-br from-[hsl(152,60%,40%)] to-[hsl(152,60%,28%)]"
      : persen >= 50
      ? "bg-gradient-to-br from-[hsl(38,92%,52%)] to-[hsl(38,92%,40%)]"
      : "bg-gradient-to-br from-[hsl(0,72%,55%)] to-[hsl(0,72%,42%)]";

  const StatusIcon = persen >= 100 ? Sparkles : persen >= 50 ? CheckCircle2 : AlertTriangle;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Target Donasi */}
      <div className="rounded-xl bg-gradient-to-br from-primary/90 to-primary p-4 shadow-lg animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2.5 bg-primary-foreground/20 backdrop-blur-sm">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-primary-foreground/70">Target Donasi</p>
            <p className="text-lg sm:text-xl font-bold whitespace-nowrap text-primary-foreground">{formatRupiah(targetDonasi)}</p>
          </div>
        </div>
      </div>

      {/* Realisasi - dynamic color based on progress */}
      <div
        className={`rounded-xl ${realisasiBg} p-4 shadow-lg animate-fade-in relative overflow-hidden`}
        style={{ animationDelay: "80ms" }}
      >
        {/* Subtle progress glow */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full transition-all duration-700"
          style={{ width: `${persen}%` }}
        />
        <div className="flex items-center gap-3 relative z-10">
          <div className="rounded-lg p-2.5 bg-white/20 backdrop-blur-sm">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">Realisasi</p>
            <p className="text-lg sm:text-xl font-bold whitespace-nowrap text-white">{formatRupiah(realisasi)}</p>
            <p className="text-[11px] font-semibold text-white/60">{persen}% dari target</p>
          </div>
        </div>
      </div>

      {/* Status Donasi - dynamic everything */}
      <div
        className={`rounded-xl ${statusBg} p-4 shadow-lg animate-fade-in relative overflow-hidden`}
        style={{ animationDelay: "160ms" }}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2.5 bg-white/20 backdrop-blur-sm">
            <StatusIcon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">Status Donasi</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{persen}%</p>
            <p className="text-xs font-semibold text-white/80">{status}</p>
          </div>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/80 transition-all duration-700"
            style={{ width: `${persen}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
