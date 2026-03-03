import { useState } from "react";
import {
  Search,
  HeartHandshake,
  ShieldCheck,
  Lock,
  PawPrint,
  SendHorizontal,
  ClipboardList,
  Handshake,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const NAV_LINKS = ["Home", "Adopt", "Rescue", "Contact"];

const FEATURES = [
  {
    icon: Search,
    title: "Easy Pet Search",
    description: "Filter by breed, age, and location to find your perfect companion.",
    color: "from-orange-100 to-orange-50",
    iconBg: "bg-orange-200 text-orange-600",
  },
  {
    icon: HeartHandshake,
    title: "Rescue Support",
    description: "Report and help injured animals get the care they need.",
    color: "from-sky-100 to-sky-50",
    iconBg: "bg-sky-200 text-sky-600",
  },
  {
    icon: ShieldCheck,
    title: "Verified Shelters",
    description: "Trusted and certified adoption centers near you.",
    color: "from-green-100 to-green-50",
    iconBg: "bg-green-200 text-green-600",
  },
  {
    icon: Lock,
    title: "Secure Adoption",
    description: "Safe, transparent, and reliable adoption process.",
    color: "from-purple-100 to-purple-50",
    iconBg: "bg-purple-200 text-purple-600",
  },
];

const STEPS = [
  {
    icon: Search,
    title: "Browse Pets",
    description: "Explore available pets from shelters and rescues near you.",
    step: "01",
  },
  {
    icon: ClipboardList,
    title: "Send Request",
    description: "Fill in a simple adoption form and submit your request.",
    step: "02",
  },
  {
    icon: Handshake,
    title: "Meet & Adopt",
    description: "Visit the shelter, meet your new friend, and take them home!",
    step: "03",
  },
];

const PawCare = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] font-sans text-[#2D3748] scroll-smooth">
      {/* ───── Navbar ───── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-lg border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <button onClick={() => scrollTo("hero")} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-md">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              PawCare
            </span>
          </button>

          {/* Desktop links */}
          <ul className="hidden md:flex gap-8 text-sm font-medium">
            {NAV_LINKS.map((l) => (
              <li key={l}>
                <button
                  onClick={() => scrollTo(l.toLowerCase())}
                  className="hover:text-orange-500 transition-colors"
                >
                  {l}
                </button>
              </li>
            ))}
          </ul>

          <Button
            className="hidden md:inline-flex bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white shadow-md shadow-orange-200"
            onClick={() => scrollTo("adopt")}
          >
            Adopt Now
          </Button>

          {/* Mobile burger */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-orange-100 px-4 pb-4 space-y-2">
            {NAV_LINKS.map((l) => (
              <button
                key={l}
                onClick={() => scrollTo(l.toLowerCase())}
                className="block w-full text-left py-2 text-sm font-medium hover:text-orange-500 transition-colors"
              >
                {l}
              </button>
            ))}
            <Button
              className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white mt-2"
              onClick={() => scrollTo("adopt")}
            >
              Adopt Now
            </Button>
          </div>
        )}
      </nav>

      {/* ───── Hero Section ───── */}
      <section id="hero" className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12">
          {/* Left text */}
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold tracking-wide mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              🐾 #AdoptDontShop
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              Find Your New{" "}
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-sky-500 bg-clip-text text-transparent">
                Best Friend
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 max-w-lg mx-auto lg:mx-0 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              Adopt. Rescue. Love. Give a pet a second chance at a happy life.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white text-base px-8 py-6 h-auto shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all"
                onClick={() => scrollTo("adopt")}
              >
                <PawPrint className="w-5 h-5 mr-2" />
                Adopt Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-sky-400 text-sky-600 hover:bg-sky-50 text-base px-8 py-6 h-auto transition-all"
                onClick={() => scrollTo("rescue")}
              >
                <HeartHandshake className="w-5 h-5 mr-2" />
                Report a Rescue
              </Button>
            </div>
          </div>

          {/* Right illustration area */}
          <div className="flex-1 flex justify-center animate-in fade-in zoom-in-95 duration-700 delay-200">
            <div className="relative w-72 h-72 sm:w-96 sm:h-96">
              {/* Background blob */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-200 via-sky-100 to-green-100 blur-3xl opacity-60" />
              {/* Card with emoji illustration */}
              <div className="relative w-full h-full rounded-3xl bg-white/60 backdrop-blur-sm border border-orange-100 shadow-xl flex flex-col items-center justify-center gap-4">
                <div className="text-7xl sm:text-8xl animate-bounce" style={{ animationDuration: "3s" }}>
                  🐶
                </div>
                <div className="text-5xl sm:text-6xl -mt-2" style={{ animation: "bounce 3s infinite 0.5s" }}>
                  🐱
                </div>
                <p className="text-sm font-medium text-gray-400 mt-2">They're waiting for you 💛</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Features Section ───── */}
      <section id="adopt" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-600 text-xs font-semibold mb-3">
              Why PawCare?
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Everything You Need to{" "}
              <span className="text-orange-500">Save a Life</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Our platform connects caring people with animals who need a forever home.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`group p-6 rounded-2xl bg-gradient-to-br ${f.color} border border-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default`}
              >
                <div className={`w-12 h-12 rounded-xl ${f.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section id="rescue" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs font-semibold mb-3">
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              How It <span className="text-sky-500">Works</span>
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Adopt a pet in just 3 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="relative text-center group">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-orange-300 to-sky-300" />
                )}
                <div className="relative z-10 w-24 h-24 mx-auto rounded-2xl bg-white border-2 border-orange-200 shadow-md flex items-center justify-center mb-5 group-hover:border-orange-400 group-hover:shadow-lg transition-all">
                  <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-white text-xs font-bold flex items-center justify-center shadow">
                    {s.step}
                  </span>
                  <s.icon className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Contact Section ───── */}
      <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold mb-3">
              Get In Touch
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Contact <span className="text-orange-500">Us</span>
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Have questions? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Form */}
            <div className="lg:col-span-3 bg-gradient-to-br from-orange-50 to-sky-50 rounded-2xl p-6 sm:p-8 border border-orange-100 shadow-sm">
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Message sent! We'll get back to you soon. 🐾");
                  setFormData({ name: "", email: "", message: "" });
                }}
              >
                <div>
                  <label className="block text-sm font-medium mb-1.5">Name</label>
                  <Input
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-white border-orange-200 focus-visible:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-white border-orange-200 focus-visible:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Message</label>
                  <Textarea
                    placeholder="How can we help?"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    className="bg-white border-orange-200 focus-visible:ring-orange-300"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white shadow-md shadow-orange-200"
                >
                  <SendHorizontal className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2 flex flex-col justify-center gap-6">
              {[
                { icon: Mail, label: "Email", value: "support@pawcare.com" },
                { icon: Phone, label: "Phone", value: "+91 98765 43210" },
                { icon: MapPin, label: "Location", value: "Pune, India" },
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <c.icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                    <p className="font-semibold text-sm">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="bg-gradient-to-br from-[#2D3748] to-[#1A202C] text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">PawCare</span>
            </div>

            {/* Quick links */}
            <ul className="flex gap-6 text-sm text-gray-300">
              {NAV_LINKS.map((l) => (
                <li key={l}>
                  <button
                    onClick={() => scrollTo(l.toLowerCase())}
                    className="hover:text-orange-400 transition-colors"
                  >
                    {l}
                  </button>
                </li>
              ))}
            </ul>

            {/* Socials */}
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-orange-500 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-gray-400">
            © 2026 PawCare. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PawCare;
