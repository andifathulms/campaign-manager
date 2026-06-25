import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shared/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
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
    <html lang="id" className={`h-full w-full ${inter.variable} ${jakarta.variable}`}>
      <body className={`${inter.className} h-full w-full`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
