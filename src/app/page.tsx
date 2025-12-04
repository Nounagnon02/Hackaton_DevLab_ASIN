"use client";

import Link from "next/link";
import { useState } from "react";
// import { Button } from "@/components/ui/button";
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
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
} from "lucide-react";
import Image from "next/image";

const FAQComponent = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqItems = [
    {
      question: "Comment utiliser ?",
      answer:
        "C'est très simple ! Cliquez sur 'Commencer', renseignez vos informations personnelles (nom, prénom, numéro de sécurité sociale) et suivez les étapes de vérification d'identité. L'inscription prend moins de 5 minutes.",
    },
    {
      question: "Mes informations sont-elles sécurisées ?",
      answer:
        "Absolument. Nous utilisons un cryptage de niveau bancaire pour protéger vos données. Toutes vos transactions sont sécurisées et vos informations personnelles ne sont jamais partagées avec des tiers.",
    },
    {
      question: "Comment puis-je retirer ma pension ?",
      answer:
        "Une fois connecté à votre compte, vous verrez le montant disponible sur votre tableau de bord. Cliquez sur 'Retirer', choisissez le montant souhaité et sélectionnez votre compte bancaire. Le virement est effectué sous 24 à 48 heures.",
    },
    {
      question: "Un proche peut-il m'aider à utiliser la plateforme ?",
      answer:
        "Oui, bien sûr ! Vous pouvez inviter un proche de confiance à vous accompagner. Il recevra un accès limité pour vous aider dans vos démarches, tout en préservant la sécurité de votre compte.",
    },
    {
      question: "Comment contacter l'assistance ?",
      answer:
        "Plusieurs options s'offrent à vous : le chatbot disponible 24h/24, le numéro d'assistance gratuit 0 800 XXX XXX (du lundi au vendredi, 8h-20h), ou le formulaire de contact. Nous nous engageons à vous répondre rapidement.",
    },
  ];

  return (
    <div className="space-y-4">
      {faqItems.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-shadow hover:shadow-md"
        >
          <button
            className="w-full flex items-center justify-between p-6 text-left"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            aria-expanded={openIndex === index}
          >
            <span className="font-semibold text-lg text-gray-800 pr-4">
              {item.question}
            </span>
            <span className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-gray-800" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-800" />
              )}
            </span>
          </button>

          {openIndex === index && (
            <div className="px-6 pb-6">
              <p className="text-gray-600 leading-relaxed text-lg">
                {item.answer}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    // { label: "Accueil", href: "#accueil" },
    { label: "Avantage", href: "#Avantage" },
    // { label: "Assistance", href: "#assistance" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="#accueil" className="flex items-center gap-3">
            <div className="w-30 h-30 relative">
              <Image
                src="/assets/logo_pension.png"
                alt="Logo PensionRetrait"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-inter text-2xl font-bold text-gray-800 hidden sm:block">
              PensionRetrait
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-green-600 font-nunito font-medium text-lg transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:block">
            {/* <Button variant="default" size="default">
              <User className="mr-2" />
              Accéder à mon compte
            </Button> */}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-6 border-t border-gray-200">
            <ul className="flex flex-col gap-4">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="block py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-gray-100 rounded-lg font-medium text-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li className="pt-4">
                {/* <Button variant="default" className="w-full">
                  <User className="mr-2" />
                  Accéder à mon compte
                </Button> */}
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-green-50 to-white flex flex-col items-center justify-start">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <div className="text-center max-w-5xl mt-16 mb-16 px-4 space-y-8">
        {/* Security Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-[#007A55] rounded-full text-sm font-medium">
          <ShieldCheck size={18} />
          Plateforme sécurisée et certifiée
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-inter font-bold text-gray-800 leading-tight">
          Retirez votre pension{" "}
          <span className="text-[#007A55]">facilement</span>, en toute{" "}
          <span className="text-[#007A55]">sécurité</span>.
        </h1>

        {/* Description */}
        <p className="text-xl md:text-2xl font-nunito text-gray-600 leading-relaxed max-w-2xl mx-auto">
          Une plateforme simple et accessible pour tous les retraités. Gérez
          votre pension en quelques clics.
        </p>

        {/* Feature Tags */}
        <div className="flex justify-center gap-2 flex-wrap pt-4">
          <span className="px-3 py-1 bg-[#F1F1F1] text-blue-800 rounded-full text-sm font-nunito font-medium">
            Guidage Vocal Fongbé
          </span>
          <span className="px-3 py-1 bg-[#f1c4a8] text-[#1F2937] rounded-full text-sm font-nunito font-medium">
            Preuve de Vie Faciale
          </span>
          <span className="px-3 py-1 bg-[#4becbe] text-[#1F2937] rounded-full text-sm font-nunito font-medium">
            Paiement Mojaloop
          </span>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center gap-6 justify-center pt-4">
          <div className="flex -space-x-3">
            {["A", "B", "C", "D"].map((letter, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-sm font-medium"
              >
                {letter}
              </div>
            ))}
          </div>
          <p className="font-nunito text-gray-500 text-sm">
            <span className="font-semibold text-gray-800">+50 000</span>{" "}
            retraités nous font confiance
          </p>
        </div>

        {/* Action Buttons */}
        {/* <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/pensioner"
            className="bg-[#007A55] text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            Commencer maintenant
            <User className="w-5 h-5" />
          </Link>
        </div> */}
      </div>

      {/* Card */}
      <div className="w-full max-w-xl px-4 flex justify-center">
        <Link href="/pensioner" className="group w-full">
          <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 h-full flex flex-col items-center text-center">
            <div className="p-4 bg-green-100 rounded-full mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <User className="w-10 h-10 text-green-700 group-hover:text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Espace Retraité
            </h2>
            <p className="text-gray-500">
              Vérifiez votre identité simplement avec votre voix et votre visage
              pour recevoir votre pension.
            </p>
            <span className="mt-6 text-green-600 font-semibold group-hover:underline">
              Commencer
            </span>
          </div>
        </Link>
      </div>

      {/* Why Choose Us Section */}
      <section
        id="Avantage"
        className="pt-20 pb-6 lg:pt-28 lg:pb-8 bg-linear-to-b from-gray-50 to-white w-full"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
              Nos avantages
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-800 mb-6">
              Pourquoi nous choisir ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une plateforme conçue avec soin pour répondre à tous vos besoins.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Shield,
                title: "Sécurité garantie",
                description:
                  "Vos données et transactions sont protégées par un cryptage de niveau bancaire.",
              },
              {
                icon: Smartphone,
                title: "Mobile friendly",
                description:
                  "Accédez à votre compte depuis n'importe quel appareil, smartphone ou tablette.",
              },
              {
                icon: Headphones,
                title: "Assistance 24/7",
                description:
                  "Notre équipe et notre chatbot sont disponibles à tout moment pour vous aider.",
              },
              {
                icon: Globe,
                title: "Multilingue",
                description:
                  "Plateforme disponible en plusieurs langues pour votre confort.",
              },
              {
                icon: Heart,
                title: "Conçu pour vous",
                description:
                  "Interface pensée spécialement pour être simple et intuitive.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-green-300 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-green-700 group-hover:text-white transition-colors" />
                </div>

                <h3 className="text-xl font-serif font-bold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/pensioner"
              className="bg-[#007A55] text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 inline-flex"
            >
              Commencer maintenant
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="py-6 lg:py-8 bg-linear-to-b from-white to-gray-50 w-full"
      >
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
              Questions fréquentes
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-800 mb-6">
              FAQ
            </h2>
            <p className="text-xl text-gray-600">
              Trouvez rapidement les réponses à vos questions.
            </p>
          </div>

          <FAQComponent />
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-800 text-white w-full">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3">
                <div className="w-30 h-30 relative">
                  <Image
                    src="/assets/logo_blanc.png"
                    alt="Logo PensionRetrait"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                La plateforme de confiance pour gérer votre pension en toute
                simplicité et sécurité.
              </p>
              <div className="flex gap-3">
                {[Facebook, Twitter, Linkedin, Youtube].map((Icon, index) => (
                  <a
                    key={index}
                    href="#"
                    className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
                    aria-label="Réseaux sociaux"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-serif font-bold text-lg mb-6">Navigation</h3>
              <ul className="space-y-4">
                {["Accueil", "Avantages", "FAQ", "Contact", "Mon compte"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-gray-300 hover:text-green-400 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-serif font-bold text-lg mb-6">
                Informations légales
              </h3>
              <ul className="space-y-4">
                {[
                  "Mentions légales",
                  "Politique de confidentialité",
                  "Conditions d'utilisation",
                  "Sécurité des données",
                  "Cookies",
                ].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-300 hover:text-green-400 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-serif font-bold text-lg mb-6">Contact</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">0 800 123 456 (gratuit)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">
                    contact@pensionretrait.bj
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">
                    Avenue Jean-Paul II
                    <br />
                    Cotonou, Bénin
                  </span>
                </li>
              </ul>

              <div className="mt-6 p-4 bg-gray-700 rounded-xl">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">
                    Service client :
                  </span>
                  <br />
                  Lundi - Vendredi : 8h - 20h
                  <br />
                  Samedi : 9h - 17h
                </p>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 PensionRetrait. Tous droits réservés. | Prototype développé
              pour le Hackathon DevLab 2025
            </p>
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-green-600 rounded text-xs text-white font-medium">
                SSL Sécurisé
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
