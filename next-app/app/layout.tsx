import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Marek Marek – Finanční partner',
  description: 'Finanční plánování, kalkulačky a poradenství',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
