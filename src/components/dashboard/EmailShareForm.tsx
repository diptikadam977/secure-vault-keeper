import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EmailShareFormProps {
  fileId: string;
  fileName: string;
  encryptedKey: string;
  onBack: () => void;
  onSuccess: () => void;
  getDecryptedKey: () => Promise<string>;
}

export const EmailShareForm = ({ 
  fileId, 
  fileName, 
  encryptedKey, 
  onBack, 
  onSuccess,
  getDecryptedKey 
}: EmailShareFormProps) => {
  const [email, setEmail] = useState("");
  const [expirationTime, setExpirationTime] = useState("24h");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) {
      toast.error("Please enter recipient email");
      return;
    }

    setSending(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Get decrypted key
      const hexKey = await getDecryptedKey();

      // Calculate expiration
      const now = new Date();
      let expiresAt: string | null = null;
      
      if (expirationTime === "24h") {
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      } else if (expirationTime === "7d") {
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (expirationTime === "30d") {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Create share record
      const { data: shareData, error: shareError } = await supabase.from("file_shares").insert({
        file_id: fileId,
        shared_by: userData.user.id,
        shared_with_email: email,
        encrypted_key: null,
        expires_at: expiresAt,
      }).select().single();

      if (shareError) throw shareError;

      const shareUrl = `${window.location.origin}/download/${shareData.id}`;

      // Get user profile for sender name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", userData.user.id)
        .single();

      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke("send-share-email", {
        body: {
          recipientEmail: email,
          fileName,
          shareUrl,
          encryptionKey: hexKey,
          expiresAt,
          senderName: profile?.display_name || userData.user.email,
        },
      });

      if (emailError) throw emailError;

      setSent(true);
      toast.success("Email sent successfully!");
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error("Email share error:", error);
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 animate-page-in">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground">Email Sent!</p>
          <p className="text-sm text-muted-foreground mt-1">
            {email} will receive the file link and decryption key
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 animate-page-in">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <div className="space-y-2">
        <Label htmlFor="recipient-email">Recipient Email</Label>
        <Input
          id="recipient-email"
          type="email"
          placeholder="friend@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-expiration">Link Expiration</Label>
        <Select value={expirationTime} onValueChange={setExpirationTime}>
          <SelectTrigger id="email-expiration">
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
        onClick={handleSend}
        disabled={sending || !email}
        className="w-full gap-2"
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4" />
            Send Email
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        The recipient will receive the download link and decryption key via email
      </p>
    </div>
  );
};
