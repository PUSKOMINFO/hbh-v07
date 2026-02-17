import { useState } from "react";
import { useDonasiPublik, useApproveDonasi, useRejectDonasi, DonasiPublikRow } from "@/hooks/useDonasiPublik";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Eye } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  diterima: { label: "Diterima", variant: "default" },
  ditolak: { label: "Ditolak", variant: "destructive" },
};

const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

const DonasiPublikAdmin = () => {
  const { data: donasiList = [], isLoading } = useDonasiPublik();
  const approveMutation = useApproveDonasi();
  const rejectMutation = useRejectDonasi();

  const [selected, setSelected] = useState<DonasiPublikRow | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [alasanTolak, setAlasanTolak] = useState("");

  const handleApprove = () => {
    if (!selected) return;
    approveMutation.mutate(selected, { onSuccess: () => setSelected(null) });
  };

  const handleReject = () => {
    if (!selected || !alasanTolak.trim()) return;
    rejectMutation.mutate(
      { id: selected.id, alasan: alasanTolak.trim() },
      { onSuccess: () => { setSelected(null); setShowReject(false); setAlasanTolak(""); } }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Tanggal</TableHead>
              <TableHead className="text-xs">Nama</TableHead>
              <TableHead className="text-xs">Nominal</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donasiList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Belum ada donasi masuk
                </TableCell>
              </TableRow>
            ) : (
              donasiList.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-xs">{fmtDate(d.created_at)}</TableCell>
                  <TableCell className="text-xs font-medium truncate max-w-[100px]">{d.nama_donatur}</TableCell>
                  <TableCell className="text-xs">Rp {fmt(d.nominal)}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[d.status]?.variant || "outline"} className="text-[10px]">
                      {statusConfig[d.status]?.label || d.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(d)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected && !showReject} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Donasi</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-muted-foreground">Kode</span>
                <span className="font-mono font-bold">{selected.kode_tracking}</span>
                <span className="text-muted-foreground">Nama</span>
                <span>{selected.nama_donatur}</span>
                <span className="text-muted-foreground">Sumber</span>
                <span>{selected.sumber_donasi === "Belum Konfirmasi" ? "Umum" : selected.sumber_donasi}</span>
                {selected.no_wa && (
                  <>
                    <span className="text-muted-foreground">No. WA</span>
                    <span>{selected.no_wa}</span>
                  </>
                )}
                <span className="text-muted-foreground">Nominal</span>
                <span className="font-semibold">Rp {fmt(selected.nominal)}</span>
                <span className="text-muted-foreground">Tanggal</span>
                <span>{fmtDate(selected.created_at)}</span>
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusConfig[selected.status]?.variant || "outline"} className="w-fit">
                  {statusConfig[selected.status]?.label || selected.status}
                </Badge>
              </div>

              {selected.bukti_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bukti Bayar:</p>
                  <img src={selected.bukti_url} alt="Bukti" className="rounded-lg max-h-48 w-auto" />
                </div>
              )}

              {selected.alasan_tolak && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  <p className="font-medium">Alasan Penolakan:</p>
                  <p>{selected.alasan_tolak}</p>
                </div>
              )}

              {selected.status === "pending" && (
                <DialogFooter className="flex gap-2 sm:gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowReject(true)}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Tolak
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> {approveMutation.isPending ? "Proses..." : "Approve"}
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showReject} onOpenChange={(open) => { if (!open) { setShowReject(false); setAlasanTolak(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alasan Penolakan</DialogTitle>
          </DialogHeader>
          <Textarea
            value={alasanTolak}
            onChange={(e) => setAlasanTolak(e.target.value)}
            placeholder="Masukkan alasan penolakan..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowReject(false); setAlasanTolak(""); }}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!alasanTolak.trim() || rejectMutation.isPending}>
              {rejectMutation.isPending ? "Proses..." : "Tolak Donasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DonasiPublikAdmin;
