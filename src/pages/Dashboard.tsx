import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";
import { FileEncryptor } from "@/components/dashboard/FileEncryptor";
import { FileDecryptor } from "@/components/dashboard/FileDecryptor";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">SecureVault</h1>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">File Encryption Dashboard</h2>
            <p className="text-muted-foreground">
              Securely encrypt and decrypt your files with AES-256-GCM encryption
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <FileEncryptor />
            <FileDecryptor />
          </div>

          <div className="mt-8 p-6 bg-card rounded-2xl shadow-card">
            <h3 className="text-lg font-semibold mb-3">Security Information</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• All encryption happens in your browser - files never leave your device unencrypted</li>
              <li>• Uses AES-256-GCM, a military-grade encryption standard</li>
              <li>• Keys are generated using cryptographically secure random numbers</li>
              <li>• Store your encryption keys safely - we cannot recover them if lost</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
