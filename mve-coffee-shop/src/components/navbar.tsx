"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import content from "@/config/site-content.json";

const navLinks = content.navbar.links;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Active section detection
      const sections = navLinks.map((l) => l.href.replace("#", ""));
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-cream/95 backdrop-blur-md shadow-md"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2.5">
          <img
            src={content.brand.logo}
            alt={content.brand.name}
            className="h-10 w-auto"
          />
          <span className="font-serif font-bold text-xl text-brown-800">
            {content.brand.name}
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors duration-200 ${
                activeSection === link.href.replace("#", "")
                  ? "text-orange-accent"
                  : "text-brown-700 hover:text-brown-500"
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href={content.navbar.ctaHref}
            className="rounded-full bg-orange-accent text-white px-5 py-2 text-sm font-medium hover:bg-brown-700 transition-colors duration-200 shadow-sm"
          >
            {content.navbar.ctaText}
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 text-brown-700"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-cream/98 backdrop-blur-md border-t border-brown-200/50 shadow-lg">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeSection === link.href.replace("#", "")
                    ? "bg-orange-accent/10 text-orange-accent"
                    : "text-brown-700 hover:bg-brown-100"
                }`}
              >
                {link.label}
              </a>
            ))}
            <a
              href={content.navbar.ctaHref}
              onClick={() => setMobileOpen(false)}
              className="block text-center rounded-full bg-orange-accent text-white px-5 py-3 text-sm font-medium mt-2"
            >
              {content.navbar.ctaText}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
