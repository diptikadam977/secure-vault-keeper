import { Mail, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ShareMode = "email" | "qr";

interface ShareModeSelectorProps {
  onSelect: (mode: ShareMode) => void;
}

export const ShareModeSelector = ({ onSelect }: ShareModeSelectorProps) => {
  return (
    <div className="space-y-4 py-4 animate-page-in">
      <p className="text-sm text-muted-foreground text-center">
        How would you like to share this file?
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="h-auto flex-col gap-3 p-6 hover:bg-primary/5 hover:border-primary transition-all"
          onClick={() => onSelect("email")}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">Send via Email</p>
            <p className="text-xs text-muted-foreground mt-1">
              Send file link directly to email
            </p>
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="h-auto flex-col gap-3 p-6 hover:bg-primary/5 hover:border-primary transition-all"
          onClick={() => onSelect("qr")}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <QrCode className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">Share via QR</p>
            <p className="text-xs text-muted-foreground mt-1">
              Generate QR code to share
            </p>
          </div>
        </Button>
      </div>
    </div>
  );
};
