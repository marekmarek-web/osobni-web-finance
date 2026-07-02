import { footerInfoLinks, footerMenuLinks, siteConfig, socialLinks } from "@/config/site";
import { NavLink } from "./NavLink";

const SOCIAL_ICON_CLASS: Record<(typeof socialLinks)[number]["icon"], string> = {
  instagram: "fab fa-instagram",
  facebook: "fab fa-facebook",
  linkedin: "fab fa-linkedin",
  whatsapp: "fab fa-whatsapp",
};

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-dark text-slate-400 py-16 border-t border-white/10" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white text-brand-dark font-bold w-8 h-8 flex items-center justify-center rounded overflow-hidden">
                <img
                  src="/images/logo_M_white.png"
                  alt={`${siteConfig.name} Logo`}
                  className="w-full h-full object-contain p-1 invert"
                />
              </div>
              <span className="text-xl font-bold text-white">{siteConfig.name}.</span>
            </div>
            <p className="text-sm text-slate-400 mb-4">{siteConfig.footerBlurb}</p>
            <div className="flex space-x-4">
              {socialLinks.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  className="text-slate-400 hover:text-white transition"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                >
                  <i className={`${SOCIAL_ICON_CLASS[s.icon]} text-xl`} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Menu</h4>
            <ul className="space-y-2 text-sm">
              {footerMenuLinks.map((link) => (
                <li key={link.href + link.label}>
                  <NavLink href={link.href} className="hover:text-brand-gold transition">
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Kontakt</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt mt-1 mr-3 text-brand-gold" aria-hidden />
                <span>
                  {siteConfig.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-phone mr-3 text-brand-gold" aria-hidden />
                <a href={`tel:${siteConfig.phoneTel}`} className="hover:text-brand-gold transition">
                  {siteConfig.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center">
                <i className="fas fa-envelope mr-3 text-brand-gold" aria-hidden />
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="hover:text-brand-gold transition"
                >
                  {siteConfig.contactEmail}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Informace</h4>
            <ul className="space-y-2 text-sm">
              {footerInfoLinks.map((link) => (
                <li key={link.href}>
                  <NavLink href={link.href} className="hover:text-white transition">
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>
            &copy; {year} {siteConfig.name}. Všechna práva vyhrazena.
          </p>
        </div>
      </div>
    </footer>
  );
}
