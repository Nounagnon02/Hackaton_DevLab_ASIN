"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  User,
  ShieldCheck,
  Shield,
  Smartphone,
  Headphones,
  Globe,
  Heart,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  ArrowRight,
  CheckCircle2,
  Wallet,
  Fingerprint,
  Banknote,
  Clock,
  TrendingUp,
  Star,
  Quote,
  Play
} from "lucide-react";

// --- Animated Counter Component ---
const AnimatedCounter = ({ value, suffix = "" }: { value: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const numericValue = parseInt(value.replace(/\D/g, ''));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const end = numericValue;
          const timer = setInterval(() => {
            start += Math.ceil(end / 50);
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(start);
            }
          }, 40);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [numericValue]);

  return (
    <div ref={ref} className="text-5xl md:text-6xl font-bold text-white tabular-nums">
      {count.toLocaleString()}{suffix}
    </div>
  );
};

// --- FAQ Component ---
const FAQComponent = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqItems = [
    { question: "Comment m'inscrire sur la plateforme ?", answer: "C'est très simple ! Cliquez sur 'Commencer', renseignez vos informations personnelles et suivez les étapes de vérification biométrique. L'inscription prend moins de 5 minutes." },
    { question: "Est-ce que mes informations sont sécurisées ?", answer: "Absolument. Nous utilisons un cryptage de niveau bancaire et la vérification biométrique pour protéger vos données. Vos informations ne sont jamais partagées." },
    { question: "Comment puis-je retirer ma pension ?", answer: "Après connexion, visualisez votre solde sur le tableau de bord. Cliquez sur 'Retirer', sélectionnez le montant et choisissez Mobile Money ou virement bancaire. Transfert sous 24-48h." },
    { question: "Un proche peut-il m'aider dans mes démarches ?", answer: "Oui ! Vous pouvez inviter un proche de confiance qui recevra un accès limité pour vous accompagner." },
    { question: "Comment contacter le support ?", answer: "Plusieurs options : chatbot IA 24h/24, numéro gratuit 0 800 123 456 (lun-ven, 8h-20h), ou formulaire de contact." }
  ];

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {faqItems.map((item, index) => (
        <div key={index} className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${openIndex === index ? "border-emerald-500 bg-white shadow-lg shadow-emerald-100" : "border-gray-100 bg-white hover:border-emerald-200"}`}>
          <button className="w-full flex items-center justify-between p-6 text-left" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
            <span className={`font-semibold text-lg pr-4 ${openIndex === index ? "text-emerald-700" : "text-gray-800"}`}>{item.question}</span>
            <span className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${openIndex === index ? "bg-emerald-500 rotate-180" : "bg-gray-100"}`}>
              <ChevronDown className={`w-5 h-5 ${openIndex === index ? "text-white" : "text-gray-600"}`} />
            </span>
          </button>
          <div className={`grid transition-all duration-300 ${openIndex === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              <div className="px-6 pb-6">
                <p className="text-gray-600 leading-relaxed border-t border-gray-100 pt-4">{item.answer}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Header Component ---
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: "Avantages", href: "#avantages" },
    { label: "Comment ça marche", href: "#processus" },
    { label: "Témoignages", href: "#temoignages" },
    { label: "FAQ", href: "#faq" }
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-white/95 backdrop-blur-lg shadow-lg py-3" : "bg-transparent py-6"}`}>
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:shadow-emerald-300 transition-shadow">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl text-gray-900 tracking-tight block leading-tight">Pension<span className="text-emerald-600">Retrait</span></span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">République du Bénin</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="text-gray-600 hover:text-emerald-600 font-medium text-sm transition-colors relative group">
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 transition-all group-hover:w-full rounded-full"></span>
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <Link href="/admin/login" className="text-gray-600 hover:text-emerald-600 font-medium text-sm transition-colors">Administration</Link>
            <Link href="/pensioner" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-emerald-200 transition-all hover:-translate-y-0.5 flex items-center gap-2">
              <User size={18} />
              Mon Espace
            </Link>
          </div>

          <button className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b shadow-xl p-6">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="py-3 px-4 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl font-medium" onClick={() => setIsMenuOpen(false)}>{item.label}</a>
              ))}
              <hr className="my-4" />
              <Link href="/pensioner" className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-semibold" onClick={() => setIsMenuOpen(false)}>
                <User size={18} />
                Accéder à mon compte
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

// --- Main Page ---
export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      <Header />

      {/* Hero Section - Bento Grid Style */}
      <section className="relative min-h-screen pt-28 pb-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-[#fafafa]"></div>
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-gradient-to-tr from-amber-400/15 to-orange-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-emerald-200/10 via-transparent to-teal-200/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          {/* Top Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
                <ShieldCheck size={18} className="text-emerald-600" />
                <span className="text-emerald-600 font-bold">Officiel</span>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              République du Bénin
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center max-w-5xl mx-auto mb-16">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 leading-[0.95] tracking-tight mb-8">
              Recevez votre
              <br />
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600">pension</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 4 150 2 298 6" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round" />
                  <defs><linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#14b8a6" /></linearGradient></defs>
                </svg>
              </span>
              {" "}en 3 clics
            </h1>

            <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
              La plateforme officielle de retrait de pension du Bénin. <span className="text-gray-900 font-medium">Sécurisée, simple et accessible.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/pensioner" className="group relative px-10 py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:shadow-2xl hover:shadow-gray-400/30 hover:-translate-y-1">
                <span className="relative z-10 flex items-center gap-3">
                  Accéder à mon espace
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              <a href="#processus" className="px-8 py-5 text-gray-600 font-semibold text-lg hover:text-emerald-600 transition-colors flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Play className="w-5 h-5 text-emerald-600 ml-0.5" />
                </div>
                Voir la démo
              </a>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-12 gap-4 max-w-6xl mx-auto">
            {/* Main Card - Dashboard Preview */}
            <div className="col-span-12 md:col-span-7 bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Tableau de bord</p>
                    <p className="font-bold text-gray-900">Mamadou Koffi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-bold text-emerald-700">Vérifié</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white mb-4">
                <p className="text-gray-400 text-sm mb-1">Solde disponible</p>
                <p className="text-4xl font-black tracking-tight">125.000 <span className="text-lg font-medium text-gray-400">FCFA</span></p>
                <div className="flex items-center gap-2 mt-3">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400">Prochaine pension dans 15 jours</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                  <Banknote className="w-5 h-5" />
                  Retirer maintenant
                </button>
                <button className="p-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5" />
                  Historique
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="col-span-12 md:col-span-5 grid grid-rows-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-6 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <Shield className="w-7 h-7" />
                  </div>
                  <p className="text-emerald-100 text-sm mb-1">Sécurité</p>
                  <p className="text-2xl font-black">100% Sécurisé</p>
                  <p className="text-emerald-100 text-sm mt-2">Cryptage bancaire + biométrie</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 group hover:scale-[1.02] transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex -space-x-3 mb-3">
                      {['K', 'A', 'Y', 'M'].map((letter, i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white">{letter}</div>
                      ))}
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs border-2 border-white">+50k</div>
                    </div>
                    <p className="text-gray-400 text-sm">Retraités actifs</p>
                    <p className="text-2xl font-black text-gray-900">50.000+</p>
                  </div>
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
                    <Star className="w-8 h-8 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row - Features */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Smartphone, label: 'Mobile First', desc: 'Accès depuis tout appareil', color: 'bg-blue-50 text-blue-600' },
                { icon: Fingerprint, label: 'Biométrie', desc: 'Vérification instantanée', color: 'bg-purple-50 text-purple-600' },
                { icon: Headphones, label: 'Support 24/7', desc: 'Assistance en continu', color: 'bg-orange-50 text-orange-600' }
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-100 border border-gray-100 flex items-center gap-4 hover:shadow-xl transition-shadow group">
                  <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{feature.label}</p>
                    <p className="text-sm text-gray-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: "50000", suffix: "+", label: "Retraités actifs" },
              { value: "1000000", suffix: "+", label: "Transactions" },
              { value: "99", suffix: "%", label: "Satisfaction" },
              { value: "24", suffix: "/7", label: "Support" }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="avantages" className="py-32 bg-white relative">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold tracking-wider uppercase mb-6">Pourquoi nous choisir</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Une expérience pensée pour <span className="text-emerald-600">vous</span></h2>
            <p className="text-xl text-gray-600">Nous avons simplifié chaque étape pour vous offrir la meilleure expérience possible.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Sécurité Maximale", desc: "Cryptage bancaire et vérification biométrique pour protéger vos données.", gradient: "from-blue-500 to-indigo-600" },
              { icon: Smartphone, title: "100% Mobile", desc: "Gérez votre compte depuis n'importe quel appareil, où que vous soyez.", gradient: "from-emerald-500 to-teal-600" },
              { icon: Headphones, title: "Support Dédié", desc: "Une équipe multilingue à votre écoute 24h/24 et 7j/7.", gradient: "from-purple-500 to-pink-600" },
              { icon: Globe, title: "Multilingue", desc: "Interface disponible en Français, Fongbé, Yoruba et autres langues locales.", gradient: "from-orange-500 to-amber-600" },
              { icon: Heart, title: "Simple d'usage", desc: "Interface épurée et intuitive, adaptée à tous les âges.", gradient: "from-rose-500 to-red-600" },
              { icon: MapPin, title: "Partout au Bénin", desc: "Service disponible sur l'ensemble du territoire national.", gradient: "from-teal-500 to-cyan-600" }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-white border-2 border-gray-100 hover:border-transparent hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 hover:-translate-y-2">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="processus" className="py-32 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100 rounded-full blur-3xl opacity-50"></div>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold tracking-wider uppercase mb-6">Processus simple</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">3 étapes pour récupérer <span className="text-emerald-600">votre pension</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", icon: User, title: "Inscription", desc: "Créez votre compte en quelques minutes avec vos documents d'identité." },
              { step: "02", icon: Fingerprint, title: "Vérification", desc: "Vérification biométrique automatique et sécurisée de votre identité." },
              { step: "03", icon: Banknote, title: "Retrait", desc: "Recevez votre pension sur Mobile Money ou compte bancaire sous 24-48h." }
            ].map((item, i) => (
              <div key={i} className="relative group">
                {i < 2 && <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-1 bg-gradient-to-r from-emerald-300 to-transparent rounded-full"></div>}
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-100 border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-6xl font-black text-gray-100 absolute top-4 right-6">{item.step}</span>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">{item.title}</h3>
                  <p className="text-gray-600 relative z-10">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/pensioner" className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-emerald-300 transition-all hover:-translate-y-1">
              Commencer la procédure
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="temoignages" className="py-32 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold tracking-wider uppercase mb-6">Témoignages</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Ce que disent nos <span className="text-emerald-600">retraités</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { name: "Kofi Mensah", role: "Retraité depuis 2022", quote: "Je n'ai plus besoin de faire la queue pendant des heures. Tout se fait depuis mon téléphone !", avatar: "K" },
              { name: "Adjo Sika", role: "Retraitée depuis 2021", quote: "L'interface en Fongbé m'a beaucoup aidée. Je comprends tout et je peux gérer ma pension seule.", avatar: "A" },
              { name: "Yaovi Agbeko", role: "Retraité depuis 2023", quote: "Le support client est exceptionnel. Ils m'ont aidé patiemment à chaque étape.", avatar: "Y" }
            ].map((testimonial, i) => (
              <div key={i} className="bg-gray-50 rounded-3xl p-8 relative group hover:bg-white hover:shadow-xl transition-all duration-500">
                <Quote className="w-10 h-10 text-emerald-200 absolute top-6 right-6" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl">{testimonial.avatar}</div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed italic">"{testimonial.quote}"</p>
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 bg-gray-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold tracking-wider uppercase mb-6">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Questions fréquentes</h2>
          </div>
          <FAQComponent />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">Prêt à simplifier<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">votre retraite ?</span></h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Rejoignez plus de 50 000 retraités qui nous font déjà confiance.</p>
            <Link href="/pensioner" className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-emerald-500/30 transition-all">
              Créer mon compte gratuitement
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-20 pb-10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">PensionRetrait</span>
              </div>
              <p className="text-gray-400 leading-relaxed">La plateforme de référence pour la gestion des pensions de retraite au Bénin.</p>
              <div className="flex gap-3">
                {[Facebook, Twitter, Linkedin, Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 bg-white/5 hover:bg-emerald-600 rounded-xl flex items-center justify-center transition-colors">
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">Navigation</h3>
              <ul className="space-y-4 text-gray-400">
                {["Accueil", "Avantages", "Comment ça marche", "FAQ"].map((item, i) => (
                  <li key={i}><a href="#" className="hover:text-emerald-400 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">Légal</h3>
              <ul className="space-y-4 text-gray-400">
                {["Mentions légales", "Confidentialité", "CGU", "Cookies"].map((item, i) => (
                  <li key={i}><a href="#" className="hover:text-emerald-400 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">Contact</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-center gap-3"><Phone size={18} className="text-emerald-500" /><span>0 800 123 456</span></li>
                <li className="flex items-center gap-3"><Mail size={18} className="text-emerald-500" /><span>contact@pensionretrait.bj</span></li>
                <li className="flex items-start gap-3"><MapPin size={18} className="text-emerald-500 mt-1" /><span>Cotonou, Bénin</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© 2025 PensionRetrait. Tous droits réservés.</p>
            <p>Développé pour le <span className="text-emerald-500 font-semibold">Hackathon DevLab 2025</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
