import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download } from "lucide-react";

export function PWAInstallPrompt() {
  const { showInstallDialog, install, dismiss } = usePWAInstall();

  return (
    <Dialog open={showInstallDialog} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-4">
            <img
              src="/pwa-192x192.png"
              alt="HBH MDTI"
              className="w-20 h-20 rounded-2xl shadow-lg"
            />
          </div>
          <DialogTitle className="text-xl font-bold">
            Install HBH MDTI
          </DialogTitle>
          <DialogDescription className="text-center">
            Instal aplikasi HBH MDTI di perangkat Anda untuk akses cepat dan
            pengalaman yang lebih baik.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 px-2 py-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            Akses langsung dari layar utama
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            Tampilan layar penuh tanpa browser
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            Performa lebih cepat
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={install}
            className="w-full bg-green-700 hover:bg-green-800"
          >
            <Download className="mr-2 h-4 w-4" />
            Instal Sekarang
          </Button>
          <Button
            variant="ghost"
            onClick={dismiss}
            className="w-full text-muted-foreground"
          >
            Nanti Saja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
