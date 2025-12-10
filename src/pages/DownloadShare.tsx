import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Download, Loader2, AlertCircle, Clock, FileText, Key } from "lucide-react";
import { toast } from "sonner";
import {
  importPrivateKey,
  getPrivateKey,
  decryptKeyWithRSA,
  importAESKey,
  decryptWithAES,
} from "@/lib/crypto";

const DownloadShare = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [manualKey, setManualKey] = useState("");
  const [shareData, setShareData] = useState<{
    fileName: string;
    fileSize: number;
    sharedBy: string;
    expiresAt: string | null;
    isExpired: boolean;
    fileId: string;
    encryptedData: string;
    encryptedKey: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadShareData();
  }, [shareId]);

  const loadShareData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: share, error: shareError } = await supabase
        .from("file_shares")
        .select(`
          *,
          encrypted_files (
            file_name,
            file_size,
            encrypted_data,
            encrypted_key
          )
        `)
        .eq("id", shareId)
        .maybeSingle();

      if (shareError) throw shareError;

      if (!share) {
        setError("Share link not found or has been revoked");
        setLoading(false);
        return;
      }

      const isExpired = share.expires_at ? new Date(share.expires_at) < new Date() : false;

      setShareData({
        fileName: share.encrypted_files?.file_name || "Unknown file",
        fileSize: share.encrypted_files?.file_size || 0,
        sharedBy: share.shared_by,
        expiresAt: share.expires_at,
        isExpired,
        fileId: share.file_id,
        encryptedData: share.encrypted_files?.encrypted_data || "",
        encryptedKey: share.encrypted_files?.encrypted_key || null,
      });
    } catch (error) {
      console.error("Error loading share:", error);
      setError("Failed to load share data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWithKey = async () => {
    if (!shareData || !manualKey || manualKey.length !== 64) {
      toast.error("Please enter a valid 64-character decryption key");
      return;
    }

    setDownloading(true);
    try {
      // Convert hex key to bytes
      const keyBytes = new Uint8Array(manualKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

      // Import key for AES-GCM
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      // Decode base64 encrypted data
      const encryptedBinary = atob(shareData.encryptedData);
      const encryptedBytes = new Uint8Array(encryptedBinary.length);
      for (let i = 0; i < encryptedBinary.length; i++) {
        encryptedBytes[i] = encryptedBinary.charCodeAt(i);
      }

      // Extract IV and encrypted data
      const iv = encryptedBytes.slice(0, 12);
      const data = encryptedBytes.slice(12);

      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        data
      );

      // Create and download file
      const blob = new Blob([decryptedData]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = shareData.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("File decrypted and downloaded!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to decrypt file. Check your key and try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadWithPrivateKey = async () => {
    if (!shareData || !user || !shareData.encryptedKey) return;

    setDownloading(true);
    try {
      // Get user's private key
      const privateKeyBase64 = getPrivateKey(user.id);
      if (!privateKeyBase64) {
        toast.error("Private key not found. Please generate your keys first.");
        navigate("/dashboard");
        return;
      }

      // Import private key
      const privateKey = await importPrivateKey(privateKeyBase64);

      // Decrypt AES key with RSA private key
      const aesKeyBuffer = await decryptKeyWithRSA(shareData.encryptedKey, privateKey);
      const aesKey = await importAESKey(aesKeyBuffer);

      // Decode base64 encrypted data
      const encryptedBinary = atob(shareData.encryptedData);
      const encryptedBytes = new Uint8Array(encryptedBinary.length);
      for (let i = 0; i < encryptedBinary.length; i++) {
        encryptedBytes[i] = encryptedBinary.charCodeAt(i);
      }

      // Extract IV and encrypted data
      const iv = encryptedBytes.slice(0, 12);
      const data = encryptedBytes.slice(12);

      // Decrypt file with AES
      const decryptedData = await decryptWithAES(data.buffer, aesKey, iv);

      // Create and download file
      const blob = new Blob([decryptedData]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = shareData.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("File downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to decrypt file. You may not have permission.");
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatExpiry = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString() + " " + new Date(date).toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card shadow-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading share...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card shadow-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Share Not Found</h2>
            <p className="text-muted-foreground mb-6">{error || "This share link is invalid or has been removed."}</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (shareData.isExpired) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card shadow-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Share Expired</h2>
            <p className="text-muted-foreground mb-2">This share link has expired.</p>
            <p className="text-sm text-muted-foreground mb-6">
              Expired on: {formatExpiry(shareData.expiresAt)}
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card shadow-card border-border animate-page-in">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-background" />
          </div>
          <CardTitle>Encrypted File Share</CardTitle>
          <CardDescription>Someone shared an encrypted file with you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-background/50 border border-border space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="w-10 h-10 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{shareData.fileName}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(shareData.fileSize)}</p>
              </div>
            </div>
            
            {shareData.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Expires: {formatExpiry(shareData.expiresAt)}</span>
              </div>
            )}
          </div>

          {/* Manual key input for decryption */}
          <div className="space-y-3">
            <Label htmlFor="decryption-key" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Decryption Key
            </Label>
            <Input
              id="decryption-key"
              type="text"
              value={manualKey}
              onChange={(e) => setManualKey(e.target.value)}
              placeholder="Enter 64-character hex key"
              className="font-mono text-sm"
              maxLength={64}
            />
            <p className="text-xs text-muted-foreground">
              Ask the file owner for the decryption key
            </p>
          </div>

          <Button
            onClick={handleDownloadWithKey}
            disabled={downloading || manualKey.length !== 64}
            className="w-full gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Decrypting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download & Decrypt
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This file is encrypted with AES-256-GCM encryption. You need the correct key to decrypt it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DownloadShare;