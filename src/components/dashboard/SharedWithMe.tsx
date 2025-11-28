import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SharedFile {
  id: string;
  file_id: string;
  shared_by: string;
  created_at: string;
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
      const fileData = file.encrypted_files;
      
      // Decode base64 encrypted data
      const encryptedBytes = Uint8Array.from(atob(fileData.encrypted_data), c => c.charCodeAt(0));
      
      // Extract IV and encrypted content
      const iv = encryptedBytes.slice(0, 12);
      const encryptedContent = encryptedBytes.slice(12);

      // Import key
      const keyData = Uint8Array.from(atob(fileData.encrypted_key), c => c.charCodeAt(0));
      const key = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      // Decrypt
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedContent
      );

      // Download
      const blob = new Blob([decrypted]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileData.file_name;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("File downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  if (loading) {
    return (
      <Card className="bg-card shadow-card border-border">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading shared files...</p>
        </CardContent>
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
          Files that others have shared with you
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sharedFiles.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No files shared with you yet
          </p>
        ) : (
          <div className="space-y-3">
            {sharedFiles.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between p-4 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {share.encrypted_files.file_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(share.encrypted_files.file_size / 1024).toFixed(2)} KB • Shared {new Date(share.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadSharedFile(share)}
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
