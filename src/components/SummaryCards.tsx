import { Target, TrendingUp, CheckCircle2 } from "lucide-react";

interface SummaryCardsProps {
  targetDonasi: number;
  realisasi: number;
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const SummaryCards = ({ targetDonasi, realisasi }: SummaryCardsProps) => {
  const persen = Math.min(100, Math.round((realisasi / targetDonasi) * 100));
  const status = persen >= 100 ? "Tercapai" : persen >= 50 ? "Berjalan Baik" : "Perlu Perhatian";

  const cards = [
    {
      label: "Target Donasi",
      value: formatRupiah(targetDonasi),
      icon: Target,
      bg: "bg-gradient-to-br from-primary/90 to-primary",
      iconBg: "bg-primary-foreground/20",
      textColor: "text-primary-foreground",
      labelColor: "text-primary-foreground/70",
    },
    {
      label: "Realisasi",
      value: formatRupiah(realisasi),
      icon: TrendingUp,
      bg: "bg-gradient-to-br from-accent/90 to-accent",
      iconBg: "bg-accent-foreground/15",
      textColor: "text-accent-foreground",
      labelColor: "text-accent-foreground/70",
    },
    {
      label: "Status Donasi",
      value: `${persen}%`,
      sub: status,
      icon: CheckCircle2,
      bg: persen >= 100
        ? "bg-gradient-to-br from-[hsl(152,60%,40%)] to-[hsl(152,60%,32%)]"
        : persen >= 50
        ? "bg-gradient-to-br from-[hsl(210,70%,50%)] to-[hsl(210,70%,40%)]"
        : "bg-gradient-to-br from-[hsl(38,92%,50%)] to-[hsl(38,92%,42%)]",
      iconBg: "bg-white/20",
      textColor: "text-white",
      labelColor: "text-white/70",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className={`rounded-xl ${c.bg} p-4 shadow-lg animate-fade-in`}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2.5 ${c.iconBg} backdrop-blur-sm`}>
              <c.icon className={`h-5 w-5 ${c.textColor}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-[11px] font-medium uppercase tracking-wide ${c.labelColor}`}>{c.label}</p>
              <p className={`text-lg sm:text-xl font-bold whitespace-nowrap ${c.textColor}`}>{c.value}</p>
              {c.sub && <p className={`text-xs font-medium ${c.labelColor}`}>{c.sub}</p>}
            </div>
          </div>
          {c.label === "Status Donasi" && (
            <div className="mt-3 h-2.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/80 transition-all duration-700"
                style={{ width: `${persen}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
