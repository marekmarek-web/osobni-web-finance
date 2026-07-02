const NEXT_ROUTES = new Set([
  "/",
  "/hypotecnikalkulacka",
  "/zivotnikalkulacka",
  "/investicnikalkulacka",
  "/penzijnikalkulacka",
]);

/** Cesta existuje v Next app — použij `<Link>`. */
export function isNextRoute(href: string): boolean {
  const path = href.split("#")[0].replace(/\/$/, "") || "/";
  return NEXT_ROUTES.has(path);
}

/**
 * Odkaz na statický web (produkční HTML mimo Next).
 * NEXT_PUBLIC_STATIC_SITE_ORIGIN např. https://marek-marek.cz
 */
export function staticHref(href: string): string {
  const origin = process.env.NEXT_PUBLIC_STATIC_SITE_ORIGIN?.replace(/\/$/, "") ?? "";
  if (!origin || isNextRoute(href)) return href;
  return `${origin}${href.startsWith("/") ? href : `/${href}`}`;
}
