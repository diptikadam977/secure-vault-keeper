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
  const scannedRef = useRef(false);

  const containerId = "qr-reader";

  const startScanning = () => {
    setErrorMessage("");
    setStatus("scanning");
  };

  useEffect(() => {

    if (status !== "scanning") return;

    const initScanner = async () => {
      try {

        const element = document.getElementById(containerId);
        if (!element) return;

        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
        scannedRef.current = false;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          async (decodedText) => {

            if (scannedRef.current) return;
            scannedRef.current = true;

            await handleScanResult(decodedText);

          }
        );

      } catch (err) {

        console.error(err);

        toast.error("Camera permission denied or camera not available");

        setStatus("idle");

      }
    };

    const timer = setTimeout(initScanner, 200);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };

  }, [status]);

  const stopScanner = async () => {

    try {

      if (scannerRef.current) {

        await scannerRef.current.stop();
        await scannerRef.current.clear();

        scannerRef.current = null;

      }

    } catch (err) {
      console.log(err);
    }

  };

  const handleScanResult = async (url: string) => {

    await stopScanner();

    let shareId: string | null = null;

    try {

      const parsed = new URL(url);

      const match = parsed.pathname.match(/\/download\/(.+)$/);

      if (match) shareId = match[1];

    } catch {

      if (/^[0-9a-f-]{36}$/i.test(url)) {
        shareId = url;
      }

      const match = url.match(/\/download\/(.+)$/);

      if (match) shareId = match[1];

    }

    if (!shareId) {

      setStatus("error");

      setErrorMessage("Invalid QR code");

      return;

    }

    setStatus("validating");

    try {

      const { data, error } = await supabase
        .from("file_shares")
        .select("id, file_id, expires_at")
        .eq("id", shareId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {

        setStatus("error");

        setErrorMessage("Share link not found");

        return;

      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {

        setStatus("error");

        setErrorMessage("Share link expired");

        return;

      }

      setStatus("success");

      toast.success("QR verified");

      setTimeout(() => {

        navigate(`/download/${shareId}`);

      }, 1200);

    } catch (err) {

      console.error(err);

      setStatus("error");

      setErrorMessage("Validation failed");

    }

  };

  const resetScanner = () => {

    setErrorMessage("");

    setStatus("idle");

  };

  useEffect(() => {

    return () => {

      stopScanner();

    };

  }, []);

  return (

    <Card className="shadow-lg">

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="w-5 h-5" />
          Scan QR Code
        </CardTitle>
        <CardDescription>
          Scan a QR to access shared file
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        {status === "scanning" && (

          <>
            <div
              id={containerId}
              className="w-full rounded-lg overflow-hidden border"
            />

            <Button
              variant="outline"
              onClick={stopScanner}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </>

        )}

        {status === "validating" && (

          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="animate-spin w-8 h-8" />
            <p>Validating...</p>
          </div>

        )}

        {status === "success" && (

          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="text-green-500 w-10 h-10" />
            <p>QR Verified</p>
          </div>

        )}

        {status === "error" && (

          <div className="flex flex-col items-center gap-3">

            <AlertCircle className="text-red-500 w-10 h-10" />

            <p className="text-red-500 text-center">{errorMessage}</p>

            <div className="flex gap-2 w-full">

              <Button
                variant="outline"
                onClick={resetScanner}
                className="flex-1"
              >
                Cancel
              </Button>

              <Button
                onClick={startScanning}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                Retry
              </Button>

            </div>

          </div>

        )}

        {status === "idle" && (

          <Button
            onClick={startScanning}
            className="w-full"
          >
            <Camera className="w-4 h-4 mr-2" />
            Open Scanner
          </Button>

        )}

      </CardContent>

    </Card>

  );

};
