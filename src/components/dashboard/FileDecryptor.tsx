import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Unlock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const FileDecryptor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [decryptionKey, setDecryptionKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      toast.success(`File selected: ${e.target.files[0].name}`);
    }
  };

  const decryptFile = async () => {
    if (!file || !decryptionKey) {
      toast.error("Please select a file and enter the decryption key");
      return;
    }

    setLoading(true);
    try {
      // Read encrypted file
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      // Extract IV and encrypted data
      const iv = data.slice(0, 12);
      const encryptedData = data.slice(12);

      // Convert hex key to bytes
      const keyBytes = new Uint8Array(decryptionKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

      // Import key for AES-GCM
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        encryptedData
      );

      // Create download with original filename
      const originalName = file.name.replace(".encrypted", "");
      const blob = new Blob([decryptedData]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("File decrypted successfully!");
    } catch (error) {
      console.error("Decryption error:", error);
      toast.error("Failed to decrypt file. Check your key and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Unlock className="w-5 h-5 text-accent" />
          Decrypt File
        </CardTitle>
        <CardDescription>
          Upload an encrypted file and decrypt it
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="decrypt-file-upload">Select Encrypted File</Label>
          <div className="flex gap-2">
            <Input
              id="decrypt-file-upload"
              type="file"
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.getElementById("decrypt-file-upload")?.click()}
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
          <Label htmlFor="decryption-key">Decryption Key (64 hex characters)</Label>
          <Input
            id="decryption-key"
            type="text"
            value={decryptionKey}
            onChange={(e) => setDecryptionKey(e.target.value)}
            placeholder="Enter your decryption key"
            className="font-mono text-sm"
            maxLength={64}
          />
          <p className="text-xs text-destructive">
            Warning: Wrong key will result in decryption failure
          </p>
        </div>

        <Button
          onClick={decryptFile}
          disabled={loading || !file || decryptionKey.length !== 64}
          className="w-full bg-accent hover:shadow-glow transition-all duration-300"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Decrypting...
            </>
          ) : (
            <>
              <Unlock className="mr-2 h-4 w-4" />
              Decrypt File
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
