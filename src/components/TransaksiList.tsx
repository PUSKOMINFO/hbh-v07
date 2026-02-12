import { Transaksi } from "@/lib/data";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface TransaksiListProps {
  data: Transaksi[];
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const TransaksiList = ({ data }: TransaksiListProps) => {
  const sorted = [...data].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  const totalMasuk = data.filter(t => t.jenis === 'masuk').reduce((s, t) => s + t.nominal, 0);
  const totalKeluar = data.filter(t => t.jenis === 'keluar').reduce((s, t) => s + t.nominal, 0);

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "320ms" }}>
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-semibold">Laporan Dana Masuk & Keluar</h2>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
            <span className="text-muted-foreground">Masuk:</span>
            <span className="font-semibold text-success">{formatRupiah(totalMasuk)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
            <span className="text-muted-foreground">Keluar:</span>
            <span className="font-semibold text-destructive">{formatRupiah(totalKeluar)}</span>
          </div>
        </div>
      </div>
      <div className="divide-y divide-border">
        {sorted.map((t) => (
          <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
            <div className={`rounded-full p-2 shrink-0 ${t.jenis === 'masuk' ? 'bg-success/10' : 'bg-destructive/10'}`}>
              {t.jenis === 'masuk' ? (
                <ArrowDownLeft className="h-4 w-4 text-success" />
              ) : (
                <ArrowUpRight className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{t.keterangan}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                {" · "}{t.kategori}
              </p>
            </div>
            <p className={`text-sm font-semibold whitespace-nowrap ${t.jenis === 'masuk' ? 'text-success' : 'text-destructive'}`}>
              {t.jenis === 'masuk' ? '+' : '-'}{formatRupiah(t.nominal)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransaksiList;
