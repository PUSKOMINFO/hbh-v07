import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface PWAInstallDialogProps {
  open: boolean;
  onInstall: () => void;
  onDismiss: () => void;
  canInstall: boolean;
}

const PWAInstallDialog = ({ open, onInstall, onDismiss, canInstall }: PWAInstallDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onDismiss()}>
      <DialogContent className="sm:max-w-sm mx-auto rounded-2xl">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-3">
            <img
              src="/logo-mdti.jpg"
              alt="Logo MDTI"
              className="h-20 w-20 rounded-2xl shadow-lg object-cover"
            />
          </div>
          <DialogTitle className="text-lg font-bold">HBH MDTI</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Install aplikasi Halal Bi Halal MDTI untuk akses lebih cepat langsung dari layar utama perangkat Anda.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {canInstall ? (
            <Button onClick={onInstall} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Install Sekarang
            </Button>
          ) : (
            <div className="text-center text-xs text-muted-foreground px-2">
              <p className="font-medium mb-1">Cara Install:</p>
              <p>Buka menu browser → <strong>"Add to Home Screen"</strong> atau <strong>"Install App"</strong></p>
            </div>
          )}
          <Button variant="ghost" onClick={onDismiss} className="w-full gap-2 text-muted-foreground">
            <X className="h-4 w-4" />
            Nanti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallDialog;
