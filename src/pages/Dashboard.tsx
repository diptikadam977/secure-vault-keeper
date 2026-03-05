import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, LogOut, Settings, Menu, X, Lock, Unlock, ScanLine,
  LayoutDashboard, FolderLock, Activity, ChevronLeft, FileKey, Users, Shield
} from "lucide-react";
import { MyFiles } from "@/components/dashboard/MyFiles";
import { KeyManager } from "@/components/dashboard/KeyManager";
import { QRScanner } from "@/components/dashboard/QRScanner";
import { ActiveShares } from "@/components/dashboard/ActiveShares";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useProfile } from "@/hooks/useProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", value: "tools" },
  { icon: FolderLock, label: "My Vault", value: "myfiles" },
  { icon: Users, label: "Shares", value: "shares" },
  { icon: Settings, label: "Settings", value: "settings" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("tools");
  const { profile } = useProfile();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
            <ShieldCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Loading your vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Square grid background */}
      <div className="fixed inset-0 opacity-[0.08] pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(hsl(var(--primary) / 0.4) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--primary) / 0.4) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
      }} />
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(hsl(var(--primary) / 0.2) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--primary) / 0.2) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
      }} />
      {/* ───── Desktop Sidebar ───── */}
      <aside className={`hidden md:flex flex-col border-r border-border/50 glass-strong transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"} shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border/30">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          {sidebarOpen && <span className="text-lg font-bold text-foreground truncate">SecureVault</span>}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                if (item.value === "settings") {
                  navigate("/settings");
                } else {
                  setActiveTab(item.value);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.value
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 pb-4 space-y-1 border-t border-border/30 pt-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
          >
            <ChevronLeft className={`w-5 h-5 shrink-0 transition-transform duration-300 ${!sidebarOpen ? "rotate-180" : ""}`} />
            {sidebarOpen && <span>Collapse</span>}
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ───── Main Area ───── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 border-b border-border/50 glass-strong">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-lg hover:bg-accent/50 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-foreground">
                {SIDEBAR_ITEMS.find(i => i.value === activeTab)?.label || "Dashboard"}
              </h1>
              <p className="text-xs text-muted-foreground">Manage your encrypted files securely</p>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-foreground">{profile?.display_name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user?.email}</p>
                </div>
                <ProfileAvatar
                  avatarUrl={profile?.avatar_url ?? null}
                  displayName={profile?.display_name ?? null}
                  email={user?.email}
                  size="sm"
                />
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border/30 px-4 py-3 space-y-1 animate-page-in">
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    if (item.value === "settings") {
                      navigate("/settings");
                    } else {
                      setActiveTab(item.value);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === item.value
                      ? "bg-gradient-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all">
                <LogOut className="w-5 h-5" /><span>Logout</span>
              </button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {/* ─── Dashboard Tab ─── */}
            {activeTab === "tools" && (
              <div className="space-y-6 animate-page-in">
                {/* Stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Total Saved Items", value: "—", icon: FileKey, gradient: "from-primary to-primary-glow" },
                    { label: "Recent Activity", value: "Active", icon: Activity, gradient: "from-emerald-500 to-teal-500" },
                    { label: "Security Status", value: "Protected", icon: Shield, gradient: "from-primary-glow to-purple-600" },
                  ].map((stat, i) => (
                    <div key={i} className="glass group rounded-2xl p-5 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                          <stat.icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <KeyManager />

                {/* Encryption / Decryption cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div
                    className="glass group rounded-2xl p-6 cursor-pointer hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
                    onClick={() => navigate("/encrypt")}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4 shadow-lg group-hover:shadow-glow transition-all">
                        <Lock className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Encryption</h3>
                      <p className="text-sm text-muted-foreground mb-4">Protect files with AES-256-GCM encryption</p>
                      <Button className="w-full bg-gradient-primary btn-glow rounded-xl h-11 text-sm">
                        <Lock className="w-4 h-4 mr-2" />Start Encrypting
                      </Button>
                    </div>
                  </div>

                  <div
                    className="glass group rounded-2xl p-6 cursor-pointer hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
                    onClick={() => navigate("/decrypt")}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-glow to-purple-600 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-glow transition-all">
                        <Unlock className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Decryption</h3>
                      <p className="text-sm text-muted-foreground mb-4">Unlock and restore your encrypted files</p>
                      <Button className="w-full bg-gradient-primary btn-glow rounded-xl h-11 text-sm">
                        <Unlock className="w-4 h-4 mr-2" />Go to Decrypt
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Scanner */}
                <div className="glass rounded-2xl p-1">
                  <QRScanner />
                </div>

                {/* Security info */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Security Information
                  </h3>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>• Uses RSA-2048 + AES-256-GCM hybrid encryption</li>
                    <li>• Your private key never leaves your device</li>
                    <li>• Each user has unique encryption keys</li>
                    <li>• Files are encrypted with recipient-specific keys when shared</li>
                    <li>• Zero-knowledge architecture — we cannot decrypt your files</li>
                  </ul>
                </div>
              </div>
            )}

            {/* ─── My Vault Tab ─── */}
            {activeTab === "myfiles" && (
              <div className="animate-page-in">
                <MyFiles />
              </div>
            )}

            {/* ─── Shares Tab ─── */}
            {activeTab === "shares" && (
              <div className="animate-page-in">
                <ActiveShares />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
