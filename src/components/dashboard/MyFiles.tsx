import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Share2, Trash2, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  importPrivateKey,
  getPrivateKey,
  decryptKeyWithRSA,
  importAESKey,
  decryptWithAES,
  importPublicKey,
  encryptKeyWithRSA,
  exportAESKey,
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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);

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

  const downloadFile = async (file: EncryptedFile) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Get private key from localStorage
      const privateKeyBase64 = getPrivateKey(userData.user.id);
      if (!privateKeyBase64) {
        toast.error("Private key not found. Please generate your keys.");
        return;
      }

      // Import private key
      const privateKey = await importPrivateKey(privateKeyBase64);

      // Decrypt AES key with RSA private key
      const aesKeyBuffer = await decryptKeyWithRSA(file.encrypted_key, privateKey);
      const aesKey = await importAESKey(aesKeyBuffer);

      // Decode base64 encrypted data
      const encryptedBinary = atob(file.encrypted_data);
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

  const shareFile = async (fileId: string) => {
    if (!shareEmail) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Get the file's encrypted key
      const { data: fileData, error: fileError } = await supabase
        .from("encrypted_files")
        .select("encrypted_key")
        .eq("id", fileId)
        .single();

      if (fileError || !fileData) {
        toast.error("Could not retrieve file data");
        return;
      }

      // Get user's private key to decrypt the file's AES key
      const privateKeyBase64 = getPrivateKey(userData.user.id);
      if (!privateKeyBase64) {
        toast.error("Your private key not found");
        return;
      }

      // Decrypt the AES key with user's private key
      const privateKey = await importPrivateKey(privateKeyBase64);
      const aesKeyBuffer = await decryptKeyWithRSA(fileData.encrypted_key, privateKey);

      // Get recipient's public key - simplified version (in production, you'd look up by email)
      // For now, just insert without re-encryption (recipient will need keys)
      const { error: shareError } = await supabase.from("file_shares").insert({
        file_id: fileId,
        shared_by: userData.user.id,
        shared_with_email: shareEmail,
        encrypted_key: null, // Will be updated when recipient has keys
      });

      if (shareError) throw shareError;

      toast.success(`File shared with ${shareEmail}!`);
      setShareEmail("");
      setShareDialogOpen(false);
      setCurrentFileId(null);
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share file");
    }
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
                  setShareDialogOpen(open);
                  if (open) {
                    setCurrentFileId(file.id);
                  } else {
                    setCurrentFileId(null);
                    setShareEmail("");
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share File</DialogTitle>
                      <DialogDescription>
                        Enter the email address of the person you want to share this file with
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input
                        type="email"
                        placeholder="recipient@example.com"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                      />
                      <Button
                        onClick={() => shareFile(file.id)}
                        className="w-full"
                      >
                        Share File
                      </Button>
                    </div>
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
