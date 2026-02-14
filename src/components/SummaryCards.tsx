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
            <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/90 to-primary px-1.5 py-1.5 sm:p-4 shadow-lg animate-fade-in text-center">
              <div className="flex flex-col items-center gap-1 sm:gap-3">
                <div className="rounded-md sm:rounded-lg p-1 sm:p-2.5 bg-primary-foreground/20 backdrop-blur-sm">
                  <Target className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <p className="sm:text-[14px] font-medium uppercase tracking-wide text-primary-foreground/70 leading-tight text-base">{formatRupiah(targetDonasi)}</p>
              </div>
              <p className="text-[14px] sm:text-2xl font-bold text-primary-foreground leading-snug mt-2 sm:mt-3">Target Donasi</p>
            </div>

            {/* Realisasi */}
            <div className={`rounded-lg sm:rounded-xl ${realisasiBg} px-1.5 py-1.5 sm:p-4 shadow-lg animate-fade-in relative overflow-hidden text-center`} style={{ animationDelay: "80ms" }}>
              <div className="absolute bottom-0 left-0 h-0.5 sm:h-1 bg-white/30 rounded-full transition-all duration-700" style={{ width: `${persen}%` }} />
              <div className="relative z-10">
                <div className="flex flex-col items-center gap-1 sm:gap-3">
                  <div className="rounded-md sm:rounded-lg p-1 sm:p-2.5 bg-white/20 backdrop-blur-sm">
                    <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <p className="text-[9px] sm:text-[14px] font-medium uppercase tracking-wide text-white/70 leading-tight">{formatRupiah(realisasi)}</p>
                  <p className="text-[9px] sm:text-[11px] font-semibold text-white/60">{persen}% - {status}</p>
                </div>
                <p className="text-[14px] sm:text-2xl font-bold text-white leading-snug mt-2 sm:mt-3">Realisasi</p>
              </div>
            </div>
          </div>);

};

export default SummaryCards;