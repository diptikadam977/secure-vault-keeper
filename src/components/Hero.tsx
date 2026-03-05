import { Lock, Key, ShieldCheck, Shield, Fingerprint, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden bg-cyber-grid opacity-30" />
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-primary-glow/5 rounded-full blur-[100px]" />

      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 py-5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow animate-glow-pulse">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SecureVault</span>
          </div>
          <Button
            variant="outline"
            className="border-border/50 text-foreground hover:bg-primary/10 hover:border-primary/50"
            onClick={() => navigate("/auth")}>
            
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Shield className="w-3.5 h-3.5" />
            Enterprise-Grade Security
          </div>

          {/* Logo icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary shadow-glow mb-8 animate-in fade-in zoom-in duration-500 animate-float">
            <ShieldCheck className="w-10 h-10 text-primary-foreground" />
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <span className="text-foreground">Secure</span>
            <span className="text-gradient">Vault</span>
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl text-foreground/70 mb-4 font-light animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            Military-grade file encryption
          </p>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
            Protect your sensitive files with AES-256 encryption. Upload, encrypt, and securely manage your data with zero-knowledge architecture.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <Button
              size="lg"
              className="bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300 text-base sm:text-lg px-8 py-6 h-auto btn-glow rounded-xl"
              onClick={() => navigate("/auth")}>
              
              <Lock className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
            







            
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8 px-2">
            {[
            {
              icon: ShieldCheck,
              title: "AES-256 Encryption",
              description: "Military-grade encryption protects your files with unbreakable security"
            },
            {
              icon: Eye,
              title: "Zero-Knowledge",
              description: "Your private keys never leave your device — we can't see your data"
            },
            {
              icon: Fingerprint,
              title: "Easy Key Management",
              description: "Generate and store RSA-2048 keys with one click"
            }].
            map((feature, index) =>
            <div
              key={index}
              className="group glass p-6 rounded-2xl hover:shadow-glow hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${600 + index * 100}ms` }}>
              
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-xl mb-4 group-hover:shadow-glow transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>);

};