import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LogOut, Settings, Menu, X, ArrowLeft, Lock } from "lucide-react";
import { FileEncryptor } from "@/components/dashboard/FileEncryptor";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const Encrypt = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile } = useProfile();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

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
          <ShieldCheck className="w-12 h-12 text-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-foreground rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-background" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">SecureVault</h1>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user?.email}</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/settings')}
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <ProfileAvatar
                  avatarUrl={profile?.avatar_url ?? null}
                  displayName={profile?.display_name ?? null}
                  email={user?.email}
                  size="sm"
                />
              </button>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="gap-2 border-foreground/20 hover:bg-foreground hover:text-background"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border mt-3 pt-3 pb-2 animate-page-in">
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground px-2 truncate">{user?.email}</p>
                <Button
                  variant="ghost"
                  onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                  className="justify-start gap-2"
                >
                  <ProfileAvatar
                    avatarUrl={profile?.avatar_url ?? null}
                    displayName={profile?.display_name ?? null}
                    email={user?.email}
                    size="sm"
                  />
                  Profile
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}
                  className="justify-start gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="justify-start gap-2 text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground flex items-center gap-3">
              <Lock className="w-7 h-7 text-primary" />
              Encrypt File
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Select a file and encrypt it with AES-256-GCM encryption for secure storage
            </p>
          </div>

          <FileEncryptor />

          <div className="mt-6 p-4 sm:p-6 bg-card rounded-2xl shadow-card border border-border">
            <h3 className="text-base sm:text-lg font-semibold mb-3 text-foreground">How It Works</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>• Select any file from your device</li>
              <li>• Generate or enter a 64-character hex encryption key</li>
              <li>• Your file will be encrypted locally using AES-256-GCM</li>
              <li>• Download the encrypted file and save your key securely</li>
              <li>• You'll need the same key to decrypt the file later</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Encrypt;