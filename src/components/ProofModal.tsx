import { useState } from "react";
import { X, FileText, Image } from "lucide-react";

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  bukti?: {
    url: string;
    tipe: string;
    keterangan?: string;
  };
  transaksiKeterangan: string;
}

const ProofModal = ({
  isOpen,
  onClose,
  bukti,
  transaksiKeterangan,
}: ProofModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 animate-fade-in">
      <div
        className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-lg border border-border shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Bukti Pengeluaran</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {transaksiKeterangan}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {bukti ? (
          <div className="p-4 space-y-4">
            {bukti.tipe === "image" ? (
              <img
                src={bukti.url}
                alt="Bukti pengeluaran"
                className="w-full rounded-lg border border-border"
              />
            ) : (
              <div className="flex items-center justify-center bg-muted rounded-lg p-8 border border-border">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Dokumen</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {bukti.url.split("/").pop()}
                  </p>
                </div>
              </div>
            )}

            {bukti.keterangan && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Keterangan
                </p>
                <p className="text-sm">{bukti.keterangan}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Image className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-muted-foreground">
              Tidak ada bukti pengeluaran
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border p-4">
          <button
            onClick={onClose}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-medium hover:opacity-90 transition-opacity"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProofModal;
