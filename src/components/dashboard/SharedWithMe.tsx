import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  importPrivateKey,
  getPrivateKey,
  decryptKeyWithRSA,
  importAESKey,
  decryptWithAES,
} from "@/lib/crypto";

interface SharedFile {
  id: string;
  file_id: string;
  shared_by: string;
  encrypted_key: string | null;
  created_at: string;
  expires_at: string | null;
  encrypted_files: {
    file_name: string;
    file_size: number;
    encrypted_key: string;
    encrypted_data: string;
  };
}

export const SharedWithMe = () => {
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedFiles();
  }, []);

  const loadSharedFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("file_shares")
        .select(`
          *,
          encrypted_files (
            file_name,
            file_size,
            encrypted_key,
            encrypted_data
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSharedFiles(data || []);
    } catch (error) {
      console.error("Load error:", error);
      toast.error("Failed to load shared files");
    } finally {
      setLoading(false);
    }
  };

  const downloadSharedFile = async (file: SharedFile) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Get private key from localStorage
      const privateKeyBase64 = getPrivateKey(userData.user.id);
      if (!privateKeyBase64) {
        toast.error("Private key not found. Please generate your keys.");
        return;
      }

      // Check if we have encrypted_key in the share (new system)
      if (file.encrypted_key) {
        // New system: Use RSA-encrypted key from file_shares
        const privateKey = await importPrivateKey(privateKeyBase64);
        const aesKeyBuffer = await decryptKeyWithRSA(file.encrypted_key, privateKey);
        const aesKey = await importAESKey(aesKeyBuffer);

        // Decode base64 encrypted data
        const encryptedBinary = atob(file.encrypted_files.encrypted_data);
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
        a.download = file.encrypted_files.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("File decrypted and downloaded!");
      } else {
        toast.error("This file was shared before the key exchange system was set up. Please ask the owner to re-share it.");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to decrypt file");
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

  if (sharedFiles.length === 0) {
    return (
      <Card className="bg-card shadow-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Shared With Me
          </CardTitle>
          <CardDescription>No files shared with you yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-card shadow-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Shared With Me
        </CardTitle>
        <CardDescription>
          {sharedFiles.length} file{sharedFiles.length !== 1 ? "s" : ""} shared with you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sharedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50 hover:bg-background/80 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{file.encrypted_files.file_name}</p>
                  {file.expires_at && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires {new Date(file.expires_at).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {(file.encrypted_files.file_size / 1024).toFixed(2)} KB •{" "}
                  Shared {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadSharedFile(file)}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
