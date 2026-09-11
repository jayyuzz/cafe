import { MapPin, Clock, Phone, Mail, ArrowRight, ExternalLink } from "lucide-react";
import content from "@/config/site-content.json";

const c = content.contact;

function InstagramIcon({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const contactInfo = [
  {
    icon: MapPin,
    label: "Lokasi",
    value: c.address,
    description: "Kunjungi kedai kami langsung",
    href: `https://maps.google.com/?q=${encodeURIComponent(c.address)}`,
    isExternal: true,
  },
  {
    icon: Clock,
    label: "Jam Buka",
    value: c.hours,
    description: "Buka setiap hari untuk secangkir kopi hangat Anda",
    href: null,
    isExternal: false,
  },
  {
    icon: Phone,
    label: "Telepon & WhatsApp",
    value: c.phone,
    description: "Pemesanan langsung & informasi reservasi meja",
    href: `tel:${c.phone.replace(/[^0-9+]/g, "")}`,
    isExternal: false,
  },
  {
    icon: Mail,
    label: "Email",
    value: c.email,
    description: "Pertanyaan umum, saran & kerjasama bisnis",
    href: `mailto:${c.email}`,
    isExternal: false,
  },
  {
    icon: InstagramIcon,
    label: "Instagram",
    value: c.instagram,
    description: "Update harian, promo spesial & aktivitas kami",
    href: c.instagramUrl,
    isExternal: true,
  },
];

export default function Contact() {
  const waLink = `https://wa.me/${c.whatsappNumber}?text=${encodeURIComponent(c.whatsappMessage)}`;
  const mapsLink = `https://maps.google.com/?q=${encodeURIComponent(c.address)}`;

  return (
    <section id="contact" className="py-20 md:py-28 bg-brown-50 relative overflow-hidden transition-colors">
      <div className="absolute top-10 -left-20 w-80 h-80 bg-cream-dark/60 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-brown-200/30 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-18">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-orange-accent block mb-2">
            {c.sectionLabel}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brown-800 font-bold tracking-tight">
            {c.heading}
          </h2>
          <div className="w-16 h-1 bg-gold mx-auto mt-4 mb-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Maps */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="w-full h-full min-h-[380px] sm:min-h-[440px] lg:min-h-[520px] rounded-2xl overflow-hidden shadow-xl border border-brown-200/80 bg-cream relative">
              <iframe
                title="Peta Lokasi MVE Coffee"
                src={c.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full min-h-[380px] sm:min-h-[440px] lg:min-h-[520px] rounded-2xl"
              />
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs bg-cream/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-brown-200/80 pointer-events-none">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brown-800 text-gold flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-serif font-bold text-sm text-brown-800">{content.brand.name}</p>
                    <p className="text-xs text-brown-600">{c.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              {contactInfo.map((item, index) => {
                const IconComponent = item.icon;
                const card = (
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-cream/80 hover:bg-cream border border-brown-200/70 hover:border-brown-400/50 shadow-xs hover:shadow-md transition-all duration-200 group">
                    <div className="w-11 h-11 rounded-xl bg-cream-dark/90 text-brown-800 flex items-center justify-center shrink-0 group-hover:bg-brown-800 group-hover:text-gold transition-colors duration-200">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brown-500 mb-0.5">{item.label}</p>
                      <p className="text-sm sm:text-base font-semibold text-brown-900 leading-snug group-hover:text-orange-accent transition-colors">{item.value}</p>
                      <p className="text-xs text-brown-600 mt-0.5 leading-relaxed">{item.description}</p>
                    </div>
                    {item.href && (
                      <div className="text-brown-400 group-hover:text-orange-accent transition-colors self-center shrink-0">
                        {item.isExternal ? <ExternalLink className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </div>
                    )}
                  </div>
                );

                return item.href ? (
                  <a key={index} href={item.href} target={item.isExternal ? "_blank" : undefined} rel={item.isExternal ? "noopener noreferrer" : undefined} className="block focus:outline-hidden focus:ring-2 focus:ring-gold/50 rounded-2xl">
                    {card}
                  </a>
                ) : (
                  <div key={index}>{card}</div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 bg-brown-800 hover:bg-brown-900 text-gold hover:text-white px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg group">
                <span>Chat via WhatsApp</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-white/90 hover:bg-white text-brown-800 border border-brown-300 hover:border-brown-400 px-5 py-3.5 rounded-xl text-sm font-semibold transition-colors shadow-xs">
                <MapPin className="w-4 h-4 text-orange-accent" />
                <span>Petunjuk Arah</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
