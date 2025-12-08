import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, Lock, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const FileEncryptor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [encryptionKey, setEncryptionKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateKey = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const key = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    setEncryptionKey(key);
    toast.success("Encryption key generated!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      toast.success(`File selected: ${e.target.files[0].name}`);
    }
  };

  const encryptFile = async () => {
    if (!file || !encryptionKey) {
      toast.error("Please select a file and enter an encryption key");
      return;
    }

    setLoading(true);
    setProgress(0);
    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 85));
      }, 150);

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      setProgress(40);
      
      // Convert hex key to bytes
      const keyBytes = new Uint8Array(encryptionKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      
      // Import key for AES-GCM
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
      );

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      setProgress(60);
      
      // Encrypt
      const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        arrayBuffer
      );
      
      setProgress(90);
      clearInterval(progressInterval);

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Create download
      const blob = new Blob([combined], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name}.encrypted`;
      a.click();
      URL.revokeObjectURL(url);
      
      setProgress(100);
      toast.success("File encrypted successfully!");
    } catch (error) {
      console.error("Encryption error:", error);
      toast.error("Failed to encrypt file");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          Encrypt File
        </CardTitle>
        <CardDescription>
          Upload a file and encrypt it with AES-256-GCM
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select File</Label>
          <div className="flex gap-2">
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="w-4 h-4" />
            </Button>
          </div>
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="encryption-key">Encryption Key (64 hex characters)</Label>
          <div className="flex gap-2">
            <Input
              id="encryption-key"
              type="text"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              placeholder="Enter or generate a key"
              className="font-mono text-sm flex-1"
              maxLength={64}
            />
            <Button
              variant="outline"
              onClick={generateKey}
            >
              Generate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Keep this key safe! You'll need it to decrypt the file.
          </p>
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground animate-progress-pulse">Encrypting...</span>
              <span className="font-mono text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button
          onClick={encryptFile}
          disabled={loading || !file || encryptionKey.length !== 64}
          className="w-full bg-gradient-primary btn-glow"
          variant="glow"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Encrypting...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Encrypt File
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
