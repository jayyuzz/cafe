import { ArrowRight } from "lucide-react";
import content from "@/config/site-content.json";

const about = content.about;

export default function About() {
  return (
    <section id="about" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-cream">
      <div className="max-w-7xl mx-auto rounded-3xl bg-brown-900 text-cream p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
        {/* Decorative glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-accent/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brown-700/40 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center relative z-10">
          {/* Left Side */}
          <div className="flex flex-col items-start space-y-6">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-orange-accent">
              {about.sectionLabel}
            </span>
            <h2 className="text-white font-serif italic text-3xl md:text-4xl lg:text-5xl leading-tight">
              {about.heading}
            </h2>
            <div className="space-y-3 pt-2">
              <h3 className="text-xl sm:text-2xl font-serif text-cream inline-block pb-1 border-b-2 border-orange-accent tracking-wide">
                {about.featureTitle}
              </h3>
              <p className="text-cream-dark/90 text-sm sm:text-base leading-relaxed max-w-xl">
                {about.featureDescription}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 w-full max-w-md">
              {about.highlights.map((h) => (
                <div key={h.label} className="border-l-2 border-brown-700 pl-4 py-1">
                  <span className="block text-gold font-serif text-lg font-semibold">{h.value}</span>
                  <span className="text-xs text-cream/75">{h.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <a
                href={about.cta.href}
                className="inline-flex items-center gap-2 border border-orange-accent text-orange-accent rounded-full px-6 py-2 text-sm sm:text-base font-medium hover:bg-orange-accent hover:text-white transition-all duration-300 group"
              >
                <span>{about.cta.text}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Right Side: Image */}
          <div className="w-full">
            <div className="relative w-full aspect-4/3 sm:aspect-16/10 lg:aspect-4/3 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
              <img
                src={about.image}
                alt={about.heading}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brown-900/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-brown-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs text-cream flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-accent animate-pulse" />
                <span>Pengalaman Kopi Otentik</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
