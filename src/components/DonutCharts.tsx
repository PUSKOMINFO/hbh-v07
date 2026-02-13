import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TransaksiRow } from "@/hooks/useTransaksi";
import { SumberDanaRow } from "@/hooks/useSumberDana";
import { useAnggaranSeksi } from "@/hooks/useAnggaranSeksi";
import { TrendingUp, TrendingDown, ArrowDownUp } from "lucide-react";

interface DonutChartsProps {
  transaksi: TransaksiRow[];
  sumberDana: SumberDanaRow[];
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const formatShort = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return n.toString();
};

const COLORS_MASUK_KELUAR = ["hsl(152,60%,40%)", "hsl(0,72%,50%)"];
const COLORS_SEKSI = [
  "hsl(210,75%,55%)", "hsl(152,60%,45%)", "hsl(38,92%,50%)", "hsl(0,72%,55%)",
  "hsl(280,60%,55%)", "hsl(180,50%,45%)", "hsl(330,65%,50%)", "hsl(60,70%,45%)",
  "hsl(210,55%,40%)", "hsl(120,45%,40%)", "hsl(15,80%,50%)", "hsl(250,50%,55%)",
];
const COLORS_SUMBER = [
  "hsl(210,75%,55%)", "hsl(38,92%,50%)", "hsl(152,60%,45%)", "hsl(280,60%,55%)",
  "hsl(0,72%,55%)", "hsl(180,50%,45%)", "hsl(330,65%,50%)", "hsl(60,70%,45%)",
  "hsl(15,80%,50%)", "hsl(120,45%,40%)", "hsl(250,50%,55%)", "hsl(210,55%,40%)",
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0];
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl text-xs">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: fill }} />
        <span className="text-muted-foreground">{name}</span>
      </div>
      <p className="font-semibold mt-1">{formatRupiah(value)}</p>
    </div>
  );
};

const DonutCharts = ({ transaksi, sumberDana }: DonutChartsProps) => {
  const { data: anggaranSeksi = [] } = useAnggaranSeksi();

  // 1. Dana Masuk vs Keluar
  const { masukKeluarData, totalMasuk, totalKeluar } = useMemo(() => {
    let masuk = 0;
    let keluar = 0;
    transaksi.forEach((t) => {
      if (t.jenis === "masuk") masuk += t.nominal;
      else keluar += t.nominal;
    });
    return {
      masukKeluarData: [
        { name: "Dana Masuk", value: masuk },
        { name: "Dana Keluar", value: keluar },
      ],
      totalMasuk: masuk,
      totalKeluar: keluar,
    };
  }, [transaksi]);

  // 2. Pengeluaran per Seksi (from transaksi keluar grouped by kategori)
  const seksiData = useMemo(() => {
    const map: Record<string, number> = {};
    transaksi
      .filter((t) => t.jenis === "keluar")
      .forEach((t) => {
        const key = t.kategori || "Lainnya";
        map[key] = (map[key] || 0) + t.nominal;
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transaksi]);

  // 3. Proporsi donasi per sumber
  const sumberData = useMemo(() => {
    return sumberDana
      .filter((s) => s.nominal > 0)
      .map((s) => ({ name: s.nama_cabang, value: s.nominal }))
      .sort((a, b) => b.value - a.value);
  }, [sumberDana]);

  const hasData = transaksi.length > 0 || sumberDana.length > 0;
  if (!hasData) {
    return (
      <div className="rounded-lg border border-border bg-card shadow-sm p-8 text-center">
        <p className="text-sm text-muted-foreground">Belum ada data untuk ditampilkan</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Chart 1: Dana Masuk vs Keluar */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ArrowDownUp className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-primary shrink-0" />
            <h3 className="text-sm sm:text-base font-semibold">Dana Masuk vs Keluar</h3>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="relative w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={masukKeluarData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {masukKeluarData.map((_, i) => (
                      <Cell key={i} fill={COLORS_MASUK_KELUAR[i]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] sm:text-[10px] text-muted-foreground">Saldo</span>
                <span className="text-xs sm:text-sm font-bold">{formatShort(totalMasuk - totalKeluar)}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2.5 sm:space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="rounded-md p-1.5 sm:p-2 bg-[hsl(152,60%,40%)]/10 shrink-0">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[hsl(152,60%,40%)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Dana Masuk</p>
                  <p className="text-xs sm:text-sm font-bold text-[hsl(152,60%,40%)] truncate">{formatRupiah(totalMasuk)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="rounded-md p-1.5 sm:p-2 bg-[hsl(0,72%,50%)]/10 shrink-0">
                  <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[hsl(0,72%,50%)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Dana Keluar</p>
                  <p className="text-xs sm:text-sm font-bold text-[hsl(0,72%,50%)] truncate">{formatRupiah(totalKeluar)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart 2: Pengeluaran Per Seksi */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 sm:h-[18px] sm:w-[18px] rounded-full bg-gradient-to-br from-[hsl(280,60%,55%)] to-[hsl(210,75%,55%)] shrink-0" />
            <h3 className="text-sm sm:text-base font-semibold">Pengeluaran Per Seksi</h3>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          {seksiData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Belum ada pengeluaran</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              <div className="relative w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={seksiData}
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="85%"
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {seksiData.map((_, i) => (
                        <Cell key={i} fill={COLORS_SEKSI[i % COLORS_SEKSI.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">Total</span>
                  <span className="text-xs sm:text-sm font-bold">{formatShort(seksiData.reduce((s, d) => s + d.value, 0))}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:gap-y-2">
                  {seksiData.map((item, i) => {
                    const total = seksiData.reduce((s, d) => s + d.value, 0);
                    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                    return (
                      <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                        <div
                          className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: COLORS_SEKSI[i % COLORS_SEKSI.length] }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs truncate text-muted-foreground">{item.name}</p>
                          <p className="text-[10px] sm:text-xs font-semibold">{pct}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart 3: Proporsi Donasi Per Sumber */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 sm:h-[18px] sm:w-[18px] rounded-full bg-gradient-to-br from-[hsl(38,92%,50%)] to-[hsl(210,75%,55%)] shrink-0" />
            <h3 className="text-sm sm:text-base font-semibold">Proporsi Donasi Per Sumber</h3>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          {sumberData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Belum ada donasi</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              <div className="relative w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sumberData}
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="85%"
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {sumberData.map((_, i) => (
                        <Cell key={i} fill={COLORS_SUMBER[i % COLORS_SUMBER.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">Total</span>
                  <span className="text-xs sm:text-sm font-bold">{formatShort(sumberData.reduce((s, d) => s + d.value, 0))}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full max-h-[180px] sm:max-h-[220px] overflow-y-auto pr-1">
                <div className="space-y-1.5 sm:space-y-2">
                  {sumberData.map((item, i) => {
                    const total = sumberData.reduce((s, d) => s + d.value, 0);
                    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                    return (
                      <div key={item.name} className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: COLORS_SUMBER[i % COLORS_SUMBER.length] }}
                        />
                        <span className="text-[10px] sm:text-xs truncate flex-1 text-muted-foreground">{item.name}</span>
                        <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap">{pct}%</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                          {formatRupiah(item.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonutCharts;
