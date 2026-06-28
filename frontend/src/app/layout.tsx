import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shared/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Editorial serif for display/headlines — establishment gravitas.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KampanyeKit — Platform Kampanye Digital',
  description: 'Kelola kampanye politik Anda dengan cerdas dan terukur.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`h-full w-full ${inter.variable} ${fraunces.variable}`}>
      <body className={`${inter.className} h-full w-full`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
