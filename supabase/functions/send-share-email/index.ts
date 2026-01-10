import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ShareEmailRequest {
  recipientEmail: string;
  fileName: string;
  shareUrl: string;
  encryptionKey: string;
  expiresAt: string | null;
  senderName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, fileName, shareUrl, encryptionKey, expiresAt, senderName }: ShareEmailRequest = await req.json();

    console.log("Sending share email to:", recipientEmail);
    console.log("File:", fileName);
    console.log("Share URL:", shareUrl);

    const expiryText = expiresAt 
      ? `This link will expire on ${new Date(expiresAt).toLocaleDateString()} at ${new Date(expiresAt).toLocaleTimeString()}.`
      : "This link never expires.";

    const emailResponse = await resend.emails.send({
      from: "SecureShare <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `🔐 Encrypted File Shared: ${fileName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Secure File Share</h1>
            </div>
            
            <div style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                ${senderName ? `<strong>${senderName}</strong> has` : "Someone has"} shared an encrypted file with you.
              </p>
              
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">📄 File Name</p>
                <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${fileName}</p>
              </div>
              
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: 600;">🔑 Decryption Key</p>
                <code style="display: block; background-color: #fffbeb; padding: 12px; border-radius: 6px; font-size: 11px; word-break: break-all; color: #78350f;">${encryptionKey}</code>
                <p style="margin: 10px 0 0 0; color: #92400e; font-size: 12px;">Keep this key safe - you'll need it to decrypt the file!</p>
              </div>
              
              <a href="${shareUrl}" style="display: block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 24px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 16px; margin: 20px 0;">
                Download Encrypted File
              </a>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                ${expiryText}
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                This is an automated email from SecureShare. If you didn't expect this file, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-share-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
