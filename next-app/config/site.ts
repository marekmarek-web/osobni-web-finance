export const siteConfig = {
  name: "Marek Marek",
  tagline: "Finanční partner",
  titleTemplate: "%s | Marek Marek – Finanční partner",
  defaultDescription:
    "Finanční plánování pro rodiny a podnikatele: hypotéka, investice, pojištění a penze.",
  contactEmail: "kontakt@marek-marek.cz",
  phoneDisplay: "+420 778 511 166",
  phoneTel: "+420778511166",
  addressLines: ["Jana z Dražic 99", "Roudnice nad Labem"],
  footerBlurb:
    "Pomáhám klientům budovat a chránit majetek pomocí ověřených strategií.",
} as const;

export type NavItem = { label: string; href: string };

export const mainNavLinks: NavItem[] = [
  { label: "Služby", href: "/#sluzby" },
  { label: "Rodiny a jednotlivci", href: "/financni-plan/" },
  { label: "Podnikatelé a firmy", href: "/podnikatele/" },
];

export type ToolLink = { href: string; title: string; description: string };

export const toolsDropdown: ToolLink[] = [
  {
    href: "/hypotecnikalkulacka",
    title: "Hypoteční kalkulačka",
    description: "Měsíční splátka a náklady",
  },
  {
    href: "/investicnikalkulacka",
    title: "Investiční kalkulačka",
    description: "Projekce zhodnocení",
  },
  {
    href: "/zivotnikalkulacka",
    title: "Kalkulačka životního pojištění",
    description: "Potřebné krytí",
  },
  {
    href: "/penzijnikalkulacka",
    title: "Penzijní kalkulačka",
    description: "Státní příspěvky",
  },
];

export const footerMenuLinks: NavItem[] = [
  { label: "Služby", href: "/#sluzby" },
  { label: "Hypoteční kalkulačka", href: "/hypotecnikalkulacka" },
  { label: "Investiční kalkulačka", href: "/investicnikalkulacka" },
  { label: "Rodiny a jednotlivci", href: "/financni-plan/" },
  { label: "Podnikatelé a firmy", href: "/podnikatele/" },
];

export const footerInfoLinks: NavItem[] = [
  { label: "Ochrana osobních údajů", href: "/gdpr/" },
  { label: "Cookies", href: "/cookies/" },
];

export const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/marekmarek_pfp/",
    icon: "instagram" as const,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/SMMarkx",
    icon: "facebook" as const,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/marek-marek-489394226/",
    icon: "linkedin" as const,
  },
  {
    label: "WhatsApp",
    href: "http://wa.me/420778511166",
    icon: "whatsapp" as const,
  },
];
