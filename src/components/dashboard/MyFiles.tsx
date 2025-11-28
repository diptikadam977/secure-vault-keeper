import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Trash2, File } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [shareFileId, setShareFileId] = useState<string | null>(null);

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
      // Decode base64 encrypted data
      const encryptedBytes = Uint8Array.from(atob(file.encrypted_data), c => c.charCodeAt(0));
      
      // Extract IV and encrypted content
      const iv = encryptedBytes.slice(0, 12);
      const encryptedContent = encryptedBytes.slice(12);

      // Import key
      const keyData = Uint8Array.from(atob(file.encrypted_key), c => c.charCodeAt(0));
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
      a.download = file.file_name;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("File downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const shareFile = async () => {
    if (!shareFileId || !shareEmail) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("file_shares").insert({
        file_id: shareFileId,
        shared_by: userData.user.id,
        shared_with_email: shareEmail,
      });

      if (error) throw error;

      toast.success(`File shared with ${shareEmail}!`);
      setShareEmail("");
      setShareFileId(null);
    } catch (error: any) {
      console.error("Share error:", error);
      toast.error(error.message || "Failed to share file");
    }
  };

  const deleteFile = async (id: string) => {
    try {
      const { error } = await supabase
        .from("encrypted_files")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFiles(files.filter(f => f.id !== id));
      toast.success("File deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete file");
    }
  };

  if (loading) {
    return (
      <Card className="bg-card shadow-card border-border">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading files...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card shadow-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="w-5 h-5 text-primary" />
          My Encrypted Files
        </CardTitle>
        <CardDescription>
          Manage your encrypted files
        </CardDescription>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No files uploaded yet
          </p>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.file_size / 1024).toFixed(2)} KB • {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(file)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShareFileId(file.id)}
                      >
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
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                          />
                        </div>
                        <Button
                          onClick={shareFile}
                          disabled={!shareEmail}
                          className="w-full"
                        >
                          Share File
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteFile(file.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
