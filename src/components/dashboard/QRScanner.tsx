import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, Camera, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";

type ScanStatus = "idle" | "scanning" | "validating" | "success" | "error";

export const QRScanner = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>("qr-reader-" + Math.random().toString(36).slice(2));

  const startScanning = async () => {
    setStatus("scanning");
    setErrorMessage("");
    try {
      const scanner = new Html5Qrcode(containerRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          handleScanResult(decodedText);
        },
        () => {}
      );
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Could not access camera. Please grant camera permissions.");
      setStatus("idle");
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch (e) {
      // ignore
    }
    scannerRef.current = null;
    if (status === "scanning") {
      setStatus("idle");
    }
  };

  const handleScanResult = async (url: string) => {
    // Stop camera immediately
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch (e) { /* ignore */ }
    scannerRef.current = null;

    // Parse the URL to extract share ID
    let shareId: string | null = null;
    try {
      const parsed = new URL(url);
      const path = parsed.pathname;
      const match = path.match(/\/download\/(.+)$/);
      if (match) {
        shareId = match[1];
      }
    } catch {
      // Not a valid URL – try raw string as share ID (UUID format)
      if (/^[0-9a-f-]{36}$/i.test(url)) {
        shareId = url;
      }
      // Also try if it's a relative path like /download/uuid
      const relMatch = url.match(/\/download\/(.+)$/);
      if (relMatch) {
        shareId = relMatch[1];
      }
    }

    if (!shareId) {
      setStatus("error");
      setErrorMessage("Invalid QR code. Not a valid SecureVault share link.");
      return;
    }

    // Validate the share token against the backend
    setStatus("validating");

    try {
      const { data: share, error } = await supabase
        .from("file_shares")
        .select("id, file_id, expires_at, encrypted_key, encrypted_files(file_name)")
        .eq("id", shareId)
        .maybeSingle();

      if (error) throw error;

      if (!share) {
        setStatus("error");
        setErrorMessage("Share not found. The link may have been revoked.");
        return;
      }

      // Check expiration
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        setStatus("error");
        setErrorMessage("This share link has expired and is no longer valid.");
        return;
      }

      // Valid share – show success and redirect
      setStatus("success");
      const fileName = (share.encrypted_files as any)?.file_name || "Encrypted file";
      toast.success(`QR code verified! File: ${fileName}`);

      // Brief delay to show success state, then redirect
      setTimeout(() => {
        navigate(`/download/${shareId}`);
      }, 1200);

    } catch (err) {
      console.error("Validation error:", err);
      setStatus("error");
      setErrorMessage("Failed to validate the share link. Please try again.");
    }
  };

  const resetScanner = () => {
    setStatus("idle");
    setErrorMessage("");
  };

  useEffect(() => {
    return () => {
      try {
        if (scannerRef.current?.isScanning) {
          scannerRef.current.stop();
        }
      } catch (e) { /* ignore */ }
      scannerRef.current = null;
    };
  }, []);

  return (
    <Card className="shadow-card hover:shadow-lg transition-all duration-300 border-primary/20 hover:border-primary/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ScanLine className="w-5 h-5 text-primary" />
          Scan QR Code
        </CardTitle>
        <CardDescription>
          Scan a QR code to access shared encrypted files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === "scanning" && (
          <div className="space-y-3 animate-page-in">
            <div className="relative">
              <div
                id={containerRef.current}
                className="w-full rounded-lg overflow-hidden border border-border"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-primary/40 rounded-lg animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Point your camera at a SecureVault QR code
            </p>
            <Button
              variant="outline"
              onClick={stopScanning}
              className="w-full gap-2"
            >
              <X className="w-4 h-4" />
              Stop Scanner
            </Button>
          </div>
        )}

        {status === "validating" && (
          <div className="flex flex-col items-center py-6 gap-3 animate-page-in">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Validating share link...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-6 gap-3 animate-page-in">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <p className="text-sm font-medium text-foreground">QR Code Verified!</p>
            <p className="text-xs text-muted-foreground">Redirecting to file...</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center py-4 gap-3 animate-page-in">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-sm text-center text-destructive font-medium">{errorMessage}</p>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={resetScanner}
                className="flex-1 gap-2"
              >
                Cancel
              </Button>
              <Button
                onClick={startScanning}
                className="flex-1 gap-2"
              >
                <Camera className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {status === "idle" && (
          <Button
            onClick={startScanning}
            className="w-full gap-2 bg-gradient-primary"
            variant="glow"
          >
            <Camera className="w-4 h-4" />
            Open Scanner
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
