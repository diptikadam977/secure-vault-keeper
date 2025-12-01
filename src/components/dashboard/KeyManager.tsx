import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Loader2, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateKeyPair, exportKeys, storePrivateKey, getPrivateKey } from "@/lib/crypto";

export const KeyManager = () => {
  const [hasKeys, setHasKeys] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    checkForKeys();
  }, []);

  const checkForKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has keys in database
      const { data: userKeys } = await supabase
        .from("user_keys")
        .select("id")
        .eq("user_id", user.id)
        .single();

      // Check if private key is in localStorage
      const privateKey = getPrivateKey(user.id);

      setHasKeys(!!userKeys && !!privateKey);
    } catch (error) {
      console.error("Error checking keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateKeys = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate RSA key pair
      const keyPair = await generateKeyPair();
      const exportedKeys = await exportKeys(keyPair);

      // Store public key in database
      const { error: dbError } = await supabase
        .from("user_keys")
        .upsert({
          user_id: user.id,
          public_key: exportedKeys.publicKey,
        });

      if (dbError) throw dbError;

      // Store private key in localStorage (encrypted in production)
      storePrivateKey(exportedKeys.privateKey, user.id);

      setHasKeys(true);
      toast.success("Encryption keys generated successfully!");
    } catch (error) {
      console.error("Key generation error:", error);
      toast.error("Failed to generate encryption keys");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card shadow-card border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (hasKeys) {
    return (
      <Card className="bg-card shadow-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Encryption Keys Active
          </CardTitle>
          <CardDescription>
            Your encryption keys are set up and ready to use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              Your files are protected with end-to-end encryption using RSA-2048 + AES-256-GCM.
              Your private key is stored securely on your device.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card shadow-card border-border border-2 border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Encryption Keys Required
        </CardTitle>
        <CardDescription>
          Generate your encryption keys to start using SecureVault
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must generate encryption keys before you can upload or access files.
            These keys enable end-to-end encryption and secure file sharing.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">What happens when you generate keys:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>A unique RSA-2048 key pair is created for you</li>
            <li>Your public key is stored in the database for file sharing</li>
            <li>Your private key is stored securely on your device</li>
            <li>You can encrypt and share files with other users</li>
          </ul>
        </div>

        <Button
          onClick={generateKeys}
          disabled={generating}
          className="w-full"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Keys...
            </>
          ) : (
            <>
              <Key className="w-4 h-4" />
              Generate Encryption Keys
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
