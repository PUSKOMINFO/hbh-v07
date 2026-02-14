import { Target, TrendingUp, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

interface SummaryCardsProps {
  targetDonasi: number;
  realisasi: number;
}

const formatRupiah = (n: number) =>
new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const SummaryCards = ({ targetDonasi, realisasi }: SummaryCardsProps) => {
  const persen = targetDonasi > 0 ? Math.min(100, Math.round(realisasi / targetDonasi * 100)) : 0;
  const status = persen >= 100 ? "Tercapai" : persen >= 50 ? "Berjalan Baik" : "Perlu Perhatian";

  const realisasiBg =
  persen >= 100 ?
  "bg-gradient-to-br from-[hsl(152,60%,45%)] to-[hsl(152,65%,30%)]" :
  persen >= 50 ?
  "bg-gradient-to-br from-[hsl(210,75%,55%)] to-[hsl(210,70%,40%)]" :
  "bg-gradient-to-br from-[hsl(0,72%,55%)] to-[hsl(0,72%,42%)]";

  const statusBg =
  persen >= 100 ?
  "bg-gradient-to-br from-[hsl(152,60%,40%)] to-[hsl(152,60%,28%)]" :
  persen >= 50 ?
  "bg-gradient-to-br from-[hsl(38,92%,52%)] to-[hsl(38,92%,40%)]" :
  "bg-gradient-to-br from-[hsl(0,72%,55%)] to-[hsl(0,72%,42%)]";

  const StatusIcon = persen >= 100 ? Sparkles : persen >= 50 ? CheckCircle2 : AlertTriangle;

  return (
    <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
            {/* Target Donasi */}
            <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/90 to-primary px-1.5 py-1.5 sm:p-4 shadow-lg animate-fade-in">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <div className="rounded-md sm:rounded-lg p-1 sm:p-2 bg-primary-foreground/20 backdrop-blur-sm">
                  <Target className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
                <p className="text-[10px] sm:text-sm font-semibold text-primary-foreground/80 uppercase tracking-wider leading-none">Target Donasi</p>
              </div>
              <p className="text-base sm:text-2xl font-bold text-primary-foreground leading-tight">{formatRupiah(targetDonasi)}</p>
            </div>

            {/* Realisasi */}
            <div className={`rounded-lg sm:rounded-xl ${realisasiBg} px-1.5 py-1.5 sm:p-4 shadow-lg animate-fade-in relative overflow-hidden`} style={{ animationDelay: "80ms" }}>
              <div className="absolute bottom-0 left-0 h-0.5 sm:h-1 bg-white/30 rounded-full transition-all duration-700" style={{ width: `${persen}%` }} />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="rounded-md sm:rounded-lg p-1 sm:p-2 bg-white/20 backdrop-blur-sm">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <p className="text-[10px] sm:text-sm font-semibold text-white/80 uppercase tracking-wider leading-none">Realisasi</p>
                </div>
                <p className="text-base sm:text-2xl font-bold text-white leading-tight">{formatRupiah(realisasi)}</p>
                <p className="text-[9px] sm:text-xs font-semibold text-white/60 mt-0.5">{persen}% - {status}</p>
              </div>
            </div>
          </div>);

};

export default SummaryCards;