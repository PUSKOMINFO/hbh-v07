import { SumberDana } from "@/lib/data";

interface SumberDanaTableProps {
  data: SumberDana[];
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const SumberDanaTable = ({ data }: SumberDanaTableProps) => {
  const totalSKG = data.reduce((s, d) => s + d.skg, 0);
  const totalNominal = data.reduce((s, d) => s + d.nominal, 0);

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: "240ms" }}>
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-semibold">Sumber Dana Donasi</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Kontribusi per cabang</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="py-2.5 px-3 text-left font-medium w-10">No</th>
              <th className="py-2.5 px-3 text-left font-medium">Nama Cabang</th>
              <th className="py-2.5 px-3 text-center font-medium w-16">SKG</th>
              <th className="py-2.5 px-3 text-right font-medium">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <td className="py-2.5 px-3 text-muted-foreground">{i + 1}</td>
                <td className="py-2.5 px-3 font-medium text-foreground">{d.namaCabang}</td>
                <td className="py-2.5 px-3 text-center">{d.skg || '-'}</td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap">{formatRupiah(d.nominal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-primary/5 font-semibold">
              <td className="py-2.5 px-3" colSpan={2}>Total</td>
              <td className="py-2.5 px-3 text-center">{totalSKG}</td>
              <td className="py-2.5 px-3 text-right whitespace-nowrap">{formatRupiah(totalNominal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default SumberDanaTable;
