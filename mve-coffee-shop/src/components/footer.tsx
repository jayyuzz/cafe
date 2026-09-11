import React from 'react';
import { MessageCircle, MapPin } from 'lucide-react';
import content from "@/config/site-content.json";

// Custom Lucide-styled Instagram icon
function InstagramIcon({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// Custom Lucide-styled Facebook icon
function FacebookIcon({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export default function Footer() {
  const { footer, brand, contact } = content;

  return (
    <footer className="bg-brown-900 text-brown-200 py-12 px-6 sm:px-8 lg:px-12 border-t border-brown-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Column 1: Brand */}
          <div className="flex flex-col items-start space-y-4">
            <a href="#home" className="flex items-center gap-2">
              {/* Using CSS filter to make the logo white for dark footer if it's black/colored */}
              <img src={brand.logo} alt={brand.name} className="h-10 w-auto brightness-0 invert opacity-90" />
              <span className="font-serif font-bold text-xl text-white">{brand.name}</span>
            </a>
            <p className="text-sm text-brown-400 leading-relaxed max-w-xs">
              {footer.description}
            </p>
            <div className="flex items-center gap-2 text-sm text-brown-400 mt-2">
              <MapPin className="w-4 h-4 text-gold" />
              <span>{contact.address}</span>
            </div>
          </div>

          {/* Column 2: Menu */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Menu</h3>
            <ul className="space-y-3 text-sm">
              {footer.menuLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-brown-400 hover:text-gold transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Informasi */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Informasi</h3>
            <ul className="space-y-3 text-sm">
              {footer.infoLinks.map((link) => (
                <li key={link.label} className="flex items-center gap-2">
                  <a href={link.href} className="text-brown-400 hover:text-gold transition-colors">{link.label}</a>
                  {link.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-brown-800 text-brown-300 px-2 py-0.5 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Ikuti Kami */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Ikuti Kami</h3>
            <div className="space-y-3 text-sm">
              <a href={footer.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-brown-400 hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-full bg-brown-800 flex items-center justify-center group-hover:bg-orange-accent group-hover:text-white transition-colors">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <span>Instagram</span>
              </a>
              <a href={footer.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-brown-400 hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-full bg-brown-800 flex items-center justify-center group-hover:bg-[#1877F2] group-hover:text-white transition-colors">
                  <FacebookIcon className="w-4 h-4" />
                </div>
                <span>Facebook</span>
              </a>
              <a href={footer.socialMedia.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-brown-400 hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-full bg-brown-800 flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-brown-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-brown-500 text-sm text-center md:text-left">
            {brand.copyright}
          </p>
          <div className="flex gap-3">
            <a href={footer.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-brown-800 text-brown-400 flex items-center justify-center hover:bg-orange-accent hover:text-white transition-colors" aria-label="Instagram">
              <InstagramIcon className="w-5 h-5" />
            </a>
            <a href={footer.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-brown-800 text-brown-400 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors" aria-label="Facebook">
              <FacebookIcon className="w-5 h-5" />
            </a>
            <a href={footer.socialMedia.whatsapp} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-brown-800 text-brown-400 flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors" aria-label="WhatsApp">
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
