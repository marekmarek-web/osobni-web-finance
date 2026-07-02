export function CalculatorPreviewBanner({
  staticPath,
  label,
}: {
  staticPath: string;
  label: string;
}) {
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>Next.js náhled (Aidvisor kalkulačky).</strong> Produkční {label} zůstává na{' '}
      <a href={staticPath} className="font-semibold underline">
        {staticPath}
      </a>{' '}
      — statické HTML se nemění, dokud Next verze neprojde schválením.
    </div>
  );
}
