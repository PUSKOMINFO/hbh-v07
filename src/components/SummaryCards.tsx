import { Target, TrendingUp, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

interface SummaryCardsProps {
  targetDonasi: number;
  realisasi: number;
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const formatNumber = (n: number) =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(n);

const SummaryCards = ({ targetDonasi, realisasi }: SummaryCardsProps) => {
  const persen = targetDonasi > 0 ? Math.min(100, Math.round((realisasi / targetDonasi) * 100)) : 0;
  const status = persen >= 100 ? "Tercapai" : persen >= 50 ? "Berjalan Baik" : "Perlu Perhatian";
  const sisa = Math.max(0, targetDonasi - realisasi);

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
    <>
      {/* Desktop: 3 separate cards */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3">
        {/* Target Donasi */}
        <div className="rounded-xl bg-gradient-to-br from-primary/90 to-primary p-4 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2.5 bg-primary-foreground/20 backdrop-blur-sm">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-primary-foreground/70">Target Donasi</p>
              <p className="text-xl font-bold whitespace-nowrap text-primary-foreground">{formatRupiah(targetDonasi)}</p>
            </div>
          </div>
        </div>

        {/* Realisasi */}
        <div className={`rounded-xl ${realisasiBg} p-4 shadow-lg animate-fade-in relative overflow-hidden`} style={{ animationDelay: "80ms" }}>
          <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full transition-all duration-700" style={{ width: `${persen}%` }} />
          <div className="flex items-center gap-3 relative z-10">
            <div className="rounded-lg p-2.5 bg-white/20 backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">Realisasi</p>
              <p className="text-xl font-bold whitespace-nowrap text-white">{formatRupiah(realisasi)}</p>
              <p className="text-[11px] font-semibold text-white/60">{persen}% dari target</p>
            </div>
          </div>
        </div>

        {/* Status Donasi */}
        <div className={`rounded-xl ${statusBg} p-4 shadow-lg animate-fade-in relative overflow-hidden`} style={{ animationDelay: "160ms" }}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2.5 bg-white/20 backdrop-blur-sm">
              <StatusIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">Status Donasi</p>
              <p className="text-3xl font-extrabold text-white">{persen}%</p>
              <p className="text-xs font-semibold text-white/80">{status}</p>
            </div>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-white/80 transition-all duration-700" style={{ width: `${persen}%` }} />
          </div>
        </div>
      </div>

      {/* Mobile: compact unified card */}
      <div className="sm:hidden animate-fade-in">
        <div className="rounded-xl bg-gradient-to-br from-primary/90 to-primary p-3 shadow-lg relative overflow-hidden">
          {/* Progress bar background */}
          <div className="absolute bottom-0 left-0 h-1 bg-white/15 w-full" />
          <div
            className="absolute bottom-0 left-0 h-1 bg-white/50 rounded-full transition-all duration-700"
            style={{ width: `${persen}%` }}
          />

          {/* Top row: status badge + percentage */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <StatusIcon className="h-3.5 w-3.5 text-primary-foreground/80" />
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                persen >= 100 ? "bg-green-400/25 text-green-100" :
                persen >= 50 ? "bg-yellow-400/25 text-yellow-100" :
                "bg-red-400/25 text-red-100"
              }`}>
                {status}
              </span>
            </div>
            <span className="text-xl font-extrabold text-primary-foreground">{persen}%</span>
          </div>

          {/* 3-column compact stats */}
          <div className="grid grid-cols-3 gap-2">
            {/* Target */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Target className="h-3 w-3 text-primary-foreground/60" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-primary-foreground/60">Target</span>
              </div>
              <p className="text-[11px] font-bold text-primary-foreground leading-tight">{formatNumber(targetDonasi)}</p>
            </div>

            {/* Realisasi */}
            <div className="bg-white/15 backdrop-blur-sm rounded-lg px-2 py-1.5 text-center ring-1 ring-white/10">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingUp className="h-3 w-3 text-primary-foreground/60" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-primary-foreground/60">Realisasi</span>
              </div>
              <p className="text-[11px] font-bold text-primary-foreground leading-tight">{formatNumber(realisasi)}</p>
            </div>

            {/* Sisa */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <AlertTriangle className="h-3 w-3 text-primary-foreground/60" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-primary-foreground/60">Sisa</span>
              </div>
              <p className="text-[11px] font-bold text-primary-foreground leading-tight">{formatNumber(sisa)}</p>
            </div>
          </div>

          {/* Compact progress bar */}
          <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                persen >= 100 ? "bg-green-300/80" : persen >= 50 ? "bg-white/70" : "bg-red-300/80"
              }`}
              style={{ width: `${persen}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SummaryCards;
