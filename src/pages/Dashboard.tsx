import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LogOut, Settings, Menu, X, Lock, Unlock, ScanLine } from "lucide-react";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { MyFiles } from "@/components/dashboard/MyFiles";
import { KeyManager } from "@/components/dashboard/KeyManager";
import { QRScanner } from "@/components/dashboard/QRScanner";
import { ActiveShares } from "@/components/dashboard/ActiveShares";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useProfile } from "@/hooks/useProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile } = useProfile();

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
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-foreground rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-background" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">SecureVault</h1>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user?.email}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
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

            {/* Mobile Menu Button */}
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

          {/* Mobile Menu */}
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">File Encryption Dashboard</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Securely encrypt, store, and share your files with AES-256-GCM encryption
            </p>
          </div>

          <Tabs defaultValue="tools" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto gap-1">
              <TabsTrigger value="tools" className="text-xs sm:text-sm py-2">Tools</TabsTrigger>
              <TabsTrigger value="myfiles" className="text-xs sm:text-sm py-2">My Files</TabsTrigger>
              <TabsTrigger value="shares" className="text-xs sm:text-sm py-2">Shares</TabsTrigger>
            </TabsList>

            <TabsContent value="tools" className="space-y-4 sm:space-y-6">
              <KeyManager />
              
              {/* Top Row: Encryption & Decryption side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card 
                  className="min-h-[220px] cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl rounded-2xl border border-white/20 bg-gradient-to-br from-blue-500/15 via-blue-400/10 to-indigo-500/15 backdrop-blur-xl shadow-[0_8px_32px_rgba(59,130,246,0.12)] dark:from-blue-500/10 dark:via-blue-400/8 dark:to-indigo-500/10 dark:shadow-[0_8px_32px_rgba(59,130,246,0.2)]"
                  onClick={() => navigate('/encrypt')}
                >
                  <CardHeader className="items-center text-center pb-3 pt-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/25">
                      <Lock className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl text-foreground">Encryption</CardTitle>
                    <CardDescription className="mt-1">
                      Protect your files with AES-256-GCM encryption
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <Button className="w-full gap-2 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md shadow-blue-500/20 transition-all duration-300 hover:shadow-lg">
                      <Lock className="w-4 h-4" />
                      Start Encrypting
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="min-h-[220px] cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl rounded-2xl border border-white/20 bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-purple-500/15 backdrop-blur-xl shadow-[0_8px_32px_rgba(139,92,246,0.12)] dark:from-indigo-500/10 dark:via-violet-500/8 dark:to-purple-500/10 dark:shadow-[0_8px_32px_rgba(139,92,246,0.2)]"
                  onClick={() => navigate('/decrypt')}
                >
                  <CardHeader className="items-center text-center pb-3 pt-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/25">
                      <Unlock className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl text-foreground">Decryption</CardTitle>
                    <CardDescription className="mt-1">
                      Unlock and restore your encrypted files securely
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <Button className="w-full gap-2 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-md shadow-indigo-500/20 transition-all duration-300 hover:shadow-lg">
                      <Unlock className="w-4 h-4" />
                      Go to Decrypt
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Row: Scanner spanning full width */}
              <div className="[&>div]:rounded-2xl [&>div]:border-white/20 [&>div]:bg-gradient-to-br [&>div]:from-blue-500/15 [&>div]:via-indigo-500/10 [&>div]:to-purple-500/15 [&>div]:backdrop-blur-xl [&>div]:shadow-[0_8px_32px_rgba(99,102,241,0.12)] dark:[&>div]:from-blue-500/10 dark:[&>div]:via-indigo-500/8 dark:[&>div]:to-purple-500/10 dark:[&>div]:shadow-[0_8px_32px_rgba(99,102,241,0.2)] [&>div]:text-center [&_h3]:justify-center">
                <QRScanner />
              </div>
              
              <div className="p-4 sm:p-6 bg-card rounded-2xl shadow-card border border-border">
                <h3 className="text-base sm:text-lg font-semibold mb-3 text-foreground">Security Information</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li>• Uses RSA-2048 + AES-256-GCM hybrid encryption</li>
                  <li>• Your private key never leaves your device</li>
                  <li>• Each user has unique encryption keys</li>
                  <li>• Files are encrypted with recipient-specific keys when shared</li>
                  <li>• Zero-knowledge architecture - we cannot decrypt your files</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="myfiles">
              <MyFiles />
            </TabsContent>

            <TabsContent value="shares">
              <ActiveShares />
            </TabsContent>

          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
