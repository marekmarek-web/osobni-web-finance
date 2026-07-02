"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { mainNavLinks, siteConfig, toolsDropdown } from "@/config/site";
import { NavLink } from "./NavLink";

const MOBILE_TOOL_ICONS: Record<string, string> = {
  "/hypotecnikalkulacka": "fa-calculator text-brand-gold",
  "/investicnikalkulacka": "fa-chart-line text-brand-main",
  "/zivotnikalkulacka": "fa-heart-pulse text-red-500",
  "/penzijnikalkulacka": "fa-piggy-bank text-brand-main",
};

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const forceLight = scrolled || menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const navLinkClass = forceLight
    ? "nav-link text-brand-main hover:bg-brand-main/5"
    : "nav-link text-white hover:bg-white/10 hover:backdrop-blur-md";

  const dividerClass = forceLight
    ? "h-4 w-px bg-brand-border mx-2 transition-colors duration-300"
    : "h-4 w-px bg-white/20 mx-2 transition-colors duration-300";

  const dropdownTriggerClass = forceLight
    ? "nav-dropdown-trigger nav-link text-brand-main hover:bg-brand-main/5 cursor-pointer flex items-center gap-1 rounded-full px-4 py-2.5 transition-colors"
    : "nav-dropdown-trigger nav-link text-white hover:bg-white/10 cursor-pointer flex items-center gap-1 rounded-full px-4 py-2.5 transition-colors";

  return (
    <nav
      id="navbar"
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500 ${
        forceLight ? "glass-header-scrolled" : "glass-header-top"
      }`}
      aria-label="Hlavní navigace"
    >
      <div className="nav-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center gap-4">
          <NavLink
            href="/"
            className="flex items-center gap-3 shrink-0"
            onClick={closeMenu}
          >
            <div
              id="logo-icon"
              className={`font-bold w-10 h-10 flex items-center justify-center rounded-full text-xl transition-all duration-300 shadow-sm overflow-hidden relative ${
                forceLight ? "bg-brand-dark text-white" : "bg-white text-brand-dark"
              }`}
            >
              {!logoFailed ? (
                <img
                  id="logo-img"
                  src="/images/logo_M_white.png"
                  alt="M"
                  className={`w-3/5 h-3/5 object-contain transition-all duration-300 ${
                    forceLight ? "" : "invert"
                  }`}
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <span className="text-lg font-bold">M</span>
              )}
            </div>
            <div className="flex flex-col leading-tight">
              <span
                id="logo-text"
                className={`text-lg font-bold transition-colors duration-300 ${
                  forceLight ? "text-brand-dark" : "text-white"
                }`}
              >
                {siteConfig.name}
                <span className="text-brand-gold">.</span>
              </span>
              <span
                id="logo-subtext"
                className={`text-[0.6rem] font-bold tracking-widest uppercase transition-colors duration-300 ${
                  forceLight ? "text-slate-500" : "text-slate-300"
                }`}
              >
                {siteConfig.tagline}
              </span>
            </div>
          </NavLink>

          <div className="hidden lg:flex items-center justify-center flex-1 gap-1">
            {mainNavLinks.map((item, i) => (
              <span key={item.href} className="contents">
                {i > 0 && <div className={dividerClass} aria-hidden />}
                <NavLink href={item.href} className={navLinkClass}>
                  {item.label}
                </NavLink>
              </span>
            ))}
            <div className={dividerClass} aria-hidden />
            <div className="nav-dropdown-group relative" aria-haspopup="true">
              <span className={dropdownTriggerClass}>
                Nástroje
                <svg
                  className={`w-4 h-4 ${forceLight ? "text-slate-500" : "text-white/80"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <div className="nav-dropdown-panel absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 rounded-2xl border border-slate-200/70 bg-white/95 backdrop-blur-xl shadow-lg p-2 z-50 pointer-events-auto">
                {toolsDropdown.map((tool) => (
                  <NavLink
                    key={tool.href}
                    href={tool.href}
                    className="block rounded-xl px-3 py-2.5 hover:bg-slate-50 transition"
                  >
                    <span className="font-medium text-slate-800">{tool.title}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{tool.description}</span>
                  </NavLink>
                ))}
                <div className="border-t border-slate-100 mt-2 pt-2">
                  <NavLink
                    href="/#sluzby"
                    className="block rounded-xl px-3 py-2.5 hover:bg-slate-50 transition font-semibold text-brand-main"
                  >
                    Všechny kalkulačky →
                  </NavLink>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center lg:hidden">
            <button
              id="mobile-menu-btn"
              type="button"
              className={`hover:text-brand-lightgold focus:outline-none p-2 transition-colors rounded-full hover:bg-white/10 ${
                forceLight ? "text-brand-dark" : "text-brand-gold"
              }`}
              aria-label={menuOpen ? "Zavřít menu" : "Otevřít menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <i className={`fas ${menuOpen ? "fa-times" : "fa-bars"} text-2xl`} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`${
          menuOpen ? "" : "hidden"
        } bg-white/95 backdrop-blur-xl border-t border-slate-100 absolute w-full shadow-2xl h-[calc(100vh-5rem)] overflow-y-auto pb-20 z-40 top-20 lg:hidden`}
        aria-hidden={!menuOpen}
      >
        <div className="px-4 pt-6 space-y-4">
          <div>
            <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Hlavní nabídka
            </p>
            <div className="space-y-1">
              {mainNavLinks.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-3 text-lg font-bold text-slate-800 rounded-xl hover:bg-slate-50"
                  onClick={closeMenu}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div>
            <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 mt-6">
              Nástroje
            </p>
            <div className="space-y-2">
              {toolsDropdown.map((tool) => {
                const active = pathname === tool.href || pathname === `${tool.href}/`;
                const iconClass = MOBILE_TOOL_ICONS[tool.href] ?? "fa-calculator text-brand-main";
                return (
                  <NavLink
                    key={tool.href}
                    href={tool.href}
                    className={`flex items-center px-4 py-3 text-brand-dark font-bold rounded-xl border ${
                      active
                        ? "bg-brand-light/50 border-brand-border/50"
                        : "bg-white border-slate-100 hover:bg-slate-50"
                    }`}
                    onClick={closeMenu}
                  >
                    <i className={`fas ${iconClass} mr-3 w-5 text-center`} aria-hidden />
                    {tool.title}
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div className="pt-8 px-4">
            <NavLink
              href="/#kontakt"
              className="block w-full py-4 bg-brand-dark text-white text-center rounded-xl font-bold shadow-lg shadow-brand-dark/20"
              onClick={closeMenu}
            >
              Kontaktovat
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}
