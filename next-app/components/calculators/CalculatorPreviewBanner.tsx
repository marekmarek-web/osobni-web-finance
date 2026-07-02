import { isCalculatorPreviewMode } from "@/lib/site-mode";

export function CalculatorPreviewBanner({
  staticPath,
  label,
}: {
  staticPath: string;
  label: string;
}) {
  if (!isCalculatorPreviewMode()) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>Next.js náhled.</strong> Produkční {label} je také na{" "}
      <a href={staticPath} className="font-semibold underline">
        {staticPath}
      </a>
      .
    </div>
  );
}
