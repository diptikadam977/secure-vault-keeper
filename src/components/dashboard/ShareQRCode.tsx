import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Key } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareQRCodeProps {
  shareId: string;
  fileName: string;
  expiresAt: string | null;
  encryptionKey?: string;
}

export const ShareQRCode = ({ shareId, fileName, expiresAt, encryptionKey }: ShareQRCodeProps) => {
  const [copied, setCopied] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/download/${shareId}`;
  
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const copyKey = async () => {
    if (!encryptionKey) return;
    try {
      await navigator.clipboard.writeText(encryptionKey);
      setKeyCopied(true);
      toast.success("Encryption key copied!");
      setTimeout(() => setKeyCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy key");
    }
  };

  const copyAll = async () => {
    const text = `🔐 Encrypted File Share\n\n📄 File: ${fileName}\n🔗 Link: ${shareUrl}\n🔑 Key: ${encryptionKey || "N/A"}\n⏰ ${formatExpiry(expiresAt)}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Share details copied!");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };
  
  const downloadQR = () => {
    const svg = document.getElementById(`qr-${shareId}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `qr-${fileName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };
  
  const formatExpiry = (date: string | null) => {
    if (!date) return "Never expires";
    const expiry = new Date(date);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `Expires in ${days} days`;
    if (hours > 0) return `Expires in ${hours} hours`;
    return "Expires soon";
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-background rounded-lg border border-border animate-page-in">
      <div className="p-4 bg-white rounded-xl shadow-md">
        <QRCodeSVG
          id={`qr-${shareId}`}
          value={shareUrl}
          size={180}
          level="H"
          includeMargin={true}
        />
      </div>
      
      <div className="text-center space-y-1">
        <p className="font-medium text-foreground text-sm">{fileName}</p>
        <p className="text-xs text-muted-foreground">{formatExpiry(expiresAt)}</p>
      </div>

      {encryptionKey && (
        <div className="w-full space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Key className="w-3 h-3" />
            <span>Encryption Key (share with recipient)</span>
          </div>
          <div className="relative">
            <code className="block w-full p-2 pr-10 bg-muted rounded text-xs font-mono break-all text-foreground/80">
              {encryptionKey}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyKey}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            >
              {keyCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex gap-2 w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={copyLink}
          className="flex-1 gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadQR}
          className="flex-1 gap-2"
        >
          <Download className="w-4 h-4" />
          Save QR
        </Button>
      </div>

      {encryptionKey && (
        <Button
          variant="secondary"
          size="sm"
          onClick={copyAll}
          className="w-full gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy All Details
        </Button>
      )}
      
      <p className="text-xs text-muted-foreground text-center break-all px-2">
        {shareUrl}
      </p>
    </div>
  );
};
