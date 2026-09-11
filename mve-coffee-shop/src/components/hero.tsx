import content from "@/config/site-content.json";

const hero = content.hero;

// Coffee bean SVG for subtle aesthetic background decoration
function CoffeeBeanIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 4C14 4 6 12.5 6 23c0 10.5 8 19 18 19s18-8.5 18-19c0-10.5-8-19-18-19zm-1.5 6c1.2 3.5 1.5 7.5-.5 11-2.2 3.8-2 8 .5 11.5-3.5-.8-6.5-3.2-8.2-6.5-1.9-3.7-1.8-7.9.2-11.5 1.8-3.3 4.8-5.6 8-4.5zm4 26c-1.2-3.5-1.5-7.5.5-11 2.2-3.8 2-8-.5-11.5 3.5.8 6.5 3.2 8.2 6.5 1.9 3.7 1.8 7.9-.2 11.5-1.8 3.3-4.8 5.6-8 4.5z" />
    </svg>
  );
}

export default function Hero() {
  const headingLines = hero.heading.split("\n");

  return (
    <section
      id="home"
      className="relative w-full min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-b from-cream via-cream to-cream-dark/40 pt-28 pb-16 lg:pt-36 lg:pb-24"
    >
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-cream-dark rounded-full blur-2xl pointer-events-none -z-10" />

      {/* Decorative Coffee Bean Elements */}
      <CoffeeBeanIcon className="absolute top-16 left-8 sm:left-16 w-10 h-10 text-brown-300/25 rotate-12 pointer-events-none -z-10" />
      <CoffeeBeanIcon className="absolute bottom-24 left-12 sm:left-24 w-12 h-12 text-brown-300/20 rotate-45 pointer-events-none -z-10" />
      <CoffeeBeanIcon className="absolute top-28 right-8 sm:right-20 w-14 h-14 text-brown-300/30 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brown-100/90 border border-brown-200/70 text-brown-700 text-xs sm:text-sm font-medium mb-6 backdrop-blur-xs shadow-xs">
              <span className="w-2 h-2 rounded-full bg-orange-accent animate-pulse" />
              <span>{content.brand.tagline}</span>
            </div>

            {/* Main Italic Serif Heading */}
            <h1 className="font-serif italic font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-brown-900 tracking-tight leading-[1.15] mb-6">
              {headingLines[0]}
              <br />
              <span className="text-brown-800">{headingLines[1]}</span>
            </h1>

            {/* Subtitle */}
            <p className="font-sans text-brown-600 text-base sm:text-lg md:text-xl leading-relaxed max-w-xl mb-8">
              {hero.subtitle}
            </p>

            {/* Call To Actions */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-10 w-full sm:w-auto">
              <a
                href={hero.ctaPrimary.href}
                className="rounded-full bg-orange-accent hover:bg-brown-700 text-white px-8 py-3 text-base sm:text-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                {hero.ctaPrimary.text}
              </a>
              <a
                href={hero.ctaSecondary.href}
                className="rounded-full border border-brown-300 hover:border-brown-500 text-brown-800 hover:bg-brown-100/60 px-7 py-3 text-base font-medium transition-all duration-200"
              >
                {hero.ctaSecondary.text}
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 border-t border-brown-200/70 w-full max-w-md">
              {hero.stats.map((stat) => (
                <div key={stat.label}>
                  <div className="font-serif font-bold text-2xl sm:text-3xl text-brown-900">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-brown-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Hero Image */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <div className="relative w-full max-w-md lg:max-w-lg">
              <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-tr from-brown-200/70 via-gold/30 to-cream-dark rounded-[3.2rem_1.5rem_3.2rem_1.5rem] rotate-2 -z-10 shadow-sm" />

              <div className="relative overflow-hidden rounded-[2.8rem_1.2rem_2.8rem_1.2rem] shadow-2xl border-4 border-white/80 bg-brown-100">
                <img
                  src={hero.image}
                  alt="MVE Coffee — Nikmati Kopi Pilihan Terbaik"
                  className="w-full h-[360px] sm:h-[440px] lg:h-[480px] object-cover hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brown-900/50 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-5 left-5 right-5 p-3.5 sm:p-4 rounded-2xl bg-cream/90 backdrop-blur-md border border-white/80 shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-accent/15 flex items-center justify-center text-lg">
                      ☕
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-brown-900">
                        Signature Latte & Espresso
                      </p>
                      <p className="text-[11px] sm:text-xs text-brown-600">
                        Racikan Barista MVE Coffee
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-orange-accent bg-orange-accent/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                    Best Seller
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
