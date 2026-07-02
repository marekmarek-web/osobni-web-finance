/** true = náhled s bannerem; false = produkční kalkulačky bez banneru */
export function isCalculatorPreviewMode(): boolean {
  return process.env.NEXT_PUBLIC_CALCULATOR_PREVIEW === "true";
}

/** true = homepage přesměruje na statické index.html v public/ */
export function useStaticHomepage(): boolean {
  return process.env.NEXT_PUBLIC_USE_STATIC_HOME !== "false";
}
