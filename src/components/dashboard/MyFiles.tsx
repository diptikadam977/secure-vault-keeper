import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, Share2, Trash2, Loader2, FileText, QrCode, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ShareQRCode } from "./ShareQRCode";
import { ShareModeSelector, ShareMode } from "./ShareModeSelector";
import { EmailShareForm } from "./EmailShareForm";
import {
  importPrivateKey,
  getPrivateKey,
  decryptKeyWithRSA,
  importAESKey,
  decryptWithAES,
} from "@/lib/crypto";

interface EncryptedFile {
  id: string;
  file_name: string;
  file_size: number;
  encrypted_key: string;
  encrypted_data: string;
  created_at: string;
}

export const MyFiles = () => {
  const [files, setFiles] = useState<EncryptedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareEmail, setShareEmail] = useState("");
  const [expirationTime, setExpirationTime] = useState<string>("24h");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<EncryptedFile | null>(null);
  const [generatedShareId, setGeneratedShareId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [currentExpiresAt, setCurrentExpiresAt] = useState<string | null>(null);
  const [currentEncryptionKey, setCurrentEncryptionKey] = useState<string>("");
  const [sharing, setSharing] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("encrypted_files")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Load error:", error);
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const getDecryptedKey = async (encryptedKey: string): Promise<string> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const privateKeyBase64 = getPrivateKey(userData.user.id);
    if (!privateKeyBase64) {
      throw new Error("Private key not found. Please generate your keys.");
    }

    const privateKey = await importPrivateKey(privateKeyBase64);
    const aesKeyBuffer = await decryptKeyWithRSA(encryptedKey, privateKey);
    
    const keyArray = new Uint8Array(aesKeyBuffer);
    return Array.from(keyArray).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const downloadFile = async (file: EncryptedFile) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const privateKeyBase64 = getPrivateKey(userData.user.id);
      if (!privateKeyBase64) {
        toast.error("Private key not found. Please generate your keys.");
        return;
      }

      const privateKey = await importPrivateKey(privateKeyBase64);
      const aesKeyBuffer = await decryptKeyWithRSA(file.encrypted_key, privateKey);
      const aesKey = await importAESKey(aesKeyBuffer);

      const encryptedBinary = atob(file.encrypted_data);
      const encryptedBytes = new Uint8Array(encryptedBinary.length);
      for (let i = 0; i < encryptedBinary.length; i++) {
        encryptedBytes[i] = encryptedBinary.charCodeAt(i);
      }

      const iv = encryptedBytes.slice(0, 12);
      const data = encryptedBytes.slice(12);
      const decryptedData = await decryptWithAES(data.buffer, aesKey, iv);

      const blob = new Blob([decryptedData]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("File decrypted and downloaded!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to decrypt file");
    }
  };

  const shareFileQR = async (file: EncryptedFile) => {
    setSharing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const hexKey = await getDecryptedKey(file.encrypted_key);

      const now = new Date();
      let expiresAt: string | null = null;
      
      if (expirationTime === "24h") {
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      } else if (expirationTime === "7d") {
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (expirationTime === "30d") {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      const { data: shareData, error: shareError } = await supabase.from("file_shares").insert({
        file_id: file.id,
        shared_by: userData.user.id,
        shared_with_email: shareEmail || "public",
        encrypted_key: null,
        expires_at: expiresAt,
      }).select().single();

      if (shareError) throw shareError;

      setGeneratedShareId(shareData.id);
      setCurrentFileName(file.file_name);
      setCurrentExpiresAt(expiresAt);
      setCurrentEncryptionKey(hexKey);

      toast.success("Share link & QR code generated!");
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to generate share link");
    } finally {
      setSharing(false);
    }
  };

  const resetShareDialog = () => {
    setShareDialogOpen(false);
    setCurrentFileId(null);
    setCurrentFile(null);
    setShareEmail("");
    setExpirationTime("24h");
    setGeneratedShareId(null);
    setCurrentFileName("");
    setCurrentExpiresAt(null);
    setCurrentEncryptionKey("");
    setShareMode(null);
  };

  const handleModeSelect = (mode: ShareMode) => {
    setShareMode(mode);
  };

  const deleteFile = async (id: string) => {
    try {
      const { error } = await supabase.from("encrypted_files").delete().eq("id", id);
      if (error) throw error;

      setFiles(files.filter((f) => f.id !== id));
      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete file");
    }
  };

  if (loading) {
    return (
      <Card className="bg-card shadow-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="bg-card shadow-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            My Encrypted Files
          </CardTitle>
          <CardDescription>No files uploaded yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-card shadow-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          My Encrypted Files
        </CardTitle>
        <CardDescription>
          {files.length} file{files.length !== 1 ? "s" : ""} stored securely
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50 hover:bg-background/80 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium">{file.file_name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.file_size / 1024).toFixed(2)} KB •{" "}
                  {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadFile(file)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Dialog open={shareDialogOpen && currentFileId === file.id} onOpenChange={(open) => {
                  if (open) {
                    setShareDialogOpen(true);
                    setCurrentFileId(file.id);
                    setCurrentFile(file);
                  } else {
                    resetShareDialog();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5" />
                        Share File
                      </DialogTitle>
                      <DialogDescription>
                        {file.file_name}
                      </DialogDescription>
                    </DialogHeader>
                    
                    {generatedShareId ? (
                      <ShareQRCode
                        shareId={generatedShareId}
                        fileName={currentFileName}
                        expiresAt={currentExpiresAt}
                        encryptionKey={currentEncryptionKey}
                      />
                    ) : shareMode === null ? (
                      <ShareModeSelector onSelect={handleModeSelect} />
                    ) : shareMode === "email" && currentFile ? (
                      <EmailShareForm
                        fileId={currentFile.id}
                        fileName={currentFile.file_name}
                        encryptedKey={currentFile.encrypted_key}
                        onBack={() => setShareMode(null)}
                        onSuccess={resetShareDialog}
                        getDecryptedKey={() => getDecryptedKey(currentFile.encrypted_key)}
                      />
                    ) : shareMode === "qr" ? (
                      <div className="space-y-4 py-4 animate-page-in">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShareMode(null)}
                          className="gap-2 -ml-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back
                        </Button>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Recipient Email (optional)</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="friend@example.com"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Leave empty to create a public share link
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiration">Link Expiration</Label>
                          <Select value={expirationTime} onValueChange={setExpirationTime}>
                            <SelectTrigger id="expiration">
                              <SelectValue placeholder="Select expiration" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="24h">24 Hours</SelectItem>
                              <SelectItem value="7d">7 Days</SelectItem>
                              <SelectItem value="30d">30 Days</SelectItem>
                              <SelectItem value="never">Never Expires</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={() => currentFile && shareFileQR(currentFile)}
                          disabled={sharing}
                          className="w-full gap-2"
                        >
                          {sharing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <QrCode className="w-4 h-4" />
                              Generate QR Code
                            </>
                          )}
                        </Button>
                      </div>
                    ) : null}
                  </DialogContent>
                </Dialog>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteFile(file.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
