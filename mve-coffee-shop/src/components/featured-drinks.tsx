import content from "@/config/site-content.json";

const { sectionLabel, heading, quote, items } = content.featuredDrinks;

export default function FeaturedDrinks() {
  return (
    <section
      id="menu"
      className="py-20 md:py-28 bg-[#FAF6F0] relative overflow-hidden transition-colors"
    >
      {/* Decorative ambient background accents */}
      <div className="absolute top-1/2 -left-40 -translate-y-1/2 w-96 h-96 bg-cream-dark/50 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute top-10 right-0 w-80 h-80 bg-brown-100/40 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-orange-accent block mb-2">
            {sectionLabel}
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-brown-800 tracking-tight">
            {heading}
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="h-px w-12 bg-brown-300/60" />
            <span className="w-2 h-2 rotate-45 bg-orange-accent" />
            <span className="h-px w-12 bg-brown-300/60" />
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* 3 Drink Cards */}
          <div className="lg:col-span-8 xl:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {items.map((drink) => (
              <article
                key={drink.id}
                className="group bg-white/90 backdrop-blur-xs rounded-3xl p-6 border border-brown-100/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center justify-between"
              >
                <div className="w-full flex flex-col items-center">
                  {drink.tag && (
                    <span className="inline-block self-end text-[11px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-brown-50 text-brown-600 border border-brown-200/50 mb-3">
                      {drink.tag}
                    </span>
                  )}

                  {/* Circular Image */}
                  <div className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-36 md:h-36 lg:w-44 lg:h-44 rounded-full overflow-hidden p-1.5 bg-cream-dark/30 ring-4 ring-cream-dark/60 shadow-md group-hover:ring-orange-accent/40 group-hover:shadow-lg transition-all duration-300">
                    <div className="relative w-full h-full rounded-full overflow-hidden">
                      <img
                        src={drink.image}
                        alt={drink.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                      />
                    </div>
                  </div>

                  <h3 className="mt-6 text-xl font-semibold text-brown-800 group-hover:text-orange-accent transition-colors">
                    {drink.name}
                  </h3>
                  <p className="mt-2.5 text-sm text-brown-500 leading-relaxed line-clamp-3">
                    {drink.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 w-full border-t border-brown-100/70 flex items-center justify-center">
                  <span className="text-gold font-bold text-xl tracking-tight">
                    {drink.price}
                  </span>
                </div>
              </article>
            ))}
          </div>

          {/* Quote */}
          <div className="lg:col-span-4 xl:col-span-3 flex">
            <aside className="w-full flex flex-col justify-between p-8 rounded-3xl bg-brown-50/80 border border-brown-200/60 shadow-xs relative overflow-hidden group hover:border-brown-300/80 transition-all duration-300">
              <div className="absolute -top-6 -right-6 text-brown-200/30 font-serif text-8xl select-none pointer-events-none" aria-hidden="true">
                &ldquo;
              </div>
              <div>
                <div className="w-10 h-10 rounded-full bg-cream-dark/60 flex items-center justify-center mb-6 text-orange-accent text-2xl font-serif">
                  &ldquo;
                </div>
                <blockquote className="font-serif italic text-lg sm:text-xl lg:text-lg xl:text-xl text-brown-800 leading-relaxed">
                  &ldquo;{quote}&rdquo;
                </blockquote>
              </div>
              <div className="mt-8 pt-5 border-t border-brown-200/60 flex items-center gap-3">
                <span className="w-8 h-0.5 bg-orange-accent rounded-full" />
                <span className="text-xs uppercase tracking-widest font-semibold text-brown-600">
                  {content.brand.name}
                </span>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
