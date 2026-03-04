import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Loader2, ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

const AuthWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden">
    <div className="absolute inset-0 bg-background" />
    
    {/* Square grid pattern background */}
    <div className="absolute inset-0 opacity-15" style={{
      backgroundImage: `
        linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
        linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    }} />
    <div className="absolute inset-0 opacity-8" style={{
      backgroundImage: `
        linear-gradient(hsl(var(--primary) / 0.15) 1px, transparent 1px),
        linear-gradient(90deg, hsl(var(--primary) / 0.15) 1px, transparent 1px)
      `,
      backgroundSize: '10px 10px',
    }} />
    
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[120px]" />
    <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-primary-glow/5 rounded-full blur-[100px]" />

    <div className="relative z-10 w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-glow mb-4 animate-glow-pulse">
          <ShieldCheck className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold">
          <span className="text-foreground">Secure</span>
          <span className="text-gradient">Vault</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Personal Data Protection System</p>
      </div>

      <div className="glass-strong rounded-2xl p-6 sm:p-8 border border-primary/20">
        {children}
      </div>
    </div>
  </div>
);

export const AuthForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setShowResetPassword(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      toast.success("Account created! Please check your email to verify.");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      const msg = error.message || "Failed to sign in";
      if (msg === "Failed to fetch") {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
      setEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setShowResetPassword(false);
      setNewPassword("");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (showResetPassword) {
      return (
        <>
          <h2 className="text-xl font-semibold text-foreground mb-1">Set New Password</h2>
          <p className="text-sm text-muted-foreground mb-6">Enter your new password below</p>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-foreground/80">New Password</Label>
              <div className="input-glow rounded-lg">
                <Input id="new-password" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="bg-input/50 border-border/50 focus-visible:ring-primary/30 h-11" />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 bg-gradient-primary btn-glow rounded-xl text-sm font-medium" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : "Update Password"}
            </Button>
          </form>
        </>
      );
    }

    if (showForgotPassword) {
      return (
        <>
          <h2 className="text-xl font-semibold text-foreground mb-1">Reset Password</h2>
          <p className="text-sm text-muted-foreground mb-6">Enter your email to receive a reset link</p>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-foreground/80">Email</Label>
              <div className="input-glow rounded-lg">
                <Input id="reset-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-input/50 border-border/50 focus-visible:ring-primary/30 h-11" />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 bg-gradient-primary btn-glow rounded-xl text-sm font-medium" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : "Send Reset Link"}
            </Button>
            <Button type="button" variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={() => setShowForgotPassword(false)}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back to Sign In
            </Button>
          </form>
        </>
      );
    }

    return (
      <>
        <h2 className="text-xl font-semibold text-foreground mb-1">Welcome back</h2>
        <p className="text-sm text-muted-foreground mb-6">Sign in to your account or create a new one</p>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/50 rounded-xl p-1">
            <TabsTrigger value="signin" className="rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground text-sm">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground text-sm">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-foreground/80">Email</Label>
                <div className="input-glow rounded-lg">
                  <Input id="signin-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-input/50 border-border/50 focus-visible:ring-primary/30 h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-foreground/80">Password</Label>
                <div className="input-glow rounded-lg">
                  <Input id="signin-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-input/50 border-border/50 focus-visible:ring-primary/30 h-11" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={(v) => setRememberMe(!!v)} className="border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                  <Label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer">Remember me</Label>
                </div>
                <button type="button" className="text-xs text-primary hover:text-primary/80 transition-colors" onClick={() => setShowForgotPassword(true)}>
                  Forgot password?
                </button>
              </div>
              <Button type="submit" className="w-full h-11 bg-gradient-primary btn-glow rounded-xl text-sm font-medium" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : <><Lock className="mr-2 h-4 w-4" />Sign In</>}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-foreground/80">Email</Label>
                <div className="input-glow rounded-lg">
                  <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-input/50 border-border/50 focus-visible:ring-primary/30 h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-foreground/80">Password</Label>
                <div className="input-glow rounded-lg">
                  <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-input/50 border-border/50 focus-visible:ring-primary/30 h-11" />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 bg-gradient-primary btn-glow rounded-xl text-sm font-medium" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : <><Shield className="mr-2 h-4 w-4" />Create Account</>}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </>
    );
  };

  return <AuthWrapper>{renderContent()}</AuthWrapper>;
};
