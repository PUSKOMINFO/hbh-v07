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
      accent: "bg-primary/10 text-primary",
    },
    {
      label: "Realisasi",
      value: formatRupiah(realisasi),
      icon: TrendingUp,
      accent: "bg-accent/20 text-accent-foreground",
    },
    {
      label: "Status Donasi",
      value: `${persen}%`,
      sub: status,
      icon: CheckCircle2,
      accent: persen >= 100 ? "bg-success/10 text-success" : persen >= 50 ? "bg-info/10 text-info" : "bg-warning/10 text-warning",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className="rounded-lg border border-border bg-card p-4 shadow-sm animate-fade-in"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-md p-2 ${c.accent}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-lg font-semibold truncate">{c.value}</p>
              {c.sub && <p className="text-xs text-muted-foreground">{c.sub}</p>}
            </div>
          </div>
          {c.label === "Status Donasi" && (
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
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
