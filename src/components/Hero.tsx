import { Shield, Lock, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-2xl shadow-glow mb-8 animate-in fade-in zoom-in duration-500">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>

          {/* Main heading */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-primary animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            SecureVault
          </h1>

          <p className="text-2xl md:text-3xl text-foreground/80 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            Military-grade file encryption
          </p>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
            Protect your sensitive files with AES-256 encryption. Upload, encrypt, and securely manage your data with zero-knowledge architecture.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <Button 
              size="lg"
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-8 py-6 h-auto"
              onClick={() => navigate("/auth")}
            >
              <Lock className="w-5 h-5 mr-2" />
              Get Started
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary/5 text-lg px-8 py-6 h-auto transition-all duration-300"
              onClick={() => navigate("/auth")}
            >
              <Key className="w-5 h-5 mr-2" />
              Sign In
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            {[
              {
                icon: Shield,
                title: "AES-256 Encryption",
                description: "Military-grade encryption protects your files"
              },
              {
                icon: Lock,
                title: "Zero-Knowledge",
                description: "Your keys never leave your device"
              },
              {
                icon: Key,
                title: "Easy Key Management",
                description: "Generate and store keys securely"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-card p-6 rounded-2xl shadow-card hover:shadow-glow transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${600 + index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
