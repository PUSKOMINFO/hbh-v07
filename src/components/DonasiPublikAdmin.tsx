import { useState } from "react";
import { useDonasiPublik, useApproveDonasi, useRejectDonasi, DonasiPublikRow } from "@/hooks/useDonasiPublik";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, ZoomIn } from "lucide-react";

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

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [alasanTolak, setAlasanTolak] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setRejectingId(null);
    setAlasanTolak("");
  };

  const handleApprove = (d: DonasiPublikRow) => {
    approveMutation.mutate(d, { onSuccess: () => setExpandedId(null) });
  };

  const handleReject = (id: string) => {
    if (!alasanTolak.trim()) return;
    rejectMutation.mutate(
      { id, alasan: alasanTolak.trim() },
      { onSuccess: () => { setExpandedId(null); setRejectingId(null); setAlasanTolak(""); } }
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
              <TableHead className="text-xs w-14 text-center">Aksi</TableHead>
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
                <>
                  <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(d.id)}>
                    <TableCell className="text-xs">{fmtDate(d.created_at)}</TableCell>
                    <TableCell className="text-xs font-medium truncate max-w-[100px]">{d.nama_donatur}</TableCell>
                    <TableCell className="text-xs">Rp {fmt(d.nominal)}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[d.status]?.variant || "outline"} className="text-[10px]">
                        {statusConfig[d.status]?.label || d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={`inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors ${expandedId === d.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                        {expandedId === d.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </TableCell>
                  </TableRow>

                  {expandedId === d.id && (
                    <TableRow key={`${d.id}-detail`}>
                      <TableCell colSpan={5} className="p-0">
                        <div className="bg-muted/30 border-t border-border px-4 py-3 space-y-3">
                          <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                            <span className="text-muted-foreground text-xs">Kode</span>
                            <span className="font-mono font-bold text-xs">{d.kode_tracking}</span>
                            <span className="text-muted-foreground text-xs">Nama</span>
                            <span className="text-xs">{d.nama_donatur}</span>
                            <span className="text-muted-foreground text-xs">Sumber</span>
                            <span className="text-xs">{d.sumber_donasi === "Belum Konfirmasi" ? "Umum" : d.sumber_donasi}</span>
                            {d.no_wa && (
                              <>
                                <span className="text-muted-foreground text-xs">No. WA</span>
                                <span className="text-xs">{d.no_wa}</span>
                              </>
                            )}
                            <span className="text-muted-foreground text-xs">Nominal</span>
                            <span className="font-semibold text-xs">Rp {fmt(d.nominal)}</span>
                            <span className="text-muted-foreground text-xs">Tanggal</span>
                            <span className="text-xs">{fmtDate(d.created_at)}</span>
                            <span className="text-muted-foreground text-xs">Status</span>
                            <Badge variant={statusConfig[d.status]?.variant || "outline"} className="w-fit text-[10px]">
                              {statusConfig[d.status]?.label || d.status}
                            </Badge>
                          </div>

                          {d.bukti_url && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Bukti Bayar:</p>
                              <div
                                className="relative inline-block cursor-pointer group"
                                onClick={(e) => { e.stopPropagation(); setZoomImage(d.bukti_url); }}
                              >
                                <img src={d.bukti_url} alt="Bukti" className="rounded-lg max-h-32 w-auto border border-border" />
                                <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ZoomIn className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            </div>
                          )}

                          {d.alasan_tolak && (
                            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-xs">
                              <p className="font-medium">Alasan Penolakan:</p>
                              <p>{d.alasan_tolak}</p>
                            </div>
                          )}

                          {d.status === "pending" && rejectingId !== d.id && (
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                className="text-xs h-8"
                                onClick={(e) => { e.stopPropagation(); setRejectingId(d.id); }}
                                disabled={rejectMutation.isPending}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Tolak
                              </Button>
                              <Button
                                size="sm"
                                className="text-xs h-8"
                                onClick={(e) => { e.stopPropagation(); handleApprove(d); }}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {approveMutation.isPending ? "Proses..." : "Approve"}
                              </Button>
                            </div>
                          )}

                          {rejectingId === d.id && (
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <Textarea
                                value={alasanTolak}
                                onChange={(e) => setAlasanTolak(e.target.value)}
                                placeholder="Masukkan alasan penolakan..."
                                rows={2}
                                className="text-xs"
                              />
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => { setRejectingId(null); setAlasanTolak(""); }}>
                                  Batal
                                </Button>
                                <Button variant="destructive" size="sm" className="text-xs h-8" onClick={() => handleReject(d.id)} disabled={!alasanTolak.trim() || rejectMutation.isPending}>
                                  {rejectMutation.isPending ? "Proses..." : "Tolak Donasi"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Image Zoom Modal */}
      <Dialog open={!!zoomImage} onOpenChange={(open) => { if (!open) setZoomImage(null); }}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 flex items-center justify-center bg-black/90 border-none">
          {zoomImage && (
            <img src={zoomImage} alt="Bukti Bayar" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DonasiPublikAdmin;
