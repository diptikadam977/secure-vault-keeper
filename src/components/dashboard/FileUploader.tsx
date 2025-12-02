import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  generateAESKey,
  exportAESKey,
  encryptWithAES,
  importPublicKey,
  encryptKeyWithRSA,
  getPrivateKey,
} from "@/lib/crypto";

export const FileUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const encryptAndUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Check if user has keys set up
      const privateKey = getPrivateKey(userData.user.id);
      if (!privateKey) {
        toast.error("Please generate your encryption keys first");
        setLoading(false);
        return;
      }

      // Get user's public key from database
      const { data: userKeys, error: keyError } = await supabase
        .from("user_keys")
        .select("public_key")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (keyError || !userKeys) {
        toast.error("Please generate your encryption keys first");
        setLoading(false);
        return;
      }

      // Generate AES symmetric key for file encryption
      const aesKey = await generateAESKey();
      const aesKeyBuffer = await exportAESKey(aesKey);

      // Read file
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      // Encrypt file with AES
      const { encryptedData, iv } = await encryptWithAES(data, aesKey);

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Convert to base64 safely for large files by processing in chunks
      let binary = "";
      const chunkSize = 0x8000; // 32KB per chunk to avoid call stack limits
      for (let i = 0; i < combined.length; i += chunkSize) {
        const chunk = combined.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
      }
      const encryptedBase64 = btoa(binary);

      // Encrypt AES key with user's public RSA key
      const publicKey = await importPublicKey(userKeys.public_key);
      const encryptedAESKey = await encryptKeyWithRSA(aesKeyBuffer, publicKey);

      // Save to database
      const { error } = await supabase.from("encrypted_files").insert({
        user_id: userData.user.id,
        file_name: file.name,
        file_size: file.size,
        encrypted_key: encryptedAESKey, // AES key encrypted with RSA
        encrypted_data: encryptedBase64,
      });

      if (error) throw error;

      toast.success("File encrypted and saved successfully!");
      setFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card shadow-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Upload & Encrypt File
        </CardTitle>
        <CardDescription>
          Upload a file to encrypt and store securely
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="file"
            onChange={handleFileSelect}
            accept="*/*"
            className="cursor-pointer"
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <Button
          onClick={encryptAndUpload}
          disabled={!file || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Encrypting...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Encrypt & Upload
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
